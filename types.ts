
export interface ProcessedImage {
  id: string;
  originalUrl: string; // Base64 or Object URL
  colorizedUrl: string | null; // Base64 or Object URL
  status: 'idle' | 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
  promptUsed?: string;
  customPrompt?: string; // Specific instructions for this page
}

export interface Settings {
  model: 'gemini-2.5-flash-image' | 'gemini-3-pro-image-preview';
  instructions: string; // Global instructions
  referenceImage: string | null; // Base64 of the reference style image
}

// Global window type extensions
declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey?: () => Promise<boolean>;
      openSelectKey?: () => Promise<void>;
    };
  }
}