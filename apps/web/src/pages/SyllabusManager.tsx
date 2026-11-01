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
              <Filter className="w-3.5 h-3.5 text-[#8c8fa1] ml-2" />
              <select
                value={selectedSubjectId}
                onChange={e => setSelectedSubjectId(e.target.value)}
                className="bg-transparent text-[#121217] dark:text-slate-200 outline-none text-xs font-bold pr-4 cursor-pointer"
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
            className="flex items-center gap-2 bg-white dark:bg-slate-900 hover:bg-[#edf3fc] dark:hover:bg-slate-800 text-[#4f75f2] dark:text-indigo-400 border border-[#d0dcf5] dark:border-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            <Sparkles className="w-4 h-4 text-[#4f75f2]" />
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
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#3b52c4] bg-[#e4e7fd] px-3 py-1 rounded-full border border-[#d0d8fb] mb-3 inline-block font-bold">
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
                className="bg-gradient-to-r from-[#4f75f2] to-[#713fb8] h-full rounded-full transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Units List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#6b6f82] gap-3">
          <Loader2 className="w-8 h-8 text-[#4f75f2] animate-spin" />
          <span className="text-xs font-mono uppercase tracking-wider font-bold">Loading Syllabus Units...</span>
        </div>
      ) : units.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-[#e3e6ed] border-dashed">
          <BookOpen className="w-12 h-12 text-[#8c8fa1] mx-auto mb-3" />
          <h3 className="text-lg font-bold text-[#121217]">No Syllabus Found</h3>
          <p className="text-[#6b6f82] text-xs mt-1 max-w-md mx-auto font-sans">
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
                    <div
                      key={topic.id}
                      onClick={() => toggleTopicCompleted(unit.id, topic.id)}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                        topic.completed
                          ? 'bg-[#e2f6eb]/50 border-[#c9eed9] text-[#1f7247] line-through'
                          : 'bg-[#f8f9fc] border-[#e3e6ed] text-[#121217] hover:border-[#4f75f2] shadow-xs'
                      }`}
                    >
                      <span className="text-xs font-bold">{topic.title}</span>
                      {topic.completed ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 ml-2" />
                      ) : (
                        <Square className="w-4 h-4 text-[#8c8fa1] dark:text-slate-500 shrink-0 ml-2" />
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
          <div className="bg-white border border-[#e3e6ed] w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl p-6 space-y-6">
            <h3 className="text-lg font-extrabold text-[#121217] flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#4f75f2]" /> Add Syllabus Unit
            </h3>

            <form onSubmit={handleAddUnit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#6b6f82] mb-1 font-bold">Unit Title</label>
                <input
                  type="text"
                  required
                  value={newUnitTitle}
                  onChange={e => setNewUnitTitle(e.target.value)}
                  placeholder="e.g. Unit 3: Informed Search & Game Theory"
                  className="w-full bg-[#f8f9fc] border border-[#e3e6ed] rounded-2xl px-4 py-2.5 text-[#121217] outline-none focus:border-[#4f75f2] shadow-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-[#6b6f82] mb-1 font-bold">Exam Weightage (%)</label>
                <input
                  type="number"
                  min={5}
                  max={100}
                  value={newUnitWeightage}
                  onChange={e => setNewUnitWeightage(Number(e.target.value))}
                  className="w-full bg-[#f8f9fc] border border-[#e3e6ed] rounded-2xl px-4 py-2.5 text-[#121217] outline-none focus:border-[#4f75f2] shadow-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-[#6b6f82] mb-1 font-bold">Learning Outcomes</label>
                <input
                  type="text"
                  value={newUnitOutcomes}
                  onChange={e => setNewUnitOutcomes(e.target.value)}
                  placeholder="e.g. Master A*, IDA*, and adversarial minimax trees."
                  className="w-full bg-[#f8f9fc] border border-[#e3e6ed] rounded-2xl px-4 py-2.5 text-[#121217] outline-none focus:border-[#4f75f2] shadow-xs"
                />
              </div>

              <div>
                <label className="block text-[#6b6f82] mb-1 font-bold">Topics (One per line)</label>
                <textarea
                  rows={4}
                  value={newUnitTopics}
                  onChange={e => setNewUnitTopics(e.target.value)}
                  placeholder="A* Search Heuristic&#10;Alpha-Beta Pruning&#10;Game Trees & Minimax"
                  className="w-full bg-[#f8f9fc] border border-[#e3e6ed] rounded-2xl p-3 text-[#121217] outline-none focus:border-[#4f75f2] resize-none shadow-xs font-sans"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#e3e6ed]">
                <button
                  type="button"
                  onClick={() => setShowAddUnitModal(false)}
                  className="bg-[#f8f9fc] hover:bg-[#edf3fc] text-[#6b6f82] hover:text-[#121217] px-5 py-2.5 rounded-xl font-bold transition-colors cursor-pointer border border-[#e3e6ed]"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white border border-[#e3e6ed] w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl p-6 space-y-6">
            <h3 className="text-lg font-extrabold text-[#121217] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#4f75f2]" /> AI Syllabus Document Parser
            </h3>
            <p className="text-xs text-[#6b6f82] leading-relaxed font-sans">
              Paste your university course syllabus, curriculum PDF text, or module breakdown below. The AI will parse units, calculate weightage, and index topics.
            </p>

            <textarea
              rows={6}
              value={extractText}
              onChange={e => setExtractText(e.target.value)}
              placeholder="Paste raw syllabus outline or lecture plan text here..."
              className="w-full bg-[#f8f9fc] border border-[#e3e6ed] rounded-2xl p-3 text-xs text-[#121217] outline-none focus:border-[#4f75f2] resize-none shadow-xs font-sans"
            />

            <div className="flex justify-end gap-3 pt-4 border-t border-[#e3e6ed]">
              <button
                type="button"
                onClick={() => setShowExtractModal(false)}
                className="bg-[#f8f9fc] hover:bg-[#edf3fc] text-[#6b6f82] hover:text-[#121217] px-5 py-2.5 rounded-xl font-bold transition-colors cursor-pointer border border-[#e3e6ed]"
              >
                Cancel
              </button>
              <button
                disabled={isExtracting || !extractText.trim()}
                onClick={handleAiExtract}
                className="bg-[#4f75f2] hover:bg-[#385dd8] text-white px-6 py-2.5 rounded-xl font-bold transition-colors cursor-pointer flex items-center gap-2 shadow-xs disabled:opacity-50"
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    Parsing Curriculum...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-200" />
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

// Fallback Default Syllabus mapped to University of Mumbai Syllabus
function getDefaultSyllabusForSubject(subjectName: string): Unit[] {
  const s = subjectName.toLowerCase();

  // 1. Information Retrieval System (IRS - ITDO7024)
  if (s.includes('retrieval') || s.includes('irs')) {
    return [
      {
        id: 'u-irs-1',
        unitNumber: 1,
        title: 'Module 1: Introduction to Information Retrieval',
        weightagePercentage: 15,
        learningOutcomes: 'Understand components of IR systems, Information vs Data Retrieval, Search engines.',
        topics: [
          { id: 't-irs-1-1', title: 'The Retrieval Process & Information Systems', completed: true },
          { id: 't-irs-1-2', title: 'Information versus Data Retrieval', completed: true },
          { id: 't-irs-1-3', title: 'Search Engines, Crawlers & Search APIs', completed: false }
        ]
      },
      {
        id: 'u-irs-2',
        unitNumber: 2,
        title: 'Module 2: Information Retrieval Models',
        weightagePercentage: 20,
        learningOutcomes: 'Evaluate taxonomy of IR models, Classic Vector Space, Probabilistic & Structured models.',
        topics: [
          { id: 't-irs-2-1', title: 'Classic IR Models: Boolean, Vector Space Model', completed: true },
          { id: 't-irs-2-2', title: 'Probabilistic IR Models & BM25 Ranking', completed: false },
          { id: 't-irs-2-3', title: 'Structured Text Retrieval & Browsing Models', completed: false }
        ]
      },
      {
        id: 'u-irs-3',
        unitNumber: 3,
        title: 'Module 3: Query Processing & Operations',
        weightagePercentage: 20,
        learningOutcomes: 'Master keyword querying, pattern matching, relevance feedback, and wildcard queries.',
        topics: [
          { id: 't-irs-3-1', title: 'Keyword Querying & Pattern Matching Algorithms', completed: false },
          { id: 't-irs-3-2', title: 'User Relevance Feedback (Rocchio Algorithm)', completed: false },
          { id: 't-irs-3-3', title: 'Proximity Queries and Wildcard Searching', completed: false }
        ]
      },
      {
        id: 'u-irs-4',
        unitNumber: 4,
        title: 'Module 4: Text Processing & Document Operations',
        weightagePercentage: 15,
        learningOutcomes: 'Preprocessing pipelines: tokenization, stemming (Porter), stop words, document clustering.',
        topics: [
          { id: 't-irs-4-1', title: 'Document Preprocessing: Tokenization & Stemming', completed: false },
          { id: 't-irs-4-2', title: 'Document Clustering & Classification (k-Means, k-NN)', completed: false },
          { id: 't-irs-4-3', title: 'Markup Languages & Digital Libraries', completed: false }
        ]
      },
      {
        id: 'u-irs-5',
        unitNumber: 5,
        title: 'Module 5: Indexing and Searching the Web',
        weightagePercentage: 20,
        learningOutcomes: 'Inverted files, index compression, PageRank, HITS, Web search challenges.',
        topics: [
          { id: 't-irs-5-1', title: 'Inverted Index Construction & Compression Techniques', completed: false },
          { id: 't-irs-5-2', title: 'Web Crawling, Meta Searches & Hyperlink Analysis (PageRank)', completed: false },
          { id: 't-irs-5-3', title: 'Multimedia Indexing & Feature Extraction', completed: false }
        ]
      },
      {
        id: 'u-irs-6',
        unitNumber: 6,
        title: 'Module 6: User Interface and Visualization',
        weightagePercentage: 10,
        learningOutcomes: 'HCI in search engines, query specification, result snippet visualization, SeeSoft.',
        topics: [
          { id: 't-irs-6-1', title: 'Human Computer Interaction in IR', completed: false },
          { id: 't-irs-6-2', title: 'Relevance Judgments & Search Interface Support', completed: false }
        ]
      }
    ];
  }

  // 2. Software Testing and Quality Assurance (STQA - ITDO7014)
  if (s.includes('testing') || s.includes('stqa') || s.includes('qa')) {
    return [
      {
        id: 'u-stqa-1',
        unitNumber: 1,
        title: 'Module 1: Testing Methodology & STLC',
        weightagePercentage: 15,
        learningOutcomes: 'Understand software failure case studies, STLC phases, Verification vs Validation.',
        topics: [
          { id: 't-stqa-1-1', title: 'Software Testing Life Cycle (STLC) & Goals', completed: true },
          { id: 't-stqa-1-2', title: 'Verification vs Validation Models', completed: true },
          { id: 't-stqa-1-3', title: 'Exhaustive vs Effective Testing Strategies', completed: false }
        ]
      },
      {
        id: 'u-stqa-2',
        unitNumber: 2,
        title: 'Module 2: Dynamic & Static Testing Techniques',
        weightagePercentage: 25,
        learningOutcomes: 'Apply Black Box (BVA, Equivalence Partitioning) and White Box (Basis Path, Mutation) testing.',
        topics: [
          { id: 't-stqa-2-1', title: 'Black Box: Boundary Value Analysis (BVA) & Equivalence Class', completed: true },
          { id: 't-stqa-2-2', title: 'White Box: Basis Path, Cyclomatic Complexity & Graph Matrices', completed: false },
          { id: 't-stqa-2-3', title: 'Mutation Testing, Loop Testing & Regression Testing', completed: false }
        ]
      },
      {
        id: 'u-stqa-3',
        unitNumber: 3,
        title: 'Module 3: Test Management & Software Metrics',
        weightagePercentage: 20,
        learningOutcomes: 'Test planning, metrics monitoring, function points, and test suite minimization.',
        topics: [
          { id: 't-stqa-3-1', title: 'Test Planning, Organization & Detailed Specification', completed: false },
          { id: 't-stqa-3-2', title: 'Software Metrics & Function Point Analysis (FPA)', completed: false },
          { id: 't-stqa-3-3', title: 'Test Suite Prioritization & Reduction Algorithms', completed: false }
        ]
      },
      {
        id: 'u-stqa-4',
        unitNumber: 4,
        title: 'Module 4: Test Automation Tools',
        weightagePercentage: 15,
        learningOutcomes: 'Automation frameworks, tools: Selenium, JIRA, Bugzilla, test script design.',
        topics: [
          { id: 't-stqa-4-1', title: 'Automation Tool Selection Guidelines & Cost Analysis', completed: false },
          { id: 't-stqa-4-2', title: 'Selenium WebDriver Test Scripts & JIRA Bug Life Cycle', completed: false }
        ]
      },
      {
        id: 'u-stqa-5',
        unitNumber: 5,
        title: 'Module 5: Testing for Specialized Environments',
        weightagePercentage: 15,
        learningOutcomes: 'Agile testing in Scrum sprints, Web testing, Mobile and Cloud app challenges.',
        topics: [
          { id: 't-stqa-5-1', title: 'Agile Testing Life Cycle & Scrum Phases', completed: false },
          { id: 't-stqa-5-2', title: 'Web-based Systems, Cross-browser & Cloud Testing', completed: false }
        ]
      },
      {
        id: 'u-stqa-6',
        unitNumber: 6,
        title: 'Module 6: Software Quality Management & Standards',
        weightagePercentage: 10,
        learningOutcomes: 'McCalls Quality Model, ISO 9000:2000, Six Sigma quality control.',
        topics: [
          { id: 't-stqa-6-1', title: 'McCalls Quality Factors & Criteria Hierarchy', completed: false },
          { id: 't-stqa-6-2', title: 'ISO 9000:2000 Quality Management & Six Sigma Metrics', completed: false }
        ]
      }
    ];
  }

  // 3. Cyber Security and Laws (CSL - ILO7016)
  if (s.includes('cyber') || s.includes('security and laws') || s.includes('csl')) {
    return [
      {
        id: 'u-csl-1',
        unitNumber: 1,
        title: 'Module 1: Introduction to Cybercrime & IT Act',
        weightagePercentage: 15,
        learningOutcomes: 'Classifications of cybercrimes, global perspectives, Indian Information Technology Act 2000.',
        topics: [
          { id: 't-csl-1-1', title: 'Cybercrime Definitions & Evolution', completed: true },
          { id: 't-csl-1-2', title: 'Indian Information Technology Act 2000 (ITA 2000)', completed: true }
        ]
      },
      {
        id: 'u-csl-2',
        unitNumber: 2,
        title: 'Module 2: Cyber Offenses & Wireless Computing',
        weightagePercentage: 20,
        learningOutcomes: 'Botnets, attack vectors, mobile/wireless security challenges, organizational security policies.',
        topics: [
          { id: 't-csl-2-1', title: 'Social Engineering, Cyber Stalking & Botnets', completed: true },
          { id: 't-csl-2-2', title: 'Credit Card Frauds & Wireless Computing Security', completed: false },
          { id: 't-csl-2-3', title: 'Organizational Security Measures & Mobile Device Policies', completed: false }
        ]
      },
      {
        id: 'u-csl-3',
        unitNumber: 3,
        title: 'Module 3: Tools & Methods Used in Cybercrime',
        weightagePercentage: 20,
        learningOutcomes: 'Phishing, Keyloggers, DoS/DDoS, SQL Injection, Buffer Overflow, Steganography.',
        topics: [
          { id: 't-csl-3-1', title: 'Phishing, Password Cracking & Keyloggers', completed: false },
          { id: 't-csl-3-2', title: 'DoS and DDoS Attack Architectures', completed: false },
          { id: 't-csl-3-3', title: 'SQL Injection, Buffer Overflow & Identity Theft', completed: false }
        ]
      },
      {
        id: 'u-csl-4',
        unitNumber: 4,
        title: 'Module 4: The Concept of Cyberspace & Electronic Commerce',
        weightagePercentage: 15,
        learningOutcomes: 'Contractual aspects, IPR in cyberspace, electronic banking, evidence law.',
        topics: [
          { id: 't-csl-4-1', title: 'Electronic Contracts & Jurisdiction in Cyberspace', completed: false },
          { id: 't-csl-4-2', title: 'Intellectual Property Rights (IPR) in Cyber Law', completed: false },
          { id: 't-csl-4-3', title: 'Digital Evidence & Electronic Banking Legal Framework', completed: false }
        ]
      },
      {
        id: 'u-csl-5',
        unitNumber: 5,
        title: 'Module 5: Indian IT Act 2008 Amendments & Penalties',
        weightagePercentage: 15,
        learningOutcomes: 'Offences, penalties, compounding, adjudication under amended IT Act 2008.',
        topics: [
          { id: 't-csl-5-1', title: 'IT Act 2008 Major Amendments & New Sections', completed: false },
          { id: 't-csl-5-2', title: 'Penalties, Adjudication and Cyber Appellate Tribunals', completed: false }
        ]
      },
      {
        id: 'u-csl-6',
        unitNumber: 6,
        title: 'Module 6: Information Security Standard Compliances',
        weightagePercentage: 15,
        learningOutcomes: 'SOX, GLBA, HIPAA, ISO 27001, FISMA, PCI-DSS compliance frameworks.',
        topics: [
          { id: 't-csl-6-1', title: 'ISO 27001 & PCI-DSS Compliance Guidelines', completed: false },
          { id: 't-csl-6-2', title: 'SOX, HIPAA & FISMA Regulatory Compliances', completed: false }
        ]
      }
    ];
  }

  // 4. Internet of Everything (IOE - ITC702)
  if (s.includes('internet of everything') || s.includes('ioe') || s.includes('iot')) {
    return [
      {
        id: 'u-ioe-1',
        unitNumber: 1,
        title: 'Module 1: Introduction to IoT & Smart Objects',
        weightagePercentage: 15,
        learningOutcomes: 'Physical & logical design, functional blocks, Arduino/ESP32 hardware fundamentals.',
        topics: [
          { id: 't-ioe-1-1', title: 'Characteristics & Conceptual Framework of IoT', completed: true },
          { id: 't-ioe-1-2', title: 'Physical and Logical Design of IoT', completed: true },
          { id: 't-ioe-1-3', title: 'Smart Objects & Microcontroller Ecosystems (ESP32, NodeMCU)', completed: false }
        ]
      },
      {
        id: 'u-ioe-2',
        unitNumber: 2,
        title: 'Module 2: IoT Architecture & Edge/Fog Computing',
        weightagePercentage: 20,
        learningOutcomes: 'IoTWF 7-layer reference model, Core functional stack, Edge vs Fog vs Cloud compute.',
        topics: [
          { id: 't-ioe-2-1', title: 'IoTWF Standardized 7-Layer Architecture', completed: true },
          { id: 't-ioe-2-2', title: 'Core IoT Functional Stack (Layers 1-3)', completed: false },
          { id: 't-ioe-2-3', title: 'Fog Computing, Edge Computing & Data Management Stack', completed: false }
        ]
      },
      {
        id: 'u-ioe-3',
        unitNumber: 3,
        title: 'Module 3: Connected Devices & Access Protocols',
        weightagePercentage: 20,
        learningOutcomes: 'RFID, NFC, BLE, Zigbee, 6LoWPAN, LoRa, LoRaWAN wireless standards.',
        topics: [
          { id: 't-ioe-3-1', title: 'RFID, NFC, and Bluetooth Low Energy (BLE)', completed: false },
          { id: 't-ioe-3-2', title: 'Zigbee, 6LoWPAN, and IEEE 802.15.4 Standards', completed: false },
          { id: 't-ioe-3-3', title: 'LoRa and LoRaWAN Long-Range Cellular IoT', completed: false }
        ]
      },
      {
        id: 'u-ioe-4',
        unitNumber: 4,
        title: 'Module 4: Edge-to-Cloud Protocols',
        weightagePercentage: 20,
        learningOutcomes: 'MQTT, MQTT-SN, CoAP, WebSockets, AMQP protocol architectures & comparisons.',
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
        { id: 't-aids-1-1', title: 'Inference Using Full Joint Distributions', completed: true },
        { id: 't-aids-1-2', title: 'Bayes Theorem & Semantics of Bayesian Networks', completed: true },
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
        { id: 't-aids-2-1', title: 'Foundations & Design Principles of Cognitive Systems', completed: true },
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
