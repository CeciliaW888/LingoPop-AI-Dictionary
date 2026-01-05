import React, { useState, useEffect } from 'react';
import { SavedEntry, Language } from '../types';
import { generateStory } from '../services/geminiService';
import { AudioButton } from './AudioButton';

interface StoryGeneratorProps {
  entries: SavedEntry[];
  nativeLang: Language;
  targetLang: Language;
  onBack: () => void;
  isOnline?: boolean;
}

export const StoryGenerator: React.FC<StoryGeneratorProps> = ({ entries, nativeLang, targetLang, onBack, isOnline = true }) => {
  const [story, setStory] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setStory("You are currently offline. Please connect to the internet to generate a new story.");
      return;
    }

    const fetchStory = async () => {
      setIsLoading(true);
      const words = entries.slice(0, 10).map(e => e.term); // Limit to 10 for better stories
      try {
        const result = await generateStory(words, nativeLang.name, targetLang.name);
        setStory(result);
      } catch (error) {
        setStory("Sorry, I couldn't write a story right now. Try again later!");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline]);

  const renderStoryText = (text: string) => {
    // Basic Markdown-ish parsing for bold text
    const parts = text.split(/(\*\*.*?\*\*)/);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <span key={index} className="bg-pop-yellow/50 px-1 rounded font-bold text-pop-dark">{part.slice(2, -2)}</span>;
      }
      return part;
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <button onClick={onBack} className="text-gray-500 font-bold hover:text-pop-dark flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Back to Notebook
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 p-8 min-h-[400px]">
        <div className="flex items-center justify-between mb-6">
           <h2 className="text-3xl font-display font-bold text-pop-purple">AI Story Time</h2>
           {story && !isLoading && isOnline && <AudioButton text={story.replace(/\*\*/g, '')} />}
        </div>
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
             <div className="text-4xl animate-bounce">✍️</div>
             <p className="text-gray-500 font-medium">Weaving your words into a magical story...</p>
          </div>
        ) : (
          <div className="prose prose-lg text-gray-700 leading-relaxed whitespace-pre-line">
            {!isOnline && (
               <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                  <div className="text-4xl mb-2">📡</div>
                  <p className="font-bold">Offline Mode</p>
               </div>
            )}
            {renderStoryText(story)}
          </div>
        )}
      </div>
    </div>
  );
};