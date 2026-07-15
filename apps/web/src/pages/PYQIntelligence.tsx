import { useEffect, useState } from 'react';
import { BookOpen, FileText, TrendingUp, Filter, AlertTriangle, Sparkles, Loader2, X, GraduationCap } from 'lucide-react';
import { fetchApi } from '../lib/api';

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

  // Load subjects
  useEffect(() => {
    async function loadSubjects() {
      try {
        const res = await fetchApi('/api/subjects');
        if (res.subjects && res.subjects.length > 0) {
          setSubjects(res.subjects);
          setSelectedSubjectId(res.subjects[0].id);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("Error loading subjects:", err);
        setLoading(false);
      }
    }
    loadSubjects();
  }, []);

  // Load subject-specific PYQ details
  useEffect(() => {
    if (!selectedSubjectId) return;

    async function loadSubjectData() {
      setLoading(true);
      try {
        const [predRes, heatRes] = await Promise.all([
          fetchApi(`/api/subjects/${selectedSubjectId}/pyqs/predicted`),
          fetchApi(`/api/subjects/${selectedSubjectId}/pyqs/heatmap`)
        ]);
        setPredictions(predRes.predictions || []);
        setHeatmap(heatRes.heatmap || []);
      } catch (err) {
        console.error("Error loading subject PYQ data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadSubjectData();
  }, [selectedSubjectId]);

  const handleGenerateAnswer = async (q: Prediction) => {
    setLoadingAnswers(prev => ({ ...prev, [q.id]: true }));
    try {
      const res = await fetchApi('/api/answers/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q.questionText,
          markValue: q.marks,
          format: 'Standard',
          subjectId: selectedSubjectId,
          topic: q.unit
        })
      });
      setActiveAnswer({
        question: q.questionText,
        answer: res.answer
      });
    } catch (err) {
      console.error("Error generating answer:", err);
      alert("Failed to generate model answer. Please check if backend is running.");
    } finally {
      setLoadingAnswers(prev => ({ ...prev, [q.id]: false }));
    }
  };

  const selectedSubject = subjects.find(s => s.id === selectedSubjectId);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-10 font-sans text-slate-100 min-h-screen">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight flex items-center gap-3 bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
            <BookOpen className="w-9 h-9 text-blue-500" />
            PYQ Intelligence
          </h1>
          <p className="text-slate-400 mt-2 text-sm md:text-base">
            AI-driven paper analysis, prediction mapping, and topper-standard answer generation.
          </p>
        </div>
        
        {subjects.length > 0 && (
          <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-2.5 shadow-xl">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="bg-transparent text-slate-200 outline-none text-sm font-medium pr-8 cursor-pointer"
            >
              {subjects.map(s => (
                <option key={s.id} value={s.id} className="bg-slate-950 text-slate-300">
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </header>

      {subjects.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/30 rounded-3xl border border-slate-800/80 border-dashed">
          <GraduationCap className="w-16 h-16 text-slate-600 mx-auto mb-4 animate-bounce" />
          <h3 className="text-xl font-semibold text-slate-300">No Subjects Active</h3>
          <p className="text-slate-500 mt-2 max-w-md mx-auto text-sm">
            Complete your onboarding or add a subject in the dashboard first to configure intelligence feeds.
          </p>
        </div>
      ) : loading ? (
        <div className="flex flex-col items-center justify-center py-40 gap-4 text-slate-400">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
          <span className="text-sm font-medium tracking-wide">Analyzing historical papers...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Predicted Questions Panel */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 md:p-8 backdrop-blur-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl" />
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 relative z-10">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-indigo-400" />
                  Upcoming Predictions
                </h2>
                <span className="text-xs bg-slate-800 text-slate-300 px-4 py-2 rounded-full font-semibold border border-slate-700/50">
                  Model: {selectedSubject?.code || 'CS'} Syllabus Prioritizer
                </span>
              </div>

              {predictions.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-sm">No predictions computed.</div>
              ) : (
                <div className="space-y-4 relative z-10">
                  {predictions.map((item) => (
                    <div key={item.id} className="p-5 md:p-6 bg-slate-950/60 rounded-2xl border border-slate-800/60 hover:border-slate-700/80 transition-all group">
                      <div className="flex justify-between items-start gap-4 mb-4">
                        <p className="text-slate-200 font-medium leading-relaxed text-sm md:text-base">
                          {item.questionText}
                        </p>
                        <div className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1.5 rounded-full text-xs font-bold shrink-0">
                          {Math.round(item.probability * 100)}% Probability
                        </div>
                      </div>
                      
                      <div className="bg-slate-900/40 px-4 py-3 rounded-xl border border-slate-800/40 mb-4 text-xs text-slate-400 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <span>{item.reason}</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 border-t border-slate-800/50 pt-4">
                        <span className="flex items-center gap-1.5"><FileText className="w-4 h-4 text-slate-500" /> {item.marks} Marks</span>
                        <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px] uppercase font-bold">{item.unit}</span>
                        
                        <button
                          disabled={loadingAnswers[item.id]}
                          onClick={() => handleGenerateAnswer(item)}
                          className="ml-auto text-blue-400 hover:text-blue-300 font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {loadingAnswers[item.id] ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5" />
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
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 md:p-8 backdrop-blur-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl" />
              
              <div className="relative z-10 mb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  Syllabus Heatmap
                </h3>
                <p className="text-sm text-slate-400 mt-1">Weightage metrics aggregated across past papers.</p>
              </div>

              {heatmap.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-sm">No frequency data calculated.</div>
              ) : (
                <div className="space-y-6 relative z-10">
                  {heatmap.map((topic, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-300 font-medium truncate max-w-[200px]">{topic.topic}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                            topic.priority === 'High' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                            topic.priority === 'Medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                            'bg-slate-800 text-slate-400 border border-slate-700/50'
                          }`}>
                            {topic.priority}
                          </span>
                          <span className="text-slate-400 font-semibold">{topic.percentage}%</span>
                        </div>
                      </div>
                      <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800/40">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 bg-gradient-to-r ${
                            topic.priority === 'High' ? 'from-red-500 to-rose-500' :
                            topic.priority === 'Medium' ? 'from-amber-500 to-yellow-500' :
                            'from-blue-500 to-indigo-500'
                          }`}
                          style={{ width: `${topic.percentage}%` }} 
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                        <span>{topic.count} questions extracted</span>
                        <span>Total Marks: {topic.totalMarks}</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] relative animate-in fade-in zoom-in duration-200">
            <header className="p-6 border-b border-slate-800 flex justify-between items-start gap-4">
              <div>
                <span className="text-[10px] font-bold tracking-widest text-blue-500 uppercase bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20 mb-2 inline-block">
                  AI Model Answer
                </span>
                <h3 className="text-lg font-bold text-white leading-snug">{activeAnswer.question}</h3>
              </div>
              <button 
                onClick={() => setActiveAnswer(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </header>
            
            <div className="p-6 overflow-y-auto space-y-4 text-slate-300 leading-relaxed text-sm md:text-base select-text whitespace-pre-wrap">
              {activeAnswer.answer}
            </div>

            <footer className="p-4 bg-slate-950/50 border-t border-slate-800 flex justify-end gap-3">
              <button 
                onClick={() => setActiveAnswer(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-6 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
              >
                Close Answer
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
