import type { ModelConfig, ModelLoadingProgress, InferenceResult } from '../types/model';
import { MODEL_CONFIG } from '../utils/constants';
import { softmax } from '../utils/mathUtils';
import * as ort from 'onnxruntime-web';

// Configure ONNX Runtime Web environment immediately
try {
  // Use local WASM files if available, fallback to CDN
  ort.env.wasm.wasmPaths = '/wasm/';
  // Limit threads to 1 since we don't have cross-origin isolation enabled
  ort.env.wasm.numThreads = 1;
  ort.env.wasm.simd = true;
  ort.env.logLevel = 'warning';
  
  console.log('ONNX Runtime Web configured successfully');
} catch (error) {
  console.error('Failed to configure ONNX Runtime Web:', error);
}

export class ModelService {
  private session: ort.InferenceSession | null = null;
  private config: ModelConfig;
  private isLoading = false;
  private loadingCallbacks: ((progress: ModelLoadingProgress) => void)[] = [];
  private modelInputNames: string[] = [];
  private pastKeyValues: Map<string, ort.Tensor> = new Map();

  constructor(config?: Partial<ModelConfig>) {
    this.config = {
      modelPath: MODEL_CONFIG.DEFAULT_MODEL_PATH,
      vocabSize: MODEL_CONFIG.VOCAB_SIZE,
      maxSequenceLength: MODEL_CONFIG.MAX_SEQUENCE_LENGTH,
      device: MODEL_CONFIG.DEFAULT_DEVICE,
      ...config,
    };
  }

  /**
   * Load the ONNX model
   */
  async loadModel(onProgress?: (progress: ModelLoadingProgress) => void): Promise<void> {
    if (this.session) {
      this.notifyProgress({ stage: 'ready', progress: 100, message: 'Model already loaded' });
      return;
    }

    if (this.isLoading) {
      if (onProgress) this.loadingCallbacks.push(onProgress);
      return;
    }

    this.isLoading = true;
    if (onProgress) this.loadingCallbacks.push(onProgress);

    try {
      this.notifyProgress({ stage: 'downloading', progress: 0, message: 'Downloading model...' });

      // Configure ONNX Runtime
      const sessionOptions = {
        executionProviders: this.getExecutionProviders(),
        graphOptimizationLevel: 'all' as const,
        enableCpuMemArena: true,
        enableMemPattern: true,
      };

      this.notifyProgress({ stage: 'downloading', progress: 0, message: 'Checking cache for model...' });

      const cacheName = 'model-cache-v1';
      const cacheKey = this.config.modelPath;
      const cache = await caches.open(cacheName);
      let cachedResponse = await cache.match(cacheKey);
      let modelBuffer: ArrayBuffer;

      if (cachedResponse) {
        this.notifyProgress({ stage: 'downloading', progress: 50, message: 'Loading model from cache...' });
        modelBuffer = await cachedResponse.arrayBuffer();
        this.notifyProgress({ stage: 'downloading', progress: 100, message: 'Model loaded from cache.' });
      } else {
        this.notifyProgress({ stage: 'downloading', progress: 0, message: 'Downloading model...' });

        const response = await fetch(this.config.modelPath);
        if (!response.ok || !response.body) {
          throw new Error(`Failed to fetch model: ${response.statusText}`);
        }

        const contentLength = response.headers.get('Content-Length');
        const totalSize = contentLength ? parseInt(contentLength, 10) : 0;
        let receivedSize = 0;

        const reader = response.body.getReader();
        const chunks: Uint8Array[] = [];
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          receivedSize += value.length;
          if (totalSize > 0) {
            const progress = (receivedSize / totalSize) * 100;
            this.notifyProgress({ stage: 'downloading', progress, message: `Downloading model... ${Math.round(progress)}%` });
          }
        }

        const blob = new Blob(chunks);
        modelBuffer = await blob.arrayBuffer();

        // Cache the downloaded model for future use
        const cacheResponse = new Response(modelBuffer, {
          headers: { 'Content-Type': 'application/octet-stream' }
        });
        await cache.put(cacheKey, cacheResponse);
        this.notifyProgress({ stage: 'downloading', progress: 100, message: 'Model downloaded.' });
      }

      this.notifyProgress({ stage: 'initializing', progress: 75, message: 'Initializing model...' });

      // Load the model from the buffer.
      // We use `as any` on the session options because the library's TypeScript definitions
      // are incorrect and don't include the `externalDataFilePaths` property, which is required
      // for loading models with external weights from a URL.
      console.log('Creating inference session from buffer...');
      this.session = await ort.InferenceSession.create(new Uint8Array(modelBuffer), {
        ...sessionOptions,
        externalDataFilePaths: [this.config.modelPath],
      } as any);

      this.notifyProgress({ stage: 'initializing', progress: 90, message: 'Validating model...' });

      // Validate model inputs/outputs
      this.validateModel();

      this.notifyProgress({ stage: 'ready', progress: 100, message: 'Model loaded successfully!' });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Model loading failed:', error);
      this.notifyProgress({ 
        stage: 'error', 
        progress: 0, 
        message: 'Failed to load model', 
        error: errorMessage 
      });
      throw new Error(`Failed to load model: ${errorMessage}`);
    } finally {
      this.isLoading = false;
      this.loadingCallbacks = [];
    }
  }

  /**
   * Run inference on a sequence of tokens
   */
  async runInference(inputIds: number[]): Promise<InferenceResult> {
    if (!this.session) {
      throw new Error('Model not loaded. Call loadModel() first.');
    }

    if (inputIds.length === 0) {
      throw new Error('Input sequence cannot be empty');
    }

    if (inputIds.length > this.config.maxSequenceLength) {
      throw new Error(`Input sequence too long. Maximum length: ${this.config.maxSequenceLength}`);
    }

    try {
      //console.log(`Running inference for ${inputIds.length} tokens:`, inputIds);
      
      // For analysis mode, we don't use past key-values caching since we're processing
      // different sequence lengths each time, not incremental generation
      // Always clear cache to ensure clean state for each inference
      this.clearCache();

      // Prepare input tensor - use int64 as the model expects it
      const inputTensor = new ort.Tensor('int64', BigInt64Array.from(inputIds.map(id => BigInt(id))), [1, inputIds.length]);
      
      // Build feeds object dynamically based on model inputs
      const feeds: Record<string, ort.Tensor> = {
        input_ids: inputTensor,
      };

      //console.log('Model input names:', this.modelInputNames);

      // Add attention mask if the model expects it (use int64 to match input_ids)
      if (this.modelInputNames.includes('attention_mask')) {
        const attentionMask = new ort.Tensor('int64', BigInt64Array.from(new Array(inputIds.length).fill(BigInt(1))), [1, inputIds.length]);
        feeds.attention_mask = attentionMask;
      }
      
      // Add position IDs if the model expects them (use int64 to match input_ids)
      if (this.modelInputNames.includes('position_ids')) {
        const positionIds = new ort.Tensor('int64', BigInt64Array.from(Array.from({length: inputIds.length}, (_, i) => BigInt(i))), [1, inputIds.length]);
        feeds.position_ids = positionIds;
      }

      // Handle past key-values - always create empty ones for analysis mode
      const pastKeyValueInputs = this.modelInputNames.filter(name => 
        name.startsWith('past_key_values') || name.includes('past_key') || name.includes('past_value')
      );
      //console.log('Past key-value inputs found:', pastKeyValueInputs);
      
      if (pastKeyValueInputs.length > 0) {
        for (const inputName of pastKeyValueInputs) {
          // Always create empty past key-values for analysis mode
          // This ensures consistent behavior across all sequence lengths
          //console.log(`Creating empty past key-values for ${inputName}`);
          
          // Based on SmolLM-135M architecture:
          // - 135M parameters, 30 layers, 9 attention heads, 3 kv-heads
          // - 576 embedding dim, 1536 hidden dim
          // - For past key-values, we use kv-heads (3) not attention heads (9)
          const batchSize = 1;
          const kvHeads = 3; // Key-value heads for grouped query attention
          const pastSeqLen = 0; // Empty for analysis mode
          const headDim = 576 / 9; // 64 - head dimension based on embedding dim / attention heads
          
          const shape = [batchSize, kvHeads, pastSeqLen, headDim];
          const size = shape.reduce((a, b) => a * b, 1);
          const data = new Float32Array(size); // All zeros
          
          feeds[inputName] = new ort.Tensor('float32', data, shape);
          //console.log(`Created empty tensor for ${inputName} with shape:`, shape, `(${kvHeads} kv-heads, ${headDim} head_dim)`);
        }
      }

      //console.log('Feeds prepared:', Object.keys(feeds));
      //console.log('Input tensor shape:', feeds.input_ids.dims);

      const results = await this.session.run(feeds);
      
      //console.log('Inference completed, output keys:', Object.keys(results));
      
      // For analysis mode, we don't cache present key-values since we're not doing
      // incremental generation - each inference is independent
      
      // Extract logits - try different possible output names
      let logitsOutput = results.logits || results.last_hidden_state || results.prediction_scores;
      
      if (!logitsOutput) {
        // If no standard names found, try the first output
        const outputKeys = Object.keys(results);
        console.log('Available outputs:', outputKeys);
        logitsOutput = results[outputKeys[0]];
      }
      
      if (!logitsOutput) {
        throw new Error('No logits output found in model results');
      }

      //console.log('Logits output shape:', logitsOutput.dims);
      //console.log('Logits data type:', logitsOutput.type);

      // Get the last token's logits
      const logitsData = logitsOutput.data as Float32Array;
      const vocabSize = this.config.vocabSize;
      
      // For sequence output, get the last position's logits
      let lastTokenLogits: Float32Array;
      if (logitsOutput.dims.length === 3) {
        // Shape: [batch_size, sequence_length, vocab_size]
        const seqLen = logitsOutput.dims[1];
        const startIdx = (seqLen - 1) * vocabSize;
        lastTokenLogits = logitsData.slice(startIdx, startIdx + vocabSize);
      } else if (logitsOutput.dims.length === 2) {
        // Shape: [batch_size, vocab_size] - already the last token
        lastTokenLogits = logitsData.slice(-vocabSize);
      } else {
        throw new Error(`Unexpected logits shape: ${logitsOutput.dims}`);
      }

      // Convert to probabilities
      const probabilities = softmax(lastTokenLogits);

      // Get top tokens for debugging/analysis
      const topTokens = this.getTopTokens(probabilities, 10);

      //console.log('Inference successful, top tokens:', topTokens.slice(0, 3));

      return {
        logits: lastTokenLogits,
        probabilities,
        topTokens,
      };

    } catch (error) {
      console.error('Inference error details:', {
        error,
        errorType: typeof error,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
        inputIds,
        inputLength: inputIds.length,
        modelInputNames: this.modelInputNames,
        pastKeyValuesCount: this.pastKeyValues.size
      });
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown inference error';
      throw new Error(`Inference failed: ${errorMessage}`);
    }
  }

  /**
   * Get model information
   */
  getModelInfo() {
    return {
      isLoaded: !!this.session,
      config: this.config,
      inputNames: this.session?.inputNames || [],
      outputNames: this.session?.outputNames || [],
    };
  }

  /**
   * Clear past key-values cache (useful when starting a new sequence)
   */
  clearCache(): void {
    this.pastKeyValues.clear();
  }

  /**
   * Dispose of the model and free memory
   */
  dispose(): void {
    if (this.session) {
      this.session.release();
      this.session = null;
    }
    this.pastKeyValues.clear();
  }

  /**
   * Get execution providers based on device configuration
   */
  private getExecutionProviders(): string[] {
    switch (this.config.device) {
      case 'webgl':
        return ['webgl', 'cpu'];
      case 'wasm':
        return ['wasm', 'cpu'];
      default:
        return ['cpu'];
    }
  }

  /**
   * Validate that the model has expected inputs/outputs
   */
  private validateModel(): void {
    if (!this.session) return;

    const requiredInputs = ['input_ids'];
    const hasRequiredInputs = requiredInputs.every(input => 
      this.session!.inputNames.includes(input)
    );

    if (!hasRequiredInputs) {
      console.warn('Model may not have expected inputs:', this.session.inputNames);
    }

    //console.log('Model inputs:', this.session.inputNames);
    //console.log('Model outputs:', this.session.outputNames);
    
    // Store input names for use in inference
    this.modelInputNames = [...this.session.inputNames];
  }

  /**
   * Get top-k tokens from probabilities
   */
  private getTopTokens(probabilities: Float32Array, k: number = 10) {
    const tokens = Array.from(probabilities)
      .map((prob, tokenId) => ({ tokenId, probability: prob, rank: 0, token: `<${tokenId}>` }))
      .sort((a, b) => b.probability - a.probability)
      .slice(0, k)
      .map((token, rank) => ({ ...token, rank }));

    return tokens;
  }

  /**
   * Notify all progress callbacks
   */
  private notifyProgress(progress: ModelLoadingProgress): void {
    this.loadingCallbacks.forEach(callback => {
      try {
        callback(progress);
      } catch (error) {
        console.error('Error in progress callback:', error);
      }
    });
  }
}

// Singleton instance for global use
export const modelService = new ModelService();
