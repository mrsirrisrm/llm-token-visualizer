export interface ModelConfig {
  modelPath: string;
  tokenizerPath?: string;
  vocabSize: number;
  maxSequenceLength: number;
  device: 'cpu' | 'webgl' | 'wasm';
}

export interface ModelLoadingProgress {
  stage: 'downloading' | 'loading' | 'initializing' | 'ready' | 'error';
  progress: number;
  message: string;
  error?: string;
}

export interface TokenizerConfig {
  vocabSize: number;
  bosToken?: string;
  eosToken?: string;
  unkToken?: string;
  padToken?: string;
}

export interface InferenceResult {
  logits: Float32Array;
  probabilities: Float32Array;
  topTokens: Array<{
    tokenId: number;
    token: string;
    probability: number;
    rank: number;
  }>;
}
