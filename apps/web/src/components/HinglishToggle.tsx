import React, { useState } from 'react';
import { Languages, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { usePreferences } from '../context/PreferencesContext';

interface HinglishToggleProps {
  originalText: string;
  topic?: string;
  subject?: string;
  onTextChange?: (activeText: string, lang: 'english' | 'hinglish') => void;
  className?: string;
}

export const HinglishToggle: React.FC<HinglishToggleProps> = ({
  originalText,
  topic,
  subject,
  onTextChange,
  className = '',
}) => {
  const { setLanguage } = usePreferences();
  const [activeLang, setActiveLang] = useState<'english' | 'hinglish'>('english');
  const [hinglishText, setHinglishText] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = async (targetLang: 'english' | 'hinglish') => {
    if (targetLang === activeLang) return;

    if (targetLang === 'english') {
      setActiveLang('english');
      setLanguage('english');
      onTextChange?.(originalText, 'english');
      return;
    }

    // Target is Hinglish
    if (hinglishText) {
      setActiveLang('hinglish');
      setLanguage('hinglish');
      onTextChange?.(hinglishText, 'hinglish');
      return;
    }

    // Need to fetch Hinglish clarification from API
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('http://localhost:3001/api/answers/clarify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'dev-user-local',
        },
        body: JSON.stringify({
          text: originalText,
          topic,
          subject,
          language: 'hinglish',
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to generate Hinglish explanation');
      }

      const data = await res.json();
      const clarified = data.clarifiedText || originalText;
      setHinglishText(clarified);
      setActiveLang('hinglish');
      setLanguage('hinglish');
      onTextChange?.(clarified, 'hinglish');
    } catch (err: any) {
      setError(err.message || 'Error clarifying in Hinglish');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`inline-flex items-center space-x-2 ${className}`}>
      <div className="flex items-center p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-800/80 text-xs">
        <button
          onClick={() => handleToggle('english')}
          disabled={loading}
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md font-medium transition-all ${
            activeLang === 'english'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <span>🇬🇧 English</span>
        </button>

        <button
          onClick={() => handleToggle('hinglish')}
          disabled={loading}
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md font-medium transition-all ${
            activeLang === 'hinglish'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
          ) : (
            <span>🇮🇳 Hinglish</span>
          )}
        </button>
      </div>

      {activeLang === 'hinglish' && (
        <span className="hidden sm:inline-flex items-center text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Technical terms preserved in English
        </span>
      )}

      {error && (
        <span className="text-[11px] text-red-500">{error}</span>
      )}
    </div>
  );
};
