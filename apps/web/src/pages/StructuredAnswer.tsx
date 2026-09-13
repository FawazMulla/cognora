import { useState } from 'react';
import { Award, Sparkles, Copy, Check, Loader2, BookOpen, Layers, Edit3, HelpCircle, FileText } from 'lucide-react';
import { fetchApi } from '../lib/api';
import { generateStructuredAnswerAI } from '../lib/ai-service';

export default function StructuredAnswer() {
  const [questionText, setQuestionText] = useState('Explain the working of A* Search Algorithm with an evaluation function, admissibility proof, and an example.');
  const [markValue, setMarkValue] = useState<number>(10);
  const [formatVariant, setFormatVariant] = useState<string>('Topper Standard');
  
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generatedAnswer, setGeneratedAnswer] = useState<string | null>(null);
  const [wordCount, setWordCount] = useState<number>(0);

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!questionText.trim()) return;

    setLoading(true);
    try {
      const res = await fetchApi('/api/answers/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: questionText.trim(),
          markValue,
          format: formatVariant
        })
      });

      if (res && res.answer) {
        setGeneratedAnswer(res.answer);
        setWordCount(res.wordCount || res.answer.split(/\s+/).length);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.warn('Backend API unavailable, utilizing client-side AI synthesizer:', err);
    }

    try {
      const answer = await generateStructuredAnswerAI(questionText.trim(), markValue, formatVariant);
      setGeneratedAnswer(answer);
      setWordCount(answer.split(/\s+/).length);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!generatedAnswer) return;
    navigator.clipboard.writeText(generatedAnswer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10 bg-white text-[#212121] min-h-screen font-display">
      {/* Header */}
      <header className="pb-6 border-b border-[#d9d9dd]">
        <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest text-[#666666] uppercase mb-2">
          <Award className="w-3.5 h-3.5 text-[#212121]" /> Exam-Ready Model Answer Engine
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#212121]">
          Structured Topper Answer Generator
        </h1>
        <p className="text-[#666666] mt-2 text-sm md:text-base max-w-2xl">
          Generate university-topper standard answers calibrated to mark values (2M, 5M, 10M, 15M) with ASCII architecture diagrams, mathematical equations, and bullet points.
        </p>
      </header>

      {/* Input Configuration Card */}
      <div className="bg-[#fafafb] border border-[#d9d9dd] rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
        <form onSubmit={handleGenerate} className="space-y-6">
          <div>
            <label className="text-[10px] font-mono uppercase tracking-wider text-[#666666] font-bold block mb-2">
              Examination Question Prompt
            </label>
            <textarea
              rows={3}
              required
              value={questionText}
              onChange={e => setQuestionText(e.target.value)}
              placeholder="Type or paste your university exam question here..."
              className="w-full bg-white border border-[#d9d9dd] rounded-2xl p-4 text-sm text-[#212121] outline-none focus:border-[#212121] leading-relaxed resize-none shadow-xs"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Mark Scheme */}
            <div>
              <label className="text-[10px] font-mono uppercase tracking-wider text-[#666666] font-bold block mb-2">
                Target Mark Weightage
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[2, 5, 10, 15].map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMarkValue(m)}
                    className={`py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      markValue === m
                        ? 'bg-[#212121] text-white border-[#212121] shadow-xs'
                        : 'bg-white border-[#d9d9dd] text-[#666666] hover:text-[#212121]'
                    }`}
                  >
                    {m} Marks
                  </button>
                ))}
              </div>
            </div>

            {/* Answer Format */}
            <div>
              <label className="text-[10px] font-mono uppercase tracking-wider text-[#666666] font-bold block mb-2">
                Answer Presentation Format
              </label>
              <select
                value={formatVariant}
                onChange={e => setFormatVariant(e.target.value)}
                className="w-full bg-white border border-[#d9d9dd] rounded-xl px-4 py-2.5 text-xs font-bold text-[#212121] outline-none focus:border-[#212121] cursor-pointer shadow-xs"
              >
                <option value="Topper Standard">Topper Standard (Intro + Diagram + Equations + Breakdown + Example)</option>
                <option value="University Schema">University Schema (Formal Headings & Strict Layout)</option>
                <option value="Crisp Bulleted">Crisp Bulleted (High-Yield Point-by-Point)</option>
                <option value="Handwriting Friendly">Handwriting-Friendly (Concise for manual writing)</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full md:w-auto bg-[#212121] hover:bg-black text-white px-8 py-3.5 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Structuring Exam Answer...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" /> Generate {markValue}-Mark Topper Answer
              </>
            )}
          </button>
        </form>
      </div>

      {/* Answer Output View */}
      {generatedAnswer && (
        <div className="bg-white border border-[#d9d9dd] rounded-3xl p-6 md:p-8 space-y-6 shadow-sm animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-[#d9d9dd]">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#212121] bg-[#fafafb] px-3 py-1 rounded-full border border-[#d9d9dd] mb-2 inline-block font-bold">
                EXAM-READY MODEL ANSWER ({markValue} MARKS)
              </span>
              <h2 className="text-xl font-black text-[#212121] leading-snug">{questionText}</h2>
              <p className="text-[#666666] text-xs mt-1 font-mono">Format: {formatVariant} • {wordCount} Words</p>
            </div>

            <button
              onClick={handleCopy}
              className="flex items-center gap-2 bg-[#212121] hover:bg-black text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied' : 'Copy Answer'}
            </button>
          </div>

          <div className="p-6 bg-[#fafafb] rounded-2xl border border-[#e5e5e8] text-[#212121] text-sm md:text-base leading-relaxed select-text whitespace-pre-wrap font-sans">
            {generatedAnswer}
          </div>
        </div>
      )}
    </div>
  );
}

