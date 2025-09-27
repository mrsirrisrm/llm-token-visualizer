export interface AnalysisResult {
  position: number;
  token: string;
  tokenId: number;
  rank: number | null;
  probability: number | null;
  cumulativeProbability: number | null;
  isInitial: boolean;
}

export interface AnalysisStatistics {
  totalTokens: number;
  predictedTokens: number;
  top1Accuracy: number;
  top5Accuracy: number;
  top10Accuracy: number;
  averageRank: number;
  averageCumulativeProbability: number;
  medianRank: number;
  medianCumulativeProbability: number;
}

export interface AnalysisProgress {
  current: number;
  total: number;
  percentage: number;
  currentToken?: string;
  estimatedTimeRemaining?: number;
}

export interface AnalysisConfig {
  maxLength?: number;
  batchSize?: number;
  showProgress?: boolean;
}
