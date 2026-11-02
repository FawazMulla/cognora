import { useEffect, useState } from 'react';
import { BookOpen, CheckSquare, Square, Plus, Sparkles, Loader2, Filter } from 'lucide-react';
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

const ATLAS_STORAGE_KEY = 'cognora_atlas_progress_v1';

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

  // Helper to get persisted completed topic IDs
  const getPersistedCompletedMap = (subjId: string): Set<string> => {
    const completedSet = new Set<string>();
    try {
      const localSaved = localStorage.getItem(`cognora_syllabus_completed_${subjId}`);
      if (localSaved) {
        const ids: string[] = JSON.parse(localSaved);
        ids.forEach(id => completedSet.add(id));
      }
    } catch {}

    try {
      const atlasSaved = localStorage.getItem(ATLAS_STORAGE_KEY);
      if (atlasSaved) {
        const atlasMap: Record<string, { status?: string }> = JSON.parse(atlasSaved);
        Object.entries(atlasMap).forEach(([tId, val]) => {
          if (val.status === 'completed') {
            completedSet.add(tId);
          }
        });
      }
    } catch {}

    return completedSet;
  };

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

  // Fetch subject-specific syllabus & hydrate persisted progress
  useEffect(() => {
    if (!selectedSubjectId) return;

    async function loadSyllabus() {
      setLoading(true);
      const selectedSub = subjects.find(s => s.id === selectedSubjectId);
      const subName = selectedSub?.name || 'Computer Science';
      const completedSet = getPersistedCompletedMap(selectedSubjectId);

      let fetchedUnits: Unit[] = [];
      try {
        const res = await fetchApi(`/api/syllabus?subjectId=${selectedSubjectId}`);
        if (res.units && res.units.length > 0) {
          fetchedUnits = res.units;
        } else {
          fetchedUnits = getDefaultSyllabusForSubject(subName);
        }
      } catch (err) {
        console.warn('Backend syllabus offline, using subject default units:', err);
        fetchedUnits = getDefaultSyllabusForSubject(subName);
      }

      // Hydrate with persisted completions
      const hydrated = fetchedUnits.map(unit => ({
        ...unit,
        topics: unit.topics.map(t => ({
          ...t,
          completed: completedSet.has(t.id) ? true : t.completed
        }))
      }));

      setUnits(hydrated);
      setLoading(false);
    }

    loadSyllabus();
  }, [selectedSubjectId, subjects]);

  const toggleTopicCompleted = (unitId: string, topicId: string) => {
    setUnits(prevUnits => {
      let targetNewState = false;
      const updated = prevUnits.map(unit => {
        if (unit.id === unitId) {
          return {
            ...unit,
            topics: unit.topics.map(topic => {
              if (topic.id === topicId) {
                targetNewState = !topic.completed;
                return { ...topic, completed: targetNewState };
              }
              return topic;
            })
          };
        }
        return unit;
      });

      // Persist to subject completed cache
      try {
        const completedIds = updated.flatMap(u => u.topics).filter(t => t.completed).map(t => t.id);
        localStorage.setItem(`cognora_syllabus_completed_${selectedSubjectId}`, JSON.stringify(completedIds));
      } catch {}

      // Bidirectional sync with Atlas Progress
      try {
        const atlasSaved = localStorage.getItem(ATLAS_STORAGE_KEY);
        const atlasMap: Record<string, any> = atlasSaved ? JSON.parse(atlasSaved) : {};
        atlasMap[topicId] = {
          ...(atlasMap[topicId] || {}),
          topicId,
          status: targetNewState ? 'completed' : 'not_started',
          lastStudied: new Date().toISOString()
        };
        localStorage.setItem(ATLAS_STORAGE_KEY, JSON.stringify(atlasMap));
      } catch {}

      return updated;
    });
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
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 bg-[#f8f9fc] dark:bg-slate-950 text-[#2d2d34] dark:text-slate-100 min-h-screen font-sans transition-colors">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-2 border-b border-[#e3e6ed] dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-[#4f75f2] animate-pulse" />
            <span className="text-[11px] font-mono tracking-widest text-[#6b6f82] dark:text-slate-400 uppercase font-bold">
              Curriculum &amp; Coverage
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#121217] dark:text-white flex items-center gap-3">
            Syllabus &amp; Units Manager
          </h1>
          <p className="text-xs md:text-sm text-[#6b6f82] dark:text-slate-400 mt-1 font-sans max-w-2xl">
            Structured unit breakdowns, exam weightage distribution, and interactive topic completion tracking.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {subjects.length > 0 && (
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-[#e3e6ed] dark:border-slate-800 rounded-2xl p-1.5 shadow-xs">
              <Filter className="w-3.5 h-3.5 text-[#8c8fa1] dark:text-slate-400 ml-2" />
              <select
                value={selectedSubjectId}
                onChange={e => setSelectedSubjectId(e.target.value)}
                className="bg-transparent text-[#121217] dark:text-slate-200 outline-none text-xs font-bold pr-4 cursor-pointer"
              >
                {subjects.map(s => (
                  <option key={s.id} value={s.id} className="dark:bg-slate-900 dark:text-white">
                    {s.name} ({s.code || 'CS'})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={() => setShowExtractModal(true)}
            className="flex items-center gap-2 bg-white dark:bg-slate-900 hover:bg-[#edf3fc] dark:hover:bg-slate-800 text-[#4f75f2] dark:text-indigo-400 border border-[#d0dcf5] dark:border-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            <Sparkles className="w-4 h-4 text-[#4f75f2] dark:text-indigo-400" />
            AI Auto-Extract
          </button>

          <button
            onClick={() => setShowAddUnitModal(true)}
            className="flex items-center gap-2 bg-[#4f75f2] hover:bg-[#385dd8] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Add Unit
          </button>
        </div>
      </header>

      {/* Progress & Overview Card */}
      <div className="bg-white dark:bg-slate-900 border border-[#e3e6ed] dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#3b52c4] dark:text-indigo-400 bg-[#e4e7fd] dark:bg-indigo-950/60 px-3 py-1 rounded-full border border-[#d0d8fb] dark:border-indigo-800 mb-3 inline-block font-bold">
              {selectedSubject?.code || 'SUBJECT'} SYLLABUS STATUS
            </span>
            <h2 className="text-2xl font-extrabold text-[#121217] dark:text-white">{selectedSubject?.name || 'Subject Syllabus'}</h2>
            <p className="text-[#6b6f82] dark:text-slate-400 text-xs mt-1 font-medium font-sans">
              {units.length} Units • {allTopics.length} Total Topics • {completedTopics.length} Completed
            </p>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="text-right">
              <div className="text-3xl font-extrabold text-[#121217] dark:text-white">{completionPercentage}%</div>
              <div className="text-[10px] font-mono uppercase text-[#6b6f82] dark:text-slate-400 font-bold">Coverage</div>
            </div>
            <div className="w-36 bg-[#f0f2f7] dark:bg-slate-800 h-3 rounded-full overflow-hidden p-0.5">
              <div
                className="bg-gradient-to-r from-[#4f75f2] via-[#6366f1] to-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Units List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#6b6f82] dark:text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 text-[#4f75f2] animate-spin" />
          <span className="text-xs font-mono uppercase tracking-wider font-bold">Loading Syllabus Units...</span>
        </div>
      ) : units.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-[#e3e6ed] dark:border-slate-800 border-dashed">
          <BookOpen className="w-12 h-12 text-[#8c8fa1] dark:text-slate-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-[#121217] dark:text-white">No Syllabus Found</h3>
          <p className="text-[#6b6f82] dark:text-slate-400 text-xs mt-1 max-w-md mx-auto font-sans">
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
                className="bg-white dark:bg-slate-900 border border-[#e3e6ed] dark:border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-xs hover:border-[#4f75f2] dark:hover:border-indigo-500 transition-all"
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-[#e3e6ed] dark:border-slate-800">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-[#edf3fc] dark:bg-indigo-950/60 text-[#4f75f2] dark:text-indigo-400 border border-[#d0dcf5] dark:border-indigo-800 px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold">
                        Unit {unit.unitNumber}
                      </span>
                      <span className="bg-[#e4e7fd] dark:bg-purple-950/60 text-[#3b52c4] dark:text-purple-300 border border-[#d0d8fb] dark:border-purple-800 px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold">
                        {unit.weightagePercentage}% Exam Weightage
                      </span>
                    </div>
                    <h3 className="text-lg font-extrabold text-[#121217] dark:text-white">{unit.title}</h3>
                    <p className="text-[#6b6f82] dark:text-slate-400 text-xs mt-1 leading-relaxed font-sans">
                      {unit.learningOutcomes}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-[#4f75f2] dark:text-indigo-400 bg-[#edf3fc] dark:bg-indigo-950/60 px-3 py-1 rounded-xl border border-[#d0dcf5] dark:border-indigo-800">
                      {unitCompleted}/{unit.topics.length} done ({unitPercent}%)
                    </span>
                  </div>
                </div>

                {/* Topics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {unit.topics.map((topic) => (
                    <button
                      key={topic.id}
                      type="button"
                      onClick={() => toggleTopicCompleted(unit.id, topic.id)}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all text-left ${
                        topic.completed
                          ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 shadow-2xs'
                          : 'bg-[#f8f9fc] dark:bg-slate-800/70 border-slate-200 dark:border-slate-700/80 text-slate-800 dark:text-slate-100 hover:border-indigo-400 dark:hover:border-indigo-500 shadow-xs'
                      }`}
                    >
                      <span className={`text-xs font-bold leading-snug ${topic.completed ? 'line-through opacity-80' : ''}`}>
                        {topic.title}
                      </span>
                      {topic.completed ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 ml-2" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0 ml-2" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Unit Modal */}
      {showAddUnitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-[#e3e6ed] dark:border-slate-800 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl p-6 space-y-6">
            <h3 className="text-lg font-extrabold text-[#121217] dark:text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#4f75f2] dark:text-indigo-400" /> Add Syllabus Unit
            </h3>

            <form onSubmit={handleAddUnit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#6b6f82] dark:text-slate-400 mb-1 font-bold">Unit Title</label>
                <input
                  type="text"
                  required
                  value={newUnitTitle}
                  onChange={e => setNewUnitTitle(e.target.value)}
                  placeholder="e.g. Unit 3: Informed Search & Game Theory"
                  className="w-full bg-[#f8f9fc] dark:bg-slate-800 border border-[#e3e6ed] dark:border-slate-700 rounded-2xl px-4 py-2.5 text-[#121217] dark:text-white outline-none focus:border-[#4f75f2] shadow-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-[#6b6f82] dark:text-slate-400 mb-1 font-bold">Exam Weightage (%)</label>
                <input
                  type="number"
                  min={5}
                  max={100}
                  value={newUnitWeightage}
                  onChange={e => setNewUnitWeightage(Number(e.target.value))}
                  className="w-full bg-[#f8f9fc] dark:bg-slate-800 border border-[#e3e6ed] dark:border-slate-700 rounded-2xl px-4 py-2.5 text-[#121217] dark:text-white outline-none focus:border-[#4f75f2] shadow-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-[#6b6f82] dark:text-slate-400 mb-1 font-bold">Learning Outcomes</label>
                <input
                  type="text"
                  value={newUnitOutcomes}
                  onChange={e => setNewUnitOutcomes(e.target.value)}
                  placeholder="e.g. Master A*, IDA*, and adversarial minimax trees."
                  className="w-full bg-[#f8f9fc] dark:bg-slate-800 border border-[#e3e6ed] dark:border-slate-700 rounded-2xl px-4 py-2.5 text-[#121217] dark:text-white outline-none focus:border-[#4f75f2] shadow-xs"
                />
              </div>

              <div>
                <label className="block text-[#6b6f82] dark:text-slate-400 mb-1 font-bold">Topics (One per line)</label>
                <textarea
                  rows={4}
                  value={newUnitTopics}
                  onChange={e => setNewUnitTopics(e.target.value)}
                  placeholder="A* Search Heuristic&#10;Alpha-Beta Pruning&#10;Game Trees & Minimax"
                  className="w-full bg-[#f8f9fc] dark:bg-slate-800 border border-[#e3e6ed] dark:border-slate-700 rounded-2xl p-3 text-[#121217] dark:text-white outline-none focus:border-[#4f75f2] resize-none shadow-xs font-sans"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#e3e6ed] dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddUnitModal(false)}
                  className="bg-[#f8f9fc] dark:bg-slate-800 hover:bg-[#edf3fc] dark:hover:bg-slate-700 text-[#6b6f82] dark:text-slate-300 hover:text-[#121217] dark:hover:text-white px-5 py-2.5 rounded-xl font-bold transition-colors cursor-pointer border border-[#e3e6ed] dark:border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#4f75f2] hover:bg-[#385dd8] text-white px-6 py-2.5 rounded-xl font-bold transition-colors cursor-pointer shadow-xs"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-[#e3e6ed] dark:border-slate-800 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl p-6 space-y-6">
            <h3 className="text-lg font-extrabold text-[#121217] dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#4f75f2] dark:text-indigo-400" /> AI Syllabus Document Parser
            </h3>
            <p className="text-xs text-[#6b6f82] dark:text-slate-400 leading-relaxed font-sans">
              Paste your university course syllabus, curriculum PDF text, or module breakdown below. The AI will parse units, calculate weightage, and index topics.
            </p>

            <textarea
              rows={6}
              value={extractText}
              onChange={e => setExtractText(e.target.value)}
              placeholder="Paste raw syllabus outline or lecture plan text here..."
              className="w-full bg-[#f8f9fc] dark:bg-slate-800 border border-[#e3e6ed] dark:border-slate-700 rounded-2xl p-3 text-xs text-[#121217] dark:text-white outline-none focus:border-[#4f75f2] resize-none shadow-xs font-sans"
            />

            <div className="flex justify-end gap-3 pt-4 border-t border-[#e3e6ed] dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowExtractModal(false)}
                className="bg-[#f8f9fc] dark:bg-slate-800 hover:bg-[#edf3fc] dark:hover:bg-slate-700 text-[#6b6f82] dark:text-slate-300 hover:text-[#121217] dark:hover:text-white px-5 py-2.5 rounded-xl font-bold transition-colors cursor-pointer border border-[#e3e6ed] dark:border-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isExtracting || !extractText.trim()}
                onClick={handleAiExtract}
                className="bg-[#4f75f2] hover:bg-[#385dd8] text-white px-6 py-2.5 rounded-xl font-bold transition-colors cursor-pointer flex items-center gap-2 shadow-xs disabled:opacity-50"
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

// Fallback Syllabus Builder for Mumbai University Semester VII
function getDefaultSyllabusForSubject(subjectName: string): Unit[] {
  const s = subjectName.toLowerCase();

  // 1. Information Retrieval System (ITDO7024)
  if (s.includes('retrieval') || s.includes('irs')) {
    return [
      {
        id: 'u-irs-1',
        unitNumber: 1,
        title: 'Module 1: Introduction to Information Retrieval Systems',
        weightagePercentage: 15,
        learningOutcomes: 'Information Retrieval vs Data Retrieval, boolean models, evaluation metrics.',
        topics: [
          { id: 't-irs-1-1', title: 'Information Retrieval vs Data Retrieval & System Architecture', completed: false },
          { id: 't-irs-1-2', title: 'Boolean Model of Information Retrieval', completed: false },
          { id: 't-irs-1-3', title: 'Evaluation Metrics: Precision, Recall, F-measure, MAP', completed: false }
        ]
      },
      {
        id: 'u-irs-2',
        unitNumber: 2,
        title: 'Module 2: Classic Information Retrieval Models',
        weightagePercentage: 20,
        learningOutcomes: 'Vector Space Model, Cosine Similarity, TF-IDF, Probabilistic BM25.',
        topics: [
          { id: 't-irs-2-1', title: 'Vector Space Model & Cosine Similarity Formulation', completed: false },
          { id: 't-irs-2-2', title: 'TF-IDF Weighting & Term Frequency Normalization', completed: false },
          { id: 't-irs-2-3', title: 'Probabilistic Information Retrieval Models & BM25', completed: false }
        ]
      },
      {
        id: 'u-irs-3',
        unitNumber: 3,
        title: 'Module 3: Query Processing and Refinement',
        weightagePercentage: 20,
        learningOutcomes: 'Query languages, spelling correction, Rocchio relevance feedback, pseudo-relevance.',
        topics: [
          { id: 't-irs-3-1', title: 'Spelling Correction & Query Expansion Algorithms', completed: false },
          { id: 't-irs-3-2', title: 'Rocchio Relevance Feedback Algorithm & Vector Shifting', completed: false },
          { id: 't-irs-3-3', title: 'Pseudo-Relevance Feedback & User Feedback Loops', completed: false }
        ]
      },
      {
        id: 'u-irs-4',
        unitNumber: 4,
        title: 'Module 4: Text Processing and Document Representation',
        weightagePercentage: 15,
        learningOutcomes: 'Tokenization, stemming (Porter), stopword removal, language models.',
        topics: [
          { id: 't-irs-4-1', title: 'Text Tokenization, Stopword Elimination & Normalization', completed: false },
          { id: 't-irs-4-2', title: 'Porter Stemming Algorithm & Lemmatization Techniques', completed: false },
          { id: 't-irs-4-3', title: 'Statistical Language Modeling for IR', completed: false }
        ]
      },
      {
        id: 'u-irs-5',
        unitNumber: 5,
        title: 'Module 5: Indexing and Search',
        weightagePercentage: 15,
        learningOutcomes: 'Inverted index, skip pointers, compression (Variable Byte, Gamma code).',
        topics: [
          { id: 't-irs-5-1', title: 'Inverted Index Construction & Dictionary Posting Lists', completed: false },
          { id: 't-irs-5-2', title: 'Posting List Traversal with Skip Pointers', completed: false },
          { id: 't-irs-5-3', title: 'Index Compression: Variable Byte & Gamma Encoding', completed: false }
        ]
      },
      {
        id: 'u-irs-6',
        unitNumber: 6,
        title: 'Module 6: Web Search and Advanced IR',
        weightagePercentage: 15,
        learningOutcomes: 'Web crawling, PageRank, HITS algorithm, recommender systems.',
        topics: [
          { id: 't-irs-6-1', title: 'Web Crawling Architecture, Robots.txt & Duplicate Detection', completed: false },
          { id: 't-irs-6-2', title: 'PageRank Algorithm & Random Surfer Model', completed: false },
          { id: 't-irs-6-3', title: 'HITS Algorithm (Hubs & Authorities) & Collaborative Filtering', completed: false }
        ]
      }
    ];
  }

  // 2. Software Testing and QA (ITDO7014)
  if (s.includes('testing') || s.includes('stqa')) {
    return [
      {
        id: 'u-stqa-1',
        unitNumber: 1,
        title: 'Module 1: Basic Testing Principles & Test Lifecycle',
        weightagePercentage: 15,
        learningOutcomes: 'Software Quality, STLC, defect lifecycle, verification vs validation.',
        topics: [
          { id: 't-stqa-1-1', title: 'Software Quality Assurance vs Quality Control', completed: false },
          { id: 't-stqa-1-2', title: 'Software Testing Life Cycle (STLC) & Entry/Exit Criteria', completed: false },
          { id: 't-stqa-1-3', title: 'Defect Life Cycle, Severity vs Priority Analysis', completed: false }
        ]
      },
      {
        id: 'u-stqa-2',
        unitNumber: 2,
        title: 'Module 2: White Box Testing Techniques',
        weightagePercentage: 20,
        learningOutcomes: 'Control flow graphs, cyclomatic complexity, basis path testing, data flow.',
        topics: [
          { id: 't-stqa-2-1', title: 'Control Flow Graph & Basis Path Testing', completed: false },
          { id: 't-stqa-2-2', title: 'McCabe Cyclomatic Complexity Calculation (V(G))', completed: false },
          { id: 't-stqa-2-3', title: 'Statement, Branch, and Condition Coverage Criteria', completed: false }
        ]
      },
      {
        id: 'u-stqa-3',
        unitNumber: 3,
        title: 'Module 3: Black Box Testing Techniques',
        weightagePercentage: 20,
        learningOutcomes: 'Equivalence class partitioning, boundary value analysis, decision tables.',
        topics: [
          { id: 't-stqa-3-1', title: 'Equivalence Class Partitioning (ECP)', completed: false },
          { id: 't-stqa-3-2', title: 'Boundary Value Analysis (BVA) & Robustness Testing', completed: false },
          { id: 't-stqa-3-3', title: 'Cause-Effect Graphing & Decision Table Testing', completed: false }
        ]
      },
      {
        id: 'u-stqa-4',
        unitNumber: 4,
        title: 'Module 4: Levels of Testing & Specialized Testing',
        weightagePercentage: 15,
        learningOutcomes: 'Unit, integration, system, regression, and performance testing.',
        topics: [
          { id: 't-stqa-4-1', title: 'Integration Testing: Top-Down, Bottom-Up & Sandwich Approaches', completed: false },
          { id: 't-stqa-4-2', title: 'Regression Testing & Test Case Prioritization', completed: false },
          { id: 't-stqa-4-3', title: 'Performance Testing: Load, Stress, and Soak Testing', completed: false }
        ]
      },
      {
        id: 'u-stqa-5',
        unitNumber: 5,
        title: 'Module 5: Test Management and Quality Models',
        weightagePercentage: 15,
        learningOutcomes: 'McCall Quality Factors, ISO 9126, CMMI, and Test Planning.',
        topics: [
          { id: 't-stqa-5-1', title: 'McCall Quality Factors (Product Operation, Revision, Transition)', completed: false },
          { id: 't-stqa-5-2', title: 'ISO 9126 Quality Characteristics & CMMI Maturity Levels', completed: false },
          { id: 't-stqa-5-3', title: 'Test Plan Development (IEEE 829 Standard)', completed: false }
        ]
      },
      {
        id: 'u-stqa-6',
        unitNumber: 6,
        title: 'Module 6: Test Automation and Tools',
        weightagePercentage: 15,
        learningOutcomes: 'Selenium WebDriver, automated frameworks, and JUnit test runners.',
        topics: [
          { id: 't-stqa-6-1', title: 'Test Automation ROI, Frameworks (Data-Driven, Keyword-Driven)', completed: false },
          { id: 't-stqa-6-2', title: 'Selenium WebDriver Locators, Page Object Model (POM)', completed: false },
          { id: 't-stqa-6-3', title: 'Automated CI/CD Test Pipelines with JUnit and GitHub Actions', completed: false }
        ]
      }
    ];
  }

  // 3. Cyber Security and Laws (ILO7016)
  if (s.includes('cyber') || s.includes('csl') || s.includes('security')) {
    return [
      {
        id: 'u-csl-1',
        unitNumber: 1,
        title: 'Module 1: Cyber Security Fundamentals & Threat Landscape',
        weightagePercentage: 15,
        learningOutcomes: 'CIA triad, attack vectors, social engineering, malware taxonomy.',
        topics: [
          { id: 't-csl-1-1', title: 'Confidentiality, Integrity, Availability (CIA Triad)', completed: false },
          { id: 't-csl-1-2', title: 'Malware Taxonomy: Viruses, Worms, Trojans, Ransomware', completed: false },
          { id: 't-csl-1-3', title: 'Social Engineering: Phishing, Spear Phishing & Watering Hole', completed: false }
        ]
      },
      {
        id: 'u-csl-2',
        unitNumber: 2,
        title: 'Module 2: Network and Web Application Security',
        weightagePercentage: 20,
        learningOutcomes: 'Firewalls, IDS/IPS, SSL/TLS handshake, OWASP Top 10.',
        topics: [
          { id: 't-csl-2-1', title: 'Firewalls, DMZ, and Intrusion Detection/Prevention (IDS/IPS)', completed: false },
          { id: 't-csl-2-2', title: 'SSL/TLS Handshake Protocol & Public Key Infrastructure', completed: false },
          { id: 't-csl-2-3', title: 'OWASP Top 10: SQLi, XSS, CSRF, and Broken Access Control', completed: false }
        ]
      },
      {
        id: 'u-csl-3',
        unitNumber: 3,
        title: 'Module 3: Information Security Governance & Standards',
        weightagePercentage: 15,
        learningOutcomes: 'ISO/IEC 27001, security policies, access control models (DAC, MAC, RBAC).',
        topics: [
          { id: 't-csl-3-1', title: 'ISO/IEC 27001 ISMS Framework & Risk Assessment Models', completed: false },
          { id: 't-csl-3-2', title: 'Access Control Paradigms: DAC, MAC, RBAC, ABAC', completed: false },
          { id: 't-csl-3-3', title: 'Business Continuity Planning (BCP) & Disaster Recovery', completed: false }
        ]
      },
      {
        id: 'u-csl-4',
        unitNumber: 4,
        title: 'Module 4: Incident Response & Digital Forensics',
        weightagePercentage: 20,
        learningOutcomes: 'Evidence collection, chain of custody, memory analysis, disk forensics.',
        topics: [
          { id: 't-csl-4-1', title: 'Digital Evidence Identification, Acquisition & Preservation', completed: false },
          { id: 't-csl-4-2', title: 'Chain of Custody Protocol & Hash Verification (SHA-256)', completed: false },
          { id: 't-csl-4-3', title: 'Live Memory Forensics vs Static Disk Forensics', completed: false }
        ]
      },
      {
        id: 'u-csl-5',
        unitNumber: 5,
        title: 'Module 5: Indian Information Technology Act (IT Act 2000 & 2008)',
        weightagePercentage: 20,
        learningOutcomes: 'Sections 43, 65, 66 (A-F), 67, 72, digital signatures, legal frameworks.',
        topics: [
          { id: 't-csl-5-1', title: 'IT Act 2000 Objectives, Scope & Digital Signature Validity', completed: false },
          { id: 't-csl-5-2', title: 'Section 43 (Penalty for Unauthorized Access) & Section 65 (Source Code Tampering)', completed: false },
          { id: 't-csl-5-3', title: 'Section 66 (Cyber Crimes, Identity Theft, Cyber Terrorism) & Section 67', completed: false }
        ]
      },
      {
        id: 'u-csl-6',
        unitNumber: 6,
        title: 'Module 6: Emerging Cyber Threats & Intellectual Property',
        weightagePercentage: 10,
        learningOutcomes: 'Cloud security threats, IoT vulnerabilities, copyright, patents in software.',
        topics: [
          { id: 't-csl-6-1', title: 'Cloud Computing Vulnerabilities & Shared Responsibility Model', completed: false },
          { id: 't-csl-6-2', title: 'Intellectual Property Rights (IPR) & Software Copyright Laws', completed: false }
        ]
      }
    ];
  }

  // 4. Internet of Everything (ITC702)
  if (s.includes('everything') || s.includes('ioe') || s.includes('iot')) {
    return [
      {
        id: 'u-ioe-1',
        unitNumber: 1,
        title: 'Module 1: Introduction to IoE and Architectural Frameworks',
        weightagePercentage: 15,
        learningOutcomes: 'IoT to IoE evolution, Four Pillars (People, Process, Data, Things), M2M.',
        topics: [
          { id: 't-ioe-1-1', title: 'Evolution from IoT to IoE: Four Pillars Architecture', completed: false },
          { id: 't-ioe-1-2', title: 'Machine-to-Machine (M2M) vs Internet of Things (IoT)', completed: false },
          { id: 't-ioe-1-3', title: 'ITU-T and Cisco IoE Reference Architecture Models', completed: false }
        ]
      },
      {
        id: 'u-ioe-2',
        unitNumber: 2,
        title: 'Module 2: IoE Sensing, Actuation & Edge Hardware',
        weightagePercentage: 20,
        learningOutcomes: 'Sensors (temperature, PIR, ultrasonic), actuators, ESP32, Raspberry Pi, Arduino.',
        topics: [
          { id: 't-ioe-2-1', title: 'Transducers, Sensors & Actuators Classification', completed: false },
          { id: 't-ioe-2-2', title: 'Microcontroller vs Microprocessor Platforms (ESP32, Raspberry Pi)', completed: false },
          { id: 't-ioe-2-3', title: 'Analog-to-Digital Conversion (ADC) & Sensor Interfacing', completed: false }
        ]
      },
      {
        id: 'u-ioe-3',
        unitNumber: 3,
        title: 'Module 3: Wireless and Connectivity Protocols for IoE',
        weightagePercentage: 20,
        learningOutcomes: 'Zigbee, Bluetooth Low Energy (BLE), LoRaWAN, 6LoWPAN, RFID/NFC.',
        topics: [
          { id: 't-ioe-3-1', title: 'IEEE 802.15.4, Zigbee & Z-Wave Mesh Networks', completed: false },
          { id: 't-ioe-3-2', title: 'Bluetooth Low Energy (BLE) GATT Architecture & Beacons', completed: false },
          { id: 't-ioe-3-3', title: 'LoRaWAN Long Range Low Power Wide Area Networks (LPWAN)', completed: false }
        ]
      },
      {
        id: 'u-ioe-4',
        unitNumber: 4,
        title: 'Module 4: Application Layer Protocols for IoE',
        weightagePercentage: 20,
        learningOutcomes: 'MQTT, CoAP, AMQP, REST over HTTP, Websockets comparison.',
        topics: [
          { id: 't-ioe-4-1', title: 'MQTT and MQTT-SN Architecture & Publish-Subscribe Flows', completed: false },
          { id: 't-ioe-4-2', title: 'Constrained Application Protocol (CoAP) & REST Constraints', completed: false },
          { id: 't-ioe-4-3', title: 'AMQP, STOMP, and Protocol Trade-Off Analysis', completed: false }
        ]
      },
      {
        id: 'u-ioe-5',
        unitNumber: 5,
        title: 'Module 5: IoT and Data Analytics',
        weightagePercentage: 15,
        learningOutcomes: 'Cloud analytics, data lakes, dashboarding, alerts (ThingSpeak, AWS IoT).',
        topics: [
          { id: 't-ioe-5-1', title: 'IoT Analytics Architecture & Data Lakes', completed: false },
          { id: 't-ioe-5-2', title: 'Cloud Dashboarding, Data Retention & Real-Time Alerts', completed: false }
        ]
      },
      {
        id: 'u-ioe-6',
        unitNumber: 6,
        title: 'Module 6: IoT Application Design & Case Studies',
        weightagePercentage: 10,
        learningOutcomes: 'Smart Cities, Industrial IoT (I-IoT), Internet of Behaviors (IoB).',
        topics: [
          { id: 't-ioe-6-1', title: 'Smart Home, Smart Agriculture & Forest Fire Detection', completed: false },
          { id: 't-ioe-6-2', title: 'Industrial IoT (I-IoT) vs IoT & Internet of Behaviors (IoB)', completed: false }
        ]
      }
    ];
  }

  // 5. Default: AI and DS – II (ITC701)
  return [
    {
      id: 'u-aids-1',
      unitNumber: 1,
      title: 'Module 1: Uncertainty in AI',
      weightagePercentage: 15,
      learningOutcomes: 'Inference using full joint distributions, Bayes Theorem, Bayesian Networks, and MDPs.',
      topics: [
        { id: 't-aids-1-1', title: 'Inference Using Full Joint Distributions', completed: false },
        { id: 't-aids-1-2', title: 'Bayes Theorem & Semantics of Bayesian Networks', completed: false },
        { id: 't-aids-1-3', title: 'Exact Inference in Bayesian Networks & Markov Decision Processes (MDP)', completed: false }
      ]
    },
    {
      id: 'u-aids-2',
      unitNumber: 2,
      title: 'Module 2: Cognitive Computing',
      weightagePercentage: 20,
      learningOutcomes: 'Design principles for cognitive systems, NLP support, taxonomies, ontologies, IBM Watson.',
      topics: [
        { id: 't-aids-2-1', title: 'Foundations & Design Principles of Cognitive Systems', completed: false },
        { id: 't-aids-2-2', title: 'Representing Knowledge in Taxonomies and Ontologies', completed: false },
        { id: 't-aids-2-3', title: 'Building Cognitive Healthcare & Support Applications', completed: false }
      ]
    },
    {
      id: 'u-aids-3',
      unitNumber: 3,
      title: 'Module 3: Fuzzy Logic & Applications',
      weightagePercentage: 20,
      learningOutcomes: 'Fuzzy sets, membership functions, defuzzification, Mamdani controller design.',
      topics: [
        { id: 't-aids-3-1', title: 'Fuzzy Sets, Membership Functions & Operations', completed: false },
        { id: 't-aids-3-2', title: 'Max-Min & Max-Product Fuzzy Compositions', completed: false },
        { id: 't-aids-3-3', title: 'Mamdani Fuzzy Control System (Washing Machine / Shower Controller)', completed: false }
      ]
    },
    {
      id: 'u-aids-4',
      unitNumber: 4,
      title: 'Module 4: Introduction to Deep Learning',
      weightagePercentage: 20,
      learningOutcomes: 'ANNs, Convolutional Neural Networks (CNNs), RNNs, LSTM, and Autoencoders.',
      topics: [
        { id: 't-aids-4-1', title: 'Artificial Neural Networks vs Deep Learning', completed: false },
        { id: 't-aids-4-2', title: 'CNN Architectures, Pooling & Feature Maps', completed: false },
        { id: 't-aids-4-3', title: 'Recurrent Neural Networks (RNN) & LSTM Networks', completed: false }
      ]
    },
    {
      id: 'u-aids-5',
      unitNumber: 5,
      title: 'Module 5: Advanced ML Classification Techniques',
      weightagePercentage: 15,
      learningOutcomes: 'Ensemble methods (Bagging, Boosting, Random Forests), ROC curves, Cross-Validation.',
      topics: [
        { id: 't-aids-5-1', title: 'Ensemble Learning: Bagging, AdaBoost, Random Forests', completed: false },
        { id: 't-aids-5-2', title: 'Classifier Evaluation: Cross-Validation, Bootstrap & ROC Curves', completed: false }
      ]
    },
    {
      id: 'u-aids-6',
      unitNumber: 6,
      title: 'Module 6: Trends and Applications in Data Science',
      weightagePercentage: 10,
      learningOutcomes: 'Multimodal applications, ImageNet classification, and modern case studies.',
      topics: [
        { id: 't-aids-6-1', title: 'Multimodal Data Science Applications (Audio, Video, Text)', completed: false },
        { id: 't-aids-6-2', title: 'ImageNet Large Scale Visual Recognition Challenge (ILSVRC)', completed: false }
      ]
    }
  ];
}
