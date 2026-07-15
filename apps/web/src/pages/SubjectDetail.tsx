import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { BookOpen, FileText, LayoutDashboard, BrainCircuit, ArrowLeft, Play, BarChart3, Clock, Loader2, Sparkles, AlertTriangle, FileDown, Plus, HelpCircle } from 'lucide-react';
import { fetchApi } from '../lib/api';

type Subject = {
  id: string;
  name: string;
  code: string;
  examDate?: string;
};

type Resource = {
  id: string;
  name: string;
  fileType?: string;
  url?: string;
  createdAt: string;
};

type Prediction = {
  id: string;
  questionText: string;
  probability: number;
  marks: number;
  unit: string;
  reason?: string;
};

type Flashcard = {
  id: string;
  front: string;
  back: string;
  intervalDays?: number;
};

type Topic = {
  topic: string;
  weakFlag: string;
  weakReason?: string | null;
  confidence?: number;
};

export default function SubjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'resources' | 'pyq' | 'flashcards'>('overview');
  const [loading, setLoading] = useState(true);
  const [loadingTab, setLoadingTab] = useState(false);

  // Live content states
  const [resources, setResources] = useState<Resource[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [weakTopics, setWeakTopics] = useState<Topic[]>([]);
  const [subjectHealth, setSubjectHealth] = useState<number>(75);
  const [estimatedReadiness, setEstimatedReadiness] = useState<number>(50);

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      try {
        const result = await fetchApi('/api/subjects');
        const found = result.subjects?.find((s: Subject) => s.id === id);
        setSubject(found || null);

        // Fetch twin profile details for overview stats
        const twinProfile = await fetchApi(`/api/student-twin/full-profile?subjectId=${id}`);
        setWeakTopics(twinProfile.topics?.weak || []);
        setSubjectHealth(twinProfile.stats?.healthScore ?? 75);
        
        // Fetch study plan/readiness estimate if any
        try {
          const planRes = await fetchApi(`/api/subjects/${id}/study-plan`);
          setEstimatedReadiness(planRes.readinessScore ?? 65);
        } catch {
          setEstimatedReadiness(50 + (twinProfile.topics?.strong?.length || 0) * 8);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  useEffect(() => {
    if (!id || activeTab === 'overview') return;
    async function loadTabContent() {
      setLoadingTab(true);
      try {
        if (activeTab === 'resources') {
          const res = await fetchApi(`/api/resources?subject_id=${id}`);
          setResources(res.resources || []);
        } else if (activeTab === 'pyq') {
          const res = await fetchApi(`/api/subjects/${id}/pyqs/predicted`);
          setPredictions(res.predictions || []);
        } else if (activeTab === 'flashcards') {
          const res = await fetchApi(`/api/subjects/${id}/flashcards`);
          setFlashcards(res.flashcards || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingTab(false);
      }
    }
    loadTabContent();
  }, [id, activeTab]);

  const handleStartSession = async () => {
    try {
      const result = await fetchApi('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectId: id, goalMode: 'study' })
      });
      navigate(`/session/${result.session.id}`);
    } catch (err) {
      console.error(err);
      alert('Failed to start study session. Please verify backend state.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-slate-400">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
        <span className="text-sm font-medium">Assembling subject syllabus details...</span>
      </div>
    );
  }

  if (!subject) {
    return <div className="p-8 text-slate-400">Subject syllabus metadata not found.</div>;
  }

  return (
    <main className="max-w-7xl mx-auto p-6 lg:p-8 space-y-8 font-sans text-slate-100">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-slate-900/40 p-8 rounded-3xl border border-slate-800/80 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl" />
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-slate-300 text-xs font-semibold mb-4">
            <BookOpen className="w-3.5 h-3.5 text-blue-400" />
            {subject.code || 'SUBJ'}
          </div>
          <h2 className="text-4xl font-extrabold text-white tracking-tight mb-2 leading-tight">{subject.name}</h2>
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-slate-500" /> Exam: {subject.examDate ? new Date(subject.examDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD'}</span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium"><BarChart3 className="w-4 h-4" /> {Math.round(Math.min(98, estimatedReadiness))}% Ready</span>
          </div>
        </div>

        <button 
          onClick={handleStartSession}
          className="relative z-10 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all duration-300 transform hover:-translate-y-0.5 flex items-center gap-2 group cursor-pointer"
        >
          <BrainCircuit className="w-5 h-5 group-hover:scale-110 transition-transform" />
          Study Now
        </button>
      </header>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-px">
        {[
          { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
          { id: 'resources', icon: FileText, label: 'Resources' },
          { id: 'pyq', icon: BookOpen, label: 'Past Papers' },
          { id: 'flashcards', icon: BrainCircuit, label: 'Flashcards' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
              activeTab === tab.id 
                ? 'border-blue-500 text-blue-400' 
                : 'border-transparent text-slate-500 hover:text-slate-300 hover:border-slate-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="py-4">
        {loadingTab ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <span className="text-xs font-semibold">Synchronizing library content...</span>
          </div>
        ) : activeTab === 'overview' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-slate-900/40 border border-slate-800/80 p-6 md:p-8 rounded-3xl">
                <h3 className="text-base font-bold text-white mb-6 uppercase tracking-wider flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-500" /> Syllabus Focus Areas
                </h3>
                
                {weakTopics.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6">All topics are currently scoring on-track. Start a quiz session to evaluate weak areas.</p>
                ) : (
                  <div className="space-y-3">
                    {weakTopics.map((topic, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-rose-500/5 rounded-xl border border-rose-500/15 hover:border-rose-500/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-rose-500" />
                          <span className="text-slate-200 font-semibold text-sm">{topic.topic}</span>
                        </div>
                        <span className="text-[10px] text-rose-400 font-semibold bg-rose-500/10 px-2 py-0.5 rounded uppercase">
                          {topic.weakReason || 'Quiz accuracy low'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/20 p-6 md:p-8 rounded-3xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl" />
                
                <h3 className="text-base font-bold text-white mb-2 uppercase tracking-wider">Subject Health</h3>
                <div className="text-4xl font-black text-indigo-400 mb-3">{Math.round(subjectHealth)}%</div>
                <p className="text-xs text-slate-400 leading-relaxed mb-6">Aggregate learning index combining topic mastery, review streaks, and mock quiz outputs.</p>
                
                <Link to="/revision" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer text-xs">
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Review Flashcards
                </Link>
              </div>
            </div>
          </div>
        ) : activeTab === 'resources' ? (
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 md:p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-base font-bold text-white uppercase tracking-wider">Academic Reference Files</h3>
              <button className="flex items-center gap-1 bg-slate-950 border border-slate-800 hover:border-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer">
                <Plus className="w-3.5 h-3.5 text-blue-500" /> Upload Notes
              </button>
            </div>

            {resources.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <FileText className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                <h4 className="text-sm font-bold text-slate-300">No notes linked yet</h4>
                <p className="text-xs mt-1">Upload university slides, text-books, or practical requirements.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {resources.map(file => (
                  <div key={file.id} className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl flex items-center justify-between hover:border-slate-700 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-center shrink-0">
                        <FileText className="w-4.5 h-4.5 text-slate-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-200 truncate max-w-[200px]" title={file.name}>{file.name}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{file.fileType?.toUpperCase() || 'DOCUMENT'} • {new Date(file.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                    {file.url && (
                      <a href={file.url} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer">
                        <FileDown className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : activeTab === 'pyq' ? (
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 md:p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-base font-bold text-white uppercase tracking-wider">Exam Predictions & PYQs</h3>
              <Link to="/pyq" className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1">
                Open Predictor Panel →
              </Link>
            </div>

            {predictions.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <HelpCircle className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                <h4 className="text-sm font-bold text-slate-300">No predictions generated</h4>
                <p className="text-xs mt-1">Upload resource files to auto-extract past exam questions.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {predictions.map(item => (
                  <div key={item.id} className="p-5 bg-slate-950/60 border border-slate-850 rounded-xl hover:border-slate-800 flex flex-col md:flex-row justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[9px] font-bold uppercase">{item.unit}</span>
                        <span className="text-xs text-slate-500 font-semibold">{item.marks} Marks</span>
                      </div>
                      <p className="text-sm text-slate-200 font-medium leading-relaxed">{item.questionText}</p>
                      {item.reason && <p className="text-xs text-slate-500 font-medium italic">{item.reason}</p>}
                    </div>
                    <div className="shrink-0 flex items-center">
                      <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full text-xs font-bold">
                        {Math.round(item.probability * 100)}% Probability
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 md:p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-indigo-400" /> Active Card Queue
              </h3>
              <Link to="/revision" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1">
                Enter Smart Revision Session →
              </Link>
            </div>

            {flashcards.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <BrainCircuit className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                <h4 className="text-sm font-bold text-slate-300">No cards in subject queue</h4>
                <p className="text-xs mt-1">Review sessions will generate flashcards automatically from your notes.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {flashcards.map(card => (
                  <div key={card.id} className="bg-slate-950/60 border border-slate-850 p-5 rounded-xl hover:border-slate-850 flex flex-col justify-between min-h-[120px]">
                    <div className="text-sm font-semibold text-slate-200 leading-relaxed">{card.front}</div>
                    <div className="text-[10px] text-slate-500 mt-4 font-semibold uppercase">
                      Recall Stability: {card.intervalDays ? `${card.intervalDays}d` : 'New card'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
