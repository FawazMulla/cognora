import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Activity, Search, Flame, Target, Clock, Sparkles, BrainCircuit, Loader2, ChevronRight, Zap, PlayCircle, X, Layers, FileText, HelpCircle, Award, Edit3, Check } from 'lucide-react';
import { fetchApi } from '../lib/api';
import { getDefaultSubjects } from '../lib/ai-service';
import { getLastNavigationState, type NavigationState } from '../lib/navigation-tracker';

type Subject = { id: string; name: string; code?: string; examDate?: string; progress?: number; type?: string };
type HealthData = { healthScore: number; updatedAt: string };
type Session = { id: string; goalMode?: string; startedAt: string; subjectId?: string };

export default function Dashboard() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [aiTip, setAiTip] = useState<string>('');
  const [lastNav, setLastNav] = useState<NavigationState | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'All' | 'Theory' | 'Labs'>('All');



  // Add Subject Modal State
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectDate, setNewSubjectDate] = useState('');
  const [addSubjectLoading, setAddSubjectLoading] = useState(false);
  const [addSubjectError, setAddSubjectError] = useState('');

  // Offline Solvers State
  const [solverType, setSolverType] = useState<'complexity' | 'bayes' | 'spaced'>('complexity');
  const [complexityExpr, setComplexityExpr] = useState('3n^2 + 5n + 12');
  const [complexityResult, setComplexityResult] = useState<{ dominant: string, explanation: string, expression: string } | null>(null);

  const [bayesPrior, setBayesPrior] = useState('0.01');
  const [bayesSensitivity, setBayesSensitivity] = useState('0.95');
  const [bayesFalseAlarm, setBayesFalseAlarm] = useState('0.05');
  const [bayesResult, setBayesResult] = useState<{ posterior: string, formula: string, explanation: string } | null>(null);

  const [spacedInterval, setSpacedInterval] = useState('4');
  const [spacedEase, setSpacedEase] = useState('2.5');
  const [spacedRating, setSpacedRating] = useState('4');
  const [spacedResult, setSpacedResult] = useState<{ nextInterval: string, newEase: string, explanation: string } | null>(null);

  const solveComplexity = () => {
    const expr = complexityExpr.toLowerCase().trim();
    let dominant = 'O(1)';
    let explanation = '';

    if (expr.includes('n^3')) {
      dominant = 'O(n^3)';
      explanation = 'The cubic term n^3 dominates quadratic, linear, and constant terms.';
    } else if (expr.includes('n^2')) {
      dominant = 'O(n^2)';
      explanation = 'The quadratic term n^2 dominates linear and constant terms.';
    } else if (expr.includes('n log n') || (expr.includes('n') && expr.includes('log'))) {
      dominant = 'O(n log n)';
      explanation = 'The linearithmic term n log n dominates linear and log terms.';
    } else if (expr.includes('2^n')) {
      dominant = 'O(2^n)';
      explanation = 'The exponential term 2^n dominates polynomial terms.';
    } else if (expr.includes('n')) {
      dominant = 'O(n)';
      explanation = 'The linear term n dominates constant terms.';
    } else if (expr.includes('log')) {
      dominant = 'O(log n)';
      explanation = 'The logarithmic term log n dominates constant terms.';
    } else {
      dominant = 'O(1)';
      explanation = 'The expression contains only constants, resulting in constant time complexity.';
    }

    setComplexityResult({ dominant, explanation, expression: complexityExpr });
  };

  const solveBayes = () => {
    const p = parseFloat(bayesPrior);
    const s = parseFloat(bayesSensitivity);
    const f = parseFloat(bayesFalseAlarm);

    if (isNaN(p) || isNaN(s) || isNaN(f)) return;

    const posterior = (s * p) / (s * p + f * (1 - p));

    setBayesResult({
      posterior: (posterior * 100).toFixed(2) + '%',
      formula: `P(H|E) = (${s} * ${p}) / (${s} * ${p} + ${f} * ${1 - p})`,
      explanation: `Prior probability was ${p * 100}%. With positive evidence (sensitivity ${s * 100}%, false alarm rate ${f * 100}%), probability is adjusted to ${(posterior * 100).toFixed(2)}%.`
    });
  };

  const solveSpaced = () => {
    const interval = parseFloat(spacedInterval);
    const ease = parseFloat(spacedEase);
    const rating = parseInt(spacedRating);

    if (isNaN(interval) || isNaN(ease) || isNaN(rating)) return;

    let newEase = ease;
    let newInterval = 1;

    if (rating >= 3) {
      if (interval === 0) {
        newInterval = 1;
      } else if (interval === 1) {
        newInterval = 6;
      } else {
        newInterval = Math.round(interval * ease);
      }
      newEase = ease + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02));
    } else {
      newInterval = 1;
      newEase = Math.max(1.3, ease - 0.2);
    }

    setSpacedResult({
      nextInterval: `${newInterval} days`,
      newEase: newEase.toFixed(2),
      explanation: `SM-2 Formula: Interval = prevInterval * easeFactor. Since quality was ${rating}/5, ease factor adjusted from ${ease} to ${newEase.toFixed(2)}.`
    });
  };



  const handleAddSubjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) {
      setAddSubjectError('Subject name is required.');
      return;
    }
    setAddSubjectLoading(true);
    setAddSubjectError('');
    try {
      await fetchApi('/api/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newSubjectName.trim(),
          examDate: newSubjectDate || undefined
        })
      });
      setShowAddSubject(false);
      setNewSubjectName('');
      setNewSubjectDate('');
      
      // Reload subjects
      const subjectsRes = await fetchApi('/api/subjects');
      setSubjects(subjectsRes.subjects || []);
    } catch (err: any) {
      console.error('Add subject error:', err);
      setAddSubjectError(err.message || 'Failed to add subject.');
    } finally {
      setAddSubjectLoading(false);
    }
  };

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      try {
        const [subjectsRes, healthRes, sessionsRes] = await Promise.allSettled([
          fetchApi('/api/subjects'),
          fetchApi('/api/analytics/health'),
          fetchApi('/api/sessions')
        ]);

        let loadedSubjs: Subject[] = [];
        const defaultSubs = getDefaultSubjects();
        if (subjectsRes.status === 'fulfilled' && Array.isArray(subjectsRes.value?.subjects) && subjectsRes.value.subjects.length > 0) {
          const apiSubs: Subject[] = subjectsRes.value.subjects;
          // Merge defaults with API subjects: keep API subjects, but ensure all core defaults exist
          const map = new Map<string, Subject>();
          defaultSubs.forEach(s => map.set(s.id, s));
          apiSubs.forEach(s => map.set(s.id, { ...map.get(s.id), ...s }));
          loadedSubjs = Array.from(map.values());
        } else {
          loadedSubjs = defaultSubs;
        }

        setSubjects(loadedSubjs);
        if (healthRes.status === 'fulfilled') setHealth(healthRes.value);
        if (sessionsRes.status === 'fulfilled') setSessions((sessionsRes.value?.sessions || []).slice(0, 3));
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();

    const tips = [
      '🧠 Your retention drops 50% after 1 day without review. Hit your flashcard queue first.',
      '📈 Students who do PYQs score 23% higher on average. Try the PYQ Intelligence tab.',
      '🎯 Spaced repetition is 6x more effective than rereading. Use Smart Revision daily.',
      '💡 Weak topics answered in Viva mode improve 3x faster than passive reading.',
      '⚡ Study sessions under 90 minutes have higher recall rates. Take breaks!'
    ];
    setAiTip(tips[Math.floor(Math.random() * tips.length)]);
    getLastNavigationState().then(nav => { if (nav && nav.pagePath && nav.pagePath !== '/') setLastNav(nav); });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowAddSubject(false);
        setAddSubjectError('');
        setNewSubjectName('');
        setNewSubjectDate('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);



  const getExamDays = (examDate?: string): number | null => {
    if (!examDate) return null;
    const days = Math.ceil((new Date(examDate).getTime() - Date.now()) / 86400000);
    return days > 0 ? days : 0;
  };

  const statusColor = (progress: number) => {
    if (progress >= 70) return { bar: 'from-emerald-500 to-teal-500', label: 'text-emerald-600 bg-emerald-50 border-emerald-100/50', text: 'On Track' };
    if (progress >= 40) return { bar: 'from-amber-500 to-yellow-500', label: 'text-amber-600 bg-amber-50 border-amber-100/50', text: 'Needs Focus' };
    return { bar: 'from-rose-500 to-red-500', label: 'text-rose-600 bg-rose-50 border-rose-100/50', text: 'At Risk' };
  };

  const filteredSubjects = subjects.filter(s => {
    const matchesSearch = searchQuery === '' || 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.code || '').toLowerCase().includes(searchQuery.toLowerCase());

    const isLab = s.name.toLowerCase().includes('lab') || s.type === 'Lab';
    const matchesCategory = 
      categoryFilter === 'All' ? true :
      categoryFilter === 'Labs' ? isLab :
      !isLab; // Theory

    return matchesSearch && matchesCategory;
  });

  const healthScore = health?.healthScore ?? 72;

  const [activeGoalMode, setActiveGoalMode] = useState<string>('IAE Mode');

  const goalModes = [
    { mode: 'Study Mode', desc: 'Concept learning & syllabus mastery' },
    { mode: 'IAE Mode', desc: 'Internal Assessment Exam (2M/5M/10M notes)' },
    { mode: 'Exam Mode', desc: 'Topper answers & predicted PYQs' },
    { mode: 'Crash Course Mode', desc: 'Last-night emergency cramming' },
  ];

  const quickActions = [
    { label: 'Syllabus & Units', icon: Layers, href: '/syllabus', color: 'text-[#1863dc]', bg: 'bg-[#f1f5ff] border-[#d0dcf5] hover:border-[#1863dc]' },
    { label: 'IAE & Exam Notes', icon: FileText, href: '/exam-notes', color: 'text-[#9b60aa]', bg: 'bg-[#fcf0ff] border-[#f2d5fc] hover:border-[#9b60aa]' },
    { label: 'Question Bank (QB)', icon: HelpCircle, href: '/question-bank', color: 'text-[#003c33]', bg: 'bg-[#edfce9] border-[#ccebc5] hover:border-[#003c33]' },
    { label: 'Structured Answers', icon: Award, href: '/answers', color: 'text-[#ff7759]', bg: 'bg-[#fff1ed] border-[#ffdad0] hover:border-[#ff7759]' },
    { label: 'Answer Optimizer', icon: Edit3, href: '/answer-optimizer', color: 'text-[#2b8a78]', bg: 'bg-[#eefaf7] border-[#d3ede7] hover:border-[#2b8a78]' },
    { label: 'PYQ Intelligence', icon: BookOpen, href: '/pyq', color: 'text-[#1863dc]', bg: 'bg-[#f1f5ff] border-[#d0dcf5] hover:border-[#1863dc]' },
  ];



  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 font-sans text-[#2d2d34] dark:text-slate-100 min-h-screen bg-[#f8f9fc] dark:bg-slate-950 transition-colors">
      {/* Top Bar */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-2 border-b border-[#e3e6ed]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-[#4f75f2] animate-pulse" />
            <span className="text-[11px] font-mono tracking-widest text-[#6b6f82] uppercase font-bold">
              COGNORA WORKSPACE
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#121217] tracking-tight">
            Your Learning Space
          </h1>
          <p className="text-xs md:text-sm text-[#6b6f82] mt-1 font-sans">
            A smarter space to learn, track progress, and stay ahead.
          </p>
        </div>
      </header>

      {/* Resume Where You Left Off Banner */}
      {lastNav && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/5 border border-indigo-200 dark:border-indigo-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs my-3">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <PlayCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-mono">
                  Continue Where You Left Off
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Saved workspace session
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {lastNav.pageTitle || 'Previous Session'}
                {lastNav.subjectName ? ' • ' + lastNav.subjectName : ''}
                {lastNav.topicTitle ? ' (' + lastNav.topicTitle + ')' : ''}
              </h3>
            </div>
          </div>

          <Link
            to={lastNav.pagePath}
            className="inline-flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all transform hover:-translate-y-0.5 shrink-0"
          >
            <span>Resume Learning</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}


      {/* Main Peaceful Grid Layout (Left: Courses/Subjects | Right: Performance Chart & Homework) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Subject / Course Selection (Pastel Cards) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#ffffff] border border-[#e3e6ed] rounded-3xl p-6 shadow-xs space-y-5">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-extrabold text-[#121217]">Select a Course</h2>
                <p className="text-xs text-[#6b6f82]">Start focused learning today</p>
              </div>
              <button
                onClick={() => setShowAddSubject(true)}
                className="text-xs font-bold text-[#4f75f2] hover:text-[#385dd8] bg-[#edf3fc] hover:bg-[#e1f1fd] px-3 py-1.5 rounded-xl transition-all cursor-pointer border border-[#d0dcf5]"
              >
                + Add Course
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#8c8fa1] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search your subjects or topics..."
                className="w-full bg-[#f8f9fc] border border-[#e3e6ed] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-[#121217] placeholder-[#8c8fa1] outline-none focus:border-[#4f75f2] transition-colors"
              />
            </div>

            {/* Filter Toggle: All | Theory | Labs */}
            <div className="flex items-center gap-1.5 pb-1 border-b border-[#e3e6ed]">
              {(['All', 'Theory', 'Labs'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1 rounded-xl text-[11px] font-mono font-bold transition-all cursor-pointer ${
                    categoryFilter === cat
                      ? 'bg-[#121217] text-white'
                      : 'bg-[#f2f3f7] text-[#6b6f82] hover:text-[#121217]'
                  }`}
                >
                  {cat} ({cat === 'All' ? subjects.length : subjects.filter((s: any) => cat === 'Labs' ? (s.name.toLowerCase().includes('lab') || s.type === 'Lab') : (!s.name.toLowerCase().includes('lab') && s.type !== 'Lab')).length})
                </button>
              ))}
            </div>

            {/* Subject Pastel Cards (Periwinkle, Sky, Mint, Sand, Lavender) */}
            <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
              {filteredSubjects.length === 0 ? (
                <div className="text-center py-8 text-[#8c8fa1] text-xs">
                  No courses found. Click "+ Add Course" to get started.
                </div>
              ) : (
                filteredSubjects.map((subj, idx) => {
                  const pastelStyles = [
                    {
                      bg: 'bg-[#e4e7fd]', // Soft Periwinkle
                      border: 'border-[#d0d8fb]',
                      badge: 'bg-[#ffffff]/80 text-[#3b52c4]',
                      text: 'text-[#1e255e]'
                    },
                    {
                      bg: 'bg-[#e1f1fd]', // Soft Sky Blue
                      border: 'border-[#cce5fc]',
                      badge: 'bg-[#ffffff]/80 text-[#216ea3]',
                      text: 'text-[#143e5e]'
                    },
                    {
                      bg: 'bg-[#e2f6eb]', // Soft Mint
                      border: 'border-[#c9eed9]',
                      badge: 'bg-[#ffffff]/80 text-[#1f7247]',
                      text: 'text-[#124229]'
                    },
                    {
                      bg: 'bg-[#fbf5e6]', // Soft Warm Sand
                      border: 'border-[#f4e8cc]',
                      badge: 'bg-[#ffffff]/80 text-[#967018]',
                      text: 'text-[#543d0b]'
                    },
                    {
                      bg: 'bg-[#f0eafb]', // Soft Lavender
                      border: 'border-[#e4d7f8]',
                      badge: 'bg-[#ffffff]/80 text-[#7a48ba]',
                      text: 'text-[#381666]'
                    }
                  ];
                  const style = pastelStyles[idx % pastelStyles.length];
                  const progress = subj.progress ?? 65;
                  const examDays = getExamDays(subj.examDate);

                  return (
                    <Link
                      key={subj.id}
                      to={`/subject/${subj.id}`}
                      className={`${style.bg} border ${style.border} rounded-3xl p-5 block transition-all hover:scale-[1.01] hover:shadow-md cursor-pointer`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className={`text-base font-extrabold ${style.text}`}>
                          {subj.name}
                        </h3>
                        <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full ${style.badge}`}>
                          {subj.code || 'CODE'}
                        </span>
                      </div>
                      <p className="text-xs text-[#5d6175] mb-4 line-clamp-1 font-medium">
                        {subj.name.toLowerCase().includes('lab')
                          ? 'Hands-on experiments, simulation models, and journal viva prep.'
                          : 'Master university syllabus, key theorems, and predicted exam question patterns.'}
                      </p>

                      <div className="flex items-center justify-between text-[11px] font-mono font-bold text-[#5d6175]">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{examDays !== null ? `${examDays} days until exam` : (subj.name.toLowerCase().includes('lab') ? 'Semester Lab' : 'Active Term')}</span>
                        </div>
                        <span className="text-xs font-bold text-[#121217]">
                          {progress}% Complete
                        </span>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Performance Chart + Homework + Friends Score */}
        <div className="lg:col-span-7 space-y-6">
          {/* Performance Chart Card */}
          <div className="bg-[#ffffff] border border-[#e3e6ed] rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-extrabold text-[#121217]">Performance Chart</h2>
                <p className="text-xs text-[#6b6f82]">Track results and watch your retention rise</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold bg-[#f2f3f7] text-[#121217] px-3 py-1.5 rounded-xl border border-[#e3e6ed]">
                  Weekly ▾
                </span>
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs font-medium text-[#6b6f82]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#4f75f2]" />
                <span>Theory</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#8e7bf3]" />
                <span>Practice</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#f28b76]" />
                <span>Lexicon / Vocab</span>
              </div>
            </div>

            {/* Peaceful SVG Performance Curve */}
            <div className="relative pt-4 pb-2">
              <svg viewBox="0 0 500 160" className="w-full h-44 overflow-visible">
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8e7bf3" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#4f75f2" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid guidelines */}
                <line x1="0" y1="30" x2="500" y2="30" stroke="#f0f2f7" strokeDasharray="3 3" />
                <line x1="0" y1="80" x2="500" y2="80" stroke="#f0f2f7" strokeDasharray="3 3" />
                <line x1="0" y1="130" x2="500" y2="130" stroke="#f0f2f7" strokeDasharray="3 3" />

                {/* Shaded Area under Curve */}
                <path
                  d="M 10 120 Q 80 135 150 110 T 280 80 T 380 40 T 490 60 L 490 150 L 10 150 Z"
                  fill="url(#chartGradient)"
                />

                {/* Primary Smooth Curve (Practice / Retention) */}
                <path
                  d="M 10 120 Q 80 135 150 110 T 280 80 T 380 40 T 490 60"
                  fill="none"
                  stroke="#8e7bf3"
                  strokeWidth="3"
                  strokeLinecap="round"
                />

                {/* Secondary Smooth Curve (Theory mastery) */}
                <path
                  d="M 10 135 Q 80 145 150 125 T 280 100 T 380 65 T 490 85"
                  fill="none"
                  stroke="#4f75f2"
                  strokeWidth="2.5"
                  strokeDasharray="4 4"
                  strokeLinecap="round"
                />

                {/* Active Marker Pin on Thursday */}
                <circle cx="380" cy="40" r="5" fill="#4f75f2" stroke="#ffffff" strokeWidth="2" />
              </svg>

              {/* Floating Pill on Peak */}
              <div className="absolute top-2 right-28 bg-[#121217] text-white text-[10px] font-mono font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 animate-bounce">
                <span>↑ +18% Higher Recall</span>
              </div>

              {/* Day Labels */}
              <div className="flex justify-between text-[11px] font-mono text-[#8c8fa1] px-2 pt-2 border-t border-[#f0f2f7]">
                <span>Sun</span>
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span className="text-[#4f75f2] font-bold">Thu</span>
                <span>Fri</span>
                <span>Sat</span>
              </div>
            </div>
          </div>

          {/* Bottom Split: Homework/Task Progress + Community Score */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Homework / Study Queue */}
            <div className="bg-[#ffffff] border border-[#e3e6ed] rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-base font-extrabold text-[#121217]">Study Tasks</h3>
                  <p className="text-[11px] text-[#6b6f82]">Check and complete today</p>
                </div>
                <span className="text-[11px] font-bold bg-[#f2f3f7] text-[#121217] px-2.5 py-1 rounded-lg">
                  Today ▾
                </span>
              </div>

              <div className="space-y-3">
                {[
                  { title: 'Learn 10 new QB terms today', progress: 85, color: 'from-[#4f75f2] to-[#8e7bf3]' },
                  { title: 'Review 1 university PYQ schema', progress: 62, color: 'from-[#2a5a52] to-[#4f75f2]' },
                  { title: 'Solve 1 complexity derivation', progress: 40, color: 'from-[#f28b76] to-[#fcd9d2]' },
                  { title: 'Write 3 model answers', progress: 92, color: 'from-[#8e7bf3] to-[#4f75f2]' },
                ].map((task, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#f8f9fc] border border-[#e3e6ed] flex items-center justify-center shrink-0 text-[#121217]">
                      <Check className="w-3.5 h-3.5 text-[#4f75f2]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-[#121217] truncate">{task.title}</div>
                      <div className="h-1.5 w-full bg-[#f0f2f7] rounded-full overflow-hidden mt-1.5">
                        <div
                          className={`h-full bg-gradient-to-r ${task.color} rounded-full`}
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-[#121217]">{task.progress}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Academic Health & Community Score */}
            <div className="bg-[#ffffff] border border-[#e3e6ed] rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-base font-extrabold text-[#121217]">Cohort Health</h3>
                  <p className="text-[11px] text-[#6b6f82]">Your ranking among peers</p>
                </div>
                <span className="text-[11px] font-bold text-[#4f75f2] bg-[#edf3fc] px-2.5 py-1 rounded-lg border border-[#d0dcf5]">
                  Active
                </span>
              </div>

              <div className="space-y-3">
                {[
                  { name: 'You (Cognora Scholar)', hours: '84h', score: `${Math.round(healthScore * 140)}` },
                  { name: 'Aarav Mehta', hours: '78h', score: '10,234' },
                  { name: 'Riya Sen', hours: '74h', score: '9,892' },
                  { name: 'Fawaz Mulla', hours: '68h', score: '9,322' },
                ].map((user, i) => (
                  <div key={i} className="flex items-center justify-between py-1 border-b border-[#f0f2f7] last:border-none">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[#edf3fc] border border-[#d0dcf5] text-[11px] font-bold text-[#4f75f2] flex items-center justify-center">
                        {user.name[0]}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#121217]">{user.name}</div>
                        <div className="text-[10px] text-[#8c8fa1] font-mono">{user.hours} total study</div>
                      </div>
                    </div>
                    <div className="text-xs font-mono font-bold text-[#121217]">{user.score}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="space-y-3 pt-4">
        <h3 className="text-xs font-mono font-bold text-[#6b6f82] uppercase tracking-wider">
          Quick Modules
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {quickActions.map((action, i) => (
            <Link
              key={i}
              to={action.href}
              className="bg-white border border-[#e3e6ed] hover:border-[#4f75f2] hover:shadow-sm p-4 rounded-2xl transition-all cursor-pointer group flex flex-col justify-between min-h-[90px]"
            >
              <action.icon className="w-5 h-5 text-[#4f75f2] group-hover:scale-110 transition-transform mb-2" />
              <span className="text-xs font-bold text-[#121217] leading-tight">
                {action.label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Sessions */}
      {sessions.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xs font-mono font-bold text-[#75758a] uppercase tracking-wider">Recent Study Sessions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sessions.map(session => (
              <Link
                key={session.id}
                to={`/session/${session.id}`}
                className="bg-[#eeece7] border border-[#d9d9dd] hover:bg-white hover:border-black p-5 rounded transition-all group cursor-pointer flex items-center gap-4 shadow-none"
              >
                <div className="w-9 h-9 rounded bg-white border border-[#d9d9dd] flex items-center justify-center shrink-0">
                  <PlayCircle className="w-4 h-4 text-black" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-mono font-bold text-black truncate group-hover:text-[#1863dc] transition-colors uppercase tracking-wider">
                    {session.goalMode || 'Study Session'}
                  </div>
                  <div className="text-[10px] text-[#75758a] mt-0.5 flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3" />
                    {new Date(session.startedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#75758a] group-hover:text-black group-hover:translate-x-0.5 transition-all shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}



      {/* Add Subject Modal */}
      {showAddSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white border border-[#d9d9dd] w-full max-w-md rounded-2xl overflow-hidden flex flex-col relative animate-in fade-in zoom-in duration-200">
            <header className="p-6 border-b border-[#d9d9dd] flex justify-between items-center bg-white">
              <h3 className="text-sm font-bold text-black uppercase tracking-wider flex items-center gap-2 font-display">
                <BookOpen className="w-4 h-4 text-black" />
                Add New Subject
              </h3>
              <button 
                onClick={() => {
                  setShowAddSubject(false);
                  setAddSubjectError('');
                  setNewSubjectName('');
                  setNewSubjectDate('');
                }}
                className="text-[#75758a] hover:text-black p-1.5 rounded-full hover:bg-[#eeece7] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </header>
            
            <form onSubmit={handleAddSubjectSubmit} className="p-6 space-y-5 bg-white">
              {addSubjectError && (
                <div className="bg-[#b30000]/10 border border-[#b30000]/20 text-[#b30000] p-3 rounded text-xs text-center font-semibold">
                  {addSubjectError}
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-[11px] font-mono text-[#75758a] uppercase tracking-wide">Subject Name</label>
                <input
                  type="text"
                  value={newSubjectName}
                  onChange={e => setNewSubjectName(e.target.value)}
                  placeholder="e.g. Distributed Systems"
                  className="w-full bg-white border border-[#d9d9dd] rounded px-4 py-2.5 text-xs text-[#212121] placeholder-[#93939f] outline-none focus:border-[#9b60aa] transition-colors"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[11px] font-mono text-[#75758a] uppercase tracking-wide">Exam Date (Optional)</label>
                <input
                  type="date"
                  value={newSubjectDate}
                  onChange={e => setNewSubjectDate(e.target.value)}
                  className="w-full bg-white border border-[#d9d9dd] rounded px-4 py-2.5 text-xs text-[#212121] outline-none focus:border-[#9b60aa] transition-colors"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => {
                    setShowAddSubject(false);
                    setAddSubjectError('');
                    setNewSubjectName('');
                    setNewSubjectDate('');
                  }}
                  className="bg-transparent hover:bg-[#eeece7] border border-[#d9d9dd] text-[#212121] px-5 py-2.5 rounded-full text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={addSubjectLoading}
                  className="bg-black hover:bg-zinc-800 text-white px-6 py-2.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {addSubjectLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Adding...</span>
                    </>
                  ) : (
                    <span>Add Subject</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
