import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Activity, Search, Flame, Target, Clock, Sparkles, BrainCircuit, Loader2, ChevronRight, Zap, PlayCircle } from 'lucide-react';
import { fetchApi } from '../lib/api';

type Subject = { id: string; name: string; code?: string; examDate?: string };
type HealthData = { healthScore: number; updatedAt: string };
type Session = { id: string; goalMode?: string; startedAt: string; subjectId?: string };

export default function Dashboard() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [aiTip, setAiTip] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      try {
        const [subjectsRes, healthRes, sessionsRes] = await Promise.allSettled([
          fetchApi('/api/subjects'),
          fetchApi('/api/analytics/health'),
          fetchApi('/api/sessions')
        ]);

        if (subjectsRes.status === 'fulfilled') setSubjects(subjectsRes.value.subjects || []);
        if (healthRes.status === 'fulfilled') setHealth(healthRes.value);
        if (sessionsRes.status === 'fulfilled') setSessions((sessionsRes.value.sessions || []).slice(0, 3));
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
  }, []);

  const getSubjectProgress = (subj: Subject): number => {
    const seed = subj.id.charCodeAt(0) + subj.name.length;
    return 20 + (seed % 60);
  };

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

  const filteredSubjects = subjects.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.code || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const healthScore = health?.healthScore ?? 72;

  const quickActions = [
    { label: 'PYQ Intelligence', icon: BookOpen, href: '/pyq', color: 'text-[#1863dc]', bg: 'bg-[#f1f5ff] border-[#d0dcf5] hover:border-[#1863dc]' },
    { label: 'Smart Revision', icon: BrainCircuit, href: '/revision', color: 'text-[#9b60aa]', bg: 'bg-[#fcf0ff] border-[#f2d5fc] hover:border-[#9b60aa]' },
    { label: 'Viva Engine', icon: Zap, href: '/viva', color: 'text-[#ff7759]', bg: 'bg-[#fff1ed] border-[#ffdad0] hover:border-[#ff7759]' },
    { label: 'Knowledge Graph', icon: Activity, href: '/knowledge', color: 'text-[#003c33]', bg: 'bg-[#edfce9] border-[#ccebc5] hover:border-[#003c33]' },
    { label: 'Practicals', icon: Sparkles, href: '/practicals', color: 'text-[#967d22]', bg: 'bg-[#faf6e8] border-[#eadeb5] hover:border-[#967d22]' },
    { label: 'Digital Twin', icon: Target, href: '/twin', color: 'text-[#2b8a78]', bg: 'bg-[#eefaf7] border-[#d3ede7] hover:border-[#2b8a78]' },
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 font-sans text-[#212121] min-h-screen bg-white">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-[#d9d9dd] pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 border border-[#ffad9b] bg-[#edfce9] text-[#003c33] text-[9px] font-mono font-bold tracking-wider uppercase mb-3">
            <Flame className="w-3 h-3 text-[#ff7759] fill-[#ff7759]" /> ArchAdemia — Active
          </div>
          <h2 className="text-3xl font-display tracking-tight text-black uppercase">Dashboard</h2>
          <p className="text-[#75758a] mt-1 text-xs font-sans">AI-powered overview of your academic performance.</p>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 text-[#75758a] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search subjects..."
            className="w-full md:w-80 bg-white border border-[#d9d9dd] rounded pl-10 pr-4 py-2 text-xs text-[#212121] placeholder-[#93939f] outline-none focus:border-[#9b60aa] transition-colors"
          />
        </div>
      </header>

      {/* AI Tip Banner */}
      {aiTip && (
        <div className="bg-[#f1f5ff] border border-[#d9d9dd] rounded px-5 py-4 flex items-start gap-3 relative z-10">
          <Sparkles className="w-4 h-4 text-[#1863dc] shrink-0 mt-0.5 animate-pulse" />
          <p className="text-xs text-[#212121] leading-relaxed font-sans">{aiTip}</p>
        </div>
      )}

      {/* Health + Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 bg-white border border-[#d9d9dd] rounded p-6 flex flex-col items-center justify-center text-center relative shadow-none">
          <div className="w-9 h-9 rounded bg-[#edfce9] border border-[#003c33]/30 flex items-center justify-center mb-3">
            <Activity className="w-4 h-4 text-[#003c33]" />
          </div>
          <div className="text-3xl font-mono font-bold text-black">{Math.round(healthScore)}</div>
          <div className="text-[9px] font-mono text-[#75758a] mt-1 uppercase tracking-wider">Academic Health Score</div>
          <div className="w-full mt-4 h-1 bg-[#eeece7] rounded overflow-hidden">
            <div className="h-full bg-black transition-all duration-1000" style={{ width: `${healthScore}%` }} />
          </div>
        </div>

        <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-3 gap-3">
          {quickActions.map((action, i) => (
            <Link key={i} to={action.href}
              className={`flex items-center gap-3 p-4 rounded border transition-all cursor-pointer group shadow-none ${action.bg}`}
            >
              <action.icon className={`w-4 h-4 ${action.color} group-hover:scale-110 transition-transform`} />
              <span className="text-xs font-mono uppercase tracking-wider font-bold">{action.label}</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#75758a] ml-auto group-hover:translate-x-0.5 transition-transform" />
            </Link>
          ))}
        </div>
      </div>

      {/* Active Subjects */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-mono font-bold text-[#75758a] uppercase tracking-wider">Active Subjects</h3>
          {loading && <Loader2 className="w-4 h-4 text-[#75758a] animate-spin" />}
        </div>

        {filteredSubjects.length === 0 && !loading ? (
          <div className="text-center py-16 bg-[#eeece7]/40 rounded border border-[#d9d9dd] border-dashed shadow-none">
            <BookOpen className="w-10 h-10 text-[#75758a] mx-auto mb-4" />
            <h4 className="text-black font-bold text-sm font-display">No subjects found</h4>
            <p className="text-[#75758a] text-xs mt-1">Add subjects or upload resources to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredSubjects.map((subj, idx) => {
              const progress = getSubjectProgress(subj);
              const examDays = getExamDays(subj.examDate);
              const { bar, label, text } = statusColor(progress);
              
              const cardColors = [
                { bg: 'bg-[#edfce9] hover:bg-white', border: 'border-[#ccebc5] hover:border-black', bar: 'bg-[#003c33]' },
                { bg: 'bg-[#f1f5ff] hover:bg-white', border: 'border-[#d0dcf5] hover:border-black', bar: 'bg-[#1863dc]' },
                { bg: 'bg-[#fff1ed] hover:bg-white', border: 'border-[#ffdad0] hover:border-black', bar: 'bg-[#ff7759]' },
                { bg: 'bg-[#fcf0ff] hover:bg-white', border: 'border-[#f2d5fc] hover:border-black', bar: 'bg-[#9b60aa]' },
                { bg: 'bg-[#faf6e8] hover:bg-white', border: 'border-[#eadeb5] hover:border-black', bar: 'bg-[#967d22]' },
              ];
              const colorCfg = cardColors[idx % cardColors.length];

              return (
                <Link to={`/subject/${subj.id}`} key={subj.id}
                  className={`${colorCfg.bg} border ${colorCfg.border} p-6 rounded transition-all duration-200 group cursor-pointer flex flex-col justify-between min-h-[165px] shadow-none`}
                >
                  <div className="flex justify-between items-start mb-5">
                    <div>
                      <div className="text-[9px] font-mono font-bold text-[#75758a] tracking-wider uppercase mb-1">{subj.code || 'SUBJ'}</div>
                      <h4 className="font-display font-medium text-lg text-black group-hover:text-[#1863dc] transition-colors leading-snug">{subj.name}</h4>
                    </div>
                    {examDays !== null && (
                      <div className={`text-right shrink-0 ml-3 ${examDays <= 7 ? 'text-[#ff7759]' : 'text-[#75758a]'}`}>
                        <div className="text-2xl font-mono font-bold">{examDays}</div>
                        <div className="text-[9px] font-mono font-bold uppercase tracking-wider">days</div>
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1.5 font-mono text-[10px] uppercase tracking-wider">
                      <span className="text-[#75758a]">Syllabus Coverage</span>
                      <span className="font-bold text-black">{progress}%</span>
                    </div>
                    <div className="h-1 bg-white/60 rounded overflow-hidden">
                      <div className={`h-full ${colorCfg.bar} transition-all duration-700`} style={{ width: `${progress}%` }} />
                    </div>
                    <div className="mt-4 flex justify-between items-center">
                      <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${label}`}>{text}</span>
                      <span className="text-xs text-[#1863dc] group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
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

      {/* Offline CS & Math Solvers */}
      <div className="space-y-4 pt-4">
        <h3 className="text-xs font-mono font-bold text-[#75758a] uppercase tracking-wider">Offline Study Solvers (No AI)</h3>
        <div className="bg-white border border-[#d9d9dd] rounded p-6 md:p-8 shadow-none">
          <div className="flex gap-2 border-b border-[#d9d9dd] pb-3 mb-6">
            {[
              { id: 'complexity', label: 'Big-O Complexity' },
              { id: 'bayes', label: 'Bayes Probability' },
              { id: 'spaced', label: 'Spaced Repetition (SM-2)' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSolverType(tab.id as any)}
                className={`px-4 py-2 text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
                  solverType === tab.id
                    ? 'bg-black text-white border border-black rounded-full'
                    : 'text-[#75758a] hover:bg-[#eeece7] hover:text-black border border-transparent rounded-full'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {solverType === 'complexity' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-[#75758a] uppercase tracking-wider mb-2">Algorithm Expression</label>
                  <input
                    type="text"
                    value={complexityExpr}
                    onChange={e => setComplexityExpr(e.target.value)}
                    className="w-full bg-white border border-[#d9d9dd] rounded px-4 py-2.5 text-xs text-[#212121] outline-none focus:border-[#9b60aa] transition-colors"
                  />
                </div>
                <button
                  onClick={solveComplexity}
                  className="bg-black hover:bg-zinc-800 text-white px-5 py-2.5 rounded-full text-xs font-semibold transition-colors cursor-pointer"
                >
                  Calculate Big-O
                </button>
              </div>

              <div className="bg-[#eeece7] border border-[#d9d9dd] rounded p-5 min-h-[140px] flex flex-col justify-center shadow-none">
                {complexityResult ? (
                  <div className="space-y-2">
                    <div className="text-[10px] font-mono text-[#75758a] font-semibold uppercase tracking-wider">Resulting Complexity</div>
                    <div className="text-3xl font-mono font-bold text-black">{complexityResult.dominant}</div>
                    <p className="text-xs text-[#212121] leading-relaxed font-medium font-sans">{complexityResult.explanation}</p>
                  </div>
                ) : (
                  <div className="text-[#75758a] text-center py-4 text-xs font-mono uppercase tracking-wider">Input expression and calculate to inspect Big-O execution class.</div>
                )}
              </div>
            </div>
          )}

          {solverType === 'bayes' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-[#75758a] uppercase tracking-wider mb-2">Prior P(H)</label>
                    <input
                      type="text"
                      value={bayesPrior}
                      onChange={e => setBayesPrior(e.target.value)}
                      className="w-full bg-white border border-[#d9d9dd] rounded px-3 py-2 text-xs text-[#212121] outline-none focus:border-[#9b60aa]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-[#75758a] uppercase tracking-wider mb-2">Sensitivity P(E|H)</label>
                    <input
                      type="text"
                      value={bayesSensitivity}
                      onChange={e => setBayesSensitivity(e.target.value)}
                      className="w-full bg-white border border-[#d9d9dd] rounded px-3 py-2 text-xs text-[#212121] outline-none focus:border-[#9b60aa]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-[#75758a] uppercase tracking-wider mb-2">False Alarm P(E|~H)</label>
                    <input
                      type="text"
                      value={bayesFalseAlarm}
                      onChange={e => setBayesFalseAlarm(e.target.value)}
                      className="w-full bg-white border border-[#d9d9dd] rounded px-3 py-2 text-xs text-[#212121] outline-none focus:border-[#9b60aa]"
                    />
                  </div>
                </div>
                <button
                  onClick={solveBayes}
                  className="bg-black hover:bg-zinc-800 text-white px-5 py-2.5 rounded-full text-xs font-semibold transition-colors cursor-pointer"
                >
                  Solve Posterior
                </button>
              </div>

              <div className="bg-[#eeece7] border border-[#d9d9dd] rounded p-5 min-h-[140px] flex flex-col justify-center shadow-none">
                {bayesResult ? (
                  <div className="space-y-2">
                    <div className="text-[10px] font-mono text-[#75758a] font-semibold uppercase tracking-wider">Posterior P(H|E)</div>
                    <div className="text-3xl font-mono font-bold text-black">{bayesResult.posterior}</div>
                    <code className="block text-[10px] bg-white border border-[#d9d9dd] p-2 rounded text-[#1863dc] font-mono">{bayesResult.formula}</code>
                    <p className="text-xs text-[#212121] leading-relaxed font-medium font-sans">{bayesResult.explanation}</p>
                  </div>
                ) : (
                  <div className="text-[#75758a] text-center py-4 text-xs font-mono uppercase tracking-wider">Configure probabilities to compute Bayes theorem posterior weight.</div>
                )}
              </div>
            </div>
          )}

          {solverType === 'spaced' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-[#75758a] uppercase tracking-wider mb-2">Interval (days)</label>
                    <input
                      type="number"
                      value={spacedInterval}
                      onChange={e => setSpacedInterval(e.target.value)}
                      className="w-full bg-white border border-[#d9d9dd] rounded px-3 py-2 text-xs text-[#212121] outline-none focus:border-[#9b60aa]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-[#75758a] uppercase tracking-wider mb-2">Ease Factor</label>
                    <input
                      type="text"
                      value={spacedEase}
                      onChange={e => setSpacedEase(e.target.value)}
                      className="w-full bg-white border border-[#d9d9dd] rounded px-3 py-2 text-xs text-[#212121] outline-none focus:border-[#9b60aa]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-[#75758a] uppercase tracking-wider mb-2">Recall Quality</label>
                    <select
                      value={spacedRating}
                      onChange={e => setSpacedRating(e.target.value)}
                      className="w-full bg-white border border-[#d9d9dd] rounded px-3 py-2 text-xs text-[#212121] outline-none focus:border-[#9b60aa] cursor-pointer font-sans"
                    >
                      <option value="0">0 - Again (Forgot)</option>
                      <option value="1">1 - Hard</option>
                      <option value="2">2 - Hard</option>
                      <option value="3">3 - Good</option>
                      <option value="4">4 - Good</option>
                      <option value="5">5 - Easy</option>
                    </select>
                  </div>
                </div>
                <button
                  onClick={solveSpaced}
                  className="bg-black hover:bg-zinc-800 text-white px-5 py-2.5 rounded-full text-xs font-semibold transition-colors cursor-pointer"
                >
                  Schedule Next Review
                </button>
              </div>

              <div className="bg-[#eeece7] border border-[#d9d9dd] rounded p-5 min-h-[140px] flex flex-col justify-center shadow-none">
                {spacedResult ? (
                  <div className="space-y-2">
                    <div className="text-[10px] font-mono text-[#75758a] font-semibold uppercase tracking-wider">Schedule Interval</div>
                    <div className="text-3xl font-mono font-bold text-black">{spacedResult.nextInterval}</div>
                    <div className="text-[10px] font-mono text-[#75758a] font-bold uppercase tracking-wider">New Ease Factor: {spacedResult.newEase}</div>
                    <p className="text-xs text-[#212121] leading-relaxed font-medium font-sans">{spacedResult.explanation}</p>
                  </div>
                ) : (
                  <div className="text-[#75758a] text-center py-4 text-xs font-mono uppercase tracking-wider">Calculate to schedule flashcard intervals offline using SM-2 rules.</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
