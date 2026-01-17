
import React, { useState } from 'react';
import { ImageSize } from '../types';

interface StoryEditorProps {
  onStart: (topic: string, imageSize: ImageSize) => void;
  isLoading: boolean;
}

export const StoryEditor: React.FC<StoryEditorProps> = ({ onStart, isLoading }) => {
  const [topic, setTopic] = useState('');
  const [size, setSize] = useState<ImageSize>(ImageSize.K1);

  const presets = [
    "A brave kitten in space",
    "The dragon who loved baking cakes",
    "A magical forest where toys come alive",
    "A robot that learned to dance"
  ];

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-[3rem] p-8 md:p-12 shadow-2xl border-b-8 border-indigo-200">
      <h2 className="text-4xl text-center mb-8 text-indigo-600">Create a New Adventure!</h2>
      
      <div className="space-y-8">
        <div>
          <label className="block text-indigo-400 text-sm font-bold mb-3 ml-2">What should the story be about?</label>
          <input 
            type="text" 
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="E.g., A funny elephant learning to paint..."
            className="w-full bg-indigo-50 border-4 border-transparent focus:border-indigo-400 rounded-3xl px-6 py-4 text-xl outline-none transition-all"
          />
        </div>

        <div>
          <label className="block text-indigo-400 text-sm font-bold mb-3 ml-2">Pick some ideas:</label>
          <div className="flex flex-wrap gap-2">
            {presets.map(p => (
              <button 
                key={p}
                onClick={() => setTopic(p)}
                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-4 py-2 rounded-full text-sm font-medium transition-colors"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-indigo-400 text-sm font-bold mb-3 ml-2">How shiny should the pictures be?</label>
          <div className="grid grid-cols-3 gap-3">
            {[ImageSize.K1, ImageSize.K2, ImageSize.K4].map((s) => (
              <button
                key={s}
                onClick={() => setSize(s)}
                className={`py-3 rounded-2xl border-4 transition-all font-bold ${
                  size === s 
                    ? 'bg-indigo-500 text-white border-indigo-600' 
                    : 'bg-white text-indigo-400 border-indigo-100 hover:border-indigo-200'
                }`}
              >
                {s} Quality
              </button>
            ))}
          </div>
          <p className="text-[10px] mt-2 text-indigo-300 italic">4K looks amazing but takes a little longer to paint!</p>
        </div>

        <button 
          onClick={() => onStart(topic, size)}
          disabled={!topic.trim() || isLoading}
          className="w-full bg-pink-500 hover:bg-pink-600 disabled:bg-gray-300 text-white text-3xl font-bold py-6 rounded-3xl shadow-lg transform hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-3"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-white border-t-transparent"></div>
              Magic in progress...
            </>
          ) : (
            <>📖 Start Storytelling!</>
          )}
        </button>
      </div>
    </div>
  );
};
