import React from 'react';
import { LANGUAGES } from '../constants';
import { Language } from '../types';

interface LanguageSelectorProps {
  nativeLang: Language;
  targetLang: Language;
  onNativeChange: (lang: Language) => void;
  onTargetChange: (lang: Language) => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  nativeLang,
  targetLang,
  onNativeChange,
  onTargetChange,
}) => {
  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex-1 w-full">
        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
          I speak
        </label>
        <div className="relative">
          <select
            value={nativeLang.code}
            onChange={(e) => {
              const lang = LANGUAGES.find(l => l.code === e.target.value);
              if (lang) onNativeChange(lang);
            }}
            className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-3 px-4 pr-8 rounded-xl leading-tight focus:outline-none focus:bg-white focus:border-pop-blue font-bold"
          >
            {LANGUAGES.map((lang) => (
              <option key={`native-${lang.code}`} value={lang.code}>
                {lang.flag} {lang.name}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
          </div>
        </div>
      </div>

      <div className="text-gray-300 transform rotate-90 md:rotate-0">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
        </svg>
      </div>

      <div className="flex-1 w-full">
        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
          I want to learn
        </label>
        <div className="relative">
          <select
            value={targetLang.code}
            onChange={(e) => {
              const lang = LANGUAGES.find(l => l.code === e.target.value);
              if (lang) onTargetChange(lang);
            }}
            className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-3 px-4 pr-8 rounded-xl leading-tight focus:outline-none focus:bg-white focus:border-pop-pink font-bold"
          >
            {LANGUAGES.map((lang) => (
              <option key={`target-${lang.code}`} value={lang.code}>
                {lang.flag} {lang.name}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
          </div>
        </div>
      </div>
    </div>
  );
};