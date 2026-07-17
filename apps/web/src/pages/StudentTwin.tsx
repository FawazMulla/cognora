import { useEffect, useState } from 'react';
import { Activity, Target, Zap, Flame, UserCircle, BrainCircuit, TrendingUp, Calendar, BookOpen, Loader2, Sparkles, Award, RefreshCw, ChevronRight } from 'lucide-react';
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
        return <path key={li} d={gridPath} fill="none" stroke="rgba(148,163,184,0.15)" strokeWidth="1" />;
      })}
      {/* Axis lines */}
      {axes.map((_, i) => {
        const end = toXY(i * angleStep, r);
        return <line key={i} x1={cx} y1={cy} x2={end.x} y2={end.y} stroke="rgba(148,163,184,0.2)" strokeWidth="1" />;
      })}
      {/* Data area */}
      <path d={dataPath} fill="rgba(99,102,241,0.25)" stroke="rgb(99,102,241)" strokeWidth="2" strokeLinejoin="round" />
      {/* Data points */}
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill="rgb(99,102,241)" stroke="white" strokeWidth="1.5" />
      ))}
      {/* Labels */}
      {axes.map((ax, i) => {
        const labelPos = toXY(i * angleStep, r + 20);
        return (
          <text key={i} x={labelPos.x} y={labelPos.y} textAnchor="middle" dominantBaseline="middle"
            fontSize="9" fill="rgb(148,163,184)" fontWeight="600" fontFamily="sans-serif">
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
      <div className="flex items-center justify-center h-32 text-slate-600 text-xs">
        No flashcard data yet
      </div>
    );
  }

  // Average curve across all cards
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
          stroke="rgba(148,163,184,0.1)" strokeWidth="1" strokeDasharray="4,4" />
      ))}
      {/* Area fill */}
      <path d={areaD} fill="rgba(24, 99, 220, 0.06)" />
      {/* Line */}
      <path d={pathD} fill="none" stroke="rgb(24, 99, 220)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* 90% retention threshold line */}
      <line x1={padding.left} y1={toY(0.9)} x2={width - padding.right} y2={toY(0.9)}
        stroke="rgba(52,211,153,0.5)" strokeWidth="1" strokeDasharray="6,3" />
      {/* Y Labels */}
      {[0, 50, 100].map(pct => (
        <text key={pct} x={padding.left - 4} y={toY(pct / 100)} textAnchor="end" dominantBaseline="middle"
          fontSize="8" fill="rgb(100,116,139)" fontFamily="sans-serif">{pct}%</text>
      ))}
      {/* X Labels */}
      {[0, 7, 14, 21].map(day => (
        <text key={day} x={toX(day)} y={height - 5} textAnchor="middle"
          fontSize="8" fill="rgb(100,116,139)" fontFamily="sans-serif">d{day}</text>
      ))}
    </svg>
  );
}

// ======================== STUDY HEATMAP ========================
function StudyHeatmap({ data }: { data: HeatmapDay[] }) {
  const weeks = 26; // Last 26 weeks
  const recentData = data.slice(-weeks * 7);
  const maxCount = Math.max(1, ...recentData.map(d => d.count));

  const getColor = (count: number) => {
    if (count === 0) return 'rgba(30,41,59,0.8)';
    const intensity = count / maxCount;
    if (intensity < 0.25) return 'rgba(99,102,241,0.3)';
    if (intensity < 0.5) return 'rgba(99,102,241,0.55)';
    if (intensity < 0.75) return 'rgba(99,102,241,0.75)';
    return 'rgba(99,102,241,1)';
  };

  // Group into weeks
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
      setProfile(data);
    } catch (err) {
      console.error('Error loading twin profile:', err);
    } finally {
      setLoading(false);
    }
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
    deep_study: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    pyq_practice: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    flashcard_review: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    viva_practice: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    mock_test: 'text-red-400 bg-red-500/10 border-red-500/20',
    answer_generation: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
    consolidation: 'text-green-400 bg-green-500/10 border-green-500/20'
  };

  const gradeColors: Record<string, string> = {
    O: 'text-emerald-400', 'A+': 'text-blue-400', A: 'text-indigo-400', B: 'text-amber-400', C: 'text-rose-400'
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-slate-400">
        <BrainCircuit className="w-12 h-12 text-purple-500 animate-pulse" />
        <span className="text-sm font-medium">Synthesizing your Digital Twin...</span>
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
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 font-sans min-h-screen bg-white">
      {/* Cohere Deep Green Dark Feature Band Header */}
      <div className="bg-[#003c33] text-white p-8 md:p-12 rounded-lg relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-3 z-10">
          <div className="text-[10px] font-mono tracking-widest uppercase text-[#ff7759] font-bold">Cohere Academic Analytics</div>
          <h1 className="text-3xl md:text-5xl font-display font-light tracking-tight flex items-center gap-3">
            <UserCircle className="w-8 h-8 md:w-12 h-12 text-[#ff7759]" />
            DIGITAL ACADEMIC TWIN
          </h1>
          <p className="text-gray-300 max-w-2xl text-xs md:text-sm">
            Your continuously evolving AI model of learning behaviors, mastery, and cognitive performance.
          </p>
        </div>
        <button 
          onClick={loadProfile} 
          className="z-10 flex items-center gap-2 bg-transparent hover:bg-white/10 border border-white/30 text-white px-5 py-2.5 rounded-full text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Model
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Health Score', val: `${Math.round(stats.healthScore)}%`, icon: Activity, color: 'text-[#003c33]' },
          { label: 'Study Streak', val: `${stats.streak}d`, icon: Flame, color: 'text-[#ff7759]' },
          { label: 'Study Hours', val: `${stats.totalStudyHours}h`, icon: Zap, color: 'text-[#212121]' },
          { label: 'Avg Quiz Score', val: `${stats.avgQuizScore.toFixed(0)}%`, icon: Target, color: 'text-[#1863dc]' },
          { label: 'Flashcards', val: `${stats.masteredCards}/${stats.totalCards}`, icon: BookOpen, color: 'text-[#1863dc]' },
          { label: 'Retention', val: `${profile?.forgettingCurve?.overallRetention || 90}%`, icon: BrainCircuit, color: 'text-[#9b60aa]' }
        ].map((s, i) => (
          <div key={i} className="bg-[#eeece7] border border-[#d9d9dd] p-5 rounded flex flex-col justify-between shadow-none min-h-[120px]">
            <s.icon className={`w-4 h-4 mb-4 ${s.color}`} />
            <div>
              <div className="text-2xl font-mono font-bold text-black">{s.val}</div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#75758a] mt-1">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Radar + Forgetting Curve */}
        <div className="space-y-6">
          <div className="bg-white border border-[#d9d9dd] rounded-lg p-6 relative overflow-hidden">
            <h3 className="text-xs font-mono font-bold text-black uppercase tracking-wider mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#1863dc]" /> Cognitive Radar
            </h3>
            <RadarChart data={radar} />
            <div className="grid grid-cols-5 gap-1 mt-4 border-t border-[#d9d9dd] pt-4">
              {Object.entries(radar).map(([key, val]) => (
                <div key={key} className="text-center">
                  <div className="text-xs font-mono font-bold text-black">{Math.round(val as number)}</div>
                  <div className="text-[9px] font-mono text-[#75758a] uppercase tracking-wider">{key}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-[#d9d9dd] rounded-lg p-6">
            <h3 className="text-xs font-mono font-bold text-black uppercase tracking-wider mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#1863dc]" /> Forgetting Curve
            </h3>
            <ForgettingCurveChart curves={profile?.forgettingCurve?.cardCurves || []} />
            <p className="text-[10px] font-mono text-[#75758a] mt-3 text-center uppercase tracking-wide">
              Dashed line = 90% retention target (FSRS-4.5)
            </p>
          </div>
        </div>

        {/* Middle: Topic Mastery + Grade Predictor */}
        <div className="space-y-6">
          <div className="bg-white border border-[#d9d9dd] rounded-lg p-6">
            <h3 className="text-xs font-mono font-bold text-black uppercase tracking-wider mb-5 flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-[#ff7759]" /> Topic Mastery Matrix
            </h3>

            {weakTopics.length === 0 && improvingTopics.length === 0 && strongTopics.length === 0 ? (
              <p className="text-xs text-[#75758a] text-center py-8">Complete a study session to map your topic mastery.</p>
            ) : (
              <div className="space-y-2.5">
                {weakTopics.slice(0, 4).map((t, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-[#eeece7] border border-[#d9d9dd] rounded">
                    <div className="w-2 h-2 rounded-full bg-[#ff7759] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-black truncate">{t.topic}</div>
                      {t.weakReason && <div className="text-[10px] text-[#ff7759] font-mono mt-0.5 truncate">{t.weakReason}</div>}
                    </div>
                    <span className="text-[9px] font-mono font-bold text-[#ff7759] border border-[#ffad9b] px-1.5 py-0.5 rounded bg-white shrink-0">WEAK</span>
                  </div>
                ))}
                {improvingTopics.slice(0, 3).map((t, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-[#eeece7] border border-[#d9d9dd] rounded">
                    <div className="w-2 h-2 rounded-full bg-[#1863dc] shrink-0" />
                    <div className="text-xs font-medium text-black truncate flex-1">{t.topic}</div>
                    <span className="text-[9px] font-mono font-bold text-[#1863dc] border border-[#1863dc]/30 px-1.5 py-0.5 rounded bg-white shrink-0">IMPROVING</span>
                  </div>
                ))}
                {strongTopics.slice(0, 3).map((t, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-[#eeece7] border border-[#d9d9dd] rounded">
                    <div className="w-2 h-2 rounded-full bg-[#003c33] shrink-0" />
                    <div className="text-xs font-medium text-black truncate flex-1">{t.topic}</div>
                    <span className="text-[9px] font-mono font-bold text-[#003c33] border border-[#003c33]/30 px-1.5 py-0.5 rounded bg-white shrink-0">STRONG</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Grade Predictors */}
          <div className="bg-white border border-[#d9d9dd] rounded-lg p-6">
            <h3 className="text-xs font-mono font-bold text-black uppercase tracking-wider mb-5 flex items-center gap-2">
              <Award className="w-4 h-4 text-[#1863dc]" /> Exam Grade Predictor
            </h3>
            {predictions.length === 0 ? (
              <p className="text-xs text-[#75758a] text-center py-6">Add subjects and complete sessions for grade prediction.</p>
            ) : (
              <div className="space-y-4">
                {predictions.map((p, i) => (
                  <div key={i}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-semibold text-black truncate max-w-[160px]">{p.subjectName}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-base font-mono font-bold ${gradeColors[p.grade] || 'text-[#212121]'}`}>{p.grade}</span>
                        <span className="text-xs font-mono text-[#75758a]">{p.predictedScore}%</span>
                      </div>
                    </div>
                    <div className="h-1 bg-[#eeece7] rounded overflow-hidden">
                      <div
                        className="h-full bg-black transition-all duration-1000"
                        style={{ width: `${p.predictedScore}%` }}
                      />
                    </div>
                    <div className="text-[9px] font-mono text-[#75758a] mt-1">{p.confidence}% prediction confidence</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Heatmap + Revision Plan */}
        <div className="space-y-6">
          <div className="bg-white border border-[#d9d9dd] rounded-lg p-6">
            <h3 className="text-xs font-mono font-bold text-black uppercase tracking-wider mb-5 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#003c33]" /> Study Activity (26 weeks)
            </h3>
            <StudyHeatmap data={profile?.heatmapData || []} />
            <div className="flex items-center justify-between mt-3 text-[10px] text-[#75758a] font-mono uppercase tracking-wide">
              <span>Less</span>
              <div className="flex gap-1">
                {['#eeece7', 'rgba(24, 99, 220, 0.2)', 'rgba(24, 99, 220, 0.45)', 'rgba(24, 99, 220, 0.7)', '#1863dc'].map((c, i) => (
                  <div key={i} className="w-3 h-3 rounded-sm" style={{ backgroundColor: c }} />
                ))}
              </div>
              <span>More</span>
            </div>
          </div>

          {/* Revision Plan */}
          <div className="bg-white border border-[#d9d9dd] rounded-lg p-6">
            <h3 className="text-xs font-mono font-bold text-black uppercase tracking-wider mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#ff7759] animate-pulse" /> AI Revision Plan
            </h3>

            {!revisionPlan ? (
              <div className="space-y-4">
                <p className="text-xs text-[#75758a] leading-relaxed">
                  Generate a personalized multi-day study schedule based on your weak topics, exam date, and spaced repetition queue.
                </p>
                {predictions.length > 0 && (
                  <select
                    value={selectedSubjectId}
                    onChange={e => setSelectedSubjectId(e.target.value)}
                    className="w-full bg-white border border-[#d9d9dd] rounded px-3 py-2 text-xs text-black outline-none focus:border-[#9b60aa] cursor-pointer font-sans"
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
                  className="w-full bg-black hover:bg-zinc-800 text-white px-4 py-2.5 rounded-full text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 font-sans"
                >
                  {generatingPlan ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...</> : <><Sparkles className="w-3.5 h-3.5" /> Generate Smart Plan</>}
                </button>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {revisionPlan.map(day => (
                  <div key={day.day} className="border border-[#d9d9dd] rounded p-3 bg-[#eeece7]/40">
                    <div className="text-[10px] font-mono font-bold text-[#1863dc] mb-2 uppercase tracking-wide">Day {day.day} — {day.date}</div>
                    <div className="space-y-1.5">
                      {day.tasks.map((task, ti) => (
                        <div key={ti} className={`flex items-center justify-between p-2 rounded border text-[9px] font-mono uppercase tracking-wider ${taskTypeColors[task.type] || 'text-[#75758a] bg-white border-[#d9d9dd]'}`}>
                          <span className="truncate">{task.topic}</span>
                          <span className="shrink-0 ml-2 opacity-70">{task.duration}m</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <button onClick={() => setRevisionPlan(null)} className="w-full text-xs text-[#75758a] hover:text-black py-1 transition-colors cursor-pointer font-sans underline">Reset Plan</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
