import React, { useState } from 'react';
import { Language } from '../types';
import { VideoTutor } from './VideoTutor';
import { RolePlay } from './RolePlay';

interface LiveTutorProps {
  nativeLang: Language;
  targetLang: Language;
  onBack: () => void;
  goals?: string[];
}

type LiveMode = 'video' | 'voice' | null;

export const LiveTutor: React.FC<LiveTutorProps> = ({ nativeLang, targetLang, onBack, goals = [] }) => {
  const [mode, setMode] = useState<LiveMode>(null);

  if (mode === 'video') {
    return (
      <VideoTutor 
        nativeLang={nativeLang} 
        targetLang={targetLang} 
        onBack={() => setMode(null)} 
        goals={goals} 
      />
    );
  }

  if (mode === 'voice') {
    return (
      <RolePlay 
        nativeLang={nativeLang} 
        targetLang={targetLang} 
        onBack={() => setMode(null)} 
        goals={goals} 
      />
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-gray-500 font-bold hover:text-pop-dark flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Back
        </button>
        <h2 className="text-2xl font-display font-bold text-pop-dark">Choose Session</h2>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        
        {/* Video Mode Card */}
        <button 
          onClick={() => setMode('video')}
          className="bg-white rounded-3xl p-8 text-left shadow-lg border-2 border-transparent hover:border-pop-blue hover:shadow-xl transition-all group flex flex-col h-full"
        >
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-pop-blue flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
          </div>
          <h3 className="text-2xl font-display font-bold text-gray-800 mb-2">Video Tutor</h3>
          <p className="text-gray-500 leading-relaxed flex-1">
            Show objects to the AI through your camera. Perfect for naming things around you and visual learning.
          </p>
          <div className="mt-6 flex items-center text-pop-blue font-bold">
            Start Video Session 
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 ml-1">
              <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
            </svg>
          </div>
        </button>

        {/* Voice Mode Card */}
        <button 
          onClick={() => setMode('voice')}
          className="bg-white rounded-3xl p-8 text-left shadow-lg border-2 border-transparent hover:border-pop-green hover:shadow-xl transition-all group flex flex-col h-full"
        >
          <div className="w-16 h-16 rounded-2xl bg-green-50 text-pop-green flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
            </svg>
          </div>
          <h3 className="text-2xl font-display font-bold text-gray-800 mb-2">Voice Roleplay</h3>
          <p className="text-gray-500 leading-relaxed flex-1">
            Focus on conversation and pronunciation. Chat with an AI tutor in real-time with feedback on your speaking.
          </p>
          <div className="mt-6 flex items-center text-pop-green font-bold">
            Start Voice Chat
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 ml-1">
              <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
            </svg>
          </div>
        </button>

      </div>
    </div>
  );
};