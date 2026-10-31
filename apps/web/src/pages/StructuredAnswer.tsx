import { useState } from 'react';
import { Award, Sparkles, Copy, Check, Loader2, BookOpen, Layers, Edit3, HelpCircle, FileText } from 'lucide-react';
import { fetchApi } from '../lib/api';
import { generateStructuredAnswerAI } from '../lib/ai-service';
import { FormattedAnswer } from '../components/FormattedAnswer';

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
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 bg-[#f8f9fc] text-[#2d2d34] min-h-screen font-sans">
      {/* Header */}
      <header className="pb-2 border-b border-[#e3e6ed]">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-2 h-2 rounded-full bg-[#4f75f2] animate-pulse" />
          <span className="text-[11px] font-mono tracking-widest text-[#6b6f82] uppercase font-bold">
            Exam-Ready Model Answer Engine
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#121217]">
          Structured Topper Answer Generator
        </h1>
        <p className="text-xs md:text-sm text-[#6b6f82] mt-1 font-sans max-w-2xl">
          Generate university-topper standard answers calibrated to mark values (2M, 5M, 10M, 15M) with ASCII architecture diagrams, mathematical equations, and bullet points.
        </p>
      </header>

      {/* Input Configuration Card */}
      <div className="bg-white border border-[#e3e6ed] rounded-3xl p-6 md:p-8 space-y-6 shadow-xs">
        <form onSubmit={handleGenerate} className="space-y-6">
          <div>
            <label className="text-[10px] font-mono uppercase tracking-wider text-[#6b6f82] font-bold block mb-2">
              Examination Question Prompt
            </label>
            <textarea
              rows={3}
              required
              value={questionText}
              onChange={e => setQuestionText(e.target.value)}
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
                {[2, 5, 10, 15].map(m => (
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
                onChange={e => setFormatVariant(e.target.value)}
                className="w-full bg-[#f8f9fc] border border-[#e3e6ed] rounded-2xl px-4 py-2.5 text-xs font-bold text-[#121217] outline-none focus:border-[#4f75f2] cursor-pointer shadow-xs"
              >
                <option value="Topper Standard">Topper Standard (Intro + Diagram + Equations + Breakdown + Example)</option>
                <option value="University Schema">University Schema (Formal Headings &amp; Strict Layout)</option>
                <option value="Crisp Bulleted">Crisp Bulleted (High-Yield Point-by-Point)</option>
                <option value="Handwriting Friendly">Handwriting-Friendly (Concise for manual writing)</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full md:w-auto bg-[#4f75f2] hover:bg-[#385dd8] text-white px-8 py-3.5 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-white" /> Structuring Exam Answer...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-amber-200" /> Generate {markValue}-Mark Topper Answer
              </>
            )}
          </button>
        </form>
      </div>

      {/* Answer Output View */}
      {generatedAnswer && (
        <div className="bg-white border border-[#e3e6ed] rounded-3xl p-6 md:p-8 space-y-6 shadow-xs animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-[#e3e6ed]">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#3b52c4] bg-[#e4e7fd] px-3 py-1 rounded-full border border-[#d0d8fb] mb-2 inline-block font-bold">
                EXAM-READY MODEL ANSWER ({markValue} MARKS)
              </span>
              <h2 className="text-xl font-extrabold text-[#121217] leading-snug">{questionText}</h2>
              <p className="text-[#6b6f82] text-xs mt-1 font-mono">Format: {formatVariant} • {wordCount} Words</p>
            </div>

            <button
              onClick={handleCopy}
              className="flex items-center gap-2 bg-white hover:bg-[#edf3fc] text-[#4f75f2] border border-[#d0dcf5] px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied' : 'Copy Answer'}
            </button>
          </div>

          <div className="p-6 md:p-8 bg-[#f8f9fc] rounded-2xl border border-[#e3e6ed] select-text">
            <FormattedAnswer content={generatedAnswer} />
          </div>
        </div>
      )}
    </div>
  );
}

