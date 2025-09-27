// Model configuration
export const MODEL_CONFIG = {
  DEFAULT_MODEL_PATH: 'https://storage.googleapis.com/dbsea-public/models/SmolLM2-135M-ONNX-fp16.onnx',
  TOKENIZER_PATH: '/smollm2-135-onnx/',
  VOCAB_SIZE: 49152,
  MAX_SEQUENCE_LENGTH: 8192, // Updated to match SmolLM2's max_position_embeddings
  DEFAULT_DEVICE: 'cpu' as const,
  INITIAL_TOKENS_COUNT: 3,
} as const;

// Analysis configuration
export const ANALYSIS_CONFIG = {
  DEFAULT_MAX_LENGTH: 100,
  DEFAULT_BATCH_SIZE: 1,
  MAX_TEXT_LENGTH: 1000000, // 1MB
  PROGRESS_UPDATE_INTERVAL: 100, // ms
} as const;

// Visualization configuration
export const VISUALIZATION_CONFIG = {
  DEFAULT_FONT_SIZE: 14,
  MIN_FONT_SIZE: 8,
  MAX_FONT_SIZE: 32,
  DEFAULT_WIDTH: 1200,
  DEFAULT_HEIGHT: 800,
  CANVAS_PADDING: 20,
  LINE_HEIGHT_MULTIPLIER: 1.6,
  WORD_SPACING: 8,
  HOVER_SCALE: 1.05,
  ANIMATION_DURATION: 200, // ms
} as const;

// Color scheme configuration
export const COLOR_CONFIG = {
  NEUTRAL_COLOR: '#808080',
  INITIAL_TOKEN_COLOR: '#808080',
  BACKGROUND_COLOR: '#ffffff',
  TEXT_COLOR: '#000000',
  BORDER_COLOR: '#e5e7eb',
} as const;

// Export formats
export const EXPORT_FORMATS = {
  PNG: 'png',
  SVG: 'svg',
  JSON: 'json',
  CSV: 'csv',
} as const;

// File upload configuration
export const FILE_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ACCEPTED_TYPES: ['.txt', '.md', '.json'],
  ACCEPTED_MIME_TYPES: ['text/plain', 'text/markdown', 'application/json'],
} as const;

// Performance configuration
export const PERFORMANCE_CONFIG = {
  DEBOUNCE_DELAY: 300, // ms
  THROTTLE_DELAY: 100, // ms
  CHUNK_SIZE: 1000, // characters
  MAX_CONCURRENT_REQUESTS: 3,
} as const;

// UI configuration
export const UI_CONFIG = {
  SIDEBAR_WIDTH: 320,
  HEADER_HEIGHT: 64,
  FOOTER_HEIGHT: 48,
  MOBILE_BREAKPOINT: 768,
  TABLET_BREAKPOINT: 1024,
} as const;

// Error messages
export const ERROR_MESSAGES = {
  MODEL_LOAD_FAILED: 'Failed to load the model. Please check your connection and try again.',
  TOKENIZER_LOAD_FAILED: 'Failed to load the tokenizer. Please check your connection and try again.',
  ANALYSIS_FAILED: 'Analysis failed. Please try again with different text.',
  FILE_TOO_LARGE: 'File is too large. Maximum size is 10MB.',
  INVALID_FILE_TYPE: 'Invalid file type. Please upload a text file (.txt, .md, .json).',
  EMPTY_TEXT: 'Please enter some text to analyze.',
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  MODEL_LOADED: 'Model loaded successfully!',
  ANALYSIS_COMPLETE: 'Analysis completed successfully!',
  FILE_UPLOADED: 'File uploaded successfully!',
  EXPORT_COMPLETE: 'Export completed successfully!',
} as const;

// Local storage keys
export const STORAGE_KEYS = {
  SETTINGS: 'smollm-visualizer-settings',
  RECENT_TEXTS: 'smollm-visualizer-recent-texts',
  USER_PREFERENCES: 'smollm-visualizer-preferences',
} as const;

// API endpoints (if needed for future extensions)
export const API_ENDPOINTS = {
  MODEL_INFO: '/api/model/info',
  HEALTH_CHECK: '/api/health',
} as const;

// Sample texts for demonstration
export const SAMPLE_TEXTS = {
  FORMAL: `Art has been maligned. People have acquired the habit of looking not at a picture, but through it, at some human fact, that shall, from a social point of view, better their mental or moral state. Art is selfishly occupied with her own perfection only, having no desire to teach.`,
  
  CONVERSATIONAL: `Hey there! How's your day going? I was just thinking about our conversation yesterday and wanted to follow up on those ideas we discussed.`,
  
  TECHNICAL: `The quantum physicist discovered an unusual phenomenon while experimenting with crystalline structures. The unexpected results challenged conventional theories about molecular behavior and thermodynamics.`,
  
  CREATIVE: `The ancient oak tree stood sentinel in the moonlit forest, its gnarled branches reaching toward the star-scattered sky like the fingers of some primordial giant awakening from centuries of slumber.`,
} as const;

// Keyboard shortcuts
export const KEYBOARD_SHORTCUTS = {
  ANALYZE: 'Ctrl+Enter',
  CLEAR: 'Ctrl+K',
  EXPORT: 'Ctrl+S',
  TOGGLE_SETTINGS: 'Ctrl+,',
  HELP: 'F1',
} as const;
