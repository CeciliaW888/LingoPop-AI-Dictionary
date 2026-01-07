import React, { useState, useRef } from 'react';
import { DictionaryEntry, Language } from '../types';
import { lookupTerm, generateImage, transcribeAudio } from '../services/geminiService';
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
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  const { addToast } = useToast();

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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

  const toggleRecording = async () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const startRecording = async () => {
    if (!isOnline) {
      addToast("Voice input requires internet.", 'error');
      return;
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      addToast("Listening... Tap mic to stop.", 'info');
    } catch (err) {
      console.error("Error accessing microphone:", err);
      addToast("Could not access microphone.", 'error');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsTranscribing(true);

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Stop all tracks
        mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
        
        try {
          // Convert Blob to Base64
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64String = reader.result as string;
            // Remove header (e.g., "data:audio/webm;base64,")
            const base64Data = base64String.split(',')[1];
            
            try {
              const text = await transcribeAudio(base64Data, audioBlob.type, [nativeLang.name, targetLang.name]);
              if (text.trim()) {
                setInput(text.trim());
              } else {
                addToast("Didn't catch that. Try again.", 'info');
              }
            } catch (apiError) {
              console.error(apiError);
              addToast("Transcription failed.", 'error');
            } finally {
              setIsTranscribing(false);
            }
          };
        } catch (e) {
          console.error(e);
          setIsTranscribing(false);
          addToast("Error processing audio.", 'error');
        }
      };
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
            placeholder={
              isRecording 
                ? "Listening..." 
                : isTranscribing 
                  ? "Transcribing..." 
                  : `Type or speak in ${targetLang.name} or ${nativeLang.name}...`
            }
            className="flex-1 p-4 text-lg outline-none text-gray-700 placeholder-gray-400 bg-transparent disabled:cursor-not-allowed min-w-0"
            disabled={isLoading || !isOnline || isRecording || isTranscribing}
          />
          
          {/* Voice Input Button */}
          {isOnline && (
            <button
              type="button"
              onClick={toggleRecording}
              disabled={isLoading || isTranscribing}
              className={`p-3 mr-2 rounded-xl transition-all ${
                isRecording 
                  ? 'bg-red-500 text-white animate-pulse shadow-md' 
                  : isTranscribing
                    ? 'bg-gray-100 text-gray-400 cursor-wait'
                    : 'text-gray-400 hover:text-pop-blue hover:bg-blue-50'
              }`}
              title={isRecording ? "Stop listening" : "Speak to search"}
            >
              {isTranscribing ? (
                <svg className="animate-spin w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : isRecording ? (
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                   <rect x="6" y="6" width="12" height="12" rx="2" />
                 </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
                </svg>
              )}
            </button>
          )}

          <button
            type="submit"
            disabled={isLoading || !input.trim() || !isOnline || isRecording || isTranscribing}
            className={`
              p-4 rounded-xl font-bold text-white transition-all transform active:scale-95 flex-shrink-0
              ${(isLoading || !isOnline || !input.trim()) ? 'bg-gray-400 cursor-not-allowed' : 'bg-pop-dark hover:bg-black'}
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