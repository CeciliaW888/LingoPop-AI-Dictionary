import React, { useState } from 'react';
import { SavedEntry } from '../types';
import { Flashcard } from './Flashcard';

interface StudyModeProps {
  entries: SavedEntry[];
  onBack: () => void;
}

export const StudyMode: React.FC<StudyModeProps> = ({ entries, onBack }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (entries.length === 0) return null;

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % entries.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + entries.length) % entries.length);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-full flex justify-between items-center mb-8">
        <button onClick={onBack} className="text-gray-500 font-bold hover:text-pop-dark flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Back
        </button>
        <span className="font-bold text-gray-400">
          {currentIndex + 1} / {entries.length}
        </span>
      </div>

      <div className="w-full mb-8">
        <Flashcard entry={entries[currentIndex]} />
      </div>

      <div className="flex gap-4">
        <button 
          onClick={handlePrev}
          className="p-4 rounded-full bg-white shadow-md text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <button 
          onClick={handleNext}
          className="p-4 rounded-full bg-white shadow-md text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>
    </div>
  );
};