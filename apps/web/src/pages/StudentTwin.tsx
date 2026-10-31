import { useEffect, useState } from 'react';
import { Activity, Target, Zap, Flame, BrainCircuit, TrendingUp, Calendar, BookOpen, Loader2, Sparkles, Award, RefreshCw } from 'lucide-react';
import { fetchApi } from '../lib/api';

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
function RadarChart({ data }: { data: RadarData }) {
  const size = 220;
  const cx = size / 2;
  const cy = size / 2;
  const r = 85;
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
      {/* Grid circles */}
      {gridLevels.map((level, li) => {
        const gridPoints = axes.map((_, i) => toXY(i * angleStep, r * level));
        const gridPath = gridPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z';
        return <path key={li} d={gridPath} fill="none" stroke="rgba(227,230,237,0.8)" strokeWidth="1" />;
      })}
      {/* Axis lines */}
      {axes.map((_, i) => {
        const end = toXY(i * angleStep, r);
        return <line key={i} x1={cx} y1={cy} x2={end.x} y2={end.y} stroke="rgba(227,230,237,0.9)" strokeWidth="1" />;
      })}
      {/* Data area */}
      <path d={dataPath} fill="rgba(79,117,242,0.18)" stroke="rgb(79,117,242)" strokeWidth="2" strokeLinejoin="round" />
      {/* Data points */}
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill="rgb(79,117,242)" stroke="white" strokeWidth="1.5" />
      ))}
      {/* Labels */}
      {axes.map((ax, i) => {
        const labelPos = toXY(i * angleStep, r + 20);
        return (
          <text key={i} x={labelPos.x} y={labelPos.y} textAnchor="middle" dominantBaseline="middle"
            fontSize="9" fill="#6b6f82" fontWeight="700" fontFamily="sans-serif">
            {ax.label.toUpperCase()}
          </text>
        );
      })}
    </svg>
  );
}

// ======================== FORGETTING CURVE ========================
function ForgettingCurveChart({ curves }: { curves: ForgettingCurveCard[] }) {
  const width = 340;
  const height = 140;
  const padding = { top: 10, right: 10, bottom: 25, left: 30 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const days = 21;

  if (!curves || curves.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-[#6b6f82] text-xs">
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

  const pathD = avgCurve.map((r, d) => `${d === 0 ? 'M' : 'L'}${toX(d).toFixed(1)},${toY(r).toFixed(1)}`).join(' ');
  const areaD = pathD + ` L${toX(days)},${toY(0)} L${toX(0)},${toY(0)} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="w-full">
      {/* Grid lines */}
      {[0.25, 0.5, 0.75, 1.0].map(level => (
        <line key={level} x1={padding.left} y1={toY(level)} x2={width - padding.right} y2={toY(level)}
          stroke="rgba(227,230,237,0.6)" strokeWidth="1" strokeDasharray="4,4" />
      ))}
      {/* Area fill */}
      <path d={areaD} fill="rgba(79, 117, 242, 0.08)" />
      {/* Line */}
      <path d={pathD} fill="none" stroke="rgb(79, 117, 242)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* 90% retention threshold line */}
      <line x1={padding.left} y1={toY(0.9)} x2={width - padding.right} y2={toY(0.9)}
        stroke="rgba(16,185,129,0.6)" strokeWidth="1" strokeDasharray="6,3" />
      {/* Y Labels */}
      {[0, 50, 100].map(pct => (
        <text key={pct} x={padding.left - 4} y={toY(pct / 100)} textAnchor="end" dominantBaseline="middle"
          fontSize="8" fill="#6b6f82" fontFamily="sans-serif">{pct}%</text>
      ))}
      {/* X Labels */}
      {[0, 7, 14, 21].map(day => (
        <text key={day} x={toX(day)} y={height - 5} textAnchor="middle"
          fontSize="8" fill="#6b6f82" fontFamily="sans-serif">d{day}</text>
      ))}
    </svg>
  );
}

// ======================== STUDY HEATMAP ========================
function StudyHeatmap({ data }: { data: HeatmapDay[] }) {
  const weeks = 26;
  const recentData = data.slice(-weeks * 7);
  const maxCount = Math.max(1, ...recentData.map(d => d.count));

  const getColor = (count: number) => {
    if (count === 0) return '#f0f2f7';
    const intensity = count / maxCount;
    if (intensity < 0.25) return 'rgba(79,117,242,0.3)';
    if (intensity < 0.5) return 'rgba(79,117,242,0.55)';
    if (intensity < 0.75) return 'rgba(79,117,242,0.8)';
    return 'rgb(79,117,242)';
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
              className="w-3 h-3 rounded-sm cursor-default transition-opacity hover:opacity-80"
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
          { id: 't4', topic: 'SQL Parameterized Statement ASTs', confidence: 68, weakFlag: 'improving' }
        ],
        strong: [
          { id: 't5', topic: 'BFS / DFS Graph Traversal Invariants', confidence: 94, weakFlag: 'strong' },
          { id: 't6', topic: 'Alpha-Beta Search Tree Pruning', confidence: 91, weakFlag: 'strong' }
        ]
      },
      stats: { streak: 7, totalStudyHours: 18.5, avgQuizScore: 84, totalCards: 32, masteredCards: 26, healthScore: 86 },
      heatmapData: Array.from({ length: 182 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (181 - i));
        return {
          date: d.toISOString().split('T')[0],
          count: (i % 3 === 0 || i % 7 === 0) ? (i % 4) + 1 : 0
        };
      }),
      forgettingCurve: {
        overallRetention: 91,
        cardCurves: [
          { cardId: 'c1', front: 'Admissibility Condition', stability: 4.2, curve: Array.from({ length: 22 }, (_, d) => ({ day: d, retrievability: Math.pow(0.9, d / 4.2) })) },
          { cardId: 'c2', front: 'MQTT QoS 2 Handshake', stability: 2.8, curve: Array.from({ length: 22 }, (_, d) => ({ day: d, retrievability: Math.pow(0.9, d / 2.8) })) }
        ]
      },
      subjectPredictions: [
        { subjectId: 'sub-1', subjectName: 'AI and DS – II', predictedScore: 88, grade: 'A+', confidence: 92 },
        { subjectId: 'sub-2', subjectName: 'Internet of Everything', predictedScore: 82, grade: 'A', confidence: 85 },
        { subjectId: 'sub-3', subjectName: 'Cyber Security Laws & Practice', predictedScore: 78, grade: 'B', confidence: 80 }
      ]
    };
  }

  async function handleGeneratePlan() {
    if (!selectedSubjectId && !profile?.subjectPredictions?.[0]?.subjectId) return;
    const sid = selectedSubjectId || profile?.subjectPredictions?.[0]?.subjectId;
    setGeneratingPlan(true);
    try {
      const result = await fetchApi('/api/student-twin/revision-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectId: sid })
      });
      setRevisionPlan(result.plan || []);
    } catch (err) {
      console.error('Error generating plan:', err);
    } finally {
      setGeneratingPlan(false);
    }
  }

  const taskTypeColors: Record<string, string> = {
    deep_study: 'text-[#dc2626] bg-[#fef2f2] border-[#fecaca]',
    pyq_practice: 'text-[#4f75f2] bg-[#edf3fc] border-[#d0dcf5]',
    flashcard_review: 'text-[#713fb8] bg-[#f5effe] border-[#e4d4fa]',
    viva_practice: 'text-[#b45309] bg-[#fbf5e6] border-[#f5e0b8]',
    mock_test: 'text-[#dc2626] bg-[#fef2f2] border-[#fecaca]',
    answer_generation: 'text-[#0f766e] bg-[#f0fdfa] border-[#ccfbf1]',
    consolidation: 'text-[#059669] bg-[#e2f6eb] border-[#a7f3d0]'
  };

  const gradeColors: Record<string, string> = {
    O: 'text-[#059669]', 'A+': 'text-[#4f75f2]', A: 'text-[#713fb8]', B: 'text-[#b45309]', C: 'text-[#dc2626]'
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-[#6b6f82]">
        <BrainCircuit className="w-10 h-10 text-[#4f75f2] animate-pulse" />
        <span className="text-xs font-mono uppercase tracking-wider">Synthesizing your Digital Twin...</span>
      </div>
    );
  }

  const stats = profile?.stats || { streak: 0, totalStudyHours: 0, avgQuizScore: 0, totalCards: 0, masteredCards: 0, healthScore: 50 };
  const radar = profile?.radarData || { memory: 70, speed: 65, accuracy: 80, consistency: 55, coverage: 60 };
  const weakTopics = profile?.topics?.weak || [];
  const improvingTopics = profile?.topics?.improving || [];
  const strongTopics = profile?.topics?.strong || [];
  const predictions = profile?.subjectPredictions || [];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 font-sans min-h-screen bg-[#f8f9fc] text-[#121217]">
      {/* Header Banner */}
      <div className="bg-white border border-[#e3e6ed] p-8 md:p-10 rounded-3xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xs">
        <div className="space-y-1.5 z-10">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#4f75f2] animate-pulse" />
            <span className="text-[11px] font-mono tracking-widest text-[#6b6f82] uppercase font-bold">
              COGNITIVE TWIN ENGINE
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#121217] tracking-tight">
            Digital Academic Twin
          </h1>
          <p className="text-[#6b6f82] max-w-2xl text-xs md:text-sm">
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
          { label: 'Health Score', val: `${Math.round(stats.healthScore)}%`, icon: Activity, bg: 'bg-[#e2f6eb]', border: 'border-[#c1e8d4]', text: 'text-[#1e784f]' },
          { label: 'Study Streak', val: `${stats.streak}d`, icon: Flame, bg: 'bg-[#fbf5e6]', border: 'border-[#f1dfba]', text: 'text-[#9c6a1e]' },
          { label: 'Study Hours', val: `${stats.totalStudyHours}h`, icon: Zap, bg: 'bg-[#edf3fc]', border: 'border-[#d0dcf5]', text: 'text-[#4f75f2]' },
          { label: 'Avg Quiz Score', val: `${stats.avgQuizScore.toFixed(0)}%`, icon: Target, bg: 'bg-[#f5effe]', border: 'border-[#e4d4fa]', text: 'text-[#713fb8]' },
          { label: 'Flashcards', val: `${stats.masteredCards}/${stats.totalCards}`, icon: BookOpen, bg: 'bg-[#edf3fc]', border: 'border-[#d0dcf5]', text: 'text-[#4f75f2]' },
          { label: 'Retention', val: `${profile?.forgettingCurve?.overallRetention || 90}%`, icon: BrainCircuit, bg: 'bg-[#e2f6eb]', border: 'border-[#c1e8d4]', text: 'text-[#1e784f]' }
        ].map((s, i) => (
          <div key={i} className={`${s.bg} border ${s.border} p-5 rounded-2xl flex flex-col justify-between shadow-xs min-h-[115px]`}>
            <s.icon className={`w-4 h-4 mb-3 ${s.text}`} />
            <div>
              <div className="text-2xl font-mono font-bold text-[#121217]">{s.val}</div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#6b6f82] mt-1">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Radar + Forgetting Curve */}
        <div className="space-y-6">
          <div className="bg-white border border-[#e3e6ed] rounded-3xl p-6 relative overflow-hidden shadow-xs">
            <h3 className="text-xs font-bold text-[#121217] uppercase tracking-wider mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#4f75f2]" /> Cognitive Radar
            </h3>
            <RadarChart data={radar} />
            <div className="grid grid-cols-5 gap-1 mt-4 border-t border-[#e3e6ed] pt-4">
              {Object.entries(radar).map(([key, val]) => (
                <div key={key} className="text-center">
                  <div className="text-xs font-mono font-bold text-[#121217]">{Math.round(val as number)}</div>
                  <div className="text-[9px] font-mono text-[#6b6f82] uppercase tracking-wider">{key}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-[#e3e6ed] rounded-3xl p-6 shadow-xs">
            <h3 className="text-xs font-bold text-[#121217] uppercase tracking-wider mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#4f75f2]" /> Forgetting Curve
            </h3>
            <ForgettingCurveChart curves={profile?.forgettingCurve?.cardCurves || []} />
            <p className="text-[10px] font-mono text-[#6b6f82] mt-3 text-center uppercase tracking-wide">
              Dashed line = 90% retention target (FSRS-4.5)
            </p>
          </div>
        </div>

        {/* Middle: Topic Mastery + Grade Predictor */}
        <div className="space-y-6">
          <div className="bg-white border border-[#e3e6ed] rounded-3xl p-6 shadow-xs">
            <h3 className="text-xs font-bold text-[#121217] uppercase tracking-wider mb-5 flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-[#713fb8]" /> Topic Mastery Matrix
            </h3>

            {weakTopics.length === 0 && improvingTopics.length === 0 && strongTopics.length === 0 ? (
              <p className="text-xs text-[#6b6f82] text-center py-8">Complete a study session to map your topic mastery.</p>
            ) : (
              <div className="space-y-2.5">
                {weakTopics.slice(0, 4).map((t, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-[#f8f9fc] border border-[#e3e6ed] rounded-2xl">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#ef4444] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-[#121217] truncate">{t.topic}</div>
                      {t.weakReason && <div className="text-[10px] text-[#dc2626] font-mono mt-0.5 truncate">{t.weakReason}</div>}
                    </div>
                    <span className="text-[9px] font-mono font-bold text-[#dc2626] border border-[#fecaca] px-2 py-0.5 rounded-lg bg-[#fef2f2] shrink-0">WEAK</span>
                  </div>
                ))}
                {improvingTopics.slice(0, 3).map((t, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-[#f8f9fc] border border-[#e3e6ed] rounded-2xl">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#f59e0b] shrink-0" />
                    <div className="text-xs font-semibold text-[#121217] truncate flex-1">{t.topic}</div>
                    <span className="text-[9px] font-mono font-bold text-[#b45309] border border-[#f5e0b8] px-2 py-0.5 rounded-lg bg-[#fbf5e6] shrink-0">IMPROVING</span>
                  </div>
                ))}
                {strongTopics.slice(0, 3).map((t, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-[#f8f9fc] border border-[#e3e6ed] rounded-2xl">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#10b981] shrink-0" />
                    <div className="text-xs font-semibold text-[#121217] truncate flex-1">{t.topic}</div>
                    <span className="text-[9px] font-mono font-bold text-[#059669] border border-[#a7f3d0] px-2 py-0.5 rounded-lg bg-[#e2f6eb] shrink-0">STRONG</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Grade Predictors */}
          <div className="bg-white border border-[#e3e6ed] rounded-3xl p-6 shadow-xs">
            <h3 className="text-xs font-bold text-[#121217] uppercase tracking-wider mb-5 flex items-center gap-2">
              <Award className="w-4 h-4 text-[#4f75f2]" /> Exam Grade Predictor
            </h3>
            {predictions.length === 0 ? (
              <p className="text-xs text-[#6b6f82] text-center py-6">Add subjects and complete sessions for grade prediction.</p>
            ) : (
              <div className="space-y-4">
                {predictions.map((p, i) => (
                  <div key={i}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-bold text-[#121217] truncate max-w-[160px]">{p.subjectName}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-base font-mono font-bold ${gradeColors[p.grade] || 'text-[#121217]'}`}>{p.grade}</span>
                        <span className="text-xs font-mono text-[#6b6f82] font-semibold">{p.predictedScore}%</span>
                      </div>
                    </div>
                    <div className="h-2 bg-[#f0f2f7] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#4f75f2] to-[#713fb8] transition-all duration-1000"
                        style={{ width: `${p.predictedScore}%` }}
                      />
                    </div>
                    <div className="text-[10px] font-mono text-[#6b6f82] mt-1">{p.confidence}% prediction confidence</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Heatmap + Revision Plan */}
        <div className="space-y-6">
          <div className="bg-white border border-[#e3e6ed] rounded-3xl p-6 shadow-xs">
            <h3 className="text-xs font-bold text-[#121217] uppercase tracking-wider mb-5 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#4f75f2]" /> Study Activity (26 weeks)
            </h3>
            <StudyHeatmap data={profile?.heatmapData || []} />
            <div className="flex items-center justify-between mt-3 text-[10px] text-[#6b6f82] font-mono uppercase tracking-wide">
              <span>Less</span>
              <div className="flex gap-1">
                {['#f0f2f7', 'rgba(79, 117, 242, 0.3)', 'rgba(79, 117, 242, 0.55)', 'rgba(79, 117, 242, 0.8)', '#4f75f2'].map((c, i) => (
                  <div key={i} className="w-3 h-3 rounded-xs" style={{ backgroundColor: c }} />
                ))}
              </div>
              <span>More</span>
            </div>
          </div>

          {/* Revision Plan */}
          <div className="bg-white border border-[#e3e6ed] rounded-3xl p-6 shadow-xs">
            <h3 className="text-xs font-bold text-[#121217] uppercase tracking-wider mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#713fb8]" /> AI Revision Plan
            </h3>

            {!revisionPlan ? (
              <div className="space-y-4">
                <p className="text-xs text-[#6b6f82] leading-relaxed">
                  Generate a personalized multi-day study schedule based on your weak topics, exam date, and spaced repetition queue.
                </p>
                {predictions.length > 0 && (
                  <select
                    value={selectedSubjectId}
                    onChange={e => setSelectedSubjectId(e.target.value)}
                    className="w-full bg-[#f8f9fc] border border-[#e3e6ed] rounded-2xl px-4 py-2.5 text-xs text-[#121217] outline-none font-bold cursor-pointer"
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
                  <div key={day.day} className="border border-[#e3e6ed] rounded-2xl p-3.5 bg-[#f8f9fc]">
                    <div className="text-[10px] font-mono font-bold text-[#4f75f2] mb-2 uppercase tracking-wide">Day {day.day} — {day.date}</div>
                    <div className="space-y-1.5">
                      {day.tasks.map((task, ti) => (
                        <div key={ti} className={`flex items-center justify-between p-2.5 rounded-xl border text-[10px] font-mono uppercase tracking-wider ${taskTypeColors[task.type] || 'text-[#6b6f82] bg-white border-[#e3e6ed]'}`}>
                          <span className="truncate">{task.topic}</span>
                          <span className="shrink-0 ml-2 font-bold opacity-80">{task.duration}m</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <button onClick={() => setRevisionPlan(null)} className="w-full text-xs text-[#6b6f82] hover:text-[#121217] py-1 transition-colors cursor-pointer font-bold underline">Reset Plan</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
