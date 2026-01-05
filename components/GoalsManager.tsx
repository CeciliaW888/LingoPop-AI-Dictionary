import React, { useState } from 'react';
import { useToast } from '../context/ToastContext';

interface GoalsManagerProps {
  goals?: string[]; // Make optional for safety
  onSave: (goals: string[]) => void;
  onBack: () => void;
}

const SUGGESTIONS = [
  "Order coffee in a cafe",
  "Introduce myself",
  "Ask for directions",
  "Job interview practice",
  "Discuss hobbies",
  "Shopping for clothes",
  "Emergency situations",
  "Booking a hotel"
];

export const GoalsManager: React.FC<GoalsManagerProps> = ({ goals = [], onSave, onBack }) => {
  const [newGoal, setNewGoal] = useState('');
  const { addToast } = useToast();

  // Ensure goals is always an array
  const safeGoals = Array.isArray(goals) ? goals : [];

  const handleAdd = () => {
    if (!newGoal.trim()) return;
    if (safeGoals.includes(newGoal.trim())) {
      addToast("Goal already exists!", 'info');
      return;
    }
    const updated = [...safeGoals, newGoal.trim()];
    onSave(updated);
    setNewGoal('');
    addToast("Goal added!", 'success');
  };

  const handleRemove = (goal: string) => {
    const updated = safeGoals.filter(g => g !== goal);
    onSave(updated);
  };

  const handleAddSuggestion = (suggestion: string) => {
    if (safeGoals.includes(suggestion)) return;
    const updated = [...safeGoals, suggestion];
    onSave(updated);
    addToast("Goal added!", 'success');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-gray-500 font-bold hover:text-pop-dark flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Back
        </button>
        <h2 className="text-2xl font-display font-bold text-pop-dark">My Learning Goals</h2>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <label className="block text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">
          Add a new goal
        </label>
        <div className="flex gap-2">
          <input 
            type="text" 
            value={newGoal}
            onChange={(e) => setNewGoal(e.target.value)}
            placeholder="e.g., Learn to haggle at a market"
            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-pop-blue focus:ring-2 ring-pop-blue/20 transition-all"
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <button 
            onClick={handleAdd}
            disabled={!newGoal.trim()}
            className="bg-pop-blue hover:bg-blue-600 disabled:bg-gray-300 text-white font-bold px-6 py-3 rounded-xl transition-colors"
          >
            Add
          </button>
        </div>
      </div>

      {safeGoals.length > 0 && (
        <div className="space-y-3">
           <h3 className="text-lg font-bold text-gray-700">Current Goals</h3>
           <div className="grid gap-3">
             {safeGoals.map((goal, idx) => (
               <div key={idx} className="bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between shadow-sm">
                 <div className="flex items-center gap-3">
                   <span className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold">
                     {idx + 1}
                   </span>
                   <span className="font-medium text-lg">{goal}</span>
                 </div>
                 <button 
                  onClick={() => handleRemove(goal)}
                  className="text-gray-400 hover:text-red-500 p-2 transition-colors"
                  aria-label="Remove goal"
                 >
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                 </button>
               </div>
             ))}
           </div>
        </div>
      )}

      <div>
        <h3 className="text-lg font-bold text-gray-700 mb-3">Suggestions</h3>
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => handleAddSuggestion(suggestion)}
              disabled={safeGoals.includes(suggestion)}
              className={`px-4 py-2 rounded-full text-sm font-bold border transition-all ${
                safeGoals.includes(suggestion)
                  ? 'bg-green-50 border-green-200 text-green-700 cursor-default'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-pop-purple hover:text-pop-purple'
              }`}
            >
              {safeGoals.includes(suggestion) ? '✓ ' : '+ '}{suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
