/**
 * Utility functions for coloring tokens based on cumulative probability
 */

/**
 * Convert cumulative probability to a color
 * Higher cumulative probability = easier to predict = greener
 * Lower cumulative probability = harder to predict = redder
 */
export function cumulativeProbabilityToColor(cumulativeProbability: number): string {
  // Clamp value to [0, 1] range
  const clampedValue = Math.max(0, Math.min(1, cumulativeProbability));
  
  // Define color stops for cumulative probability
  // Green (easy to predict) to Red (hard to predict)
  const colorStops = [
    { threshold: 0.0, color: '#dc2626' },   // Red - very hard to predict
    { threshold: 0.1, color: '#ea580c' },   // Red-orange
    { threshold: 0.2, color: '#f59e0b' },   // Orange
    { threshold: 0.3, color: '#eab308' },   // Yellow-orange
    { threshold: 0.5, color: '#84cc16' },   // Yellow-green
    { threshold: 0.7, color: '#22c55e' },   // Green
    { threshold: 0.9, color: '#16a34a' },   // Dark green
    { threshold: 1.0, color: '#15803d' }    // Very dark green - very easy to predict
  ];
  
  // Find the appropriate color range
  for (let i = 0; i < colorStops.length - 1; i++) {
    const current = colorStops[i];
    const next = colorStops[i + 1];
    
    if (clampedValue >= current.threshold && clampedValue <= next.threshold) {
      // Interpolate between the two colors
      const range = next.threshold - current.threshold;
      const position = range > 0 ? (clampedValue - current.threshold) / range : 0;
      return interpolateColor(current.color, next.color, position);
    }
  }
  
  // Fallback to the last color
  return colorStops[colorStops.length - 1].color;
}

/**
 * Get background and text color classes for cumulative probability
 */
export function getCumulativeProbabilityClasses(cumulativeProbability: number): {
  bgClass: string;
  textClass: string;
} {
  // Clamp value to [0, 1] range
  const clampedValue = Math.max(0, Math.min(1, cumulativeProbability));
  
  if (clampedValue >= 0.7) {
    return { bgClass: 'bg-green-100', textClass: 'text-green-800' };
  } else if (clampedValue >= 0.5) {
    return { bgClass: 'bg-green-50', textClass: 'text-green-700' };
  } else if (clampedValue >= 0.3) {
    return { bgClass: 'bg-yellow-100', textClass: 'text-yellow-800' };
  } else if (clampedValue >= 0.1) {
    return { bgClass: 'bg-orange-100', textClass: 'text-orange-800' };
  } else {
    return { bgClass: 'bg-red-100', textClass: 'text-red-800' };
  }
}

/**
 * Interpolate between two hex colors
 */
function interpolateColor(color1: string, color2: string, factor: number): string {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return color1;
  
  const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * factor);
  const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * factor);
  const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * factor);
  
  return rgbToHex(r, g, b);
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Convert RGB to hex color
 */
function rgbToHex(r: number, g: number, b: number): string {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/**
 * Get a descriptive label for cumulative probability ranges
 */
export function getCumulativeProbabilityLabel(cumulativeProbability: number): string {
  const clampedValue = Math.max(0, Math.min(1, cumulativeProbability));
  
  if (clampedValue >= 0.9) return 'Very Easy to Predict';
  if (clampedValue >= 0.7) return 'Easy to Predict';
  if (clampedValue >= 0.5) return 'Moderately Predictable';
  if (clampedValue >= 0.3) return 'Somewhat Difficult';
  if (clampedValue >= 0.1) return 'Difficult to Predict';
  return 'Very Difficult to Predict';
}
