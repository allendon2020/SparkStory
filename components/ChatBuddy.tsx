
import React, { useState, useRef, useEffect } from 'react';
import { GeminiService } from '../services/geminiService';
import { ChatMessage } from '../types';

export const ChatBuddy: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const response = await GeminiService.sendMessageToBuddy(userMsg, messages);
      setMessages(prev => [...prev, { role: 'model', text: response || "I'm a bit speechless! Try again?" }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: "Oops! My magic wand is buzzing. Try again soon!" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="w-80 h-96 bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border-4 border-yellow-400 mb-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-yellow-400 p-3 flex justify-between items-center">
            <h3 className="text-white text-xl font-bold flex items-center gap-2">
              <span className="text-2xl">✨</span> Sparky Buddy
            </h3>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-yellow-100 font-bold"
            >
              ✕
            </button>
          </div>
          
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-yellow-50">
            {messages.length === 0 && (
              <p className="text-sm text-yellow-800 text-center italic mt-10">
                Hi! I'm Sparky! Ask me anything about your stories or just say hello!
              </p>
            )}
            {messages.map((msg, i) => (
              <div 
                key={i} 
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                  msg.role === 'user' 
                    ? 'bg-indigo-500 text-white rounded-tr-none' 
                    : 'bg-white text-indigo-900 border border-yellow-200 rounded-tl-none'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white p-3 rounded-2xl animate-pulse text-xs text-indigo-300">
                  Sparky is thinking...
                </div>
              </div>
            )}
          </div>

          <div className="p-3 border-t bg-white flex gap-2">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask Sparky..."
              className="flex-1 border-2 border-yellow-200 rounded-full px-4 py-2 focus:outline-none focus:border-yellow-400 text-sm"
            />
            <button 
              onClick={handleSend}
              className="bg-yellow-400 text-white p-2 rounded-full hover:bg-yellow-500 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex items-center justify-center w-16 h-16 bg-yellow-400 rounded-full shadow-lg hover:scale-110 transition-transform border-4 border-white"
      >
        <span className="text-3xl">✨</span>
        {!isOpen && (
          <div className="absolute -top-12 right-0 bg-white text-yellow-600 px-3 py-1 rounded-full text-xs font-bold shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            Talk to Sparky!
          </div>
        )}
      </button>
    </div>
  );
};
