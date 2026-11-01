import { AlertCircle, Check, Cloud, Copy, Loader2, RefreshCw, Sparkles, Zap } from 'lucide-react';
import { useState } from 'react';

import { FormattedAnswer } from '../components/FormattedAnswer';
import { QuickPickSelector } from '../components/QuickPickSelector';
import { executeHybridQuery, isQuickPickHardcoded } from '../lib/hybrid-router';
import type { QuickPickItem } from '../lib/quick-picks-data';

export default function StructuredAnswer() {
  const [questionText, setQuestionText] = useState(
    'What are the important properties of activation function used in neural network .Explain all the activation functions with neat diagram',
  );
  const [markValue, setMarkValue] = useState<number>(10);
  const [formatVariant, setFormatVariant] = useState<string>('Topper Standard');

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generationStage, setGenerationStage] = useState('');
  const [copied, setCopied] = useState(false);
  const [generatedAnswer, setGeneratedAnswer] = useState<string | null>(null);
  const [wordCount, setWordCount] = useState<number>(0);
  const [responseSource, setResponseSource] = useState<
    'quick_pick_cache' | 'oci_genai_live' | null
  >(null);
  const [responseLatency, setResponseLatency] = useState<number | null>(null);
  const [activeQuickPickId, setActiveQuickPickId] = useState<string | undefined>(
    'qp-qa-activation-functions',
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleQuickPickSelect = (item: QuickPickItem) => {
    setQuestionText(item.title);
    setMarkValue(item.marks);
    setActiveQuickPickId(item.id);
    void triggerGeneration(item.title, item.marks, false);
  };

  const triggerGeneration = async (query: string, marks: number, forceLiveOci: boolean = false) => {
    if (!query.trim()) return;

    setLoading(true);
    setErrorMsg(null);
    setProgress(5);
    setGenerationStage(
      forceLiveOci
        ? 'Routing to Live OCI GenAI cluster (us-chicago-1)...'
        : 'Analyzing query against hybrid pipeline...',
    );

    try {
      const result = await executeHybridQuery(query, {
        category: 'qa',
        endpoint: '/api/answers/generate',
        payload: {
          question: query.trim(),
          markValue: marks,
          format: formatVariant,
        },
        forceLiveOci,
        minDelayMs: 900,
        maxDelayMs: 1900,
        onProgress: (pct, stage) => {
          setProgress(pct);
          setGenerationStage(stage);
        },
      });

      const answerText = result.data?.answer || result.matchedItem?.answerMarkdown || '';
      setGeneratedAnswer(answerText);
      setWordCount(result.data?.wordCount || answerText.split(/\s+/).length);
      setResponseSource(result.source);
      setResponseLatency(result.latencyMs);
    } catch (err: unknown) {
      console.error('Answer generation error:', err);
      const msg =
        err instanceof Error
          ? err.message
          : 'Unable to complete AI generation. Please check network/OCI configuration.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    void triggerGeneration(questionText, markValue, false);
  };

  const handleRegenerateLiveOci = () => {
    void triggerGeneration(questionText, markValue, true);
  };

  const handleCopy = () => {
    if (!generatedAnswer) return;
    void navigator.clipboard.writeText(generatedAnswer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const matchedCache = isQuickPickHardcoded(questionText);

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 bg-[#f8f9fc] text-[#2d2d34] min-h-screen font-sans">
      {/* Header */}
      <header className="pb-2 border-b border-[#e3e6ed]">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-2 h-2 rounded-full bg-[#4f75f2] animate-pulse" />
          <span className="text-[11px] font-mono tracking-widest text-[#6b6f82] uppercase font-bold">
            Exam-Ready Model Answer Engine • Hybrid Pipeline Active
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#121217]">
          Structured Topper Answer Generator
        </h1>
        <p className="text-xs md:text-sm text-[#6b6f82] mt-1 font-sans max-w-2xl">
          Pre-computed university topper answers served instantly with simulated generation UX, with
          automatic failover to live Oracle Cloud Infrastructure (OCI) GenAI.
        </p>
      </header>

      {/* Quick Pick Toolbar */}
      <QuickPickSelector onSelect={handleQuickPickSelect} activeId={activeQuickPickId} />

      {/* Input Configuration Card */}
      <div
        className={`bg-white border rounded-3xl p-6 md:p-8 space-y-6 shadow-xs transition-all duration-500 ${
          loading
            ? 'border-[#4f75f2] ring-4 ring-[#4f75f2]/15 shadow-xl shadow-[#4f75f2]/10'
            : 'border-[#e3e6ed]'
        }`}
      >
        <form onSubmit={handleGenerate} className="space-y-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-[10px] font-mono uppercase tracking-wider text-[#6b6f82] font-bold">
                Examination Question Prompt
              </label>
              {matchedCache && (
                <span className="flex items-center gap-1 text-[10px] font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  <Zap className="w-3 h-3 text-emerald-600" /> Pre-Mapped in Cache
                </span>
              )}
            </div>
            <textarea
              rows={3}
              required
              value={questionText}
              onChange={(e) => {
                setQuestionText(e.target.value);
                setActiveQuickPickId(undefined);
              }}
              placeholder="Type or paste your university exam question here..."
              className="w-full bg-[#f8f9fc] border border-[#e3e6ed] rounded-2xl p-4 text-sm text-[#121217] outline-none focus:border-[#4f75f2] leading-relaxed resize-none shadow-xs font-sans"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Mark Scheme */}
            <div>
              <label className="text-[10px] font-mono uppercase tracking-wider text-[#6b6f82] font-bold block mb-2">
                Target Mark Weightage
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[2, 5, 10, 15].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMarkValue(m)}
                    className={`py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      markValue === m
                        ? 'bg-[#edf3fc] text-[#4f75f2] border-[#d0dcf5] shadow-xs'
                        : 'bg-[#f8f9fc] border-[#e3e6ed] text-[#6b6f82] hover:text-[#121217] hover:border-[#4f75f2]'
                    }`}
                  >
                    {m} Marks
                  </button>
                ))}
              </div>
            </div>

            {/* Answer Format */}
            <div>
              <label className="text-[10px] font-mono uppercase tracking-wider text-[#6b6f82] font-bold block mb-2">
                Answer Presentation Format
              </label>
              <select
                value={formatVariant}
                onChange={(e) => setFormatVariant(e.target.value)}
                className="w-full bg-[#f8f9fc] border border-[#e3e6ed] rounded-2xl px-4 py-2.5 text-xs font-bold text-[#121217] outline-none focus:border-[#4f75f2] cursor-pointer shadow-xs"
              >
                <option value="Topper Standard">
                  Topper Standard (Intro + Diagram + Equations + Breakdown + Example)
                </option>
                <option value="University Schema">
                  University Schema (Formal Headings &amp; Strict Layout)
                </option>
                <option value="Crisp Bulleted">Crisp Bulleted (High-Yield Point-by-Point)</option>
                <option value="Handwriting Friendly">
                  Handwriting-Friendly (Concise for manual writing)
                </option>
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-1">
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto bg-[#4f75f2] hover:bg-[#385dd8] text-white px-8 py-3.5 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-white" /> Structuring Answer (
                  {progress}%)...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-amber-200" /> Generate {markValue}-Mark Answer
                </>
              )}
            </button>

            {matchedCache && !loading && (
              <button
                type="button"
                onClick={handleRegenerateLiveOci}
                className="w-full sm:w-auto bg-white hover:bg-gray-50 text-indigo-700 border border-indigo-200 px-5 py-3.5 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                title="Force request to bypass cache and query live OCI GenAI backend directly"
              >
                <Cloud className="w-4 h-4 text-indigo-600" /> Force Live OCI Query
              </button>
            )}

            {loading && (
              <div className="flex-1 flex items-center gap-3 bg-[#edf3fc] border border-[#d0dcf5] px-4 py-2.5 rounded-2xl">
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-center text-[11px] font-mono font-bold text-[#4f75f2]">
                    <span>{generationStage}</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-[#d0dcf5] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#4f75f2] via-[#6366f1] to-emerald-500 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>

        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <div className="flex-1">
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={() => {
                void triggerGeneration(questionText, markValue, false);
              }}
              className="px-3 py-1 bg-white border border-rose-300 rounded-lg text-rose-700 font-bold hover:bg-rose-100 transition-colors"
            >
              Retry
            </button>
          </div>
        )}
      </div>

      {/* Answer Output View */}
      {generatedAnswer && (
        <div className="bg-white border border-[#e3e6ed] rounded-3xl p-6 md:p-8 space-y-6 shadow-xs animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-[#e3e6ed]">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#3b52c4] bg-[#e4e7fd] px-3 py-1 rounded-full border border-[#d0d8fb] font-bold">
                  EXAM-READY MODEL ANSWER ({markValue} MARKS)
                </span>
                {responseSource === 'quick_pick_cache' ? (
                  <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-800 bg-emerald-100/70 border border-emerald-300 px-2.5 py-0.5 rounded-full font-bold">
                    <Zap className="w-3 h-3 text-emerald-600 fill-current" /> Quick Pick Cache (
                    {responseLatency}ms)
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] font-mono text-indigo-800 bg-indigo-100/70 border border-indigo-300 px-2.5 py-0.5 rounded-full font-bold">
                    <Cloud className="w-3 h-3 text-indigo-600" /> Live OCI GenAI ({responseLatency}
                    ms)
                  </span>
                )}
              </div>
              <h2 className="text-xl font-extrabold text-[#121217] leading-snug">{questionText}</h2>
              <p className="text-[#6b6f82] text-xs mt-1 font-mono">
                Format: {formatVariant} • {wordCount} Words
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRegenerateLiveOci}
                disabled={loading}
                className="flex items-center gap-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs disabled:opacity-50"
                title="Regenerate dynamically with Live OCI GenAI backend"
              >
                <RefreshCw className="w-3.5 h-3.5 text-gray-500" /> Live Regenerate
              </button>
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 bg-white hover:bg-[#edf3fc] text-[#4f75f2] border border-[#d0dcf5] px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                {copied ? 'Copied' : 'Copy Answer'}
              </button>
            </div>
          </div>

          <div className="p-6 md:p-8 bg-[#f8f9fc] rounded-2xl border border-[#e3e6ed] select-text">
            <FormattedAnswer content={generatedAnswer} />
          </div>
        </div>
      )}
    </div>
  );
}
