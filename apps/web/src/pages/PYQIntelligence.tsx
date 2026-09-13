import { useEffect, useState } from 'react';
import { BookOpen, FileText, TrendingUp, Filter, AlertTriangle, Sparkles, Loader2, X, GraduationCap, Award, Copy, Check } from 'lucide-react';
import { fetchApi } from '../lib/api';
import { getDefaultSubjects, generatePYQDataAI, generateStructuredAnswerAI } from '../lib/ai-service';

type Subject = {
  id: string;
  name: string;
  code?: string;
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
      const defaults = getDefaultSubjects();
      try {
        const res = await fetchApi('/api/subjects');
        if (res.subjects && res.subjects.length > 0) {
          setSubjects(res.subjects);
          setSelectedSubjectId(res.subjects[0].id);
          return;
        }
      } catch (err) {
        console.warn("Backend subjects lookup warning:", err);
      }
      setSubjects(defaults);
      setSelectedSubjectId(defaults[0].id);
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
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 font-sans text-[#212121] bg-white min-h-screen">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-[#d9d9dd]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#f1f5ff] border border-[#d0dcf5] text-[#1863dc] text-[9px] font-mono font-bold tracking-wider uppercase rounded mb-2">
            <BookOpen className="w-3 h-3 text-[#1863dc]" /> Predictive Paper Analytics
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-light text-black tracking-tight uppercase">
            PYQ Intelligence
          </h1>
          <p className="text-[#75758a] mt-1 text-xs">
            AI-driven paper analysis, prediction probability mapping, and topper-standard answer generation.
          </p>
        </div>
        
        {subjects.length > 0 && (
          <div className="flex items-center gap-2 bg-white border border-[#d9d9dd] rounded-full px-4 py-2">
            <Filter className="w-3.5 h-3.5 text-[#75758a]" />
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="bg-transparent text-black outline-none text-xs font-mono font-bold cursor-pointer"
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
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-[#75758a] font-mono text-xs uppercase">
          <Loader2 className="w-6 h-6 text-black animate-spin" />
          <span>Analyzing Historical University Papers...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Predicted Questions Panel */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-[#d9d9dd] rounded-2xl p-6 md:p-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h2 className="text-sm font-bold font-mono text-black uppercase tracking-wider flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#1863dc]" />
                    Upcoming Exam Predictions
                  </h2>
                  <p className="text-xs text-[#75758a] font-sans mt-0.5">High probability questions ranked by recurrence and syllabus weightage.</p>
                </div>
                <span className="text-[10px] font-mono font-bold bg-[#eeece7] text-[#212121] px-3 py-1 rounded-full border border-[#d9d9dd] uppercase">
                  {selectedSubject?.code || 'CS-701'} Model
                </span>
              </div>

              {predictions.length === 0 ? (
                <div className="text-center py-10 text-[#75758a] text-xs font-mono">No predictions computed.</div>
              ) : (
                <div className="space-y-4">
                  {predictions.map((item) => (
                    <div key={item.id} className="p-5 bg-[#eeece7]/40 rounded-xl border border-[#d9d9dd] hover:border-black transition-all">
                      <div className="flex justify-between items-start gap-4 mb-3">
                        <p className="text-black font-medium text-xs md:text-sm leading-relaxed">
                          {item.questionText}
                        </p>
                        <div className="bg-[#edfce9] text-[#003c33] border border-[#ccebc5] px-2.5 py-1 rounded-full text-xs font-mono font-bold shrink-0">
                          {Math.round(item.probability * 100)}% Probability
                        </div>
                      </div>
                      
                      <div className="bg-white px-3.5 py-2.5 rounded border border-[#d9d9dd] mb-3 text-[11px] text-[#75758a] flex items-start gap-2 font-sans">
                        <AlertTriangle className="w-3.5 h-3.5 text-[#ff7759] shrink-0 mt-0.5" />
                        <span>{item.reason}</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs border-t border-[#d9d9dd] pt-3">
                        <span className="text-[10px] font-mono text-black font-bold flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5 text-[#75758a]" /> {item.marks} Marks
                        </span>
                        <span className="bg-white border border-[#d9d9dd] text-black px-2 py-0.5 rounded text-[9px] font-mono uppercase font-bold">{item.unit}</span>
                        
                        <button
                          disabled={loadingAnswers[item.id]}
                          onClick={() => handleGenerateAnswer(item)}
                          className="ml-auto bg-black hover:bg-zinc-800 text-white px-4 py-1.5 rounded-full text-[10px] font-mono uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {loadingAnswers[item.id] ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Drafting...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3 h-3 text-[#ff7759]" />
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
            <div className="bg-white border border-[#d9d9dd] rounded-2xl p-6 md:p-8">
              <div className="mb-5">
                <h3 className="text-xs font-mono font-bold text-black uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#ff7759]" />
                  Syllabus Heatmap
                </h3>
                <p className="text-xs text-[#75758a] mt-0.5 font-sans">Weightage metrics aggregated across 5 years of exam papers.</p>
              </div>

              {heatmap.length === 0 ? (
                <div className="text-center py-10 text-[#75758a] text-xs font-mono">No frequency data calculated.</div>
              ) : (
                <div className="space-y-5">
                  {heatmap.map((topic, i) => (
                    <div key={i} className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-black font-medium truncate max-w-[180px]">{topic.topic}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${
                            topic.priority === 'High Yield' || topic.priority === 'High' ? 'bg-[#fff1ed] text-[#ff7759] border border-[#ffdad0]' :
                            'bg-[#eeece7] text-[#212121] border border-[#d9d9dd]'
                          }`}>
                            {topic.priority}
                          </span>
                          <span className="text-black font-mono font-bold">{topic.percentage}%</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-[#eeece7] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-black rounded-full transition-all duration-700"
                          style={{ width: `${topic.percentage}%` }} 
                        />
                      </div>
                      <div className="flex justify-between text-[10px] font-mono text-[#75758a]">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white border border-[#d9d9dd] w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] relative animate-in fade-in zoom-in duration-200">
            <header className="p-6 border-b border-[#d9d9dd] flex justify-between items-start gap-4">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#1863dc] bg-[#f1f5ff] border border-[#d0dcf5] px-2.5 py-0.5 rounded mb-2 inline-block">
                  Topper Model Answer
                </span>
                <h3 className="text-base font-display font-bold text-black leading-snug">{activeAnswer.question}</h3>
              </div>
              <button 
                onClick={() => setActiveAnswer(null)}
                className="text-[#75758a] hover:text-black p-1.5 rounded-full hover:bg-[#eeece7] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </header>
            
            <div className="p-6 overflow-y-auto space-y-4 text-[#212121] leading-relaxed text-xs md:text-sm select-text whitespace-pre-wrap font-sans bg-[#ffffff]">
              {activeAnswer.answer}
            </div>

            <footer className="p-4 bg-[#eeece7] border-t border-[#d9d9dd] flex justify-between items-center">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-black hover:text-[#1863dc] cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#003c33]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Answer'}</span>
              </button>
              <button 
                onClick={() => setActiveAnswer(null)}
                className="bg-black hover:bg-zinc-800 text-white px-5 py-2 rounded-full text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer"
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
