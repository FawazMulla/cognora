import { useEffect, useState } from 'react';
import { BookOpen, FileText, TrendingUp, Filter, AlertTriangle, Sparkles, Loader2, X, GraduationCap, Award, Copy, Check } from 'lucide-react';
import { fetchApi } from '../lib/api';
import { getDefaultSubjects, generatePYQDataAI, generateStructuredAnswerAI } from '../lib/ai-service';
import { FormattedAnswer } from '../components/FormattedAnswer';

type Subject = {
  id: string;
  name: string;
  code?: string;
  type?: string;
};

type Prediction = {
  id: string;
  questionText: string;
  probability: number;
  reason: string;
  marks: number;
  unit: string;
};

type HeatmapItem = {
  topic: string;
  count: number;
  totalMarks: number;
  percentage: number;
  priority: string;
};

export default function PYQIntelligence() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [heatmap, setHeatmap] = useState<HeatmapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAnswers, setLoadingAnswers] = useState<Record<string, boolean>>({});
  const [activeAnswer, setActiveAnswer] = useState<{ question: string; answer: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Load subjects
  useEffect(() => {
    async function loadSubjects() {
      // Helper: keep only theory subjects (exclude labs)
      const theoryOnly = (list: Subject[]) =>
        list.filter(s => s.type !== 'Lab' && !s.name.toLowerCase().includes('lab'));

      const defaults = theoryOnly(getDefaultSubjects());
      try {
        const res = await fetchApi('/api/subjects');
        if (res.subjects && res.subjects.length > 0) {
          const theory = theoryOnly(res.subjects);
          if (theory.length > 0) {
            setSubjects(theory);
            setSelectedSubjectId(theory[0].id);
            return;
          }
        }
      } catch (err) {
        console.warn("Backend subjects lookup warning:", err);
      }
      setSubjects(defaults);
      setSelectedSubjectId(defaults[0]?.id || '');
    }
    loadSubjects();
  }, []);

  // Load subject-specific PYQ details
  useEffect(() => {
    if (!selectedSubjectId) return;

    async function loadSubjectData() {
      setLoading(true);
      const selectedSub = subjects.find(s => s.id === selectedSubjectId);
      const defaultData = generatePYQDataAI(selectedSub?.name || 'Computer Science');

      try {
        const [predRes, heatRes] = await Promise.all([
          fetchApi(`/api/subjects/${selectedSubjectId}/pyqs/predicted`),
          fetchApi(`/api/subjects/${selectedSubjectId}/pyqs/heatmap`)
        ]);
        setPredictions(predRes.predictions?.length > 0 ? predRes.predictions : defaultData.predictions);
        setHeatmap(heatRes.heatmap?.length > 0 ? heatRes.heatmap : defaultData.heatmap);
      } catch {
        setPredictions(defaultData.predictions);
        setHeatmap(defaultData.heatmap);
      } finally {
        setLoading(false);
      }
    }

    loadSubjectData();
  }, [selectedSubjectId, subjects]);

  const handleGenerateAnswer = async (q: Prediction) => {
    setLoadingAnswers(prev => ({ ...prev, [q.id]: true }));
    const selectedSub = subjects.find(s => s.id === selectedSubjectId);

    try {
      const res = await fetchApi('/api/answers/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q.questionText,
          markValue: q.marks,
          format: 'Topper Standard',
          subjectId: selectedSubjectId,
          topic: q.unit
        })
      });
      if (res && res.answer) {
        setActiveAnswer({ question: q.questionText, answer: res.answer });
        setLoadingAnswers(prev => ({ ...prev, [q.id]: false }));
        return;
      }
    } catch {
      // fallback to AI generator
    }

    const answer = await generateStructuredAnswerAI(q.questionText, q.marks, 'Topper Standard', selectedSub?.name || '');
    setActiveAnswer({
      question: q.questionText,
      answer: answer
    });
    setLoadingAnswers(prev => ({ ...prev, [q.id]: false }));
  };

  const selectedSubject = subjects.find(s => s.id === selectedSubjectId);

  const handleCopy = () => {
    if (!activeAnswer) return;
    navigator.clipboard.writeText(activeAnswer.answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 font-sans text-[#2d2d34] bg-[#f8f9fc] min-h-screen">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-2 border-b border-[#e3e6ed]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-[#4f75f2] animate-pulse" />
            <span className="text-[11px] font-mono tracking-widest text-[#6b6f82] uppercase font-bold">
              Predictive Paper Analytics
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#121217] tracking-tight">
            PYQ Intelligence
          </h1>
          <p className="text-xs md:text-sm text-[#6b6f82] mt-1 font-sans">
            AI-driven paper analysis, prediction probability mapping, and topper-standard answer generation.
          </p>
        </div>
        
        {subjects.length > 0 && (
          <div className="flex items-center gap-2 bg-white border border-[#e3e6ed] rounded-2xl p-1.5 shadow-xs">
            <Filter className="w-3.5 h-3.5 text-[#8c8fa1] ml-2" />
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="bg-transparent text-[#121217] outline-none text-xs font-bold pr-3 cursor-pointer"
            >
              {subjects.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-[#6b6f82] font-mono text-xs uppercase">
          <Loader2 className="w-6 h-6 text-[#4f75f2] animate-spin" />
          <span>Analyzing Historical University Papers...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Predicted Questions Panel */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-[#e3e6ed] rounded-3xl p-6 md:p-8 shadow-xs">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h2 className="text-sm font-extrabold text-[#121217] uppercase tracking-wider flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#4f75f2]" />
                    Upcoming Exam Predictions
                  </h2>
                  <p className="text-xs text-[#6b6f82] font-sans mt-0.5">High probability questions ranked by recurrence and syllabus weightage.</p>
                </div>
                <span className="text-[10px] font-mono font-bold bg-[#edf3fc] text-[#4f75f2] px-3 py-1 rounded-xl border border-[#d0dcf5] uppercase">
                  {selectedSubject?.code || 'CS-701'} Model
                </span>
              </div>

              {predictions.length === 0 ? (
                <div className="text-center py-10 text-[#8c8fa1] text-xs font-mono">No predictions computed.</div>
              ) : (
                <div className="space-y-4">
                  {predictions.map((item) => (
                    <div key={item.id} className="p-5 bg-[#f8f9fc] rounded-2xl border border-[#e3e6ed] hover:border-[#4f75f2] transition-all">
                      <div className="flex justify-between items-start gap-4 mb-3">
                        <p className="text-[#121217] font-bold text-xs md:text-sm leading-relaxed">
                          {item.questionText}
                        </p>
                        <div className="bg-[#e2f6eb] text-[#1f7247] border border-[#c9eed9] px-2.5 py-1 rounded-xl text-xs font-mono font-bold shrink-0">
                          {Math.round(item.probability * 100)}% Probability
                        </div>
                      </div>
                      
                      <div className="bg-white px-3.5 py-2.5 rounded-xl border border-[#e3e6ed] mb-3 text-[11px] text-[#6b6f82] flex items-start gap-2 font-sans">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <span>{item.reason}</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs border-t border-[#e3e6ed] pt-3">
                        <span className="text-[10px] font-mono text-[#121217] font-bold flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5 text-[#4f75f2]" /> {item.marks} Marks
                        </span>
                        <span className="bg-[#edf3fc] border border-[#d0dcf5] text-[#4f75f2] px-2 py-0.5 rounded-lg text-[9px] font-mono uppercase font-bold">{item.unit}</span>
                        
                        <button
                          disabled={loadingAnswers[item.id]}
                          onClick={() => handleGenerateAnswer(item)}
                          className="ml-auto bg-[#4f75f2] hover:bg-[#385dd8] text-white px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
                        >
                          {loadingAnswers[item.id] ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Drafting...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3 h-3 text-amber-200" />
                              Draft Model Answer
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Topic Heatmap Panel */}
          <div className="space-y-6">
            <div className="bg-white border border-[#e3e6ed] rounded-3xl p-6 md:p-8 shadow-xs">
              <div className="mb-5">
                <h3 className="text-xs font-mono font-bold text-[#121217] uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#4f75f2]" />
                  Syllabus Heatmap
                </h3>
                <p className="text-xs text-[#6b6f82] mt-0.5 font-sans">Weightage metrics aggregated across 5 years of exam papers.</p>
              </div>

              {heatmap.length === 0 ? (
                <div className="text-center py-10 text-[#8c8fa1] text-xs font-mono">No frequency data calculated.</div>
              ) : (
                <div className="space-y-5">
                  {heatmap.map((topic, i) => (
                    <div key={i} className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-[#121217] font-bold truncate max-w-[180px]">{topic.topic}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-lg uppercase border ${
                            topic.priority === 'High Yield' || topic.priority === 'High'
                              ? 'bg-[#fbf5e6] text-[#967018] border-[#f4e8cc]'
                              : 'bg-[#edf3fc] text-[#4f75f2] border-[#d0dcf5]'
                          }`}>
                            {topic.priority}
                          </span>
                          <span className="text-[#121217] font-mono font-bold">{topic.percentage}%</span>
                        </div>
                      </div>
                      <div className="h-2 bg-[#f0f2f7] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-[#4f75f2] to-[#713fb8] rounded-full transition-all duration-700"
                          style={{ width: `${topic.percentage}%` }} 
                        />
                      </div>
                      <div className="flex justify-between text-[10px] font-mono text-[#8c8fa1]">
                        <span>{topic.count} questions extracted</span>
                        <span>Total: {topic.totalMarks} Marks</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Answer Modal */}
      {activeAnswer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white border border-[#e3e6ed] w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] relative animate-in fade-in zoom-in duration-200">
            <header className="p-6 border-b border-[#e3e6ed] bg-[#f8f9fc] flex justify-between items-start gap-4">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#3b52c4] bg-[#e4e7fd] border border-[#d0d8fb] px-3 py-1 rounded-full mb-2 inline-block">
                  Topper Model Answer
                </span>
                <h3 className="text-base font-extrabold text-[#121217] leading-snug">{activeAnswer.question}</h3>
              </div>
              <button 
                onClick={() => setActiveAnswer(null)}
                className="text-[#6b6f82] hover:text-[#121217] p-2 rounded-xl hover:bg-[#edf3fc] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </header>
            
            <div className="p-6 md:p-8 overflow-y-auto space-y-4 select-text bg-[#ffffff]">
              <FormattedAnswer content={activeAnswer.answer} />
            </div>

            <footer className="p-4 bg-[#f8f9fc] border-t border-[#e3e6ed] flex justify-between items-center">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs font-bold text-[#4f75f2] hover:text-[#385dd8] cursor-pointer bg-white px-4 py-2 rounded-xl border border-[#d0dcf5] shadow-xs"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Answer'}</span>
              </button>
              <button 
                onClick={() => setActiveAnswer(null)}
                className="bg-[#4f75f2] hover:bg-[#385dd8] text-white px-6 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                Close
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
