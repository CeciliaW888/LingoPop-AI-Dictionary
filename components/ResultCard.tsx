import React from 'react';
import { DictionaryEntry } from '../types';
import { AudioButton } from './AudioButton';

interface ResultCardProps {
  entry: DictionaryEntry;
  onSave: () => void;
  isSaved: boolean;
}

export const ResultCard: React.FC<ResultCardProps> = ({ entry, onSave, isSaved }) => {
  return (
    <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
      
      {/* Top Section: Image & Main Word */}
      <div className="flex flex-col md:flex-row">
        {/* Image Section */}
        <div className="w-full md:w-1/3 bg-gray-50 flex items-center justify-center p-6 border-b md:border-b-0 md:border-r border-gray-100">
          {entry.imageUrl ? (
            <img 
              src={entry.imageUrl} 
              alt={entry.targetTerm} 
              className="w-full h-auto rounded-xl shadow-sm hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full aspect-square bg-gray-200 rounded-xl flex items-center justify-center text-gray-400">
              <span>No Image</span>
            </div>
          )}
        </div>

        {/* Definition Section */}
        <div className="w-full md:w-2/3 p-6 md:p-8 flex flex-col justify-center">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-4xl font-display font-bold text-gray-800 mb-1">{entry.targetTerm}</h2>
              {entry.term.toLowerCase() !== entry.targetTerm.toLowerCase() && (
                 <p className="text-sm text-gray-400 font-bold uppercase tracking-wider mb-2">Searched: {entry.term}</p>
              )}
              <p className="text-pop-purple font-medium text-lg">{entry.definition}</p>
            </div>
            <div className="flex space-x-2">
               <AudioButton text={entry.targetTerm} />
               <button 
                onClick={onSave}
                className={`p-3 rounded-full shadow-md transition-all transform hover:scale-105 ${
                  isSaved ? 'bg-pop-green text-white' : 'bg-white text-gray-400 hover:text-pop-green border border-gray-100'
                }`}
               >
                 {isSaved ? (
                   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                    <path fillRule="evenodd" d="M6.32 2.577a49.255 49.255 0 0 1 11.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 0 1-1.085.67L12 18.089l-7.165 3.583A.75.75 0 0 1 3.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93Z" clipRule="evenodd" />
                  </svg>
                 ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
                  </svg>
                 )}
               </button>
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-xl border border-pop-yellow/30">
             <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">💡</span>
                <h3 className="text-sm font-bold uppercase tracking-wide text-yellow-800">Pro Tip</h3>
             </div>
             <p className="text-gray-700 text-sm leading-relaxed italic">
               "{entry.usageNote}"
             </p>
          </div>
        </div>
      </div>

      {/* Examples Section */}
      <div className="bg-gray-50 p-6 md:p-8 border-t border-gray-100">
        <h3 className="text-sm font-bold uppercase tracking-wide text-gray-400 mb-4">Examples</h3>
        <div className="space-y-4">
          {entry.examples.map((ex, idx) => (
            <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-start gap-4">
              <div className="mt-1">
                 <AudioButton text={ex.target} size="sm" />
              </div>
              <div>
                <p className="text-lg text-gray-800 font-medium">{ex.target}</p>
                <p className="text-gray-500">{ex.native}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};