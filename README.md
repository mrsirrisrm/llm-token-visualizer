# SmolLM2 Text Probability Visualizer

A web-based application that analyzes text predictability using the SmolLM2-135M model running locally in your browser via ONNX Runtime Web.

## Features

- **Local Inference**: Runs the SmolLM2-135M model entirely in your browser using ONNX Runtime Web
- **Text Analysis**: Analyzes token-by-token predictability of input text
- **Visual Feedback**: Color-coded tokens showing prediction difficulty
- **Statistics**: Comprehensive analysis including top-k accuracy, average rank, and cumulative probabilities
- **Real-time Progress**: Live progress tracking during analysis
- **Sample Texts**: Pre-loaded examples for quick testing

## Architecture

This project ports the Python text probability analysis to a modern web application:

### Core Components

- **ModelService**: Handles ONNX model loading and inference
- **TokenizerService**: Text tokenization using Transformers.js with fallback
- **AnalysisEngine**: Core analysis logic ported from Python implementation
- **React Frontend**: Modern UI with Tailwind CSS styling

### Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **ML Runtime**: ONNX Runtime Web
- **Tokenization**: @xenova/transformers (Transformers.js)
- **Model**: SmolLM2-135M ONNX format

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- Modern web browser with WebAssembly support

### Installation

1. **Clone and navigate to the project**:
   ```bash
   cd web-visualizer
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Model Files**:
   The required ONNX model files are already included in the `public/models/smollm2-135-onnx` directory. No download is necessary.

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. **Open your browser** to `http://localhost:5173`

## Usage

1. **Wait for Model Loading**: The app will automatically download and load the model on first visit
2. **Enter Text**: Type or paste text into the input area, or use one of the sample texts
3. **Analyze**: Click "Analyze Text" to start the analysis
4. **View Results**: 
   - Tokens are color-coded by prediction difficulty
   - Green: Easy to predict (low rank)
   - Yellow: Moderately predictable
   - Red: Hard to predict (high rank)
   - Gray: Initial tokens (no prediction)

## Model Information

- **Model**: SmolLM2-135M (135 million parameters)
- **Format**: ONNX for web deployment
- **Vocabulary**: 49,152 tokens
- **Context Length**: 2048 tokens
- **Source**: Included in project (`/public/models/smollm2-135-onnx`)

## Analysis Metrics

The application provides several key metrics:

- **Top-1 Accuracy**: Percentage of tokens where the model's top prediction was correct
- **Top-5/Top-10 Accuracy**: Percentage where correct token was in top-5/10 predictions
- **Average Rank**: Mean rank of actual tokens in model predictions
- **Cumulative Probability**: Probability mass up to the actual token's rank

## Performance Considerations

- **First Load**: Model download (~270MB) happens once and is cached
- **Inference Speed**: Depends on device capabilities (CPU/WebGL)
- **Memory Usage**: ~500MB-1GB during inference
- **Token Limit**: Analysis limited to 50 tokens for demo (configurable)

## Browser Compatibility

- **Chrome/Edge**: Full support with WebGL acceleration
- **Firefox**: CPU-only inference
- **Safari**: Limited support, CPU-only
- **Mobile**: May have memory limitations

## Development

### Project Structure

```
web-visualizer/
├── src/
│   ├── components/         # React components
│   │   ├── Analysis/
│   │   ├── Layout/
│   │   ├── TextInput/
│   │   ├── ui/
│   │   └── Visualization/
│   ├── services/           # Core services (Model, Tokenizer, Analysis)
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions and constants
│   ├── App.tsx             # Main application component
│   └── main.tsx            # Application entry point
├── public/
│   ├── models/             # ONNX model files
│   │   └── smollm2-135-onnx/
│   └── examples/           # Sample text files
└── package.json
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript checks

### Adding New Features

The codebase is designed for extensibility:

- **New Visualizations**: Extend `VisualizationSettings` and color schemes
- **Export Functionality**: Add export services for different formats
- **Model Support**: Extend `ModelService` for other ONNX models
- **Analysis Modes**: Add new analysis types to `AnalysisEngine`

## Troubleshooting

### Model Loading Issues

- Ensure model files are in `public/models/smollm2-135-onnx/`
- Check browser console for network errors
- Verify file size (~270MB) downloaded correctly

### Performance Issues

- Try reducing analysis token limit in `handleAnalyze`
- Close other browser tabs to free memory
- Use Chrome/Edge for better WebGL support

### Memory Errors

- Refresh the page to clear memory
- Reduce input text length
- Check available system memory

## Contributing

This project demonstrates the feasibility of running language model analysis entirely in the browser. Contributions welcome for:

- Performance optimizations
- Additional visualization modes
- Support for other models
- Mobile optimization
- Export functionality

## License

MIT License - see LICENSE file for details.

## Acknowledgments

- **SmolLM2**: HuggingFace team for the base model
- **ONNX Runtime**: Microsoft for web runtime
- **Transformers.js**: Xenova for tokenization library
- **Original Python Implementation**: Base analysis algorithms


# MODEL DIMS

smollm-135
135M param
30 layers
9 heads
3 kv-head
576 embedding dim
1536 hidden dim