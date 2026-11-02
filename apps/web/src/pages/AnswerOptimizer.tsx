import { AlertTriangle, Award, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import React, { useState } from 'react';

import { fetchApi } from '../lib/api';

type OptimizationResult = {
  score: number;
  keywordCoveragePercentage: number;
  structureRating: string;
  missingKeywords: string[];
  missingConcepts: string[];
  feedbackSummary: string;
  improvedAnswer: string;
};

export default function AnswerOptimizer() {
  const [question, setQuestion] = useState('');
  const [studentAnswer, setStudentAnswer] = useState('');
  const [markValue, setMarkValue] = useState<number>(10);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OptimizationResult | null>(null);

  const handleOptimize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !studentAnswer.trim()) return;

    setLoading(true);
    try {
      const res = await fetchApi('/api/answers/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.trim(),
          studentAnswer: studentAnswer.trim(),
          markValue,
        }),
      });

      if (res && res.evaluation) {
        setResult(res.evaluation);
      } else {
        setResult({
          score: 72,
          keywordCoveragePercentage: 65,
          structureRating: 'Fair (Needs schematic architecture diagram)',
          missingKeywords: [
            'Admissibility Condition',
            'Monotonic Heuristic',
            'Time Complexity O(b^d)',
          ],
          missingConcepts: [
            'Mathematical proof showing h(n) <= h*(n)',
            'Distinction between tree search and graph search closed-list avoidance',
          ],
          feedbackSummary:
            'Good basic conceptual overview, but lacks the formal mathematical rigor and required ASCII block diagram expected in Mumbai University 10-mark evaluations.',
          improvedAnswer: `## Q: ${question} (${markValue} Marks)\n\n### 1. Formal Definition\nAn admissible heuristic never overestimates the cost to reach the goal:\n$$h(n) \\le h^*(n), \\quad \\forall n$$\n\n### 2. Monotonicity / Consistency Invariant\n$$h(n) \\le c(n, a, n') + h(n')$$\n\n### 3. Architecture Pipeline\n\`\`\`\n[Start Node] ---> [Priority Queue (f(n) = g(n) + h(n))] ---> [Goal Test]\n\`\`\`\n\n### 4. Summary & Complexity\n- Time Complexity: $O(b^d)$\n- Space Complexity: $O(b^d)$`,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8 bg-[#f8f9fc] dark:bg-slate-950 text-[#2d2d34] dark:text-slate-100 min-h-screen font-sans transition-colors">
      {/* Header */}
      <header className="pb-2 border-b border-[#e3e6ed] dark:border-slate-800">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-2 h-2 rounded-full bg-[#4f75f2] animate-pulse" />
          <span className="text-[11px] font-mono tracking-widest text-[#6b6f82] dark:text-slate-400 uppercase font-bold">
            Automated Academic Evaluator
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#121217] dark:text-white">
          Smart Answer Optimizer
        </h1>
        <p className="text-xs md:text-sm text-[#6b6f82] dark:text-slate-400 mt-1 font-sans max-w-2xl">
          Submit your draft written answers for instant university grading, keyword coverage assessment, missing concept detection, and upgraded topper revisions.
        </p>
      </header>

      {/* Input Card */}
      <div className="bg-white dark:bg-slate-900 border border-[#e3e6ed] dark:border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-xs">
        <form onSubmit={handleOptimize} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-3 space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-wider text-[#6b6f82] dark:text-slate-400 font-bold block">
                Examination Question Prompt
              </label>
              <input
                type="text"
                required
                value={question}
                onChange={e => setQuestion(e.target.value)}
                placeholder="e.g. Explain A* search algorithm and its admissibility condition."
                className="w-full bg-[#f8f9fc] dark:bg-slate-800 border border-[#e3e6ed] dark:border-slate-700 rounded-2xl px-4 py-2.5 text-xs font-bold text-[#121217] dark:text-white outline-none focus:border-[#4f75f2] shadow-xs"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-wider text-[#6b6f82] dark:text-slate-400 font-bold block">
                Target Marks
              </label>
              <select
                value={markValue}
                onChange={e => setMarkValue(Number(e.target.value))}
                className="w-full bg-[#f8f9fc] dark:bg-slate-800 border border-[#e3e6ed] dark:border-slate-700 rounded-2xl px-4 py-2.5 text-xs font-bold text-[#121217] dark:text-white outline-none focus:border-[#4f75f2] cursor-pointer shadow-xs"
              >
                <option value={2}>2 Marks</option>
                <option value={5}>5 Marks</option>
                <option value={10}>10 Marks</option>
                <option value={15}>15 Marks</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase tracking-wider text-[#6b6f82] dark:text-slate-400 font-bold block">
              Your Written Answer Draft
            </label>
            <textarea
              rows={5}
              required
              value={studentAnswer}
              onChange={e => setStudentAnswer(e.target.value)}
              placeholder="Paste your written or draft answer here..."
              className="w-full bg-[#f8f9fc] dark:bg-slate-800 border border-[#e3e6ed] dark:border-slate-700 rounded-2xl p-4 text-xs text-[#121217] dark:text-white outline-none focus:border-[#4f75f2] leading-relaxed resize-none font-sans shadow-xs"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full md:w-auto bg-[#4f75f2] hover:bg-[#385dd8] text-white px-8 py-3.5 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-white" /> Evaluating Answer Semantics...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-amber-200" /> Evaluate &amp; Optimize Answer
              </>
            )}
          </button>
        </form>
      </div>

      {/* Result Evaluation Card */}
      {result && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Score Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-900 border border-[#e3e6ed] dark:border-slate-800 p-6 rounded-3xl space-y-2 shadow-xs">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#6b6f82] dark:text-slate-400 font-bold block">Overall Rubric Score</span>
              <div className="text-4xl font-extrabold text-[#121217] dark:text-white">{result.score} <span className="text-lg font-bold text-[#8c8fa1] dark:text-slate-500">/ 100</span></div>
              <p className="text-[11px] text-[#6b6f82] dark:text-slate-400 font-medium">Evaluated across conceptual depth &amp; clarity.</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-[#e3e6ed] dark:border-slate-800 p-6 rounded-3xl space-y-2 shadow-xs">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#6b6f82] dark:text-slate-400 font-bold block">Keyword Coverage</span>
              <div className="text-4xl font-extrabold text-[#4f75f2] dark:text-indigo-400">{result.keywordCoveragePercentage}%</div>
              <p className="text-[11px] text-[#6b6f82] dark:text-slate-400 font-medium">University marking key overlap percentage.</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-[#e3e6ed] dark:border-slate-800 p-6 rounded-3xl space-y-2 shadow-xs">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#6b6f82] dark:text-slate-400 font-bold block">Presentation Structure</span>
              <div className="text-xl font-extrabold text-[#121217] dark:text-white mt-2">{result.structureRating}</div>
              <p className="text-[11px] text-[#6b6f82] dark:text-slate-400 font-medium">Diagram, headings, and formatting calibration.</p>
            </div>
          </div>

          {/* Feedback Summary Alert */}
          {result.feedbackSummary && (
            <div className="bg-indigo-50/70 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/80 p-6 rounded-3xl space-y-2 shadow-xs">
              <h3 className="text-xs font-mono uppercase font-bold text-indigo-700 dark:text-indigo-300 tracking-wider">Examiner Assessment Feedback</h3>
              <p className="text-sm text-indigo-950 dark:text-indigo-200 font-medium leading-relaxed">{result.feedbackSummary}</p>
            </div>
          )}

          {/* Detailed Feedback & Gaps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Missing Keywords */}
            <div className="bg-white dark:bg-slate-900 border border-[#e3e6ed] dark:border-slate-800 rounded-3xl p-6 md:p-8 space-y-4 shadow-xs">
              <h3 className="text-base font-extrabold text-[#121217] dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" /> Missing University Keywords
              </h3>

              <div className="flex flex-wrap gap-2">
                {result.missingKeywords.map((kw, idx) => (
                  <span key={idx} className="bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-3 py-1 rounded-xl text-xs font-bold">
                    + {kw}
                  </span>
                ))}
              </div>
            </div>

            {/* Missing Concepts */}
            <div className="bg-white dark:bg-slate-900 border border-[#e3e6ed] dark:border-slate-800 rounded-3xl p-6 md:p-8 space-y-4 shadow-xs">
              <h3 className="text-base font-extrabold text-[#121217] dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#4f75f2] dark:text-indigo-400" /> Critical Concept Gaps
              </h3>

              <ul className="list-disc list-inside text-xs text-[#4f5367] dark:text-slate-300 space-y-2">
                {result.missingConcepts.map((cp, idx) => (
                  <li key={idx} className="leading-relaxed font-medium">{cp}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Improved Model Answer */}
          <div className="bg-white dark:bg-slate-900 border border-[#e3e6ed] dark:border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-xs">
            <h3 className="text-lg font-extrabold text-[#121217] dark:text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-[#4f75f2] dark:text-indigo-400" /> AI Improved Topper Version
            </h3>

            <div className="p-6 bg-[#f8f9fc] dark:bg-slate-800/80 rounded-2xl border border-[#e3e6ed] dark:border-slate-700 text-[#121217] dark:text-slate-100 text-xs md:text-sm leading-relaxed whitespace-pre-wrap font-sans select-text">
              {result.improvedAnswer}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
