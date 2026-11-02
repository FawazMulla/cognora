import React, { useState } from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { usePreferences } from '../context/PreferencesContext';
import { fetchApi } from '../lib/api';

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

    // Fetch Hinglish clarification from API
    try {
      setLoading(true);
      setError(null);
      const data = await fetchApi('/api/answers/clarify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: originalText,
          topic,
          subject,
          language: 'hinglish',
        }),
      });

      const clarified = data?.clarifiedText || originalText;
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
      <div className="flex bg-slate-200 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold">
        <button
          type="button"
          onClick={() => handleToggle('english')}
          disabled={loading}
          className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1 cursor-pointer ${
            activeLang === 'english'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <span>GB English</span>
        </button>

        <button
          type="button"
          onClick={() => handleToggle('hinglish')}
          disabled={loading}
          className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1 cursor-pointer ${
            activeLang === 'hinglish'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />
              <span>Translating...</span>
            </>
          ) : (
            <>
              <span>IN Hinglish</span>
              {hinglishText && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
            </>
          )}
        </button>
      </div>

      {error && (
        <span className="text-[10px] text-rose-500 font-mono italic" title={error}>
          Clarification offline
        </span>
      )}
    </div>
  );
};
