import React, { useEffect, useRef, useState } from 'react';
import { Language } from '../types';
import { LiveSession } from '../services/liveService';

interface RolePlayProps {
  nativeLang: Language;
  targetLang: Language;
  onBack: () => void;
  goals?: string[];
}

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
}

// Waveform SVG Component for UI visualization
const Waveform = ({ active }: { active: boolean }) => (
  <div className={`flex items-center gap-1 h-6 ${active ? '' : 'opacity-60'}`}>
    {[...Array(12)].map((_, i) => (
      <div 
        key={i} 
        className={`w-1 bg-current rounded-full transition-all duration-150 ${active ? 'animate-pulse' : ''}`}
        style={{ 
          height: active ? `${Math.random() * 100}%` : `${20 + Math.random() * 40}%`,
          animationDelay: `${i * 0.05}s`
        }}
      />
    ))}
  </div>
);

export const RolePlay: React.FC<RolePlayProps> = ({ nativeLang, targetLang, onBack, goals = [] }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Transients for current speaking turn
  const [currentUserText, setCurrentUserText] = useState('');
  const [currentAiText, setCurrentAiText] = useState('');
  
  const sessionRef = useRef<LiveSession | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto scroll to bottom
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, currentUserText, currentAiText]);

  useEffect(() => {
    sessionRef.current = new LiveSession();
    return () => {
      stopSession();
    };
  }, []);

  const startSession = async () => {
    setError(null);
    try {
      // Connect to Gemini Live
      // Choose a goal if available (for demo simplicity, pick first one or generic)
      const goal = goals.length > 0 ? goals[0] : null;

      await sessionRef.current?.connect(
        nativeLang.name,
        targetLang.name,
        goal,
        (user, ai) => {
          setCurrentUserText(user);
          setCurrentAiText(ai);
        },
        (err) => setError("Connection error: " + err.message),
        () => setIsActive(false),
        (userFull, aiFull) => {
          // Turn Complete: Add to history
          if (userFull.trim()) {
            setMessages(prev => [...prev, { id: Date.now().toString() + 'u', sender: 'user', text: userFull }]);
          }
          if (aiFull.trim()) {
            setMessages(prev => [...prev, { id: Date.now().toString() + 'a', sender: 'ai', text: aiFull }]);
          }
          setCurrentUserText('');
          setCurrentAiText('');
        }
      );

      setIsActive(true);
      // Initial Greeting message from system (visual only)
      setMessages([{
        id: 'init', 
        sender: 'ai', 
        text: `Hello! I'm your AI tutor. Let's practice ${targetLang.name}. ${goal ? `We are focusing on: ${goal}` : ''}`
      }]);

    } catch (err: any) {
      setError("Could not access microphone. Please check permissions.");
      console.error(err);
    }
  };

  const stopSession = () => {
    setIsActive(false);
    sessionRef.current?.disconnect();
    setCurrentUserText('');
    setCurrentAiText('');
  };

  const toggleSession = () => {
    if (isActive) {
      stopSession();
    } else {
      startSession();
    }
  };

  return (
    <div className="max-w-md mx-auto h-[85vh] md:h-[800px] flex flex-col bg-[#F9FAFB] md:rounded-3xl md:shadow-2xl md:border border-gray-100 overflow-hidden relative">
      
      {/* Header */}
      <div className="bg-white p-6 flex items-center justify-between border-b border-gray-100 sticky top-0 z-10">
        <h2 className="text-2xl font-display font-bold text-gray-800">Role Play</h2>
        <button onClick={() => { stopSession(); onBack(); }} className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6" ref={scrollRef}>
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
             <div className={`max-w-[85%] p-5 rounded-2xl shadow-sm relative ${
               msg.sender === 'user' 
                 ? 'bg-[#5F9EA0] text-white rounded-br-none' // Tealish Green
                 : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
             }`}>
                {/* Visual Waveform (Fake for history items) */}
                <div className={`mb-3 ${msg.sender === 'user' ? 'text-white/80' : 'text-gray-400'}`}>
                  <Waveform active={false} />
                </div>
                <p className="text-lg leading-snug">{msg.text}</p>
             </div>
             
             {/* Fake Feedback for AI messages */}
             {msg.sender === 'ai' && (
                <div className="mt-3 bg-white border border-gray-100 rounded-xl p-3 flex items-center gap-3 shadow-sm max-w-[85%] animate-fade-in-up">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-0.5">Pronunciation</p>
                    <p className="text-sm font-medium text-gray-700">Your sound 90% like a native speaker.</p>
                  </div>
                </div>
             )}
          </div>
        ))}

        {/* Transient / Real-time Bubble */}
        {(currentUserText || currentAiText) && (
           <div className={`flex flex-col ${currentAiText ? 'items-start' : 'items-end'}`}>
             <div className={`max-w-[85%] p-5 rounded-2xl shadow-sm relative ${
               !currentAiText 
                 ? 'bg-[#5F9EA0] text-white rounded-br-none' 
                 : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
             }`}>
                <div className={`mb-3 ${!currentAiText ? 'text-white' : 'text-gray-400'}`}>
                   <Waveform active={isActive} />
                </div>
                <p className="text-lg leading-snug">{currentAiText || currentUserText}</p>
             </div>
           </div>
        )}
        
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center text-sm font-bold">
            {error}
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="bg-white p-6 border-t border-gray-100 sticky bottom-0 z-10 pb-8 md:pb-6">
        <div className="flex items-center justify-between px-4">
          <button className="p-4 rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
            </svg>
          </button>

          <button 
            onClick={toggleSession}
            className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transform transition-all active:scale-95 ${
              isActive 
                ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                : 'bg-pop-yellow hover:bg-yellow-400 text-pop-dark'
            }`}
          >
            {isActive ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 0 1 7.5 5.25h9a2.25 2.25 0 0 1 2.25 2.25v9a2.25 2.25 0 0 1-2.25 2.25h-9a2.25 2.25 0 0 1-2.25-2.25v-9Z" />
              </svg>
            ) : (
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
              </svg>
            )}
          </button>

          <button className="p-4 rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
            </svg>
          </button>
        </div>
        <p className="text-center text-sm text-gray-400 font-medium mt-6">
          {isActive ? 'Listening...' : 'Tap mic to start'}
        </p>
      </div>
    </div>
  );
};