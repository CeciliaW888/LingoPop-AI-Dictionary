import React, { useState } from 'react';
import { DictionaryEntry, Language } from '../types';
import { lookupTerm, generateImage } from '../services/geminiService';
import { useToast } from '../context/ToastContext';

interface SearchInputProps {
  nativeLang: Language;
  targetLang: Language;
  onResult: (entry: DictionaryEntry) => void;
  isOnline?: boolean;
}

export const SearchInput: React.FC<SearchInputProps> = ({ nativeLang, targetLang, onResult, isOnline = true }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useToast();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    if (!isOnline) {
      addToast("You are offline. Please reconnect to search.", 'error');
      return;
    }

    setIsLoading(true);
    try {
      // Parallel execution for speed, but handle image failure gracefully
      const lookupPromise = lookupTerm(input, nativeLang.name, targetLang.name);
      const imagePromise = generateImage(input);

      const [lookupResult, imageResult] = await Promise.all([lookupPromise, imagePromise]);

      const entry: DictionaryEntry = {
        id: Date.now().toString(),
        imageUrl: imageResult,
        ...lookupResult
      };

      onResult(entry);
      setInput('');
    } catch (error) {
      console.error("Search failed:", error);
      addToast("Oops! The AI got confused. Please try again.", 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSearch} className="relative">
      <div className="relative group">
        <div className={`absolute -inset-1 bg-gradient-to-r from-pop-yellow via-pop-pink to-pop-blue rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200 ${isLoading ? 'animate-pulse' : ''}`}></div>
        <div className={`relative bg-white rounded-2xl shadow-xl flex items-center p-2 ${!isOnline ? 'opacity-75 grayscale' : ''}`}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isOnline ? `Type a word or phrase in ${targetLang.name} or ${nativeLang.name}...` : "Offline mode - Search unavailable"}
            className="flex-1 p-4 text-lg outline-none text-gray-700 placeholder-gray-400 bg-transparent disabled:cursor-not-allowed"
            disabled={isLoading || !isOnline}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim() || !isOnline}
            className={`
              p-4 rounded-xl font-bold text-white transition-all transform active:scale-95
              ${(isLoading || !isOnline) ? 'bg-gray-400 cursor-not-allowed' : 'bg-pop-dark hover:bg-black'}
            `}
          >
            {isLoading ? (
              <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </form>
  );
};