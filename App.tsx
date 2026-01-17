
import React, { useState, useEffect } from 'react';
import { StoryEditor } from './components/StoryEditor';
import { Reader } from './components/Reader';
import { ChatBuddy } from './components/ChatBuddy';
import { GeminiService } from './services/geminiService';
import { Story, ImageSize } from './types';

const App: React.FC = () => {
  const [view, setView] = useState<'landing' | 'editing' | 'reading'>('landing');
  const [story, setStory] = useState<Story | null>(null);
  const [imageSize, setImageSize] = useState<ImageSize>(ImageSize.K1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState(false);

  useEffect(() => {
    checkApiKey();
  }, []);

  const checkApiKey = async () => {
    const hasKey = await window.aistudio.hasSelectedApiKey();
    setHasApiKey(hasKey);
  };

  const handleOpenKeySelector = async () => {
    await window.aistudio.openSelectKey();
    setHasApiKey(true); // Assume success per requirements
  };

  const handleStartStory = async (topic: string, size: ImageSize) => {
    setIsLoading(true);
    setError(null);
    setImageSize(size);
    try {
      const generatedStory = await GeminiService.generateStorySkeleton(topic);
      setStory(generatedStory);
      setView('reading');
    } catch (e: any) {
      console.error(e);
      const errorMessage = e.message || JSON.stringify(e);
      if (errorMessage.includes("Requested entity was not found") || errorMessage.includes("does not have permission")) {
        setHasApiKey(false);
        setError("Your magic key needs checking! Please re-select a key with permission for image generation.");
      } else {
        setError("Oh no! The story magic failed. Let's try another idea!");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setStory(null);
    setView('landing');
    setError(null);
  };

  if (!hasApiKey) {
    return (
      <div className="min-h-screen bg-indigo-600 flex items-center justify-center p-6">
        <div className="bg-white rounded-[3rem] p-10 max-w-lg text-center shadow-2xl">
          <h1 className="text-5xl text-indigo-600 mb-6">Hello Explorer!</h1>
          <p className="text-xl text-indigo-400 mb-8 leading-relaxed">
            To create magic pictures (like 2K and 4K illustrations!), we need a special key. 
            Ask an adult to help you select one from a paid project!
          </p>
          <a 
            href="https://ai.google.dev/gemini-api/docs/billing" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-indigo-300 underline block mb-6"
          >
            Learn about API Key billing
          </a>
          <button 
            onClick={handleOpenKeySelector}
            className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-5 rounded-3xl text-2xl shadow-lg transition-transform hover:scale-105"
          >
            🔑 Unlock the Magic
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <nav className="p-6 md:p-8 flex justify-between items-center">
        <div 
          onClick={reset}
          className="brand text-4xl md:text-5xl cursor-pointer hover:scale-105 transition-transform select-none"
        >
          <span className="text-indigo-600">Story</span>
          <span className="text-pink-500">Spark</span>
          <span className="text-yellow-400">✨</span>
        </div>
        
        {view !== 'landing' && (
          <button 
            onClick={reset}
            className="bg-white text-indigo-600 px-6 py-2 rounded-full font-bold shadow-md hover:bg-indigo-50 transition-colors hidden md:block"
          >
            Home
          </button>
        )}
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 mt-8 md:mt-16 animate-in fade-in slide-in-from-bottom-8 duration-500">
        {error && (
          <div className="max-w-md mx-auto mb-8 bg-red-100 border-l-4 border-red-500 p-4 rounded-xl text-red-700">
            <p className="font-bold">Oops!</p>
            <p>{error}</p>
          </div>
        )}

        {view === 'landing' && (
          <div className="text-center space-y-12">
            <div className="space-y-4">
              <h1 className="text-6xl md:text-8xl text-indigo-700">Create Your Own Tale!</h1>
              <p className="text-xl md:text-2xl text-indigo-400 max-w-2xl mx-auto">
                Imagine any world you want. We'll write the story, paint the pictures, and read it aloud just for you.
              </p>
            </div>
            
            <button 
              onClick={() => setView('editing')}
              className="bg-pink-500 hover:bg-pink-600 text-white text-4xl font-bold px-12 py-8 rounded-[2.5rem] shadow-xl transform hover:-rotate-2 hover:scale-110 transition-all"
            >
              Start Dreaming! 🚀
            </button>

            <div className="flex justify-center gap-8 mt-12 opacity-50 grayscale hover:grayscale-0 transition-all">
              <span className="text-6xl">🧚‍♀️</span>
              <span className="text-6xl">🐉</span>
              <span className="text-6xl">🚀</span>
              <span className="text-6xl">🎨</span>
            </div>
          </div>
        )}

        {view === 'editing' && (
          <StoryEditor onStart={handleStartStory} isLoading={isLoading} />
        )}

        {view === 'reading' && story && (
          <Reader story={story} imageSize={imageSize} onReset={reset} />
        )}
      </main>

      {/* Chat Buddy - Always available */}
      <ChatBuddy />

      {/* Footer Decoration */}
      <div className="fixed bottom-0 left-0 w-full h-16 pointer-events-none overflow-hidden flex items-end justify-center opacity-20">
        <div className="w-full h-24 bg-indigo-200 rounded-t-[50%] transform translate-y-8 scale-x-125"></div>
      </div>
    </div>
  );
};

export default App;
