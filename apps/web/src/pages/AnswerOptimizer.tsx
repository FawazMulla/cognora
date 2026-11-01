import { useState } from 'react';
import { Sparkles, CheckCircle2, AlertTriangle, ArrowRight, Loader2, Award, Edit3, RefreshCw, BarChart2, ShieldCheck } from 'lucide-react';
import { fetchApi } from '../lib/api';
import { generateAnswerOptimizationAI } from '../lib/ai-service';

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
  const [question, setQuestion] = useState('Explain A* Search Algorithm and its admissibility condition.');
  const [studentAnswer, setStudentAnswer] = useState('A* search uses f(n) = g(n) + h(n). g(n) is the cost from start and h(n) is heuristic. It finds the shortest path if heuristic is admissible.');
  const [markValue, setMarkValue] = useState<number>(10);
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OptimizationResult | null>(null);

  const handleOptimize = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!studentAnswer.trim()) return;

    setLoading(true);
    try {
      const res = await fetchApi('/api/answers/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.trim(),
          studentAnswer: studentAnswer.trim(),
          markValue
        })
      });

      if (res && res.evaluation) {
        setResult(res.evaluation);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.warn('Backend optimize API offline, synthesizing answer optimization:', err);
    }

    try {
      const evaluation = await generateAnswerOptimizationAI(question.trim(), studentAnswer.trim(), markValue);
      setResult(evaluation);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 bg-[#f8f9fc] dark:bg-slate-950 text-[#2d2d34] dark:text-slate-100 min-h-screen font-sans transition-colors">
      {/* Header */}
      <header className="pb-2 border-b border-[#e3e6ed]">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-2 h-2 rounded-full bg-[#4f75f2] animate-pulse" />
          <span className="text-[11px] font-mono tracking-widest text-[#6b6f82] uppercase font-bold">
            Automated Academic Evaluator
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#121217]">
          Smart Answer Optimizer
        </h1>
        <p className="text-xs md:text-sm text-[#6b6f82] mt-1 font-sans max-w-2xl">
          Submit your draft written answers for instant university grading, keyword coverage assessment, missing concept detection, and upgraded topper revisions.
        </p>
      </header>

      {/* Input Card */}
      <div className="bg-white dark:bg-slate-900 border border-[#e3e6ed] dark:border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-xs">
        <form onSubmit={handleOptimize} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-3 space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-wider text-[#6b6f82] font-bold block">
                Examination Question Prompt
              </label>
              <input
                type="text"
                required
                value={question}
                onChange={e => setQuestion(e.target.value)}
                placeholder="e.g. Explain A* search algorithm and its admissibility condition."
                className="w-full bg-[#f8f9fc] border border-[#e3e6ed] rounded-2xl px-4 py-2.5 text-xs font-bold text-[#121217] outline-none focus:border-[#4f75f2] shadow-xs"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-wider text-[#6b6f82] font-bold block">
                Target Marks
              </label>
              <select
                value={markValue}
                onChange={e => setMarkValue(Number(e.target.value))}
                className="w-full bg-[#f8f9fc] border border-[#e3e6ed] rounded-2xl px-4 py-2.5 text-xs font-bold text-[#121217] outline-none focus:border-[#4f75f2] cursor-pointer shadow-xs"
              >
                <option value={2}>2 Marks</option>
                <option value={5}>5 Marks</option>
                <option value={10}>10 Marks</option>
                <option value={15}>15 Marks</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase tracking-wider text-[#6b6f82] font-bold block">
              Your Written Answer Draft
            </label>
            <textarea
              rows={5}
              required
              value={studentAnswer}
              onChange={e => setStudentAnswer(e.target.value)}
              placeholder="Paste your written or draft answer here..."
              className="w-full bg-[#f8f9fc] border border-[#e3e6ed] rounded-2xl p-4 text-xs text-[#121217] outline-none focus:border-[#4f75f2] leading-relaxed resize-none font-sans shadow-xs"
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
            <div className="bg-white border border-[#e3e6ed] p-6 rounded-3xl space-y-2 shadow-xs">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#6b6f82] font-bold block">Overall Rubric Score</span>
              <div className="text-4xl font-extrabold text-[#121217]">{result.score} <span className="text-lg font-bold text-[#8c8fa1]">/ 100</span></div>
              <p className="text-[11px] text-[#6b6f82] font-medium">Evaluated across conceptual depth &amp; clarity.</p>
            </div>

            <div className="bg-white border border-[#e3e6ed] p-6 rounded-3xl space-y-2 shadow-xs">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#6b6f82] font-bold block">Keyword Coverage</span>
              <div className="text-4xl font-extrabold text-[#4f75f2]">{result.keywordCoveragePercentage}%</div>
              <p className="text-[11px] text-[#6b6f82] font-medium">University marking key overlap percentage.</p>
            </div>

            <div className="bg-white border border-[#e3e6ed] p-6 rounded-3xl space-y-2 shadow-xs">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#6b6f82] font-bold block">Presentation Structure</span>
              <div className="text-xl font-extrabold text-[#121217] mt-2">{result.structureRating}</div>
              <p className="text-[11px] text-[#6b6f82] font-medium">Diagram, headings, and formatting calibration.</p>
            </div>
          </div>

          {/* Feedback Summary Alert */}
          {result.feedbackSummary && (
            <div className="bg-[#edf3fc] border border-[#d0dcf5] p-6 rounded-3xl space-y-2 shadow-xs">
              <h3 className="text-xs font-mono uppercase font-bold text-[#3b52c4] tracking-wider">Examiner Assessment Feedback</h3>
              <p className="text-sm text-[#1e255e] font-medium leading-relaxed">{result.feedbackSummary}</p>
            </div>
          )}

          {/* Detailed Feedback & Gaps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Missing Keywords */}
            <div className="bg-white border border-[#e3e6ed] rounded-3xl p-6 md:p-8 space-y-4 shadow-xs">
              <h3 className="text-base font-extrabold text-[#121217] flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" /> Missing University Keywords
              </h3>

              <div className="flex flex-wrap gap-2">
                {result.missingKeywords.map((kw, idx) => (
                  <span key={idx} className="bg-[#fbf5e6] text-[#967018] border border-[#f4e8cc] px-3 py-1 rounded-xl text-xs font-bold">
                    + {kw}
                  </span>
                ))}
              </div>
            </div>

            {/* Missing Concepts */}
            <div className="bg-white border border-[#e3e6ed] rounded-3xl p-6 md:p-8 space-y-4 shadow-xs">
              <h3 className="text-base font-extrabold text-[#121217] flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#4f75f2]" /> Critical Concept Gaps
              </h3>

              <ul className="list-disc list-inside text-xs text-[#4f5367] space-y-2">
                {result.missingConcepts.map((cp, idx) => (
                  <li key={idx} className="leading-relaxed font-medium">{cp}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Improved Model Answer */}
          <div className="bg-white border border-[#e3e6ed] rounded-3xl p-6 md:p-8 space-y-6 shadow-xs">
            <h3 className="text-lg font-extrabold text-[#121217] flex items-center gap-2">
              <Award className="w-5 h-5 text-[#4f75f2]" /> AI Improved Topper Version
            </h3>

            <div className="p-6 bg-[#f8f9fc] rounded-2xl border border-[#e3e6ed] text-[#121217] text-xs md:text-sm leading-relaxed whitespace-pre-wrap font-sans select-text">
              {result.improvedAnswer}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

