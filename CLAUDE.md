# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a web-based text probability visualization tool that runs the SmolLM2-135M language model locally in the browser using ONNX Runtime Web. The application analyzes text predictability by calculating token ranks and cumulative probabilities, providing visual feedback through color-coded tokens.

## Development Commands

```bash
# Development server
npm run dev

# Type checking
npm run type-check

# Build for production
npm run build

# Lint code
npm run lint

# Preview production build
npm run preview
```

## Core Architecture

### Service Layer Pattern
The application follows a service-oriented architecture with three main services:

- **ModelService** (`src/services/ModelService.ts`): Handles ONNX model loading, inference, and memory management. Uses singleton pattern (`modelService`).
- **TokenizerService** (`src/services/TokenizerService.ts`): Text tokenization using Transformers.js with fallback handling. Uses singleton pattern (`tokenizerService`).
- **AnalysisEngine** (`src/services/AnalysisEngine.ts`): Core analysis logic ported from Python implementation. Orchestrates model inference and statistical calculations. Uses singleton pattern (`analysisEngine`).

### Model Integration
- SmolLM2-135M ONNX model (135M parameters, 30 layers, 9 heads, 3 kv-heads)
- Model files stored in `public/models/smollm2-135-onnx/`
- WASM files for ONNX Runtime in `public/wasm/`
- Model configuration in `src/utils/constants.ts` under `MODEL_CONFIG`

### Analysis Pipeline
1. Text preprocessing (`src/utils/textUtils.ts`)
2. Tokenization using Transformers.js
3. Sequential token analysis with inference for each position
4. Rank and cumulative probability calculations (`src/utils/mathUtils.ts`)
5. Statistical aggregation and visualization

### Data Flow
- **Analysis Results**: `AnalysisResult[]` - token-by-token analysis data
- **Statistics**: `AnalysisStatistics` - aggregated metrics (top-k accuracy, average rank, etc.)
- **Progress Tracking**: `AnalysisProgress` - real-time analysis updates

## Key Technical Details

### Memory Management
- Analysis mode clears past key-values cache for each inference (no incremental generation)
- Empty past key-values tensors created for each inference with shape `[batch_size, kv_heads, 0, head_dim]`
- Model disposal handled via `modelService.dispose()`

### Token Limits
- Analysis limited to 200 tokens by default (configurable via `AnalysisConfig.maxLength`)
- Initial tokens (first few in sequence) marked as non-predictable
- Max sequence length: 2048 tokens (model context window)

### Color Visualization
- Cumulative probability determines token background color
- Color scheme implemented in `src/utils/cumulativeProbabilityColors.ts`
- Green: High predictability, Red: Low predictability, Gray: Initial tokens

### Error Handling
- Progressive fallbacks for model loading and inference
- Detailed error reporting with context in console
- UI feedback for loading states, errors, and progress

## File Structure Highlights

```
src/
├── components/       # React components
│   ├── Analysis/
│   ├── Layout/
│   ├── TextInput/
│   ├── ui/
│   └── Visualization/
├── services/         # Core business logic services
├── types/            # TypeScript type definitions
├── utils/            # Utility functions and constants
└── App.tsx           # Main application component
```

## Development Notes

- Uses React 18 with TypeScript and Vite
- Tailwind CSS for styling
- ONNX Runtime Web for ML inference
- @xenova/transformers for tokenization
- All analysis runs client-side (no server required)