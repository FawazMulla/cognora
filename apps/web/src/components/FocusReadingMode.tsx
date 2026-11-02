import React, { useState, useEffect, useRef } from 'react';
import { X, Moon, Sun, BookOpen, Coffee } from 'lucide-react';
import { usePreferences } from '../context/PreferencesContext';

interface FocusReadingModeProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subject?: string;
  topic?: string;
  children: React.ReactNode;
}

export const FocusReadingMode: React.FC<FocusReadingModeProps> = ({
  isOpen,
  onClose,
  title,
  subject,
  topic,
  children,
}) => {
  const { setTheme, setDensity, isDark } = usePreferences();
  const [fontSize, setFontSize] = useState<number>(18); // px
  const [readingTheme, setReadingTheme] = useState<'light' | 'dark' | 'sepia'>('light');
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const contentRef = useRef<HTMLDivElement>(null);

  // Sync initial theme
  useEffect(() => {
    if (isDark) {
      setReadingTheme('dark');
    } else {
      setReadingTheme('light');
    }
  }, [isDark]);

  // Handle ESC key to exit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Track reading scroll progress
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const progress = (target.scrollTop / (target.scrollHeight - target.clientHeight)) * 100;
    setScrollProgress(Math.min(100, Math.max(0, progress)));
  };

  if (!isOpen) return null;

  // Reading theme classes
  const themeClasses = {
    light: 'bg-white text-slate-800',
    dark: 'bg-slate-950 text-slate-200',
    sepia: 'bg-[#FBF0D9] text-[#433422]',
  }[readingTheme];

  const barClasses = {
    light: 'bg-white/95 border-slate-200 text-slate-700 backdrop-blur',
    dark: 'bg-slate-900/95 border-slate-800 text-slate-300 backdrop-blur',
    sepia: 'bg-[#F4E4C1]/95 border-[#E2CE9F] text-[#433422] backdrop-blur',
  }[readingTheme];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex flex-col animate-fade-in">
      {/* Scroll Progress Bar */}
      <div className="h-1 bg-slate-200 dark:bg-slate-800 w-full fixed top-0 left-0 z-50">
        <div
          className="h-full bg-indigo-600 transition-all duration-150"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Top Floating Control Bar */}
      <div
        className={`sticky top-0 z-40 border-b px-6 py-3 flex items-center justify-between shadow-sm transition-colors ${barClasses}`}
      >
        <div className="flex items-center space-x-3">
          <BookOpen className="w-5 h-5 text-indigo-600" />
          <div>
            <h2 className="text-sm font-bold truncate max-w-md">{title}</h2>
            {(subject || topic) && (
              <p className="text-xs opacity-70 truncate">
                {[subject, topic].filter(Boolean).join(' • ')}
              </p>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-2">
          {/* Font Resizing */}
          <div className="flex items-center rounded-lg border border-current/20 p-0.5 space-x-1">
            <button
              onClick={() => setFontSize((prev) => Math.max(14, prev - 2))}
              className="p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded transition-colors text-xs font-bold"
              title="Decrease Font Size"
            >
              A-
            </button>
            <span className="text-xs px-1 font-mono">{fontSize}px</span>
            <button
              onClick={() => setFontSize((prev) => Math.min(26, prev + 2))}
              className="p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded transition-colors text-xs font-bold"
              title="Increase Font Size"
            >
              A+
            </button>
          </div>

          {/* Reading Density Toggle */}
          <div className="hidden sm:flex items-center rounded-lg border border-current/20 p-0.5 text-xs">
            {(['comfortable', 'standard', 'compact'] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDensity(d)}
                className={`px-2 py-1 rounded capitalize transition-all ${
                  density === d
                    ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          {/* Theme Palette */}
          <div className="flex items-center rounded-lg border border-current/20 p-0.5 space-x-1">
            <button
              onClick={() => {
                setReadingTheme('light');
                setTheme('light');
              }}
              className={`p-1.5 rounded transition-colors ${
                readingTheme === 'light' ? 'bg-indigo-100 text-indigo-800' : 'opacity-70'
              }`}
              title="Light theme"
            >
              <Sun className="w-4 h-4" />
            </button>
            <button
              onClick={() => setReadingTheme('sepia')}
              className={`p-1.5 rounded transition-colors ${
                readingTheme === 'sepia' ? 'bg-[#ebd3a2] text-[#433422] font-bold' : 'opacity-70'
              }`}
              title="Sepia eye-care theme"
            >
              <Coffee className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setReadingTheme('dark');
                setTheme('dark');
              }}
              className={`p-1.5 rounded transition-colors ${
                readingTheme === 'dark' ? 'bg-indigo-950 text-indigo-300' : 'opacity-70'
              }`}
              title="Dark theme"
            >
              <Moon className="w-4 h-4" />
            </button>
          </div>

          {/* Close / Esc */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors ml-2 flex items-center space-x-1 text-xs font-semibold px-2.5"
            title="Exit Focus Mode (Esc)"
          >
            <span>Exit</span>
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Focus Reading Canvas */}
      <div
        ref={contentRef}
        onScroll={handleScroll}
        className={`flex-1 overflow-y-auto px-4 sm:px-8 py-10 transition-colors ${themeClasses}`}
      >
        <main
          className="max-w-3xl mx-auto focus-content leading-relaxed transition-all"
          style={{ fontSize: `${fontSize}px` }}
        >
          {children}
        </main>
      </div>
    </div>
  );
};
