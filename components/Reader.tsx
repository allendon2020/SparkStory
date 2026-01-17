
import React, { useState, useEffect } from 'react';
import { Story, Page, ImageSize } from '../types';
import { GeminiService, playAudio } from '../services/geminiService';

interface ReaderProps {
  story: Story;
  imageSize: ImageSize;
  onReset: () => void;
}

export const Reader: React.FC<ReaderProps> = ({ story, imageSize, onReset }) => {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [pages, setPages] = useState<Page[]>(story.pages);
  const [isGeneratingImg, setIsGeneratingImg] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioSource, setAudioSource] = useState<AudioBufferSourceNode | null>(null);

  const currentPage = pages[currentPageIndex];

  const generatePageAssets = async (index: number) => {
    const page = pages[index];
    if (page.imageUrl && page.audioData) return;

    let updatedPage = { ...page };

    if (!page.imageUrl) {
      setIsGeneratingImg(true);
      try {
        const url = await GeminiService.generateIllustration(page.illustrationPrompt, imageSize);
        updatedPage.imageUrl = url;
      } catch (e: any) {
        console.error("Image gen failed", e);
      } finally {
        setIsGeneratingImg(false);
      }
    }

    if (!page.audioData) {
      setIsGeneratingAudio(true);
      try {
        const audio = await GeminiService.generateSpeech(page.text);
        updatedPage.audioData = audio;
      } catch (e) {
        console.error("Audio gen failed", e);
      } finally {
        setIsGeneratingAudio(false);
      }
    }

    const newPages = [...pages];
    newPages[index] = updatedPage;
    setPages(newPages);
  };

  useEffect(() => {
    generatePageAssets(currentPageIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPageIndex]);

  const handleReadAloud = async () => {
    if (audioSource) {
      audioSource.stop();
      setAudioSource(null);
      setIsPlaying(false);
      return;
    }

    // If audio generation failed in background, try one more time manually
    if (!currentPage.audioData && !isGeneratingAudio) {
      setIsGeneratingAudio(true);
      try {
        const audio = await GeminiService.generateSpeech(currentPage.text);
        const newPages = [...pages];
        newPages[currentPageIndex].audioData = audio;
        setPages(newPages);
        
        // Immediately play the newly generated audio
        setIsPlaying(true);
        const source = await playAudio(audio);
        setAudioSource(source);
        source.onended = () => {
          setIsPlaying(false);
          setAudioSource(null);
        };
      } catch (e) {
        console.error("Manual audio gen failed", e);
      } finally {
        setIsGeneratingAudio(false);
      }
      return;
    }

    if (currentPage.audioData) {
      setIsPlaying(true);
      const source = await playAudio(currentPage.audioData);
      setAudioSource(source);
      source.onended = () => {
        setIsPlaying(false);
        setAudioSource(null);
      };
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <button 
          onClick={onReset}
          className="bg-white text-indigo-500 px-6 py-2 rounded-full font-bold shadow-sm hover:shadow-md transition-all flex items-center gap-2"
        >
          ← New Story
        </button>
        <h1 className="text-3xl md:text-5xl text-indigo-700 text-center flex-1">{story.title}</h1>
        <div className="w-[120px]"></div> {/* spacer */}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Illustration Section */}
        <div className="relative group">
          <div className="aspect-square bg-white rounded-[2rem] overflow-hidden shadow-2xl border-8 border-white relative">
            {isGeneratingImg ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-indigo-50/50 backdrop-blur-sm">
                <div className="w-16 h-16 border-8 border-indigo-400 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-indigo-600 font-bold">Painting your picture...</p>
              </div>
            ) : currentPage.imageUrl ? (
              <img 
                src={currentPage.imageUrl} 
                alt="Page illustration" 
                className="w-full h-full object-cover animate-in fade-in zoom-in duration-700" 
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-indigo-200">
                <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>
          <div className="absolute -bottom-4 -right-4 bg-yellow-400 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl shadow-lg">
            {currentPageIndex + 1}
          </div>
        </div>

        {/* Text and Controls Section */}
        <div className="space-y-8 flex flex-col h-full">
          <div className="bg-white rounded-[2rem] p-8 md:p-12 shadow-xl border-l-8 border-pink-400 flex-1 flex flex-col justify-center">
            <p className="text-2xl md:text-3xl leading-relaxed text-indigo-900 font-medium italic">
              "{currentPage.text}"
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <button 
              onClick={handleReadAloud}
              disabled={isGeneratingAudio}
              className={`w-full py-6 rounded-3xl text-2xl font-bold transition-all flex items-center justify-center gap-4 ${
                isPlaying 
                ? 'bg-red-400 text-white shadow-inner animate-pulse' 
                : 'bg-green-400 text-white shadow-lg hover:bg-green-500 disabled:opacity-50'
              }`}
            >
              {isGeneratingAudio ? (
                <>
                  <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                  Warming up my voice...
                </>
              ) : isPlaying ? (
                <>⏹ Stop Reading</>
              ) : (
                <>🔊 {(!currentPage.audioData) ? 'Try Reading Aloud' : 'Read This Page Aloud'}</>
              )}
            </button>

            <div className="flex gap-4">
              <button 
                onClick={() => setCurrentPageIndex(p => Math.max(0, p - 1))}
                disabled={currentPageIndex === 0}
                className="flex-1 bg-white text-indigo-500 py-4 rounded-3xl text-xl font-bold shadow-md hover:shadow-lg disabled:opacity-30 transition-all"
              >
                ← Previous
              </button>
              <button 
                onClick={() => {
                  if (currentPageIndex < pages.length - 1) {
                    setCurrentPageIndex(p => p + 1);
                  } else {
                    onReset();
                  }
                }}
                className="flex-1 bg-indigo-500 text-white py-4 rounded-3xl text-xl font-bold shadow-md hover:bg-indigo-600 transition-all"
              >
                {currentPageIndex === pages.length - 1 ? 'Finish & Create New!' : 'Next Page →'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
