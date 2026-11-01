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
          <span className="flex items-center gap-1 text-[9px] font-mono uppercase bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-200">
            <FlaskConical className="w-3 h-3 text-emerald-600" /> Lab Practical
          </span>
        );
      case 'qa':
        return (
          <span className="flex items-center gap-1 text-[9px] font-mono uppercase bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-200">
            <Award className="w-3 h-3 text-indigo-600" /> Standard Q&A
          </span>
        );
      case 'pyq':
        return (
          <span className="flex items-center gap-1 text-[9px] font-mono uppercase bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md border border-amber-200">
            <HelpCircle className="w-3 h-3 text-amber-600" /> PYQ Analysis
          </span>
        );
      case 'smart_module':
        return (
          <span className="flex items-center gap-1 text-[9px] font-mono uppercase bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md border border-purple-200">
            <BookOpen className="w-3 h-3 text-purple-600" /> Smart Module
          </span>
        );
    }
  };

  return (
    <div className="space-y-3 bg-gradient-to-r from-blue-50/60 via-indigo-50/40 to-purple-50/40 p-4 rounded-2xl border border-blue-100 shadow-xs">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
            <Zap className="w-3.5 h-3.5 fill-current" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-900 tracking-tight flex items-center gap-1.5">
              Instant Quick Picks
              <span className="bg-indigo-100 text-indigo-800 text-[10px] font-mono font-medium px-1.5 py-0.2 rounded">
                Hybrid Pipeline
              </span>
            </h4>
            <p className="text-[11px] text-gray-500">
              Pre-computed university model answers • Instant bypass with simulated AI synthesis
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
        {items.map((item) => {
          const isSelected = activeId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item)}
              className={`shrink-0 text-left max-w-xs p-3 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-white border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm'
                  : 'bg-white/80 hover:bg-white border-gray-200 hover:border-indigo-300 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                {getCategoryBadge(item.category)}
                <span className="text-[9px] font-mono text-gray-400 font-semibold">
                  {item.subjectCode} • {item.marks}M
                </span>
              </div>
              <h5 className="text-xs font-bold text-gray-800 line-clamp-1 group-hover:text-indigo-600">
                {item.title}
              </h5>
              <p className="text-[10px] text-gray-500 line-clamp-1 mt-0.5">{item.subtitle}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
