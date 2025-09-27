export type VisualizationMode = 'probability' | 'rank' | 'cumulative';

export type ColorScheme = 'probability' | 'rank' | 'heatmap' | 'grayscale';

export interface ColorSchemeConfig {
  name: string;
  description: string;
  colors: string[];
}

export interface VisualizationSettings {
  mode: VisualizationMode;
  colorScheme: ColorScheme;
  fontSize: number;
  showTooltips: boolean;
  showLegend: boolean;
  width?: number;
  height?: number;
}

export interface TokenVisualization {
  token: string;
  color: string;
  position: number;
  rank?: number;
  probability?: number;
  cumulativeProbability?: number;
  isInitial: boolean;
}

export interface ExportOptions {
  format: 'png' | 'svg' | 'json' | 'csv';
  quality?: number;
  width?: number;
  height?: number;
  includeMetadata?: boolean;
}
