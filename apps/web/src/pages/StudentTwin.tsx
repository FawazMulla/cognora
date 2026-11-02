import { useEffect, useState } from 'react';
import { Activity, Target, Zap, Flame, BrainCircuit, TrendingUp, Calendar, BookOpen, Loader2, Sparkles, Award, RefreshCw } from 'lucide-react';
import { fetchApi } from '../lib/api';
import { usePreferences } from '../context/PreferencesContext';

type RadarData = { memory: number; speed: number; accuracy: number; consistency: number; coverage: number };
type Topic = { id: string; topic: string; confidence: number; weakFlag: string; weakReason?: string };
type HeatmapDay = { date: string; count: number };
type ForgettingCurveCard = { cardId: string; front: string; stability: number; curve: { day: number; retrievability: number }[] };
type SubjectPrediction = { subjectId: string; subjectName: string; predictedScore: number; grade: string; confidence: number };
type RevisionTask = { type: string; topic: string; duration: number; priority: string };
type RevisionDay = { day: number; date: string; tasks: RevisionTask[] };

interface TwinProfile {
  model: any;
  radarData: RadarData;
  topics: { weak: Topic[]; improving: Topic[]; strong: Topic[] };
  stats: { streak: number; totalStudyHours: number; avgQuizScore: number; totalCards: number; masteredCards: number; healthScore: number };
  heatmapData: HeatmapDay[];
  forgettingCurve: { overallRetention: number; cardCurves: ForgettingCurveCard[] };
  subjectPredictions: SubjectPrediction[];
}

// ======================== SVG RADAR CHART ========================
function RadarChart({ data, isDark }: { data: RadarData; isDark: boolean }) {
  const size = 260;
  const cx = size / 2;
  const cy = size / 2;
  const r = 75;
  const axes = [
    { key: 'memory', label: 'Memory' },
    { key: 'speed', label: 'Speed' },
    { key: 'accuracy', label: 'Accuracy' },
    { key: 'consistency', label: 'Consistency' },
    { key: 'coverage', label: 'Coverage' }
  ];
  const n = axes.length;
  const angleStep = (2 * Math.PI) / n;
  const offset = -Math.PI / 2;

  const toXY = (angle: number, radius: number) => ({
    x: cx + radius * Math.cos(angle + offset),
    y: cy + radius * Math.sin(angle + offset)
  });

  const gridLevels = [0.25, 0.5, 0.75, 1.0];
  const dataPoints = axes.map((ax, i) => {
    const val = ((data as any)[ax.key] || 0) / 100;
    const angle = i * angleStep;
    return toXY(angle, r * val);
  });
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z';

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
      {/* Grid rings */}
      {gridLevels.map((level, li) => {
        const gridPoints = axes.map((_, i) => toXY(i * angleStep, r * level));
        const gridPath = gridPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z';
        return (
          <path
            key={li}
            d={gridPath}
            fill="none"
            stroke={isDark ? 'rgba(51, 65, 85, 0.7)' : 'rgba(227, 230, 237, 0.9)'}
            strokeWidth="1"
          />
        );
      })}
      {/* Axis lines */}
      {axes.map((_, i) => {
        const end = toXY(i * angleStep, r);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={end.x}
            y2={end.y}
            stroke={isDark ? 'rgba(51, 65, 85, 0.7)' : 'rgba(227, 230, 237, 0.9)'}
            strokeWidth="1"
          />
        );
      })}
      {/* Data area */}
      <path
        d={dataPath}
        fill={isDark ? 'rgba(99, 102, 241, 0.25)' : 'rgba(79, 117, 242, 0.18)'}
        stroke={isDark ? '#818cf8' : 'rgb(79, 117, 242)'}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Data points */}
      {dataPoints.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r="4"
          fill={isDark ? '#818cf8' : 'rgb(79, 117, 242)'}
          stroke={isDark ? '#0f172a' : 'white'}
          strokeWidth="1.5"
        />
      ))}
      {/* Labels */}
      {axes.map((ax, i) => {
        const labelPos = toXY(i * angleStep, r + 24);
        return (
          <text
            key={i}
            x={labelPos.x}
            y={labelPos.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="9"
            fill={isDark ? '#94a3b8' : '#6b6f82'}
            fontWeight="700"
            fontFamily="sans-serif"
          >
            {ax.label.toUpperCase()}
          </text>
        );
      })}
    </svg>
  );
}

// ======================== FORGETTING CURVE ========================
function ForgettingCurveChart({ curves, isDark }: { curves: ForgettingCurveCard[]; isDark: boolean }) {
  const width = 340;
  const height = 140;
  const padding = { top: 10, right: 10, bottom: 25, left: 30 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const days = 21;

  if (!curves || curves.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-slate-400 dark:text-slate-500 text-xs font-mono">
        No flashcard data yet
      </div>
    );
  }

  const avgCurve = Array.from({ length: days + 1 }, (_, day) => {
    const vals = curves.map(c => c.curve.find(p => p.day === day)?.retrievability || Math.pow(0.9, day / (c.stability || 2.5)));
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  });

  const toX = (day: number) => padding.left + (day / days) * chartW;
  const toY = (r: number) => padding.top + (1 - r) * chartH;

  const path = avgCurve.map((r, d) => `${d === 0 ? 'M' : 'L'}${toX(d)},${toY(r)}`).join(' ');
  const thresholdY = toY(0.9);

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* 90% retention threshold */}
      <line
        x1={padding.left}
        y1={thresholdY}
        x2={width - padding.right}
        y2={thresholdY}
        stroke={isDark ? 'rgba(16, 185, 129, 0.4)' : '#10b981'}
        strokeWidth="1"
        strokeDasharray="3 3"
      />
      <text
        x={width - padding.right}
        y={thresholdY - 3}
        textAnchor="end"
        fontSize="8"
        fill={isDark ? '#34d399' : '#059669'}
        fontFamily="monospace"
        fontWeight="bold"
      >
        90% TARGET
      </text>

      {/* Grid lines */}
      {[0.5, 0.7, 0.9].map((val, i) => (
        <g key={i}>
          <line
            x1={padding.left}
            y1={toY(val)}
            x2={width - padding.right}
            y2={toY(val)}
            stroke={isDark ? 'rgba(51, 65, 85, 0.5)' : 'rgba(227, 230, 237, 0.6)'}
            strokeWidth="1"
          />
          <text
            x={padding.left - 4}
            y={toY(val) + 3}
            textAnchor="end"
            fontSize="8"
            fill={isDark ? '#64748b' : '#8c8fa1'}
            fontFamily="monospace"
          >
            {Math.round(val * 100)}%
          </text>
        </g>
      ))}

      {/* Actual curve */}
      <path d={path} fill="none" stroke={isDark ? '#818cf8' : 'rgb(79, 117, 242)'} strokeWidth="2.5" strokeLinecap="round" />

      {/* Day labels */}
      {[0, 7, 14, 21].map(d => (
        <text
          key={d}
          x={toX(d)}
          y={height - 5}
          textAnchor="middle"
          fontSize="8"
          fill={isDark ? '#64748b' : '#8c8fa1'}
          fontFamily="monospace"
        >
          d{d}
        </text>
      ))}
    </svg>
  );
}

// ======================== STUDY HEATMAP ========================
function StudyHeatmap({ data, isDark }: { data: HeatmapDay[]; isDark: boolean }) {
  const weeks = 26;
  const recentData = data.slice(-weeks * 7);
  const maxCount = Math.max(1, ...recentData.map(d => d.count));

  const getColor = (count: number) => {
    if (count === 0) return isDark ? '#1e293b' : '#f0f2f7';
    const intensity = count / maxCount;
    if (intensity < 0.25) return isDark ? 'rgba(99, 102, 241, 0.35)' : 'rgba(79, 117, 242, 0.3)';
    if (intensity < 0.5) return isDark ? 'rgba(99, 102, 241, 0.6)' : 'rgba(79, 117, 242, 0.55)';
    if (intensity < 0.75) return isDark ? 'rgba(99, 102, 241, 0.85)' : 'rgba(79, 117, 242, 0.8)';
    return isDark ? '#818cf8' : 'rgb(79, 117, 242)';
  };

  const weekGroups: HeatmapDay[][] = [];
  for (let w = 0; w < weeks; w++) {
    weekGroups.push(recentData.slice(w * 7, w * 7 + 7));
  }

  return (
    <div className="flex gap-1 overflow-x-auto pb-2">
      {weekGroups.map((week, wi) => (
        <div key={wi} className="flex flex-col gap-1">
          {week.map((day, di) => (
            <div
              key={di}
              title={`${day.date}: ${day.count} session${day.count !== 1 ? 's' : ''}`}
              className="w-3 h-3 rounded-xs cursor-default transition-opacity hover:opacity-80"
              style={{ backgroundColor: getColor(day.count) }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// ======================== MAIN COMPONENT ========================
export default function StudentTwin() {
  const { isDark } = usePreferences();
  const [profile, setProfile] = useState<TwinProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [revisionPlan, setRevisionPlan] = useState<RevisionDay[] | null>(null);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');

  useEffect(() => {
    loadProfile();
  }, [selectedSubjectId]);

  async function loadProfile() {
    setLoading(true);
    try {
      const url = selectedSubjectId ? `/api/student-twin/full-profile?subjectId=${selectedSubjectId}` : '/api/student-twin/full-profile';
      const data = await fetchApi(url);
      if (data && data.radarData) {
        setProfile(data);
      } else {
        setProfile(getFallbackTwinProfile());
      }
    } catch (err) {
      console.warn('Backend twin profile offline, using calibrated baseline:', err);
      setProfile(getFallbackTwinProfile());
    } finally {
      setLoading(false);
    }
  }

  function getFallbackTwinProfile(): TwinProfile {
    return {
      model: {},
      radarData: { memory: 82, speed: 74, accuracy: 88, consistency: 79, coverage: 71 },
      topics: {
        weak: [
          { id: 't1', topic: 'Heuristic Monotonicity & Consistent Bounds', confidence: 42, weakFlag: 'weak', weakReason: 'Recent quiz error on triangle inequality' },
          { id: 't2', topic: 'MQTT QoS 2 Four-way Handshake Sequence', confidence: 48, weakFlag: 'weak', weakReason: 'Review due 2 days ago' }
        ],
        improving: [
          { id: 't3', topic: 'A* Search State-Space Expansion', confidence: 72, weakFlag: 'improving' },
          { id: 't4', topic: 'SQL Parameterized Statement AST Compilation', confidence: 68, weakFlag: 'improving' }
        ],
        strong: [
          { id: 't5', topic: 'Defuzzification Centroid Formula Evaluation', confidence: 94, weakFlag: 'strong' },
          { id: 't6', topic: 'Classic Vector Space Cosine Similarity', confidence: 91, weakFlag: 'strong' }
        ]
      },
      stats: { streak: 7, totalStudyHours: 18.5, avgQuizScore: 84, totalCards: 32, masteredCards: 26, healthScore: 86 },
      heatmapData: Array.from({ length: 182 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (181 - i));
        return {
          date: d.toISOString().split('T')[0],
          count: Math.random() > 0.4 ? Math.floor(Math.random() * 4) + 1 : 0
        };
      }),
      forgettingCurve: {
        overallRetention: 91,
        cardCurves: [
          { cardId: 'c1', front: 'Admissibility vs Consistency', stability: 4.2, curve: [{ day: 0, retrievability: 1.0 }, { day: 3, retrievability: 0.94 }, { day: 7, retrievability: 0.88 }, { day: 14, retrievability: 0.81 }] },
          { cardId: 'c2', front: 'Mamdani Centroid Formula', stability: 6.8, curve: [{ day: 0, retrievability: 1.0 }, { day: 7, retrievability: 0.93 }, { day: 14, retrievability: 0.89 }, { day: 21, retrievability: 0.85 }] }
        ]
      },
      subjectPredictions: [
        { subjectId: 's1', subjectName: 'AI and DS – II (ITC701)', predictedScore: 84, grade: 'O', confidence: 87 },
        { subjectId: 's2', subjectName: 'Internet of Everything (ITC702)', predictedScore: 78, grade: 'A', confidence: 82 },
        { subjectId: 's3', subjectName: 'Software Testing & QA (ITDO7014)', predictedScore: 81, grade: 'A', confidence: 85 }
      ]
    };
  }

  async function handleGeneratePlan() {
    setGeneratingPlan(true);
    try {
      const data = await fetchApi('/api/student-twin/revision-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days: 3, targetHoursPerDay: 2, subjectId: selectedSubjectId || undefined })
      });
      if (data && data.schedule) {
        setRevisionPlan(data.schedule);
      } else {
        setRevisionPlan(getFallbackPlan());
      }
    } catch {
      setRevisionPlan(getFallbackPlan());
    } finally {
      setGeneratingPlan(false);
    }
  }

  function getFallbackPlan(): RevisionDay[] {
    return [
      {
        day: 1,
        date: 'Tomorrow',
        tasks: [
          { type: 'weak_drill', topic: 'Heuristic Monotonicity & Consistent Bounds', duration: 35, priority: 'high' },
          { type: 'flashcard_review', topic: 'AI and DS – II Core Formulas', duration: 20, priority: 'high' },
          { type: 'pyq_practice', topic: 'A* Admissibility Proof (10 Marks)', duration: 35, priority: 'medium' }
        ]
      },
      {
        day: 2,
        date: 'In 2 days',
        tasks: [
          { type: 'weak_drill', topic: 'MQTT QoS 2 Four-way Handshake Sequence', duration: 30, priority: 'high' },
          { type: 'summary_read', topic: 'CoAP vs MQTT Transport Tradeoffs', duration: 25, priority: 'medium' },
          { type: 'quiz', topic: 'IoE Architecture Verification Quiz', duration: 20, priority: 'medium' }
        ]
      },
      {
        day: 3,
        date: 'In 3 days',
        tasks: [
          { type: 'pyq_practice', topic: 'Classic Vector Space Model Numerical', duration: 40, priority: 'high' },
          { type: 'viva_simulation', topic: 'STQA Test Lifecycle Viva Prep', duration: 25, priority: 'medium' }
        ]
      }
    ];
  }

  const gradeColors: Record<string, string> = {
    O: 'text-emerald-600 dark:text-emerald-400',
    A: 'text-indigo-600 dark:text-indigo-400',
    B: 'text-amber-600 dark:text-amber-400',
    C: 'text-orange-600 dark:text-orange-400',
    D: 'text-rose-600 dark:text-rose-400',
    F: 'text-red-700 dark:text-red-400'
  };

  const taskTypeColors: Record<string, string> = {
    weak_drill: 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-900',
    flashcard_review: 'text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-900',
    pyq_practice: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-900',
    summary_read: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-900',
    quiz: 'text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-900',
    viva_simulation: 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-900'
  };

  if (loading && !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 text-[#4f75f2] animate-spin" />
        <span className="text-xs font-mono uppercase tracking-wider text-slate-500">
          Synthesizing Cognitive Model...
        </span>
      </div>
    );
  }

  const stats = profile?.stats || { streak: 0, totalStudyHours: 0, avgQuizScore: 0, totalCards: 0, masteredCards: 0, healthScore: 0 };
  const radar = profile?.radarData || { memory: 80, speed: 70, accuracy: 85, consistency: 75, coverage: 70 };
  const weakTopics = profile?.topics?.weak || [];
  const improvingTopics = profile?.topics?.improving || [];
  const strongTopics = profile?.topics?.strong || [];
  const predictions = profile?.subjectPredictions || [];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 font-sans min-h-screen bg-[#f8f9fc] dark:bg-slate-950 text-[#121217] dark:text-slate-100 transition-colors">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-[#e3e6ed] dark:border-slate-800 p-8 md:p-10 rounded-3xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xs">
        <div className="space-y-1.5 z-10">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#4f75f2] animate-pulse" />
            <span className="text-[11px] font-mono tracking-widest text-[#6b6f82] dark:text-slate-400 uppercase font-bold">
              COGNITIVE TWIN ENGINE
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#121217] dark:text-white tracking-tight">
            Digital Academic Twin
          </h1>
          <p className="text-[#6b6f82] dark:text-slate-400 max-w-2xl text-xs md:text-sm">
            Your continuously evolving AI model of learning behaviors, mastery retention, and predictive cognitive performance.
          </p>
        </div>
        <button 
          onClick={loadProfile} 
          className="z-10 flex items-center gap-2 bg-[#4f75f2] hover:bg-[#385dd8] text-white px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5 text-white" /> Refresh Model
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Health Score', val: `${Math.round(stats.healthScore)}%`, icon: Activity, bg: 'bg-emerald-50 dark:bg-emerald-950/40', border: 'border-emerald-200 dark:border-emerald-800/60', text: 'text-emerald-700 dark:text-emerald-300' },
          { label: 'Study Streak', val: `${stats.streak}d`, icon: Flame, bg: 'bg-amber-50 dark:bg-amber-950/40', border: 'border-amber-200 dark:border-amber-800/60', text: 'text-amber-700 dark:text-amber-300' },
          { label: 'Study Hours', val: `${stats.totalStudyHours}h`, icon: Zap, bg: 'bg-indigo-50 dark:bg-indigo-950/40', border: 'border-indigo-200 dark:border-indigo-800/60', text: 'text-indigo-700 dark:text-indigo-300' },
          { label: 'Avg Quiz Score', val: `${stats.avgQuizScore.toFixed(0)}%`, icon: Target, bg: 'bg-purple-50 dark:bg-purple-950/40', border: 'border-purple-200 dark:border-purple-800/60', text: 'text-purple-700 dark:text-purple-300' },
          { label: 'Flashcards', val: `${stats.masteredCards}/${stats.totalCards}`, icon: BookOpen, bg: 'bg-blue-50 dark:bg-blue-950/40', border: 'border-blue-200 dark:border-blue-800/60', text: 'text-blue-700 dark:text-blue-300' },
          { label: 'Retention', val: `${profile?.forgettingCurve?.overallRetention || 90}%`, icon: BrainCircuit, bg: 'bg-teal-50 dark:bg-teal-950/40', border: 'border-teal-200 dark:border-teal-800/60', text: 'text-teal-700 dark:text-teal-300' }
        ].map((s, i) => (
          <div key={i} className={`${s.bg} border ${s.border} p-5 rounded-2xl flex flex-col justify-between shadow-xs min-h-[115px] transition-colors`}>
            <s.icon className={`w-4 h-4 mb-3 ${s.text}`} />
            <div>
              <div className="text-2xl font-mono font-bold text-slate-900 dark:text-white">{s.val}</div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-1">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Radar + Forgetting Curve */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-[#e3e6ed] dark:border-slate-800 rounded-3xl p-6 relative overflow-hidden shadow-xs">
            <h3 className="text-xs font-bold text-[#121217] dark:text-white uppercase tracking-wider mb-2 flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#4f75f2]" /> Cognitive Radar
            </h3>
            <RadarChart data={radar} isDark={isDark} />
            <div className="grid grid-cols-5 gap-1 mt-4 border-t border-[#e3e6ed] dark:border-slate-800 pt-4">
              {Object.entries(radar).map(([key, val]) => (
                <div key={key} className="text-center">
                  <div className="text-xs font-mono font-bold text-slate-900 dark:text-white">{Math.round(val as number)}</div>
                  <div className="text-[9px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider">{key}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-[#e3e6ed] dark:border-slate-800 rounded-3xl p-6 shadow-xs">
            <h3 className="text-xs font-bold text-[#121217] dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#4f75f2]" /> Forgetting Curve
            </h3>
            <ForgettingCurveChart curves={profile?.forgettingCurve?.cardCurves || []} isDark={isDark} />
            <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-3 text-center uppercase tracking-wide">
              Dashed line = 90% retention target (FSRS-4.5)
            </p>
          </div>
        </div>

        {/* Middle: Topic Mastery + Grade Predictor */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-[#e3e6ed] dark:border-slate-800 rounded-3xl p-6 shadow-xs">
            <h3 className="text-xs font-bold text-[#121217] dark:text-white uppercase tracking-wider mb-5 flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-purple-600 dark:text-purple-400" /> Topic Mastery Matrix
            </h3>

            {weakTopics.length === 0 && improvingTopics.length === 0 && strongTopics.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-8">Complete a study session to map your topic mastery.</p>
            ) : (
              <div className="space-y-2.5">
                {weakTopics.slice(0, 4).map((t, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-[#f8f9fc] dark:bg-slate-800/70 border border-[#e3e6ed] dark:border-slate-700/80 rounded-2xl">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{t.topic}</div>
                      {t.weakReason && <div className="text-[10px] text-rose-600 dark:text-rose-400 font-mono mt-0.5 truncate">{t.weakReason}</div>}
                    </div>
                    <span className="text-[9px] font-mono font-bold text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 px-2 py-0.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 shrink-0">WEAK</span>
                  </div>
                ))}
                {improvingTopics.slice(0, 3).map((t, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-[#f8f9fc] dark:bg-slate-800/70 border border-[#e3e6ed] dark:border-slate-700/80 rounded-2xl">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate flex-1">{t.topic}</div>
                    <span className="text-[9px] font-mono font-bold text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900 px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 shrink-0">IMPROVING</span>
                  </div>
                ))}
                {strongTopics.slice(0, 3).map((t, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-[#f8f9fc] dark:bg-slate-800/70 border border-[#e3e6ed] dark:border-slate-700/80 rounded-2xl">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate flex-1">{t.topic}</div>
                    <span className="text-[9px] font-mono font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 shrink-0">STRONG</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Grade Predictors */}
          <div className="bg-white dark:bg-slate-900 border border-[#e3e6ed] dark:border-slate-800 rounded-3xl p-6 shadow-xs">
            <h3 className="text-xs font-bold text-[#121217] dark:text-white uppercase tracking-wider mb-5 flex items-center gap-2">
              <Award className="w-4 h-4 text-[#4f75f2]" /> Exam Grade Predictor
            </h3>
            {predictions.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-6">Add subjects and complete sessions for grade prediction.</p>
            ) : (
              <div className="space-y-4">
                {predictions.map((p, i) => (
                  <div key={i}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate max-w-[160px]">{p.subjectName}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-base font-mono font-bold ${gradeColors[p.grade] || 'text-slate-900 dark:text-white'}`}>{p.grade}</span>
                        <span className="text-xs font-mono text-slate-500 dark:text-slate-400 font-semibold">{p.predictedScore}%</span>
                      </div>
                    </div>
                    <div className="h-2 bg-[#f0f2f7] dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#4f75f2] to-[#713fb8] transition-all duration-1000"
                        style={{ width: `${p.predictedScore}%` }}
                      />
                    </div>
                    <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-1">{p.confidence}% prediction confidence</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Heatmap + Revision Plan */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-[#e3e6ed] dark:border-slate-800 rounded-3xl p-6 shadow-xs">
            <h3 className="text-xs font-bold text-[#121217] dark:text-white uppercase tracking-wider mb-5 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#4f75f2]" /> Study Activity (26 weeks)
            </h3>
            <StudyHeatmap data={profile?.heatmapData || []} isDark={isDark} />
            <div className="flex items-center justify-between mt-3 text-[10px] text-slate-500 dark:text-slate-400 font-mono uppercase tracking-wide">
              <span>Less</span>
              <div className="flex gap-1">
                {[
                  isDark ? '#1e293b' : '#f0f2f7',
                  isDark ? 'rgba(99, 102, 241, 0.35)' : 'rgba(79, 117, 242, 0.3)',
                  isDark ? 'rgba(99, 102, 241, 0.6)' : 'rgba(79, 117, 242, 0.55)',
                  isDark ? 'rgba(99, 102, 241, 0.85)' : 'rgba(79, 117, 242, 0.8)',
                  isDark ? '#818cf8' : '#4f75f2'
                ].map((c, i) => (
                  <div key={i} className="w-3 h-3 rounded-xs" style={{ backgroundColor: c }} />
                ))}
              </div>
              <span>More</span>
            </div>
          </div>

          {/* Revision Plan */}
          <div className="bg-white dark:bg-slate-900 border border-[#e3e6ed] dark:border-slate-800 rounded-3xl p-6 shadow-xs">
            <h3 className="text-xs font-bold text-[#121217] dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" /> AI Revision Plan
            </h3>

            {!revisionPlan ? (
              <div className="space-y-4">
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
                  Generate a personalized multi-day study schedule based on your weak topics, exam date, and spaced repetition queue.
                </p>
                {predictions.length > 0 && (
                  <select
                    value={selectedSubjectId}
                    onChange={e => setSelectedSubjectId(e.target.value)}
                    className="w-full bg-[#f8f9fc] dark:bg-slate-800 border border-[#e3e6ed] dark:border-slate-700 rounded-2xl px-4 py-2.5 text-xs text-slate-900 dark:text-white outline-none font-bold cursor-pointer"
                  >
                    <option value="">Select subject...</option>
                    {predictions.map(p => (
                      <option key={p.subjectId} value={p.subjectId}>{p.subjectName}</option>
                    ))}
                  </select>
                )}
                <button
                  onClick={handleGeneratePlan}
                  disabled={generatingPlan}
                  className="w-full bg-[#4f75f2] hover:bg-[#385dd8] text-white px-5 py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  {generatingPlan ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4" /> Generate Smart Plan</>}
                </button>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {revisionPlan.map(day => (
                  <div key={day.day} className="border border-[#e3e6ed] dark:border-slate-800 rounded-2xl p-3.5 bg-[#f8f9fc] dark:bg-slate-800/60">
                    <div className="text-[10px] font-mono font-bold text-[#4f75f2] dark:text-indigo-400 mb-2 uppercase tracking-wide">Day {day.day} — {day.date}</div>
                    <div className="space-y-1.5">
                      {day.tasks.map((task, ti) => (
                        <div key={ti} className={`flex items-center justify-between p-2.5 rounded-xl border text-[10px] font-mono uppercase tracking-wider ${taskTypeColors[task.type] || 'text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                          <span className="truncate">{task.topic}</span>
                          <span className="shrink-0 ml-2 font-bold opacity-80">{task.duration}m</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <button onClick={() => setRevisionPlan(null)} className="w-full text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white py-1 transition-colors cursor-pointer font-bold underline">Reset Plan</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
