# SmolLM2 Text Probability Visualizer

**A web-based tool for analyzing and visualizing the predictability of text using a language model that runs entirely in your browser.**

This application uses the SmolLM2-135M model to perform a token-by-token analysis of your input text, providing insights into how surprising or predictable each word is to the model. The results are displayed as color-coded text, offering an intuitive visual representation of the analysis.

---

## Features

-   **100% Client-Side**: The entire analysis, from tokenization to model inference, runs locally in your web browser. No data is ever sent to a server.
-   **Interactive Visualization**: Text is colored based on its predictability, making it easy to spot surprising or unusual phrases.
    -   <span style="color:green;">**Green**</span>: High predictability (the model easily guessed this token).
    -   <span style="color:red;">**Red**</span>: Low predictability (a surprising token for the model).
-   **Detailed Statistics**: Get a comprehensive breakdown of the analysis, including:
    -   Top-K Accuracy (Top-1, Top-5, Top-10)
    -   Average Token Rank
    -   Average Cumulative Probability
-   **Efficient Caching**: The model is downloaded once and then cached by your browser for near-instant loading on subsequent visits.
-   **Real-Time Progress**: The UI shows live progress for model downloads and text analysis.

## How It Works

The application performs a sophisticated analysis without needing a backend server. Here’s the process:

1.  **Model Loading**: On the first visit, the SmolLM2-135M model (in ONNX format) is downloaded from a public GCS bucket and cached in the browser.
2.  **Tokenization**: The input text is broken down into tokens using the `@xenova/transformers` library.
3.  **Sequential Inference**: The application iterates through the tokens one by one. For each token, it runs an inference using the preceding tokens as context to get the model's prediction for the *next* token.
4.  **Analysis**: It calculates the rank and cumulative probability of the *actual* token within the model's predictions.
5.  **Visualization**: This data is used to color the tokens and calculate the overall statistics.

## Technology Stack

-   **Frontend**: React 18, TypeScript, Vite
-   **Styling**: Tailwind CSS
-   **ML Runtime**: ONNX Runtime Web (for running the model in the browser)
-   **Tokenization**: `@xenova/transformers` (Transformers.js)
-   **Model**: SmolLM2-135M in ONNX format

## Getting Started

### Prerequisites

-   Node.js v18+
-   npm (or your preferred package manager)
-   A modern web browser with WebAssembly support (Chrome, Firefox, Edge recommended).

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/llm-token-visualizer.git
    cd llm-token-visualizer
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    ```

4.  **Open your browser** to `http://localhost:5173`.

The application will download the model on the first load, which may take a moment depending on your network connection.

### Available Scripts

-   `npm run dev`: Starts the development server.
-   `npm run build`: Builds the application for production.
-   `npm run preview`: Serves the production build locally for testing.
-   `npm run lint`: Runs ESLint to check for code quality issues.
-   `npm run type-check`: Runs the TypeScript compiler to check for type errors.

## Contributing

Contributions are welcome! This project is a great way to explore the capabilities of running language models in the browser. Potential areas for contribution include:

-   Performance optimizations
-   Additional visualization modes
-   Support for other models
-   Mobile-friendly optimizations

## License

This project is licensed under the MIT License.

## Acknowledgments

-   The **HuggingFace team** for the base SmolLM2 model.
-   **Microsoft** for the ONNX Runtime.
-   **Xenova** for the `Transformers.js` library.
