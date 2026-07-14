import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { BookOpen, FileText, LayoutDashboard, BrainCircuit, ArrowLeft, Play, BarChart3, Clock } from 'lucide-react';
import { fetchApi } from '../lib/api';

type Subject = {
  id: string;
  name: string;
  code: string;
  examDate?: string;
};

export default function SubjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'resources' | 'pyq' | 'flashcards'>('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const { data } = await fetchApi('/api/subjects');
        const found = data?.find((s: Subject) => s.id === id);
        setSubject(found || null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const handleStartSession = async () => {
    try {
      // Create session in API
      const { data } = await fetchApi('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectId: id, goalMode: 'study' })
      });
      navigate(`/session/${data.id}`);
    } catch (err) {
      console.error(err);
      alert('Failed to start session. Is backend running?');
    }
  };

  if (loading) {
    return <div className="p-8 text-slate-400">Loading subject...</div>;
  }

  if (!subject) {
    return <div className="p-8 text-slate-400">Subject not found.</div>;
  }

  return (
    <main className="max-w-7xl mx-auto p-6 lg:p-8 space-y-8 font-sans">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-slate-900/50 p-8 rounded-3xl border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl" />
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-sm font-medium border border-slate-700 mb-4">
            <BookOpen className="w-4 h-4" />
            {subject.code || 'SUBJ'}
          </div>
          <h2 className="text-4xl font-bold text-white tracking-tight mb-2">{subject.name}</h2>
          <div className="flex items-center gap-4 text-sm text-slate-400">
            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> Exam: {subject.examDate ? new Date(subject.examDate).toLocaleDateString() : 'TBD'}</span>
            <span className="flex items-center gap-1.5 text-emerald-400"><BarChart3 className="w-4 h-4" /> 45% Ready</span>
          </div>
        </div>

        <button 
          onClick={handleStartSession}
          className="relative z-10 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-8 py-3 rounded-xl font-semibold shadow-lg shadow-blue-500/25 transition-all duration-300 transform hover:-translate-y-0.5 flex items-center gap-2 group"
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
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id 
                ? 'border-blue-500 text-blue-400' 
                : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="py-4">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                <h3 className="text-lg font-bold text-white mb-4">Weak Topics to Review</h3>
                <div className="space-y-3">
                  {['A* Search Algorithm', 'Alpha-Beta Pruning', 'Fuzzy Logic'].map((topic, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-slate-950/50 rounded-xl border border-slate-800/50 hover:border-red-500/30 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        <span className="text-slate-200 font-medium">{topic}</span>
                      </div>
                      <span className="text-xs text-slate-500">Failed last 2 quizzes</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900 p-6 rounded-2xl border border-indigo-500/20">
                <h3 className="text-lg font-bold text-white mb-2">Next Revision</h3>
                <p className="text-sm text-slate-400 mb-6">You have 12 flashcards due for review today.</p>
                <button className="w-full bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                  <Play className="w-4 h-4 fill-current" />
                  Start Revision
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab !== 'overview' && (
          <div className="text-center py-20 bg-slate-900/30 rounded-2xl border border-slate-800 border-dashed">
            <BrainCircuit className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-300">Feature Coming Soon</h3>
            <p className="text-slate-500 mt-1">This section is being wired up to the API.</p>
          </div>
        )}
      </div>

    </main>
  );
}
