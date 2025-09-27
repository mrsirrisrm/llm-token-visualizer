/**
 * Clean and preprocess text for analysis
 */
export function preprocessText(text: string): string {
  // Remove excessive whitespace while preserving single spaces
  return text
    .replace(/\r\n/g, '\n')  // Normalize line endings
    .replace(/\r/g, '\n')    // Normalize line endings
    .replace(/\t/g, ' ')     // Replace tabs with spaces
    .replace(/[ ]+/g, ' ')   // Replace multiple spaces with single space
    .trim();                 // Remove leading/trailing whitespace
}

/**
 * Split text into chunks for processing
 */
export function chunkText(text: string, maxChunkSize: number): string[] {
  if (text.length <= maxChunkSize) {
    return [text];
  }

  const chunks: string[] = [];
  let currentChunk = '';
  const words = text.split(/\s+/);

  for (const word of words) {
    const testChunk = currentChunk ? `${currentChunk} ${word}` : word;
    
    if (testChunk.length <= maxChunkSize) {
      currentChunk = testChunk;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
        currentChunk = word;
      } else {
        // Word is longer than maxChunkSize, split it
        chunks.push(word.substring(0, maxChunkSize));
        currentChunk = word.substring(maxChunkSize);
      }
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}

/**
 * Estimate token count for text (rough approximation)
 */
export function estimateTokenCount(text: string): number {
  // Rough approximation: 1 token per 4 characters on average
  return Math.ceil(text.length / 4);
}

/**
 * Truncate text to approximately maxTokens
 */
export function truncateToTokens(text: string, maxTokens: number): string {
  const estimatedChars = maxTokens * 4; // Rough approximation
  if (text.length <= estimatedChars) {
    return text;
  }
  
  // Try to break at word boundaries
  const truncated = text.substring(0, estimatedChars);
  const lastSpaceIndex = truncated.lastIndexOf(' ');
  
  if (lastSpaceIndex > estimatedChars * 0.8) {
    return truncated.substring(0, lastSpaceIndex);
  }
  
  return truncated;
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Validate text input
 */
export function validateText(text: string): { isValid: boolean; error?: string } {
  if (!text || text.trim().length === 0) {
    return { isValid: false, error: 'Text cannot be empty' };
  }
  
  if (text.length > 1000000) { // 1MB limit
    return { isValid: false, error: 'Text is too long (max 1MB)' };
  }
  
  return { isValid: true };
}

/**
 * Extract filename from file path or URL
 */
export function extractFilename(path: string): string {
  return path.split('/').pop() || path.split('\\').pop() || 'unknown';
}

/**
 * Generate a safe filename for downloads
 */
export function generateSafeFilename(text: string, extension: string = 'txt'): string {
  const maxLength = 50;
  const safe = text
    .replace(/[^a-zA-Z0-9\s-_]/g, '') // Remove special characters
    .replace(/\s+/g, '_')             // Replace spaces with underscores
    .substring(0, maxLength)          // Limit length
    .toLowerCase();
  
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
  return `${safe}_${timestamp}.${extension}`;
}

/**
 * Word wrap text to specified width
 */
export function wordWrap(text: string, width: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    
    if (testLine.length <= width) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        // Word is longer than width, break it
        lines.push(word.substring(0, width));
        currentLine = word.substring(width);
      }
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Escape HTML characters in text
 */
export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Calculate reading time estimate
 */
export function estimateReadingTime(text: string): string {
  const wordsPerMinute = 200;
  const wordCount = text.split(/\s+/).length;
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  
  if (minutes < 1) return 'Less than 1 minute';
  if (minutes === 1) return '1 minute';
  return `${minutes} minutes`;
}
