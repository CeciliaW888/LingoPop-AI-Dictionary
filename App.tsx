import React, { useState, useEffect } from 'react';
import { AppView, DictionaryEntry, Language, SavedEntry } from './types';
import { LANGUAGES } from './constants';
import { LanguageSelector } from './components/LanguageSelector';
import { SearchInput } from './components/SearchInput';
import { ResultCard } from './components/ResultCard';
import { Notebook } from './components/Notebook';
import { StudyMode } from './components/StudyMode';
import { StoryGenerator } from './components/StoryGenerator';
import { useToast } from './context/ToastContext';
import { storageService } from './services/storageService';

// Simple Lollipop Icon Component
const LollipopIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
    <line x1="50" y1="50" x2="50" y2="90" stroke="#E2E8F0" strokeWidth="8" strokeLinecap="round" />
    <circle cx="50" cy="40" r="30" fill="#FF6B6B" />
    <path d="M50 10 A 30 30 0 0 1 80 40" stroke="#FFD93D" strokeWidth="6" strokeLinecap="round" fill="none" />
    <circle cx="35" cy="30" r="5" fill="white" fillOpacity="0.5" />
  </svg>
);

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.HOME);
  const [nativeLang, setNativeLang] = useState<Language>(LANGUAGES[0]); // English
  const [targetLang, setTargetLang] = useState<Language>(LANGUAGES[1]); // Spanish
  const [currentResult, setCurrentResult] = useState<DictionaryEntry | null>(null);
  const { addToast } = useToast();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Initialize notebook state
  const [notebook, setNotebook] = useState<SavedEntry[]>([]);

  // Monitor Online Status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      addToast("You're back online!", "success");
    };
    const handleOffline = () => {
      setIsOnline(false);
      addToast("You are offline. AI features disabled.", "error");
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [addToast]);

  // Load from IndexedDB on mount
  useEffect(() => {
    const loadNotebook = async () => {
      try {
        const entries = await storageService.getAllEntries();
        // Sort newest first
        const sorted = entries.sort((a, b) => b.savedAt - a.savedAt);
        setNotebook(sorted);
      } catch (err) {
        console.error("Failed to load notebook:", err);
        addToast("Could not load your notebook.", "error");
      }
    };
    loadNotebook();
  }, [addToast]);

  const addToNotebook = async (entry: DictionaryEntry) => {
    if (!notebook.some(item => item.id === entry.id)) {
      const savedEntry: SavedEntry = { ...entry, savedAt: Date.now() };
      
      // Optimistic UI update
      setNotebook([savedEntry, ...notebook]);
      
      try {
        await storageService.addEntry(savedEntry);
        addToast("Added to notebook!", 'success');
      } catch (err) {
        console.error("Failed to save entry:", err);
        // Revert optimistic update
        setNotebook(prev => prev.filter(n => n.id !== entry.id));
        addToast("Failed to save to storage.", 'error');
      }
    } else {
      addToast("Already in your notebook", 'info');
    }
  };

  const removeFromNotebook = async (id: string) => {
    const originalNotebook = [...notebook];
    setNotebook(notebook.filter(item => item.id !== id));
    
    try {
      await storageService.removeEntry(id);
      addToast("Removed from notebook", 'info');
    } catch (err) {
      console.error("Failed to remove entry:", err);
      // Revert
      setNotebook(originalNotebook);
      addToast("Failed to delete.", 'error');
    }
  };

  const renderContent = () => {
    switch (currentView) {
      case AppView.HOME:
        return (
          <div className="max-w-2xl mx-auto w-full space-y-8">
            <div className="text-center space-y-4 py-8">
              <h1 className="text-5xl md:text-6xl font-display font-bold text-pop-purple tracking-tight flex items-center justify-center gap-3">
                <span>Lingo<span className="text-pop-yellow">Pop</span></span>
                <LollipopIcon className="w-12 h-12 md:w-16 md:h-16 -mt-2 animate-bounce-slow" />
              </h1>
              <p className="text-lg text-gray-600 font-medium">
                The fun, intelligent dictionary that paints a picture.
              </p>
            </div>

            <LanguageSelector 
              nativeLang={nativeLang}
              targetLang={targetLang}
              onNativeChange={setNativeLang}
              onTargetChange={setTargetLang}
            />

            <SearchInput 
              nativeLang={nativeLang}
              targetLang={targetLang}
              onResult={setCurrentResult}
              isOnline={isOnline}
            />

            {currentResult && (
              <div className="animate-fade-in-up">
                <ResultCard 
                  entry={currentResult} 
                  onSave={() => addToNotebook(currentResult)}
                  isSaved={notebook.some(n => n.id === currentResult.id)}
                />
              </div>
            )}
          </div>
        );
      case AppView.NOTEBOOK:
        return (
          <Notebook 
            entries={notebook} 
            onRemove={removeFromNotebook}
            onGenerateStory={() => setCurrentView(AppView.STORY)}
            onStudy={() => setCurrentView(AppView.STUDY)}
          />
        );
      case AppView.STORY:
        return (
          <StoryGenerator 
            entries={notebook} 
            nativeLang={nativeLang}
            targetLang={targetLang}
            onBack={() => setCurrentView(AppView.NOTEBOOK)}
            isOnline={isOnline}
          />
        );
      case AppView.STUDY:
        return (
          <StudyMode 
            entries={notebook}
            onBack={() => setCurrentView(AppView.NOTEBOOK)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div 
            className="flex items-center space-x-2 cursor-pointer" 
            onClick={() => setCurrentView(AppView.HOME)}
          >
             <LollipopIcon className="w-8 h-8" />
             <span className="text-2xl font-display font-bold text-pop-purple">
               L<span className="text-pop-yellow">P</span>
             </span>
          </div>

          <nav className="flex items-center space-x-1 md:space-x-4">
            <button
              onClick={() => setCurrentView(AppView.HOME)}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                currentView === AppView.HOME 
                  ? 'bg-pop-blue text-white shadow-md' 
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              Search
            </button>
            <button
              onClick={() => setCurrentView(AppView.NOTEBOOK)}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all flex items-center space-x-2 ${
                [AppView.NOTEBOOK, AppView.STORY, AppView.STUDY].includes(currentView)
                  ? 'bg-pop-pink text-white shadow-md' 
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <span>Notebook</span>
              {notebook.length > 0 && (
                <span className="bg-white text-pop-pink text-xs py-0.5 px-1.5 rounded-full">
                  {notebook.length}
                </span>
              )}
            </button>
          </nav>
        </div>
      </header>

      {/* Offline Banner */}
      {!isOnline && (
        <div className="bg-pop-dark text-white text-center py-2 px-4 text-sm font-bold animate-fade-in-down sticky top-16 z-40 shadow-md">
           📡 You are offline. AI search and stories are unavailable, but you can study your notebook!
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-6 md:py-10">
        {renderContent()}
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-gray-400 text-sm">
        <p>Powered by Google Gemini</p>
      </footer>
    </div>
  );
};

export default App;