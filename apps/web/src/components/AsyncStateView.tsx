import React from 'react';
import { AlertCircle, RefreshCw, Sparkles, Inbox, Loader2, ArrowRight } from 'lucide-react';

export type AsyncStatus = 'idle' | 'loading' | 'processing' | 'empty' | 'error' | 'success';

export interface AsyncStateViewProps {
  status: AsyncStatus;
  idleTitle?: string;
  idleDescription?: string;
  idleActionLabel?: string;
  onIdleAction?: () => void;
  loadingMessage?: string;
  processingStages?: string[];
  activeStageIndex?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  errorMessage?: string;
  onRetry?: () => void;
  skeletonType?: 'cards' | 'document' | 'table' | 'chat';
  children?: React.ReactNode;
}

export const AsyncStateView: React.FC<AsyncStateViewProps> = ({
  status,
  idleTitle = 'Ready to Generate',
  idleDescription = 'Select options or enter a query to generate comprehensive academic content.',
  idleActionLabel,
  onIdleAction,
  loadingMessage = 'Gathering academic context...',
  processingStages = [
    'Synthesizing curriculum syllabus...',
    'Consulting neural engine...',
    'Formatting academic model answer...',
  ],
  activeStageIndex = 0,
  emptyTitle = 'No Results Found',
  emptyDescription = 'There are no items matching your criteria. Try adjusting your search or filters.',
  emptyActionLabel,
  onEmptyAction,
  errorMessage = 'An error occurred while processing your request.',
  onRetry,
  skeletonType = 'document',
  children,
}) => {
  if (status === 'success') {
    return <div className="animate-fade-in">{children}</div>;
  }

  if (status === 'idle') {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50 transition-colors">
        <div className="w-14 h-14 mb-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-inner">
          <Sparkles className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">{idleTitle}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6">{idleDescription}</p>
        {idleActionLabel && onIdleAction && (
          <button
            onClick={onIdleAction}
            className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <span>{idleActionLabel}</span>
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </button>
        )}
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="flex items-center space-x-3 mb-6">
          <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{loadingMessage}</span>
        </div>
        {renderSkeleton(skeletonType)}
      </div>
    );
  }

  if (status === 'processing') {
    return (
      <div className="p-8 rounded-2xl border border-indigo-100 dark:border-indigo-900/60 bg-gradient-to-b from-indigo-50/50 to-white dark:from-slate-900 dark:to-slate-950 shadow-sm">
        <div className="flex flex-col items-center justify-center text-center mb-8">
          <div className="relative mb-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/25">
              <Sparkles className="w-8 h-8 animate-pulse" />
            </div>
            <div className="absolute -inset-1 rounded-2xl bg-indigo-600/20 blur animate-ping -z-10" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Synthesizing Response</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Analyzing academic parameters and tailoring content to exam rubric
          </p>
        </div>

        {/* Processing Stages Ticker */}
        <div className="max-w-md mx-auto space-y-3">
          {processingStages.map((stage, idx) => {
            const isCompleted = idx < activeStageIndex;
            const isCurrent = idx === activeStageIndex;

            return (
              <div
                key={idx}
                className={`flex items-center space-x-3 p-3 rounded-xl border text-xs font-medium transition-all ${
                  isCompleted
                    ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300'
                    : isCurrent
                    ? 'border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-800 text-indigo-900 dark:text-indigo-200 shadow-sm'
                    : 'border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-900/30 text-slate-400 dark:text-slate-500'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isCompleted
                      ? 'bg-emerald-500 text-white'
                      : isCurrent
                      ? 'bg-indigo-600 text-white animate-spin'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  {isCompleted ? '✓' : idx + 1}
                </div>
                <span className="flex-1 text-left">{stage}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (status === 'empty') {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-sm">
        <div className="w-14 h-14 mb-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center">
          <Inbox className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">{emptyTitle}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6">{emptyDescription}</p>
        {emptyActionLabel && onEmptyAction && (
          <button
            onClick={onEmptyAction}
            className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 transition-colors"
          >
            {emptyActionLabel}
          </button>
        )}
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="p-6 rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50/40 dark:bg-red-950/20 text-red-900 dark:text-red-200 shadow-sm">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-sm text-red-800 dark:text-red-300">Operation Encountered an Error</h4>
            <p className="text-xs text-red-700 dark:text-red-400 mt-1 leading-relaxed">{errorMessage}</p>
            {onRetry && (
              <div className="mt-4">
                <button
                  onClick={onRetry}
                  className="inline-flex items-center px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 shadow-sm transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                  Retry Request
                </button>
                <span className="text-[11px] text-red-500 dark:text-red-400 ml-3">
                  Your inputs and selection have been preserved.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

function renderSkeleton(type: 'cards' | 'document' | 'table' | 'chat') {
  if (type === 'cards') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 animate-pulse space-y-3"
          >
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-md w-3/4" />
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-md w-1/2" />
            <div className="space-y-1.5 pt-2">
              <div className="h-2.5 bg-slate-200 dark:bg-slate-700 rounded w-full" />
              <div className="h-2.5 bg-slate-200 dark:bg-slate-700 rounded w-5/6" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-lg w-full" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-10 bg-slate-100 dark:bg-slate-800 rounded-md w-full" />
        ))}
      </div>
    );
  }

  if (type === 'chat') {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="flex space-x-3 items-start">
          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700" />
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
            <div className="h-14 bg-slate-100 dark:bg-slate-800 rounded-xl w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  // default 'document'
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-md w-1/2" />
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-md w-1/3" />
      <div className="space-y-2 pt-4">
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full" />
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-11/12" />
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-4/5" />
      </div>
      <div className="space-y-2 pt-4">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-md w-1/4" />
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full" />
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-5/6" />
      </div>
    </div>
  );
}

