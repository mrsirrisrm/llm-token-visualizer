/**
 * Apply softmax to convert logits to probabilities
 */
export function softmax(logits: Float32Array): Float32Array {
  const maxLogit = Math.max(...Array.from(logits));
  const expLogits = logits.map(x => Math.exp(x - maxLogit));
  const sumExp = expLogits.reduce((sum, x) => sum + x, 0);
  return new Float32Array(expLogits.map(x => x / sumExp));
}

/**
 * Calculate the rank of a target token in sorted predictions
 */
export function calculateTokenRank(probabilities: Float32Array, targetTokenId: number): number {
  // Create array of [probability, index] pairs
  const probabilityPairs = Array.from(probabilities).map((prob, index) => ({ prob, index }));
  
  // Sort by probability in descending order
  probabilityPairs.sort((a, b) => b.prob - a.prob);
  
  // Find the rank of the target token
  const rank = probabilityPairs.findIndex(pair => pair.index === targetTokenId);
  return rank === -1 ? probabilities.length : rank;
}

/**
 * Calculate cumulative probability up to a given rank
 */
export function calculateCumulativeProbability(probabilities: Float32Array, rank: number): number {
  // Create array of [probability, index] pairs
  const probabilityPairs = Array.from(probabilities).map((prob, index) => ({ prob, index }));
  
  // Sort by probability in descending order
  probabilityPairs.sort((a, b) => b.prob - a.prob);
  
  // Sum probabilities up to the given rank (exclusive)
  let cumulativeProb = 0;
  for (let i = 0; i < rank && i < probabilityPairs.length; i++) {
    cumulativeProb += probabilityPairs[i].prob;
  }
  
  return cumulativeProb;
}

/**
 * Calculate top-k accuracy for a set of results
 */
export function calculateTopKAccuracy(ranks: number[], k: number): number {
  if (ranks.length === 0) return 0;
  const topKCount = ranks.filter(rank => rank < k).length;
  return topKCount / ranks.length;
}

/**
 * Calculate basic statistics for an array of numbers
 */
export function calculateStatistics(values: number[]): {
  mean: number;
  median: number;
  min: number;
  max: number;
  std: number;
} {
  if (values.length === 0) {
    return { mean: 0, median: 0, min: 0, max: 0, std: 0 };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const median = sorted.length % 2 === 0
    ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    : sorted[Math.floor(sorted.length / 2)];
  
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const std = Math.sqrt(variance);

  return {
    mean,
    median,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    std
  };
}

/**
 * Get top-k tokens from probabilities
 */
export function getTopKTokens(
  probabilities: Float32Array, 
  k: number = 10
): Array<{ tokenId: number; probability: number; rank: number }> {
  // Create array of [probability, tokenId] pairs
  const probabilityPairs = Array.from(probabilities).map((prob, tokenId) => ({ prob, tokenId }));
  
  // Sort by probability in descending order
  probabilityPairs.sort((a, b) => b.prob - a.prob);
  
  // Return top-k with ranks
  return probabilityPairs.slice(0, k).map((pair, rank) => ({
    tokenId: pair.tokenId,
    probability: pair.prob,
    rank
  }));
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Linear interpolation between two values
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp(t, 0, 1);
}
