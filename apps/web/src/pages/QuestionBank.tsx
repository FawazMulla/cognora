import { useEffect, useState } from 'react';
import { HelpCircle, Filter, Plus, Sparkles, Search, BookOpen, FileText, Check, Loader2, Tag, ArrowRight, X } from 'lucide-react';
import { fetchApi } from '../lib/api';
import { getDefaultSubjects, generateStructuredAnswerAI } from '../lib/ai-service';

type Subject = {
  id: string;
  name: string;
  code?: string;
};

type QBQuestion = {
  id: string;
  questionText: string;
  unit: string;
  marks: number;
  tags: string[];
  frequencyCount?: number;
};

export default function QuestionBank() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [questions, setQuestions] = useState<QBQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [unitFilter, setUnitFilter] = useState<string>('All');
  const [marksFilter, setMarksFilter] = useState<string>('All');
  const [tagFilter, setTagFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Add Question Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newUnit, setNewUnit] = useState('Unit 1');
  const [newMarks, setNewMarks] = useState(5);
  const [newTags, setNewTags] = useState('IAE, Theory');

  // Answer Dialog state
  const [activeAnswer, setActiveAnswer] = useState<{ question: string; marks: number; answer: string } | null>(null);
  const [loadingAnswerId, setLoadingAnswerId] = useState<string | null>(null);

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

  useEffect(() => {
    if (!selectedSubjectId) return;

    async function loadQuestions() {
      setLoading(true);
      const selectedSub = subjects.find(s => s.id === selectedSubjectId);
      const subName = selectedSub?.name || 'Computer Science';

      try {
        const res = await fetchApi(`/api/question-bank?subjectId=${selectedSubjectId}`);
        if (res.questions && res.questions.length > 0) {
          setQuestions(res.questions);
        } else {
          setQuestions(getDefaultQBForSubject(subName));
        }
      } catch (err) {
        console.warn('Backend QB offline, using subject defaults:', err);
        setQuestions(getDefaultQBForSubject(subName));
      } finally {
        setLoading(false);
      }
    }

    loadQuestions();
  }, [selectedSubjectId, subjects]);

  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionText.trim()) return;

    const parsedTags = newTags
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const newQbItem: QBQuestion = {
      id: `qb-${Date.now()}`,
      questionText: newQuestionText.trim(),
      unit: newUnit,
      marks: Number(newMarks),
      tags: parsedTags.length > 0 ? parsedTags : ['Theory'],
      frequencyCount: 1
    };

    setQuestions(prev => [newQbItem, ...prev]);
    setShowAddModal(false);
    setNewQuestionText('');
  };

  const handleGenerateAnswer = async (q: QBQuestion) => {
    setLoadingAnswerId(q.id);
    const selectedSub = subjects.find(s => s.id === selectedSubjectId);
    const subName = selectedSub?.name || 'Computer Science';

    try {
      const res = await fetchApi('/api/answers/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q.questionText,
          markValue: q.marks,
          format: 'Topper Standard',
          subjectId: selectedSubjectId,
          topic: q.unit
        })
      });

      if (res && res.answer) {
        setActiveAnswer({
          question: q.questionText,
          marks: q.marks,
          answer: res.answer
        });
        return;
      }
    } catch (err) {
      console.warn('Backend answers offline, using AI generator:', err);
    }

    try {
      const answer = await generateStructuredAnswerAI(q.questionText, q.marks, 'Topper Standard', subName);
      setActiveAnswer({
        question: q.questionText,
        marks: q.marks,
        answer
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAnswerId(null);
    }
  };

  // Filter logic
  const filteredQuestions = questions.filter(q => {
    const matchesUnit = unitFilter === 'All' || q.unit === unitFilter;
    const matchesMarks = marksFilter === 'All' || q.marks === Number(marksFilter);
    const matchesTag = tagFilter === 'All' || q.tags.includes(tagFilter);
    const matchesSearch = searchQuery === '' || q.questionText.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesUnit && matchesMarks && matchesTag && matchesSearch;
  });

  const selectedSubject = subjects.find(s => s.id === selectedSubjectId);

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10 bg-white text-[#212121] min-h-screen font-display">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-[#d9d9dd]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest text-[#666666] uppercase mb-2">
            <BookOpen className="w-3.5 h-3.5 text-[#212121]" /> Question Bank Repository
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#212121] flex items-center gap-3">
            Question Bank (QB) Explorer
          </h1>
          <p className="text-[#666666] mt-2 text-sm md:text-base max-w-2xl">
            Unit-wise question banks, mark distributions (2M, 5M, 10M, 15M), IAE/PYQ tagging, and instant topper model answer drafting.
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
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-[#212121] hover:bg-black text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" /> Add Question
          </button>
        </div>
      </header>

      {/* Search & Filters Toolbar */}
      <div className="bg-[#fafafb] border border-[#d9d9dd] rounded-3xl p-6 space-y-4 shadow-sm">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-[#888888] absolute left-4 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search question bank by keyword, topic, or syllabus concept..."
              className="w-full bg-white border border-[#d9d9dd] rounded-2xl pl-11 pr-4 py-2.5 text-xs text-[#212121] outline-none focus:border-[#212121] shadow-xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Unit Filter */}
            <select
              value={unitFilter}
              onChange={e => setUnitFilter(e.target.value)}
              className="bg-white border border-[#d9d9dd] text-[#212121] rounded-xl px-3 py-2 text-xs font-bold outline-none cursor-pointer shadow-xs"
            >
              <option value="All">All Units</option>
              <option value="Unit 1">Unit 1</option>
              <option value="Unit 2">Unit 2</option>
              <option value="Unit 3">Unit 3</option>
              <option value="Unit 4">Unit 4</option>
              <option value="Unit 5">Unit 5</option>
            </select>

            {/* Marks Filter */}
            <select
              value={marksFilter}
              onChange={e => setMarksFilter(e.target.value)}
              className="bg-white border border-[#d9d9dd] text-[#212121] rounded-xl px-3 py-2 text-xs font-bold outline-none cursor-pointer shadow-xs"
            >
              <option value="All">All Marks</option>
              <option value="2">2 Marks</option>
              <option value="5">5 Marks</option>
              <option value="10">10 Marks</option>
              <option value="15">15 Marks</option>
            </select>

            {/* Tag Filter */}
            <select
              value={tagFilter}
              onChange={e => setTagFilter(e.target.value)}
              className="bg-white border border-[#d9d9dd] text-[#212121] rounded-xl px-3 py-2 text-xs font-bold outline-none cursor-pointer shadow-xs"
            >
              <option value="All">All Tags</option>
              <option value="IAE">IAE Tagged</option>
              <option value="PYQ">PYQ Tagged</option>
              <option value="Theory">Theory</option>
              <option value="Numerical">Numerical</option>
              <option value="Diagram">Diagram</option>
            </select>
          </div>
        </div>

        <div className="flex justify-between items-center text-xs text-[#666666] pt-3 border-t border-[#e5e5e8]">
          <span className="font-medium">Showing {filteredQuestions.length} of {questions.length} questions</span>
          <span className="text-[#212121] font-mono text-[11px] font-bold">{selectedSubject?.code || 'SUBJ'} Repository</span>
        </div>
      </div>

      {/* Questions List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#666666] gap-3">
          <Loader2 className="w-8 h-8 text-[#212121] animate-spin" />
          <span className="text-xs font-mono uppercase tracking-wider font-bold">Loading Question Bank...</span>
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="text-center py-20 bg-[#fafafb] rounded-3xl border border-[#d9d9dd] border-dashed">
          <HelpCircle className="w-12 h-12 text-[#999999] mx-auto mb-3" />
          <h3 className="text-lg font-bold text-[#212121]">No Questions Found</h3>
          <p className="text-[#666666] text-xs mt-1 max-w-md mx-auto">
            Try adjusting filters or click "Add Question" to add items to your QB.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQuestions.map((q) => (
            <div
              key={q.id}
              className="bg-white border border-[#d9d9dd] rounded-3xl p-6 shadow-sm hover:border-[#212121] transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
            >
              <div className="space-y-3 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-[#f4f4f4] text-[#212121] border border-[#d9d9dd] px-3 py-0.5 rounded-full text-xs font-mono font-bold">
                    {q.unit}
                  </span>
                  <span className="bg-[#212121] text-white px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold">
                    {q.marks} Marks
                  </span>
                  {q.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        tag === 'IAE'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : tag === 'PYQ'
                          ? 'bg-purple-100 text-purple-900 border border-purple-300'
                          : 'bg-[#f4f4f4] text-[#666666] border border-[#d9d9dd]'
                      }`}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                <p className="text-[#212121] font-bold text-sm md:text-base leading-relaxed">
                  {q.questionText}
                </p>
              </div>

              <button
                disabled={loadingAnswerId === q.id}
                onClick={() => handleGenerateAnswer(q)}
                className="shrink-0 bg-white hover:bg-[#fafafb] border border-[#d9d9dd] hover:border-[#212121] text-[#212121] px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shadow-xs disabled:opacity-50"
              >
                {loadingAnswerId === q.id ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Synthesizing Answer...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> Draft Topper Answer
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Question Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white border border-[#d9d9dd] w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl p-6 space-y-6">
            <h3 className="text-lg font-black text-[#212121] flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#212121]" /> Add Question to Bank
            </h3>

            <form onSubmit={handleAddQuestion} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#666666] mb-1 font-bold">Question Text</label>
                <textarea
                  rows={3}
                  required
                  value={newQuestionText}
                  onChange={e => setNewQuestionText(e.target.value)}
                  placeholder="e.g. Differentiate between BFS and DFS traversal algorithms with state space diagrams."
                  className="w-full bg-[#fafafb] border border-[#d9d9dd] rounded-xl p-3 text-[#212121] outline-none focus:border-[#212121] leading-relaxed resize-none shadow-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#666666] mb-1 font-bold">Unit</label>
                  <select
                    value={newUnit}
                    onChange={e => setNewUnit(e.target.value)}
                    className="w-full bg-[#fafafb] border border-[#d9d9dd] rounded-xl px-3 py-2.5 text-[#212121] outline-none focus:border-[#212121] cursor-pointer shadow-xs font-bold"
                  >
                    <option value="Unit 1">Unit 1</option>
                    <option value="Unit 2">Unit 2</option>
                    <option value="Unit 3">Unit 3</option>
                    <option value="Unit 4">Unit 4</option>
                    <option value="Unit 5">Unit 5</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#666666] mb-1 font-bold">Marks</label>
                  <select
                    value={newMarks}
                    onChange={e => setNewMarks(Number(e.target.value))}
                    className="w-full bg-[#fafafb] border border-[#d9d9dd] rounded-xl px-3 py-2.5 text-[#212121] outline-none focus:border-[#212121] cursor-pointer shadow-xs font-bold"
                  >
                    <option value={2}>2 Marks</option>
                    <option value={5}>5 Marks</option>
                    <option value={10}>10 Marks</option>
                    <option value={15}>15 Marks</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#666666] mb-1 font-bold">Tags (Comma-separated)</label>
                <input
                  type="text"
                  value={newTags}
                  onChange={e => setNewTags(e.target.value)}
                  placeholder="IAE, PYQ, Theory, Numerical"
                  className="w-full bg-[#fafafb] border border-[#d9d9dd] rounded-xl px-4 py-2.5 text-[#212121] outline-none focus:border-[#212121] shadow-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#d9d9dd]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="bg-[#f4f4f4] hover:bg-[#e5e5e8] text-[#212121] px-5 py-2.5 rounded-xl font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#212121] hover:bg-black text-white px-6 py-2.5 rounded-xl font-bold transition-colors cursor-pointer shadow-xs"
                >
                  Save Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Answer Modal */}
      {activeAnswer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white border border-[#d9d9dd] w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            <header className="p-6 border-b border-[#d9d9dd] flex justify-between items-start gap-4 bg-[#fafafb]">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#212121] bg-white px-3 py-1 rounded-full border border-[#d9d9dd] mb-2 inline-block font-bold">
                  TOPPER MODEL ANSWER ({activeAnswer.marks} MARKS)
                </span>
                <h3 className="text-lg font-black text-[#212121] leading-snug">{activeAnswer.question}</h3>
              </div>
              <button
                onClick={() => setActiveAnswer(null)}
                className="text-[#666666] hover:text-[#212121] p-1.5 rounded-lg bg-white border border-[#d9d9dd] hover:bg-[#f4f4f4] transition-colors cursor-pointer shadow-xs"
              >
                <X className="w-5 h-5" />
              </button>
            </header>

            <div className="p-6 overflow-y-auto space-y-4 text-[#333333] leading-relaxed text-sm whitespace-pre-wrap font-sans select-text">
              {activeAnswer.answer}
            </div>

            <footer className="p-4 bg-[#fafafb] border-t border-[#d9d9dd] flex justify-end">
              <button
                onClick={() => setActiveAnswer(null)}
                className="bg-[#212121] hover:bg-black text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                Close Answer
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}

// Fallback QB Data
function getDefaultQBForSubject(subjectName: string): QBQuestion[] {
  return [
    {
      id: 'qb-1',
      questionText: `Explain the working of fundamental algorithms in ${subjectName} with evaluation function and admissibility proof.`,
      unit: 'Unit 1',
      marks: 10,
      tags: ['IAE', 'PYQ', 'Theory'],
      frequencyCount: 5
    },
    {
      id: 'qb-2',
      questionText: 'Differentiate between core architectural styles in terms of state space, completeness, and asymptotic optimality.',
      unit: 'Unit 1',
      marks: 5,
      tags: ['IAE', 'Theory'],
      frequencyCount: 4
    },
    {
      id: 'qb-3',
      questionText: 'Define formal consistency conditions and invariant properties with mathematical inequality formulations.',
      unit: 'Unit 2',
      marks: 2,
      tags: ['Theory', 'Numerical'],
      frequencyCount: 3
    },
    {
      id: 'qb-4',
      questionText: 'Demonstrate tree pruning and optimization on a multi-tier pipeline diagram, calculating alpha/beta cutoff values.',
      unit: 'Unit 2',
      marks: 10,
      tags: ['IAE', 'PYQ', 'Diagram'],
      frequencyCount: 4
    },
    {
      id: 'qb-5',
      questionText: 'Formulate First-Order Predicate Logic (FOL) representations and verify clause normal forms for domain assertions.',
      unit: 'Unit 3',
      marks: 5,
      tags: ['PYQ', 'Numerical'],
      frequencyCount: 2
    }
  ];
}

