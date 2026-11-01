import { Award, BookOpen, FlaskConical, HelpCircle, Zap } from 'lucide-react';
import type React from 'react';

import { QUICK_PICK_DATASET } from '../lib/quick-picks-data';
import type { QuickPickItem } from '../lib/quick-picks-data';

interface QuickPickSelectorProps {
  onSelect: (item: QuickPickItem) => void;
  category?: 'practical' | 'qa' | 'pyq' | 'smart_module' | 'all';
  activeId?: string;
}

export const QuickPickSelector: React.FC<QuickPickSelectorProps> = ({
  onSelect,
  category,
  activeId,
}) => {
  const items =
    category && category !== 'all'
      ? QUICK_PICK_DATASET.filter((item) => item.category === category)
      : QUICK_PICK_DATASET;

  const getCategoryBadge = (cat: QuickPickItem['category']) => {
    switch (cat) {
      case 'practical':
        return (
          <span className="flex items-center gap-1 text-[9px] font-mono uppercase bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/80 font-bold">
            <FlaskConical className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Lab Practical
          </span>
        );
      case 'qa':
        return (
          <span className="flex items-center gap-1 text-[9px] font-mono uppercase bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800/80 font-bold">
            <Award className="w-3 h-3 text-indigo-600 dark:text-indigo-400" /> Standard Q&A
          </span>
        );
      case 'pyq':
        return (
          <span className="flex items-center gap-1 text-[9px] font-mono uppercase bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800/80 font-bold">
            <HelpCircle className="w-3 h-3 text-amber-600 dark:text-amber-400" /> PYQ Analysis
          </span>
        );
      case 'smart_module':
        return (
          <span className="flex items-center gap-1 text-[9px] font-mono uppercase bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-md border border-purple-200 dark:border-purple-800/80 font-bold">
            <BookOpen className="w-3 h-3 text-purple-600 dark:text-purple-400" /> Smart Module
          </span>
        );
    }
  };

  return (
    <div className="space-y-3 bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-purple-50/50 dark:from-slate-900/90 dark:via-indigo-950/40 dark:to-slate-900/90 p-4 sm:p-5 rounded-2xl border border-blue-100 dark:border-slate-800 shadow-xs transition-colors">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm shrink-0">
            <Zap className="w-4 h-4 fill-current text-white" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
              Instant Quick Picks
              <span className="bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-indigo-200/60 dark:border-indigo-800">
                Hybrid Pipeline
              </span>
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Pre-computed university model answers • Instant bypass with simulated AI synthesis
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-2.5 overflow-x-auto pb-1.5 pt-1 no-scrollbar">
        {items.map((item) => {
          const isSelected = activeId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item)}
              className={`shrink-0 text-left w-72 sm:w-80 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-white dark:bg-slate-800 border-indigo-500 dark:border-indigo-400 ring-2 ring-indigo-500/25 shadow-sm transform -translate-y-0.5'
                  : 'bg-white/80 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-800 border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                {getCategoryBadge(item.category)}
                <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 font-bold">
                  {item.subjectCode} • {item.marks}M
                </span>
              </div>
              <h5 className="text-xs font-bold text-slate-800 dark:text-slate-100 line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                {item.title}
              </h5>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-1 leading-relaxed">
                {item.subtitle}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
