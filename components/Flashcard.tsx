import React, { useState } from 'react';
import { DictionaryEntry } from '../types';

interface FlashcardProps {
  entry: DictionaryEntry;
}

export const Flashcard: React.FC<FlashcardProps> = ({ entry }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div 
      className="w-full max-w-sm h-96 cursor-pointer perspective-1000 mx-auto"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
        
        {/* Front Face - Target Language */}
        <div className="absolute w-full h-full backface-hidden bg-white rounded-3xl shadow-xl flex flex-col overflow-hidden border-2 border-pop-blue">
          <div className="flex-1 bg-gray-50 flex items-center justify-center p-6">
            {entry.imageUrl ? (
              <img src={entry.imageUrl} alt="Hint" className="max-h-full max-w-full rounded-lg shadow-sm" />
            ) : (
              <span className="text-4xl">❓</span>
            )}
          </div>
          <div className="h-1/3 flex items-center justify-center bg-pop-blue text-white p-4 text-center">
            <h3 className="text-3xl font-display font-bold">{entry.targetTerm}</h3>
          </div>
        </div>

        {/* Back Face - Native Language Definition */}
        <div className="absolute w-full h-full backface-hidden rotate-y-180 bg-white rounded-3xl shadow-xl flex flex-col justify-between p-8 border-2 border-pop-pink">
          <div className="text-center">
            <h3 className="text-3xl font-display font-bold text-pop-pink mb-4">{entry.targetTerm}</h3>
            <p className="text-xl font-medium text-gray-800 mb-6">{entry.definition}</p>
          </div>
          
          <div className="bg-pink-50 p-4 rounded-xl">
            <p className="text-sm text-gray-600 italic">"{entry.examples[0].target}"</p>
            <p className="text-xs text-gray-400 mt-1">{entry.examples[0].native}</p>
          </div>
          
          <div className="text-center text-gray-400 text-sm font-bold uppercase tracking-wider">
            Tap to flip
          </div>
        </div>

      </div>
    </div>
  );
};