import type { ColorScheme, ColorSchemeConfig } from '../types/visualization';

export const colorSchemes: Record<ColorScheme, ColorSchemeConfig> = {
  probability: {
    name: 'Probability (Green=High, Red=Low)',
    description: 'High probability tokens are green, low probability tokens are red',
    colors: ['#ee0000', '#dd4500', '#ddA500', '#bbbb00', '#ADcc2F', '#00bb00']
  },
  rank: {
    name: 'Rank (Blue=Low Rank, Red=High Rank)',
    description: 'Low rank (more predictable) tokens are blue, high rank tokens are red',
    colors: ['#0000FF', '#4169E1', '#87CEEB', '#FFB6C1', '#FF69B4', '#FF0000']
  },
  heatmap: {
    name: 'Heatmap (Cool=High Prob, Warm=Low Prob)',
    description: 'Cool colors for high probability, warm colors for low probability',
    colors: ['#8B0000', '#FF0000', '#FF4500', '#FFA500', '#FFFF00', '#00FFFF', '#0000FF']
  },
  grayscale: {
    name: 'Grayscale (White=High Prob, Black=Low Prob)',
    description: 'White for high probability, black for low probability',
    colors: ['#000000', '#404040', '#808080', '#C0C0C0', '#E0E0E0', '#FFFFFF']
  }
};

/**
 * Interpolate between colors in a color array
 */
export function interpolateColors(value: number, colors: string[]): string {
  // Clamp value to [0, 1]
  const clampedValue = Math.max(0, Math.min(1, value));
  
  if (colors.length === 0) return '#000000';
  if (colors.length === 1) return colors[0];
  
  // Calculate position in color array
  const position = clampedValue * (colors.length - 1);
  const index = Math.floor(position);
  const fraction = position - index;
  
  // Handle edge cases
  if (index >= colors.length - 1) return colors[colors.length - 1];
  if (fraction === 0) return colors[index];
  
  // Interpolate between two colors
  const color1 = hexToRgb(colors[index]);
  const color2 = hexToRgb(colors[index + 1]);
  
  if (!color1 || !color2) return colors[index];
  
  const r = Math.round(color1.r + (color2.r - color1.r) * fraction);
  const g = Math.round(color1.g + (color2.g - color1.g) * fraction);
  const b = Math.round(color1.b + (color2.b - color1.b) * fraction);
  
  return rgbToHex(r, g, b);
}

/**
 * Convert probability to color using specified scheme
 */
export function probabilityToColor(probability: number, scheme: ColorScheme): string {
  const schemeConfig = colorSchemes[scheme];
  return interpolateColors(probability, schemeConfig.colors);
}

/**
 * Convert rank to color using specified scheme
 */
export function rankToColor(rank: number, maxRank: number, scheme: ColorScheme): string {
  const schemeConfig = colorSchemes[scheme];
  // Normalize rank to 0-1 range (invert so 0 rank = 1.0, high rank = 0.0)
  const normalizedValue = maxRank > 0 ? 1.0 - (rank / maxRank) : 1.0;
  return interpolateColors(normalizedValue, schemeConfig.colors);
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
 * Get neutral color for initial tokens
 */
export function getNeutralColor(): string {
  return '#808080';
}
