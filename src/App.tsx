import { useState, useEffect } from 'react';
import { modelService } from './services/ModelService';
import { tokenizerService } from './services/TokenizerService';
import { analysisEngine } from './services/AnalysisEngine';
import type { AnalysisResult, AnalysisStatistics, AnalysisProgress } from './types/analysis';
import type { ModelLoadingProgress } from './types/model';
import { SAMPLE_TEXTS, MODEL_CONFIG } from './utils/constants';
import { getCumulativeProbabilityLabel, cumulativeProbabilityToColor } from './utils/cumulativeProbabilityColors';

function App() {
  // Model state
  const [modelLoading, setModelLoading] = useState<ModelLoadingProgress | null>(null);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);

  // Analysis state
  const [inputText, setInputText] = useState<string>(SAMPLE_TEXTS.CONVERSATIONAL);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [analysisStatistics, setAnalysisStatistics] = useState<AnalysisStatistics | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState<AnalysisProgress | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Visualization state (for future use)
  // const [visualizationSettings, setVisualizationSettings] = useState<VisualizationSettings>({
  //   mode: 'probability',
  //   colorScheme: 'probability',
  //   fontSize: 14,
  //   showTooltips: true,
  //   showLegend: true,
  // });

  // Initialize model and tokenizer on component mount
  useEffect(() => {
    initializeServices();
  }, []);

  const initializeServices = async () => {
    try {
      setModelError(null);
      
      // Load tokenizer first using the configured path
      await tokenizerService.loadTokenizer(MODEL_CONFIG.TOKENIZER_PATH);
      
      // Load model with progress tracking
      await modelService.loadModel((progress) => {
        setModelLoading(progress);
        if (progress.stage === 'ready') {
          setModelLoaded(true);
          setModelLoading(null);
        } else if (progress.stage === 'error') {
          setModelError(progress.error || 'Unknown error');
          setModelLoading(null);
        }
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize services';
      setModelError(errorMessage);
      setModelLoading(null);
    }
  };

  const handleAnalyze = async () => {
    if (!modelLoaded || !inputText.trim()) {
      return;
    }

    console.log('Starting analysis - setting isAnalyzing to true');
    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisResults([]);
    setAnalysisStatistics(null);
    setAnalysisProgress(null);

    try {
      console.log('Calling analysisEngine.analyzeText');
      const results = await analysisEngine.analyzeText(
        inputText,
        { maxLength: 200 }, // Limit for demo
        (progress) => {
          console.log('Progress update:', progress);
          setAnalysisProgress(progress);
        }
      );

      console.log('Analysis complete, processing results');
      const statistics = analysisEngine.calculateStatistics(results);
      
      setAnalysisResults(results);
      setAnalysisStatistics(statistics);
      setAnalysisProgress(null);
      
    } catch (error) {
      console.error('Analysis error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Analysis failed';
      setAnalysisError(errorMessage);
      setAnalysisProgress(null);
    } finally {
      console.log('Analysis finished - setting isAnalyzing to false');
      setIsAnalyzing(false);
    }
  };

  const handleSampleTextSelect = (sampleKey: keyof typeof SAMPLE_TEXTS) => {
    setInputText(SAMPLE_TEXTS[sampleKey]);
  };

  const renderModelStatus = () => {
    if (modelLoading) {
      return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <div>
              <p className="text-blue-800 font-medium">{modelLoading.message}</p>
              <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${modelLoading.progress}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (modelError) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className="text-red-600">⚠️</div>
            <div>
              <p className="text-red-800 font-medium">Model Loading Failed</p>
              <p className="text-red-600 text-sm">{modelError}</p>
              <button 
                onClick={initializeServices}
                className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (modelLoaded) {
      return (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className="text-green-600">✅</div>
            <p className="text-green-800 font-medium">Model loaded successfully!</p>
          </div>
        </div>
      );
    }

    return null;
  };

  const renderAnalysisProgress = () => {
    if (!analysisProgress && !isAnalyzing) return null;

    // Show a basic progress indicator even if analysisProgress is null but isAnalyzing is true
    if (!analysisProgress && isAnalyzing) {
      return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <div className="flex-1">
              <p className="text-blue-800 font-medium">
                Initializing analysis...
              </p>
              <p className="text-blue-600 text-sm">
                Preparing to analyze text
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <div className="flex-1">
            <p className="text-blue-800 font-medium">
              Analyzing token: <span className="font-mono bg-blue-100 px-1 rounded">{analysisProgress?.currentToken}</span>
            </p>
            <p className="text-blue-600 text-sm">
              Progress: {analysisProgress?.current} / {analysisProgress?.total} tokens ({analysisProgress?.percentage.toFixed(1)}%)
            </p>
            <div className="w-full bg-blue-200 rounded-full h-3 mt-2">
              <div 
                className="bg-blue-600 h-3 rounded-full transition-all duration-300 flex items-center justify-end pr-2"
                style={{ width: `${Math.max(analysisProgress?.percentage || 0, 5)}%` }}
              >
                {(analysisProgress?.percentage || 0) > 15 && (
                  <span className="text-white text-xs font-medium">
                    {analysisProgress?.percentage.toFixed(0)}%
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderResults = () => {
    if (analysisResults.length === 0) return null;

    return (
      <div className="space-y-6">
        {/* Token Visualization */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Token Analysis (Colored by Cumulative Probability)</h3>
          <div className="mb-4 text-sm text-gray-600">
            <p>Colors indicate how predictable each token was:</p>
            <div className="flex flex-wrap gap-4 mt-2">
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                <span>High cumulative probability (easy to predict)</span>
              </span>
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded"></div>
                <span>Medium cumulative probability</span>
              </span>
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
                <span>Low cumulative probability (hard to predict)</span>
              </span>
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 bg-gray-200 border border-gray-300 rounded"></div>
                <span>Initial tokens (no prediction)</span>
              </span>
            </div>
          </div>
          <div className="visualization-canvas space-y-2">
            {analysisResults.map((result, index) => {
              if (result.isInitial) {
                return (
                  <span
                    key={index}
                    className="inline-block px-2 py-1 m-1 rounded text-sm token-hover bg-gray-200 text-gray-700"
                    title="Initial token (no prediction)"
                  >
                    {result.token}
                  </span>
                );
              }

              // Use inline styles with calculated colors to ensure they're applied
              const backgroundColor = result.cumulativeProbability !== null 
                ? cumulativeProbabilityToColor(1 - result.cumulativeProbability)
                : '#f3f4f6'; // gray-100 equivalent

              // Calculate text color based on background brightness
              const getTextColor = (bgColor: string) => {
                // Simple brightness calculation
                const hex = bgColor.replace('#', '');
                const r = parseInt(hex.substr(0, 2), 16);
                const g = parseInt(hex.substr(2, 2), 16);
                const b = parseInt(hex.substr(4, 2), 16);
                const brightness = (r * 299 + g * 587 + b * 114) / 1000;
                return brightness > 128 ? '#1f2937' : '#ffffff'; // dark or white text
              };

              const textColor = getTextColor(backgroundColor);

              const tooltipText = result.cumulativeProbability !== null
                ? `${getCumulativeProbabilityLabel(1 - result.cumulativeProbability)} | Cumulative Prob: ${(result.cumulativeProbability * 100).toFixed(1)}% | Rank: ${result.rank} | Token Prob: ${result.probability?.toFixed(4)}`
                : `Rank: ${result.rank}, Probability: ${result.probability?.toFixed(4)}`;

              return (
                <span
                  key={index}
                  className="inline-block px-2 py-1 m-1 rounded text-sm token-hover"
                  style={{
                    backgroundColor,
                    color: textColor,
                    border: `1px solid ${backgroundColor}`,
                    transition: 'all 0.2s ease-in-out'
                  }}
                  title={tooltipText}
                >
                  {result.token}
                </span>
              );
            })}
          </div>
        </div>

        {/* Statistics */}
        {analysisStatistics && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Analysis Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {analysisStatistics.totalTokens}
                </div>
                <div className="text-sm text-gray-600">Total Tokens</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {(analysisStatistics.top1Accuracy * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Top-1 Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {analysisStatistics.averageRank.toFixed(1)}
                </div>
                <div className="text-sm text-gray-600">Average Rank</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {(analysisStatistics.averageCumulativeProbability * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Avg Cumulative Prob</div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-4 mb-4">
            <a
              href="https://github.com/mrsirrisrm"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-900 transition-colors"
              title="GitHub"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </a>
            <a
              href="https://x.com/mrsirrisrm"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-900 transition-colors"
              title="X (Twitter)"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            SmolLM2 Text Probability Visualizer
          </h1>
          <p className="text-gray-600">
            Analyze text predictability using the SmolLM2-135M model running locally in your browser
          </p>
        </div>

        {/* Model Status */}
        {renderModelStatus()}

        {/* Input Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Input Text</h2>
          
          {/* Sample Text Buttons */}
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">Try a sample text:</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(SAMPLE_TEXTS).map(([key]) => (
                <button
                  key={key}
                  onClick={() => handleSampleTextSelect(key as keyof typeof SAMPLE_TEXTS)}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
                >
                  {key.charAt(0).toUpperCase() + key.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Text Input */}
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Enter text to analyze..."
            className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          {/* Analyze Button */}
          <div className="mt-4 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {inputText.length} characters
              {isAnalyzing && <span className="ml-2 text-blue-600 font-medium">• Analysis in progress</span>}
            </div>
            <button
              onClick={handleAnalyze}
              disabled={!modelLoaded || isAnalyzing || !inputText.trim()}
              className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                isAnalyzing 
                  ? 'bg-gray-400 text-white cursor-not-allowed' 
                  : (!modelLoaded || !inputText.trim()
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800')
              }`}
            >
              {isAnalyzing ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Analyzing...</span>
                </div>
              ) : (
                'Analyze Text'
              )}
            </button>
          </div>

          {/* Analysis Error */}
          {analysisError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {analysisError}
            </div>
          )}
        </div>

        {/* Analysis Progress */}
        {renderAnalysisProgress()}

        {/* Results */}
        {renderResults()}
      </div>
    </div>
  );
}

export default App;
