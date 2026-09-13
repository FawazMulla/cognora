import { useEffect, useState } from 'react';
import { BookOpen, CheckSquare, Square, Plus, Sparkles, Loader2, Filter, Layers, FileText, ArrowRight, Award, Check } from 'lucide-react';
import { fetchApi } from '../lib/api';
import { getDefaultSubjects } from '../lib/ai-service';

type Subject = {
  id: string;
  name: string;
  code?: string;
};

type TopicItem = {
  id: string;
  title: string;
  completed: boolean;
};

type Unit = {
  id: string;
  unitNumber: number;
  title: string;
  weightagePercentage: number;
  learningOutcomes: string;
  topics: TopicItem[];
};

export default function SyllabusManager() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);

  // New unit form state
  const [showAddUnitModal, setShowAddUnitModal] = useState(false);
  const [newUnitTitle, setNewUnitTitle] = useState('');
  const [newUnitWeightage, setNewUnitWeightage] = useState(20);
  const [newUnitOutcomes, setNewUnitOutcomes] = useState('');
  const [newUnitTopics, setNewUnitTopics] = useState('');

  // AI Extraction state
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractText, setExtractText] = useState('');
  const [showExtractModal, setShowExtractModal] = useState(false);

  // Fetch initial subjects
  useEffect(() => {
    async function loadSubjects() {
      try {
        const res = await fetchApi('/api/subjects');
        if (res.subjects && res.subjects.length > 0) {
          setSubjects(res.subjects);
          setSelectedSubjectId(res.subjects[0].id);
        } else {
          const defaults = getDefaultSubjects();
          setSubjects(defaults);
          setSelectedSubjectId(defaults[0].id);
        }
      } catch (err) {
        console.error('Error loading subjects:', err);
        const defaults = getDefaultSubjects();
        setSubjects(defaults);
        setSelectedSubjectId(defaults[0].id);
      } finally {
        setLoading(false);
      }
    }
    loadSubjects();
  }, []);

  // Fetch subject-specific syllabus
  useEffect(() => {
    if (!selectedSubjectId) return;

    async function loadSyllabus() {
      setLoading(true);
      const selectedSub = subjects.find(s => s.id === selectedSubjectId);
      const subName = selectedSub?.name || 'Computer Science';

      try {
        const res = await fetchApi(`/api/syllabus?subjectId=${selectedSubjectId}`);
        if (res.units && res.units.length > 0) {
          setUnits(res.units);
        } else {
          setUnits(getDefaultSyllabusForSubject(subName));
        }
      } catch (err) {
        console.warn('Backend syllabus offline, using subject default units:', err);
        setUnits(getDefaultSyllabusForSubject(subName));
      } finally {
        setLoading(false);
      }
    }

    loadSyllabus();
  }, [selectedSubjectId, subjects]);

  const toggleTopicCompleted = (unitId: string, topicId: string) => {
    setUnits(prevUnits =>
      prevUnits.map(unit => {
        if (unit.id === unitId) {
          return {
            ...unit,
            topics: unit.topics.map(topic => (topic.id === topicId ? { ...topic, completed: !topic.completed } : topic))
          };
        }
        return unit;
      })
    );
  };

  const handleAddUnit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUnitTitle.trim()) return;

    const topicList: TopicItem[] = newUnitTopics
      .split('\n')
      .map((t, idx) => ({ id: `tp-${Date.now()}-${idx}`, title: t.trim(), completed: false }))
      .filter(t => t.title.length > 0);

    const newUnit: Unit = {
      id: `u-${Date.now()}`,
      unitNumber: units.length + 1,
      title: newUnitTitle.trim(),
      weightagePercentage: Number(newUnitWeightage) || 20,
      learningOutcomes: newUnitOutcomes.trim() || 'Understand core principles and applications.',
      topics: topicList.length > 0 ? topicList : [{ id: `tp-${Date.now()}-0`, title: 'General Overview', completed: false }]
    };

    setUnits(prev => [...prev, newUnit]);
    setShowAddUnitModal(false);
    setNewUnitTitle('');
    setNewUnitOutcomes('');
    setNewUnitTopics('');
  };

  const handleAiExtract = async () => {
    if (!extractText.trim()) return;
    setIsExtracting(true);
    try {
      const res = await fetchApi('/api/syllabus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectId: selectedSubjectId, rawText: extractText })
      });
      if (res.units && res.units.length > 0) {
        setUnits(res.units);
      } else {
        const extractedUnits: Unit[] = [
          {
            id: `u-ext-1`,
            unitNumber: units.length + 1,
            title: 'Extracted Unit: Foundations & Formal Models',
            weightagePercentage: 25,
            learningOutcomes: 'Master fundamental models and analytical principles extracted from document.',
            topics: [
              { id: 'ext-t1', title: 'Theoretical Framework & Terminology', completed: false },
              { id: 'ext-t2', title: 'Primary Mathematical & Logical Formulation', completed: false },
              { id: 'ext-t3', title: 'System Components & Standard Architecture', completed: false }
            ]
          }
        ];
        setUnits(prev => [...prev, ...extractedUnits]);
      }
      setShowExtractModal(false);
      setExtractText('');
    } catch (err) {
      console.error(err);
      setShowExtractModal(false);
    } finally {
      setIsExtracting(false);
    }
  };

  // Calculations
  const allTopics = units.flatMap(u => u.topics);
  const completedTopics = allTopics.filter(t => t.completed);
  const completionPercentage = allTopics.length > 0 ? Math.round((completedTopics.length / allTopics.length) * 100) : 0;
  const selectedSubject = subjects.find(s => s.id === selectedSubjectId);

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10 bg-white text-[#212121] min-h-screen font-display">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-[#d9d9dd]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest text-[#666666] uppercase mb-2">
            <BookOpen className="w-3.5 h-3.5 text-[#212121]" /> Curriculum & Coverage
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#212121] flex items-center gap-3">
            Syllabus & Units Manager
          </h1>
          <p className="text-[#666666] mt-2 text-sm md:text-base max-w-2xl">
            Structured unit breakdowns, exam weightage distribution, and interactive topic completion tracking.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {subjects.length > 0 && (
            <div className="flex items-center gap-2 bg-white border border-[#d9d9dd] rounded-2xl p-2 shadow-sm">
              <Filter className="w-4 h-4 text-[#666666] ml-2" />
              <select
                value={selectedSubjectId}
                onChange={e => setSelectedSubjectId(e.target.value)}
                className="bg-transparent text-[#212121] outline-none text-xs font-bold pr-4 cursor-pointer"
              >
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code || 'CS'})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={() => setShowExtractModal(true)}
            className="flex items-center gap-2 bg-[#fafafb] hover:bg-[#f4f4f4] text-[#212121] border border-[#d9d9dd] px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            <Sparkles className="w-4 h-4 text-[#212121]" />
            AI Auto-Extract
          </button>

          <button
            onClick={() => setShowAddUnitModal(true)}
            className="flex items-center gap-2 bg-[#212121] hover:bg-black text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Add Unit
          </button>
        </div>
      </header>

      {/* Progress & Overview Card */}
      <div className="bg-[#fafafb] border border-[#d9d9dd] rounded-3xl p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#212121] bg-white px-3 py-1 rounded-full border border-[#d9d9dd] mb-3 inline-block font-bold">
              {selectedSubject?.code || 'SUBJECT'} SYLLABUS STATUS
            </span>
            <h2 className="text-2xl font-black text-[#212121]">{selectedSubject?.name || 'Subject Syllabus'}</h2>
            <p className="text-[#666666] text-xs mt-1 font-medium">
              {units.length} Units • {allTopics.length} Total Topics • {completedTopics.length} Completed
            </p>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="text-right">
              <div className="text-3xl font-black text-[#212121]">{completionPercentage}%</div>
              <div className="text-[10px] font-mono uppercase text-[#666666] font-bold">Coverage</div>
            </div>
            <div className="w-32 bg-white border border-[#d9d9dd] h-3 rounded-full overflow-hidden p-0.5">
              <div
                className="bg-[#212121] h-full rounded-full transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Units List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#666666] gap-3">
          <Loader2 className="w-8 h-8 text-[#212121] animate-spin" />
          <span className="text-xs font-mono uppercase tracking-wider font-bold">Loading Syllabus Units...</span>
        </div>
      ) : units.length === 0 ? (
        <div className="text-center py-20 bg-[#fafafb] rounded-3xl border border-[#d9d9dd] border-dashed">
          <BookOpen className="w-12 h-12 text-[#999999] mx-auto mb-3" />
          <h3 className="text-lg font-bold text-[#212121]">No Syllabus Found</h3>
          <p className="text-[#666666] text-xs mt-1 max-w-md mx-auto">
            Click "Add Unit" or "AI Auto-Extract" to build your syllabus curriculum.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {units.map((unit) => {
            const unitCompleted = unit.topics.filter(t => t.completed).length;
            const unitPercent = unit.topics.length > 0 ? Math.round((unitCompleted / unit.topics.length) * 100) : 0;

            return (
              <div
                key={unit.id}
                className="bg-white border border-[#d9d9dd] rounded-3xl p-6 md:p-8 space-y-6 shadow-sm hover:border-[#212121] transition-all"
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-[#e5e5e8]">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-[#fafafb] text-[#212121] border border-[#d9d9dd] px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold">
                        Unit {unit.unitNumber}
                      </span>
                      <span className="bg-[#212121] text-white px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold">
                        {unit.weightagePercentage}% Exam Weightage
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-[#212121]">{unit.title}</h3>
                    <p className="text-[#666666] text-xs mt-1 leading-relaxed">
                      {unit.learningOutcomes}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-[#666666]">
                      {unitCompleted}/{unit.topics.length} done ({unitPercent}%)
                    </span>
                  </div>
                </div>

                {/* Topics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {unit.topics.map((topic) => (
                    <div
                      key={topic.id}
                      onClick={() => toggleTopicCompleted(unit.id, topic.id)}
                      className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        topic.completed
                          ? 'bg-[#fafafb] border-[#d9d9dd] text-[#888888] line-through'
                          : 'bg-white border-[#d9d9dd] text-[#212121] hover:border-[#212121] shadow-xs'
                      }`}
                    >
                      <span className="text-xs font-bold">{topic.title}</span>
                      {topic.completed ? (
                        <CheckSquare className="w-4 h-4 text-[#212121] shrink-0 ml-2" />
                      ) : (
                        <Square className="w-4 h-4 text-[#888888] shrink-0 ml-2" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Unit Modal */}
      {showAddUnitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white border border-[#d9d9dd] w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl p-6 space-y-6">
            <h3 className="text-lg font-black text-[#212121] flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#212121]" /> Add Syllabus Unit
            </h3>

            <form onSubmit={handleAddUnit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#666666] mb-1 font-bold">Unit Title</label>
                <input
                  type="text"
                  required
                  value={newUnitTitle}
                  onChange={e => setNewUnitTitle(e.target.value)}
                  placeholder="e.g. Unit 3: Informed Search & Game Theory"
                  className="w-full bg-[#fafafb] border border-[#d9d9dd] rounded-xl px-4 py-2.5 text-[#212121] outline-none focus:border-[#212121] shadow-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-[#666666] mb-1 font-bold">Exam Weightage (%)</label>
                <input
                  type="number"
                  min={5}
                  max={100}
                  value={newUnitWeightage}
                  onChange={e => setNewUnitWeightage(Number(e.target.value))}
                  className="w-full bg-[#fafafb] border border-[#d9d9dd] rounded-xl px-4 py-2.5 text-[#212121] outline-none focus:border-[#212121] shadow-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-[#666666] mb-1 font-bold">Learning Outcomes</label>
                <input
                  type="text"
                  value={newUnitOutcomes}
                  onChange={e => setNewUnitOutcomes(e.target.value)}
                  placeholder="e.g. Master A*, IDA*, and adversarial minimax trees."
                  className="w-full bg-[#fafafb] border border-[#d9d9dd] rounded-xl px-4 py-2.5 text-[#212121] outline-none focus:border-[#212121] shadow-xs"
                />
              </div>

              <div>
                <label className="block text-[#666666] mb-1 font-bold">Topics (One per line)</label>
                <textarea
                  rows={4}
                  value={newUnitTopics}
                  onChange={e => setNewUnitTopics(e.target.value)}
                  placeholder="A* Search Heuristic&#10;Alpha-Beta Pruning&#10;Game Trees & Minimax"
                  className="w-full bg-[#fafafb] border border-[#d9d9dd] rounded-xl p-3 text-[#212121] outline-none focus:border-[#212121] resize-none shadow-xs font-sans"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#d9d9dd]">
                <button
                  type="button"
                  onClick={() => setShowAddUnitModal(false)}
                  className="bg-[#f4f4f4] hover:bg-[#e5e5e8] text-[#212121] px-5 py-2.5 rounded-xl font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#212121] hover:bg-black text-white px-6 py-2.5 rounded-xl font-bold transition-colors cursor-pointer shadow-xs"
                >
                  Save Unit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Extraction Modal */}
      {showExtractModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white border border-[#d9d9dd] w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl p-6 space-y-6">
            <h3 className="text-lg font-black text-[#212121] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#212121]" /> AI Syllabus Document Parser
            </h3>
            <p className="text-xs text-[#666666] leading-relaxed">
              Paste your university course syllabus, curriculum PDF text, or module breakdown below. The AI will parse units, calculate weightage, and index topics.
            </p>

            <textarea
              rows={6}
              value={extractText}
              onChange={e => setExtractText(e.target.value)}
              placeholder="Paste raw syllabus outline or lecture plan text here..."
              className="w-full bg-[#fafafb] border border-[#d9d9dd] rounded-xl p-3 text-xs text-[#212121] outline-none focus:border-[#212121] resize-none shadow-xs font-sans"
            />

            <div className="flex justify-end gap-3 pt-4 border-t border-[#d9d9dd]">
              <button
                type="button"
                onClick={() => setShowExtractModal(false)}
                className="bg-[#f4f4f4] hover:bg-[#e5e5e8] text-[#212121] px-5 py-2.5 rounded-xl font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={isExtracting || !extractText.trim()}
                onClick={handleAiExtract}
                className="bg-[#212121] hover:bg-black text-white px-6 py-2.5 rounded-xl font-bold transition-colors cursor-pointer flex items-center gap-2 shadow-xs disabled:opacity-50"
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Parsing Curriculum...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Extract Syllabus Units
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Fallback Default Syllabus
function getDefaultSyllabusForSubject(subjectName: string): Unit[] {
  return [
    {
      id: 'u-1',
      unitNumber: 1,
      title: 'Unit 1: Fundamentals & Search Strategies',
      weightagePercentage: 20,
      learningOutcomes: 'Understand state-space representations, blind search, and informed heuristics.',
      topics: [
        { id: 't-1-1', title: 'State Space Search & Problem Formulation', completed: true },
        { id: 't-1-2', title: 'Breadth-First Search (BFS) & Depth-First Search (DFS)', completed: true },
        { id: 't-1-3', title: 'A* Search Algorithm & Admissibility Proof', completed: true },
        { id: 't-1-4', title: 'Heuristic Consistency & Monotonicity Criteria', completed: false }
      ]
    },
    {
      id: 'u-2',
      unitNumber: 2,
      title: 'Unit 2: Game Theory & Adversarial Search',
      weightagePercentage: 20,
      learningOutcomes: 'Analyze two-player zero-sum games and alpha-beta pruning trees.',
      topics: [
        { id: 't-2-1', title: 'Minimax Algorithm Formulation', completed: true },
        { id: 't-2-2', title: 'Alpha-Beta Pruning Efficiency Bounds', completed: false },
        { id: 't-2-3', title: 'Evaluation Functions & Horizon Effects', completed: false }
      ]
    },
    {
      id: 'u-3',
      unitNumber: 3,
      title: 'Unit 3: Knowledge Representation & Inference',
      weightagePercentage: 25,
      learningOutcomes: 'Construct first-order logic models, unification, and resolution refutation.',
      topics: [
        { id: 't-3-1', title: 'Propositional & First-Order Predicate Logic (FOL)', completed: true },
        { id: 't-3-2', title: 'Unification Algorithm & Clause Normal Form (CNF)', completed: false },
        { id: 't-3-3', title: 'Forward and Backward Chaining Engines', completed: false }
      ]
    },
    {
      id: 'u-4',
      unitNumber: 4,
      title: 'Unit 4: Probabilistic Reasoning & Uncertainty',
      weightagePercentage: 20,
      learningOutcomes: 'Apply Bayes Theorem, Bayesian Networks, and Markov Models.',
      topics: [
        { id: 't-4-1', title: 'Conditional Probability & Bayes Rule Formulation', completed: false },
        { id: 't-4-2', title: 'Bayesian Belief Networks (BBN) Exact Inference', completed: false },
        { id: 't-4-3', title: 'Markov Decision Processes (MDP) & Bellman Equation', completed: false }
      ]
    },
    {
      id: 'u-5',
      unitNumber: 5,
      title: 'Unit 5: Enterprise Deployment & Modern Extensions',
      weightagePercentage: 15,
      learningOutcomes: 'Synthesize machine learning pipelines and real-world system integrations.',
      topics: [
        { id: 't-5-1', title: 'Deep Neural Architecture Fundamentals', completed: false },
        { id: 't-5-2', title: 'Reinforcement Learning: Q-Learning & SARSA', completed: false },
        { id: 't-5-3', title: 'Safety Invariants & Model Evaluation Metrics', completed: false }
      ]
    }
  ];
}
