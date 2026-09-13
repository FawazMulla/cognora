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
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10 bg-white text-[#212121] min-h-screen font-display">
      {/* Header */}
      <header className="pb-6 border-b border-[#d9d9dd]">
        <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest text-[#666666] uppercase mb-2">
          <Edit3 className="w-3.5 h-3.5 text-[#212121]" /> Automated Academic Evaluator
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#212121]">
          Smart Answer Optimizer
        </h1>
        <p className="text-[#666666] mt-2 text-sm md:text-base max-w-2xl">
          Submit your draft written answers for instant university grading, keyword coverage assessment, missing concept detection, and upgraded topper revisions.
        </p>
      </header>

      {/* Input Card */}
      <div className="bg-[#fafafb] border border-[#d9d9dd] rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
        <form onSubmit={handleOptimize} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-3 space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-wider text-[#666666] font-bold block">
                Examination Question Prompt
              </label>
              <input
                type="text"
                required
                value={question}
                onChange={e => setQuestion(e.target.value)}
                placeholder="e.g. Explain A* search algorithm and its admissibility condition."
                className="w-full bg-white border border-[#d9d9dd] rounded-xl px-4 py-2.5 text-xs font-bold text-[#212121] outline-none focus:border-[#212121] shadow-xs"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-wider text-[#666666] font-bold block">
                Target Marks
              </label>
              <select
                value={markValue}
                onChange={e => setMarkValue(Number(e.target.value))}
                className="w-full bg-white border border-[#d9d9dd] rounded-xl px-4 py-2.5 text-xs font-bold text-[#212121] outline-none focus:border-[#212121] cursor-pointer shadow-xs"
              >
                <option value={2}>2 Marks</option>
                <option value={5}>5 Marks</option>
                <option value={10}>10 Marks</option>
                <option value={15}>15 Marks</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase tracking-wider text-[#666666] font-bold block">
              Your Written Answer Draft
            </label>
            <textarea
              rows={5}
              required
              value={studentAnswer}
              onChange={e => setStudentAnswer(e.target.value)}
              placeholder="Paste your written or draft answer here..."
              className="w-full bg-white border border-[#d9d9dd] rounded-2xl p-4 text-xs text-[#212121] outline-none focus:border-[#212121] leading-relaxed resize-none font-sans shadow-xs"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full md:w-auto bg-[#212121] hover:bg-black text-white px-8 py-3.5 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Evaluating Answer Semantics...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" /> Evaluate & Optimize Answer
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
            <div className="bg-[#fafafb] border border-[#d9d9dd] p-6 rounded-3xl space-y-2 shadow-sm">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#666666] font-bold block">Overall Rubric Score</span>
              <div className="text-4xl font-black text-[#212121]">{result.score} <span className="text-lg font-bold text-[#888888]">/ 100</span></div>
              <p className="text-[11px] text-[#666666] font-medium">Evaluated across conceptual depth & clarity.</p>
            </div>

            <div className="bg-[#fafafb] border border-[#d9d9dd] p-6 rounded-3xl space-y-2 shadow-sm">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#666666] font-bold block">Keyword Coverage</span>
              <div className="text-4xl font-black text-[#212121]">{result.keywordCoveragePercentage}%</div>
              <p className="text-[11px] text-[#666666] font-medium">University marking key overlap percentage.</p>
            </div>

            <div className="bg-[#fafafb] border border-[#d9d9dd] p-6 rounded-3xl space-y-2 shadow-sm">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#666666] font-bold block">Presentation Structure</span>
              <div className="text-xl font-black text-[#212121] mt-2">{result.structureRating}</div>
              <p className="text-[11px] text-[#666666] font-medium">Diagram, headings, and formatting calibration.</p>
            </div>
          </div>

          {/* Feedback Summary Alert */}
          {result.feedbackSummary && (
            <div className="bg-[#fafafb] border border-[#d9d9dd] p-6 rounded-3xl space-y-2 shadow-sm">
              <h3 className="text-xs font-mono uppercase font-bold text-[#666666] tracking-wider">Examiner Assessment Feedback</h3>
              <p className="text-sm text-[#212121] font-medium leading-relaxed">{result.feedbackSummary}</p>
            </div>
          )}

          {/* Detailed Feedback & Gaps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Missing Keywords */}
            <div className="bg-white border border-[#d9d9dd] rounded-3xl p-6 md:p-8 space-y-4 shadow-sm">
              <h3 className="text-base font-black text-[#212121] flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" /> Missing University Keywords
              </h3>

              <div className="flex flex-wrap gap-2">
                {result.missingKeywords.map((kw, idx) => (
                  <span key={idx} className="bg-amber-50 text-amber-900 border border-amber-300 px-3 py-1 rounded-full text-xs font-bold">
                    + {kw}
                  </span>
                ))}
              </div>
            </div>

            {/* Missing Concepts */}
            <div className="bg-white border border-[#d9d9dd] rounded-3xl p-6 md:p-8 space-y-4 shadow-sm">
              <h3 className="text-base font-black text-[#212121] flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#212121]" /> Critical Concept Gaps
              </h3>

              <ul className="list-disc list-inside text-xs text-[#444444] space-y-2">
                {result.missingConcepts.map((cp, idx) => (
                  <li key={idx} className="leading-relaxed font-medium">{cp}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Improved Model Answer */}
          <div className="bg-white border border-[#d9d9dd] rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
            <h3 className="text-lg font-black text-[#212121] flex items-center gap-2">
              <Award className="w-5 h-5 text-[#212121]" /> AI Improved Topper Version
            </h3>

            <div className="p-6 bg-[#fafafb] rounded-2xl border border-[#e5e5e8] text-[#212121] text-xs md:text-sm leading-relaxed whitespace-pre-wrap font-sans select-text">
              {result.improvedAnswer}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

