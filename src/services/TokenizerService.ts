import { AutoTokenizer, env } from '@xenova/transformers';
import type { TokenizerConfig } from '../types/model';

// Configure Transformers.js environment for local models
env.allowLocalModels = true;
env.allowRemoteModels = true;

export class TokenizerService {
  private tokenizer: any | null = null; // eslint-disable-line @typescript-eslint/no-explicit-any
  private config: TokenizerConfig;
  private isLoading = false;

  constructor(config?: Partial<TokenizerConfig>) {
    this.config = {
      vocabSize: 49152,
      bosToken: '<|endoftext|>',
      eosToken: '<|endoftext|>',
      unkToken: '<|endoftext|>',
      padToken: '<|endoftext|>',
      ...config,
    };
  }

  /**
   * Load the tokenizer from local files
   */
  async loadTokenizer(modelPath: string = '/models/smollm2-135-onnx/'): Promise<void> {
    if (this.tokenizer) {
      return;
    }

    if (this.isLoading) {
      return;
    }

    this.isLoading = true;

    try {
      console.log('Loading tokenizer from local path:', modelPath);
      
      // Load tokenizer from local files
      this.tokenizer = await AutoTokenizer.from_pretrained(modelPath, {
        local_files_only: true,
      });
      
      console.log('Tokenizer loaded successfully from local files');
      
      // Verify tokenizer configuration
      const tokenizerInfo = this.getTokenizerInfo();
      console.log('Tokenizer info:', tokenizerInfo);
      
    } catch (error) {
      console.error('Failed to load tokenizer from local files:', error);
      
      try {
        // Fallback: try loading from HuggingFace
        console.log('Attempting fallback to HuggingFace...');
        this.tokenizer = await AutoTokenizer.from_pretrained('HuggingFaceTB/SmolLM2-135M');
        console.log('Tokenizer loaded successfully from HuggingFace fallback');
      } catch (fallbackError) {
        console.error('HuggingFace fallback also failed:', fallbackError);
        // Final fallback to simple tokenizer implementation
        this.tokenizer = new SimpleTokenizer();
        console.log('Using fallback simple tokenizer');
      }
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Tokenize text into token IDs
   */
  async encode(text: string): Promise<number[]> {
    if (!this.tokenizer) {
      throw new Error('Tokenizer not loaded. Call loadTokenizer() first.');
    }

    try {
      if (this.tokenizer.encode) {
        // Using Transformers.js tokenizer
        const result = await this.tokenizer.encode(text);
        return Array.isArray(result) ? result : Array.from(result);
      } else {
        // Using fallback tokenizer
        return this.tokenizer.encode(text);
      }
    } catch (error) {
      console.error('Tokenization failed:', error);
      throw new Error(`Failed to tokenize text: ${error}`);
    }
  }

  /**
   * Decode token IDs back to text
   */
  async decode(tokenIds: number[]): Promise<string> {
    if (!this.tokenizer) {
      throw new Error('Tokenizer not loaded. Call loadTokenizer() first.');
    }

    try {
      if (this.tokenizer.decode) {
        // Using Transformers.js tokenizer
        return await this.tokenizer.decode(tokenIds, { skip_special_tokens: true });
      } else {
        // Using fallback tokenizer
        return this.tokenizer.decode(tokenIds);
      }
    } catch (error) {
      console.error('Decoding failed:', error);
      throw new Error(`Failed to decode tokens: ${error}`);
    }
  }

  /**
   * Decode a single token ID to text
   */
  async decodeToken(tokenId: number): Promise<string> {
    if (!this.tokenizer) {
      throw new Error('Tokenizer not loaded. Call loadTokenizer() first.');
    }

    try {
      if (this.tokenizer.decode) {
        // Using Transformers.js tokenizer
        return await this.tokenizer.decode([tokenId], { skip_special_tokens: true });
      } else {
        // Using fallback tokenizer
        return this.tokenizer.decodeToken(tokenId);
      }
    } catch (error) {
      console.error('Token decoding failed:', error);
      return `<${tokenId}>`;
    }
  }

  /**
   * Get tokenizer information
   */
  getTokenizerInfo() {
    return {
      isLoaded: !!this.tokenizer,
      config: this.config,
      vocabSize: this.config.vocabSize,
    };
  }

  /**
   * Estimate token count for text (without full tokenization)
   */
  estimateTokenCount(text: string): number {
    // Rough approximation: 1 token per 4 characters on average
    return Math.ceil(text.length / 4);
  }
}

/**
 * Simple fallback tokenizer for when Transformers.js fails
 */
class SimpleTokenizer {
  private vocab: Map<string, number> = new Map();
  private reverseVocab: Map<number, string> = new Map();
  private nextId = 0;

  constructor() {
    // Add SmolLM2 special tokens in correct order
    this.addToken('<|endoftext|>'); // ID: 0 - BOS/EOS/UNK/PAD
    this.addToken('<|im_start|>');  // ID: 1
    this.addToken('<|im_end|>');    // ID: 2
    this.addToken('<repo_name>');   // ID: 3
    this.addToken('<reponame>');    // ID: 4
    this.addToken('<file_sep>');    // ID: 5
    this.addToken('<filename>');    // ID: 6
    this.addToken('<gh_stars>');    // ID: 7
    this.addToken('<issue_start>'); // ID: 8
    this.addToken('<issue_comment>'); // ID: 9
    this.addToken('<issue_closed>'); // ID: 10
    this.addToken('<jupyter_start>'); // ID: 11
    this.addToken('<jupyter_text>'); // ID: 12
    this.addToken('<jupyter_code>'); // ID: 13
    this.addToken('<jupyter_output>'); // ID: 14
    this.addToken('<jupyter_script>'); // ID: 15
    this.addToken('<empty_output>'); // ID: 16
  }

  private addToken(token: string): number {
    if (!this.vocab.has(token)) {
      const id = this.nextId++;
      this.vocab.set(token, id);
      this.reverseVocab.set(id, token);
      return id;
    }
    return this.vocab.get(token)!;
  }

  encode(text: string): number[] {
    // Very simple word-based tokenization
    const words = text.toLowerCase().split(/\s+/);
    const tokens: number[] = [];

    for (const word of words) {
      if (word.length === 0) continue;
      
      let tokenId = this.vocab.get(word);
      if (tokenId === undefined) {
        tokenId = this.addToken(word);
      }
      tokens.push(tokenId);
    }

    return tokens;
  }

  decode(tokenIds: number[]): string {
    const tokens = tokenIds.map(id => this.reverseVocab.get(id) || '<unk>');
    return tokens.join(' ');
  }

  decodeToken(tokenId: number): string {
    return this.reverseVocab.get(tokenId) || '<unk>';
  }
}

// Singleton instance for global use
export const tokenizerService = new TokenizerService();
