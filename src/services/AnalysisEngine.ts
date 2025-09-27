import type { AnalysisResult, AnalysisStatistics, AnalysisProgress, AnalysisConfig } from '../types/analysis';
import { modelService } from './ModelService';
import { tokenizerService } from './TokenizerService';
import { calculateTokenRank, calculateCumulativeProbability, calculateTopKAccuracy, calculateStatistics } from '../utils/mathUtils';
import { preprocessText } from '../utils/textUtils';
import { MODEL_CONFIG } from '../utils/constants';

export class AnalysisEngine {
  private isAnalyzing = false;
  private progressCallbacks: ((progress: AnalysisProgress) => void)[] = [];

  /**
   * Analyze a text sequence and return detailed results
   */
  async analyzeText(
    text: string, 
    config?: AnalysisConfig,
    onProgress?: (progress: AnalysisProgress) => void
  ): Promise<AnalysisResult[]> {
    if (this.isAnalyzing) {
      throw new Error('Analysis already in progress');
    }

    this.isAnalyzing = true;
    if (onProgress) this.progressCallbacks.push(onProgress);

    try {
      // Preprocess text
      const cleanText = preprocessText(text);
      if (!cleanText) {
        throw new Error('Text is empty after preprocessing');
      }

      // Tokenize text
      this.notifyProgress({ current: 0, total: 100, percentage: 5, currentToken: 'Tokenizing...' });
      const tokenIds = await tokenizerService.encode(cleanText);
      
      if (tokenIds.length === 0) {
        throw new Error('No tokens generated from text');
      }

      // Apply max length limit
      const maxLength = config?.maxLength || tokenIds.length;
      const limitedTokenIds = tokenIds.slice(0, maxLength);

      this.notifyProgress({ 
        current: 0, 
        total: limitedTokenIds.length, 
        percentage: 10, 
        currentToken: 'Starting analysis...' 
      });

      // Analyze token sequence
      const results = await this.analyzeTokenSequence(limitedTokenIds);

      this.notifyProgress({ 
        current: limitedTokenIds.length, 
        total: limitedTokenIds.length, 
        percentage: 100, 
        currentToken: 'Complete!' 
      });

      return results;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown analysis error';
      throw new Error(`Analysis failed: ${errorMessage}`);
    } finally {
      this.isAnalyzing = false;
      this.progressCallbacks = [];
    }
  }

  /**
   * Analyze a sequence of token IDs (core algorithm from Python)
   */
  async analyzeTokenSequence(tokenIds: number[]): Promise<AnalysisResult[]> {
    const results: AnalysisResult[] = [];
    const initialTokensCount = Math.min(MODEL_CONFIG.INITIAL_TOKENS_COUNT, tokenIds.length);

    // Helper function to yield control to the main thread
    const yieldToMainThread = () => new Promise<void>(resolve => setTimeout(resolve, 0));

    // Process initial tokens (no prediction)
    for (let i = 0; i < initialTokensCount; i++) {
      const tokenId = tokenIds[i];
      const token = await tokenizerService.decodeToken(tokenId);
      
      results.push({
        position: i,
        token,
        tokenId,
        rank: null,
        probability: null,
        cumulativeProbability: null,
        isInitial: true,
      });

      this.notifyProgress({
        current: i + 1,
        total: tokenIds.length,
        percentage: ((i + 1) / tokenIds.length) * 100,
        currentToken: token,
      });

      // Yield to main thread after each token to allow UI updates
      await yieldToMainThread();
    }

    // Process remaining tokens with prediction
    for (let i = initialTokensCount; i < tokenIds.length; i++) {
      const contextTokens = tokenIds.slice(0, i);
      const targetTokenId = tokenIds[i];
      const token = await tokenizerService.decodeToken(targetTokenId);

      try {
        // Run inference on context
        const inferenceResult = await modelService.runInference(contextTokens);
        
        // Calculate rank of target token
        const rank = calculateTokenRank(inferenceResult.probabilities, targetTokenId);        
        
        // Get probability of target token
        const probability = inferenceResult.probabilities[targetTokenId] || 0;
        
        // Calculate cumulative probability
        const cumulativeProbability = calculateCumulativeProbability(inferenceResult.probabilities, rank);

        //console.log("token details", rank, probability, cumulativeProbability)

        results.push({
          position: i,
          token,
          tokenId: targetTokenId,
          rank,
          probability,
          cumulativeProbability,
          isInitial: false,
        });

      } catch (error) {
        console.error(`Error analyzing token at position ${i}:`, error);
        
        // Add result with null values on error
        results.push({
          position: i,
          token,
          tokenId: targetTokenId,
          rank: null,
          probability: null,
          cumulativeProbability: null,
          isInitial: false,
        });
      }

      this.notifyProgress({
        current: i + 1,
        total: tokenIds.length,
        percentage: ((i + 1) / tokenIds.length) * 100,
        currentToken: token,
      });

      // Yield to main thread after each token to allow UI updates
      await yieldToMainThread();
    }

    return results;
  }

  /**
   * Calculate statistics from analysis results
   */
  calculateStatistics(results: AnalysisResult[]): AnalysisStatistics {
    const predictedResults = results.filter(r => !r.isInitial && r.rank !== null);
    
    if (predictedResults.length === 0) {
      return {
        totalTokens: results.length,
        predictedTokens: 0,
        top1Accuracy: 0,
        top5Accuracy: 0,
        top10Accuracy: 0,
        averageRank: 0,
        averageCumulativeProbability: 0,
        medianRank: 0,
        medianCumulativeProbability: 0,
      };
    }

    const ranks = predictedResults.map(r => r.rank!);
    const cumulativeProbs = predictedResults
      .filter(r => r.cumulativeProbability !== null)
      .map(r => r.cumulativeProbability!);

    const rankStats = calculateStatistics(ranks);
    const cumulativeProbStats = cumulativeProbs.length > 0 
      ? calculateStatistics(cumulativeProbs)
      : { mean: 0, median: 0, min: 0, max: 0, std: 0 };

    return {
      totalTokens: results.length,
      predictedTokens: predictedResults.length,
      top1Accuracy: calculateTopKAccuracy(ranks, 1),
      top5Accuracy: calculateTopKAccuracy(ranks, 5),
      top10Accuracy: calculateTopKAccuracy(ranks, 10),
      averageRank: rankStats.mean,
      averageCumulativeProbability: cumulativeProbStats.mean,
      medianRank: rankStats.median,
      medianCumulativeProbability: cumulativeProbStats.median,
    };
  }

  /**
   * Format results for display (similar to Python format_results)
   */
  formatResults(results: AnalysisResult[], statistics: AnalysisStatistics): string {
    let output = 'TEXT-TO-RANK SEQUENCE ANALYSIS RESULTS\n';
    output += '='.repeat(80) + '\n\n';

    // Token-by-token results
    output += 'TOKEN-BY-TOKEN ANALYSIS:\n';
    output += '-'.repeat(40) + '\n';
    output += 'Pos | Token | ID | Rank | Prob | CumProb\n';
    output += '-'.repeat(40) + '\n';

    for (const result of results) {
      const pos = result.position.toString().padStart(3);
      const token = result.token.padEnd(15);
      const id = result.tokenId.toString().padStart(6);
      const rank = result.rank !== null ? result.rank.toString().padStart(4) : '  --';
      const prob = result.probability !== null ? result.probability.toFixed(4) : '  --  ';
      const cumProb = result.cumulativeProbability !== null ? result.cumulativeProbability.toFixed(4) : '  --  ';
      
      output += `${pos} | ${token} | ${id} | ${rank} | ${prob} | ${cumProb}\n`;
    }

    // Summary statistics
    output += '\n' + '='.repeat(80) + '\n';
    output += 'SUMMARY STATISTICS:\n';
    output += '='.repeat(80) + '\n';
    output += `Total tokens: ${statistics.totalTokens}\n`;
    output += `Predicted tokens: ${statistics.predictedTokens}\n`;
    output += `Top-1 accuracy: ${(statistics.top1Accuracy * 100).toFixed(1)}%\n`;
    output += `Top-5 accuracy: ${(statistics.top5Accuracy * 100).toFixed(1)}%\n`;
    output += `Top-10 accuracy: ${(statistics.top10Accuracy * 100).toFixed(1)}%\n`;
    output += `Average rank: ${statistics.averageRank.toFixed(2)}\n`;
    output += `Median rank: ${statistics.medianRank.toFixed(2)}\n`;
    output += `Average cumulative probability: ${statistics.averageCumulativeProbability.toFixed(4)}\n`;
    output += `Median cumulative probability: ${statistics.medianCumulativeProbability.toFixed(4)}\n`;

    return output;
  }

  /**
   * Check if analysis is currently running
   */
  isRunning(): boolean {
    return this.isAnalyzing;
  }

  /**
   * Notify all progress callbacks
   */
  private notifyProgress(progress: AnalysisProgress): void {
    this.progressCallbacks.forEach(callback => {
      try {
        callback(progress);
      } catch (error) {
        console.error('Error in progress callback:', error);
      }
    });
  }
}

// Singleton instance for global use
export const analysisEngine = new AnalysisEngine();
