
export interface Page {
  text: string;
  illustrationPrompt: string;
  imageUrl?: string;
  audioData?: string;
}

export interface Story {
  title: string;
  pages: Page[];
}

export enum ImageSize {
  K1 = '1K',
  K2 = '2K',
  K4 = '4K'
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

declare global {
  interface Window {
    // aistudio is already defined as AIStudio in the environment, so we remove the duplicate declaration
    // to avoid "identical modifiers" and "subsequent property declarations" errors.
    webkitAudioContext: typeof AudioContext;
  }
}
