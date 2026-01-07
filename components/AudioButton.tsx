import React, { useState, useEffect } from 'react';
import { generateSpeech, pcmToWav } from '../services/geminiService';

interface AudioButtonProps {
  text: string;
  size?: 'sm' | 'md';
}

// Global cache for Blob URLs to prevent re-fetching
const audioUrlCache = new Map<string, string>();

export const AudioButton: React.FC<AudioButtonProps> = ({ text, size = 'md' }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Clean up blob URLs when component unmounts (optional, but good practice if app grows)
  useEffect(() => {
    return () => {
      // We keep the cache alive for the session to save API calls
    };
  }, []);

  const playAudio = async () => {
    if (isPlaying || isLoading || !text) return;

    try {
      setIsLoading(true);
      
      let audioUrl = audioUrlCache.get(text);

      if (!audioUrl) {
        // Fetch raw PCM
        const pcmData = await generateSpeech(text);
        // Convert to WAV Blob
        const wavBlob = pcmToWav(pcmData, 24000);
        // Create URL
        audioUrl = URL.createObjectURL(wavBlob);
        audioUrlCache.set(text, audioUrl);
      }

      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        setIsPlaying(false);
      };

      audio.onerror = (e) => {
        console.error("Audio playback error:", e);
        setIsPlaying(false);
      };

      // Play
      await audio.play();
      setIsPlaying(true);
      
    } catch (error) {
      console.error("Audio generation error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-6 h-6';
  const buttonClass = size === 'sm' 
    ? "p-2 bg-gray-100 hover:bg-pop-blue hover:text-white rounded-full transition-colors text-gray-500 flex-shrink-0" 
    : "p-3 bg-pop-blue text-white rounded-full shadow-lg hover:bg-blue-600 transition-all transform hover:scale-105 flex-shrink-0";

  return (
    <button 
      onClick={playAudio} 
      className={buttonClass}
      disabled={isLoading || isPlaying}
      aria-label="Play pronunciation"
    >
      {isLoading ? (
        <svg className={`animate-spin ${iconSize}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : isPlaying ? (
         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`${iconSize} animate-pulse`}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={iconSize}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
        </svg>
      )}
    </button>
  );
};