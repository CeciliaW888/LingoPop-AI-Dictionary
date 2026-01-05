import React, { useEffect, useRef, useState } from 'react';
import { Language } from '../types';
import { LiveSession } from '../services/liveService';

interface LiveTutorProps {
  nativeLang: Language;
  targetLang: Language;
  onBack: () => void;
  goals?: string[];
}

export const LiveTutor: React.FC<LiveTutorProps> = ({ nativeLang, targetLang, onBack, goals = [] }) => {
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subtitles, setSubtitles] = useState<{user: string, ai: string}>({ user: '', ai: '' });
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sessionRef = useRef<LiveSession | null>(null);
  const frameIntervalRef = useRef<number | null>(null);
  
  // Safe access to goals
  const safeGoals = Array.isArray(goals) ? goals : [];

  // Initialize session
  useEffect(() => {
    sessionRef.current = new LiveSession();
    
    return () => {
      stopSession();
    };
  }, []);

  const startSession = async () => {
    setError(null);
    setSubtitles({ user: '', ai: '' });
    try {
      // 1. Start Video Locally
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      // 2. Connect to Live API
      await sessionRef.current?.connect(
        nativeLang.name,
        targetLang.name,
        selectedGoal, // Pass the selected goal
        (user, ai) => setSubtitles({ user, ai }),
        (err) => setError("Connection error: " + err.message),
        () => setIsActive(false)
      );

      setIsActive(true);

      // 3. Start Video Frame Loop
      startFrameTransmission();

    } catch (err: any) {
      setError("Could not access camera or microphone. Please check permissions.");
      console.error(err);
    }
  };

  const stopSession = () => {
    setIsActive(false);
    setSubtitles({ user: '', ai: '' });
    
    // Stop local video
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }

    // Stop frame loop
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }

    // Disconnect API
    sessionRef.current?.disconnect();
  };

  const startFrameTransmission = () => {
    if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);

    frameIntervalRef.current = window.setInterval(() => {
      if (!videoRef.current || !canvasRef.current || !sessionRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (!ctx || video.videoWidth === 0) return;

      // Draw video frame to canvas
      // Downscale slightly for performance/bandwidth if needed, but 1:1 is usually fine for screenshots
      // Let's keep it reasonable, e.g., max 640px width
      const scale = Math.min(1, 640 / video.videoWidth);
      canvas.width = video.videoWidth * scale;
      canvas.height = video.videoHeight * scale;
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to JPEG base64
      const base64 = canvas.toDataURL('image/jpeg', 0.6); // 0.6 quality
      
      sessionRef.current.sendVideoFrame(base64);

    }, 1000); // 1 FPS is sufficient for "showing objects" without killing bandwidth
  };

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => { stopSession(); onBack(); }} className="text-gray-500 font-bold hover:text-pop-dark flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Back
        </button>
        <div className="flex items-center gap-2">
           <span className={`w-3 h-3 rounded-full ${isActive ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`}></span>
           <span className="font-bold text-gray-600">{isActive ? 'LIVE' : 'Ready'}</span>
        </div>
      </div>

      {/* Main Video Area */}
      <div className="flex-1 bg-black rounded-3xl overflow-hidden shadow-2xl relative aspect-video md:aspect-auto min-h-[400px]">
        <video 
          ref={videoRef} 
          className="w-full h-full object-cover transform scale-x-[-1]" // Mirror effect
          muted 
          playsInline
        />
        
        {/* Hidden Canvas for processing */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Subtitles Overlay */}
        {isActive && (subtitles.user || subtitles.ai) && (
             <div className="absolute bottom-40 md:bottom-48 left-0 right-0 px-4 md:px-8 flex flex-col gap-3 pointer-events-none z-10">
                 {subtitles.user && (
                    <div className="self-end bg-pop-blue/90 backdrop-blur-sm text-white px-5 py-3 rounded-2xl rounded-tr-none max-w-[85%] md:max-w-[70%] animate-fade-in-up shadow-lg border border-white/10">
                        <p className="text-xs font-bold opacity-75 uppercase tracking-wide mb-1">You</p>
                        <p className="text-lg leading-snug">{subtitles.user}</p>
                    </div>
                 )}
                 {subtitles.ai && (
                    <div className="self-start bg-pop-dark/90 backdrop-blur-sm text-white px-5 py-3 rounded-2xl rounded-tl-none max-w-[85%] md:max-w-[70%] animate-fade-in-up shadow-lg border border-white/10">
                        <p className="text-xs font-bold text-pop-yellow uppercase tracking-wide mb-1">Tutor</p>
                        <p className="text-lg leading-snug">{subtitles.ai}</p>
                    </div>
                 )}
             </div>
        )}

        {/* Overlay Controls */}
        <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col items-center justify-end gap-6 pt-24 z-20">
           {error && (
             <div className="bg-red-500/90 text-white px-4 py-2 rounded-lg text-sm font-bold mb-4 animate-bounce">
               {error}
             </div>
           )}

           {!isActive ? (
             <div className="flex flex-col items-center gap-4 w-full">
               
               {/* Goal Selection before starting */}
               {safeGoals.length > 0 && (
                 <div className="flex flex-wrap justify-center gap-2 mb-2 max-w-lg">
                   <div className="w-full text-center text-white/80 text-xs font-bold uppercase tracking-wider mb-1">
                     Optional: Pick a focus topic
                   </div>
                   {safeGoals.map(goal => (
                     <button
                       key={goal}
                       onClick={() => setSelectedGoal(selectedGoal === goal ? null : goal)}
                       className={`px-3 py-1.5 rounded-full text-sm font-bold transition-all border ${
                         selectedGoal === goal 
                           ? 'bg-pop-yellow text-pop-dark border-pop-yellow' 
                           : 'bg-black/40 text-white border-white/30 hover:bg-black/60'
                       }`}
                     >
                       {goal}
                     </button>
                   ))}
                 </div>
               )}

               <button 
                onClick={startSession}
                className="bg-pop-green hover:bg-green-500 text-white font-display font-bold text-xl px-12 py-4 rounded-full shadow-lg transform transition-all hover:scale-105 active:scale-95 flex items-center gap-3"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                   <path d="M4.5 4.5a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h8.25a3 3 0 0 0 3-3v-9a3 3 0 0 0-3-3H4.5ZM19.94 18.75l-2.69-2.69V7.94l2.69-2.69c.944-.945 2.56-.276 2.56 1.06v11.38c0 1.336-1.616 2.005-2.56 1.06Z" />
                 </svg>
                 Start Live Tutor
               </button>
             </div>
           ) : (
             <button 
              onClick={stopSession}
              className="bg-red-500 hover:bg-red-600 text-white font-display font-bold text-xl px-12 py-4 rounded-full shadow-lg transform transition-all hover:scale-105 active:scale-95 flex items-center gap-3"
             >
               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                 <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm6-2.438c0-.724.588-1.312 1.313-1.312h4.874c.725 0 1.313.588 1.313 1.313v4.874c0 .725-.588 1.313-1.313 1.313H9.564a1.312 1.312 0 0 1-1.313-1.313V9.562Z" clipRule="evenodd" />
               </svg>
               End Session
             </button>
           )}

           <p className="text-white/80 text-sm font-medium text-center max-w-md">
             {isActive 
               ? (selectedGoal ? `Focusing on: "${selectedGoal}"` : `Speaking ${targetLang.name}. Show me objects or just chat!`)
               : `Practice ${targetLang.name} with a real-time AI tutor.`}
           </p>
        </div>
      </div>
    </div>
  );
};