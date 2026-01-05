import React from 'react';
import { SavedEntry } from '../types';

interface NotebookProps {
  entries: SavedEntry[];
  onRemove: (id: string) => void;
  onGenerateStory: () => void;
  onStudy: () => void;
}

export const Notebook: React.FC<NotebookProps> = ({ entries, onRemove, onGenerateStory, onStudy }) => {
  if (entries.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">📓</div>
        <h2 className="text-2xl font-bold text-gray-700 mb-2">Your notebook is empty</h2>
        <p className="text-gray-500">Search for words and save them here to review later!</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-display font-bold text-gray-800">My Notebook</h2>
          <p className="text-gray-500">{entries.length} items saved</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button 
            onClick={onGenerateStory}
            className="flex-1 md:flex-none px-6 py-3 bg-pop-purple hover:bg-purple-600 text-white rounded-xl font-bold shadow-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2"
          >
            <span>✨ AI Story</span>
          </button>
          <button 
            onClick={onStudy}
            className="flex-1 md:flex-none px-6 py-3 bg-pop-pink hover:bg-pink-600 text-white rounded-xl font-bold shadow-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2"
          >
            <span>🎓 Study</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {entries.map((entry) => (
          <div key={entry.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex gap-4 relative group">
            <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
              {entry.imageUrl ? (
                <img src={entry.imageUrl} alt={entry.targetTerm} className="w-full h-full object-cover" />
              ) : (
                <span className="flex h-full items-center justify-center text-2xl">📝</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold text-gray-800 truncate">{entry.targetTerm}</h3>
              <p className="text-gray-500 truncate">{entry.definition}</p>
              <p className="text-xs text-gray-400 mt-2">Saved {new Date(entry.savedAt).toLocaleDateString()}</p>
            </div>
            <button 
              onClick={() => onRemove(entry.id)}
              className="absolute top-2 right-2 p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 0 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};