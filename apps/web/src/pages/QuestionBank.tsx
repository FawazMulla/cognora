import { useEffect, useState } from 'react';
import { HelpCircle, Filter, Plus, Sparkles, Search, Check, Loader2, X, Copy, Bookmark, Printer, Download, Edit3, Eye } from 'lucide-react';
import { fetchApi } from '../lib/api';
import { getDefaultSubjects, generateStructuredAnswerAI } from '../lib/ai-service';
import { FormattedAnswer } from '../components/FormattedAnswer';

type Subject = {
  id: string;
  name: string;
  code?: string;
  type?: string;
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
  const [copiedAnswer, setCopiedAnswer] = useState(false);
  const [isEditingAnswer, setIsEditingAnswer] = useState(false);
  const [editedAnswerText, setEditedAnswerText] = useState('');

  // Bookmarking & Saved Items
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('cognora_qb_bookmarks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showOnlyBookmarks, setShowOnlyBookmarks] = useState(false);

  const toggleBookmark = (id: string) => {
    setBookmarkedIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      try {
        localStorage.setItem('cognora_qb_bookmarks', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  useEffect(() => {
    async function loadSubjects() {
      // Helper: keep only theory subjects (exclude labs)
      const theoryOnly = (list: Subject[]) =>
        list.filter(s => s.type !== 'Lab' && !s.name.toLowerCase().includes('lab'));

      try {
        const res = await fetchApi('/api/subjects');
        if (res.subjects && res.subjects.length > 0) {
          const theory = theoryOnly(res.subjects);
          if (theory.length > 0) {
            setSubjects(theory);
            setSelectedSubjectId(theory[0].id);
          } else {
            const defaults = theoryOnly(getDefaultSubjects());
            setSubjects(defaults);
            setSelectedSubjectId(defaults[0]?.id || '');
          }
        } else {
          const defaults = theoryOnly(getDefaultSubjects());
          setSubjects(defaults);
          setSelectedSubjectId(defaults[0]?.id || '');
        }
      } catch (err) {
        console.error('Error loading subjects:', err);
        const defaults = theoryOnly(getDefaultSubjects());
        setSubjects(defaults);
        setSelectedSubjectId(defaults[0]?.id || '');
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
        setEditedAnswerText(res.answer);
        setIsEditingAnswer(false);
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
      setEditedAnswerText(answer);
      setIsEditingAnswer(false);
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
    const matchesBookmark = !showOnlyBookmarks || bookmarkedIds.includes(q.id);
    return matchesUnit && matchesMarks && matchesTag && matchesSearch && matchesBookmark;
  });

  const selectedSubject = subjects.find(s => s.id === selectedSubjectId);

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 bg-[#f8f9fc] text-[#2d2d34] min-h-screen font-sans">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-2 border-b border-[#e3e6ed]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-[#4f75f2] animate-pulse" />
            <span className="text-[11px] font-mono tracking-widest text-[#6b6f82] uppercase font-bold">
              Question Bank Repository
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#121217] flex items-center gap-3">
            Question Bank (QB) Explorer
          </h1>
          <p className="text-xs md:text-sm text-[#6b6f82] mt-1 font-sans max-w-2xl">
            Unit-wise question banks, mark distributions (2M, 5M, 10M, 15M), IAE/PYQ tagging, and instant topper model answers with schematic architecture diagrams.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {subjects.length > 0 && (
            <div className="flex items-center gap-2 bg-white border border-[#e3e6ed] rounded-2xl p-1.5 shadow-xs">
              <Filter className="w-3.5 h-3.5 text-[#8c8fa1] ml-2" />
              <select
                value={selectedSubjectId}
                onChange={e => setSelectedSubjectId(e.target.value)}
                className="bg-transparent text-[#121217] outline-none text-xs font-bold pr-3 cursor-pointer"
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
            className="flex items-center gap-2 bg-[#4f75f2] hover:bg-[#385dd8] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" /> Add Question
          </button>
        </div>
      </header>

      {/* Search & Filters Toolbar */}
      <div className="bg-white border border-[#e3e6ed] rounded-3xl p-5 md:p-6 space-y-4 shadow-xs">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-[#8c8fa1] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search question bank by keyword, topic, or syllabus concept..."
              className="w-full bg-[#f8f9fc] border border-[#e3e6ed] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-[#121217] placeholder-[#8c8fa1] outline-none focus:border-[#4f75f2] transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Bookmarks Toggle Filter */}
            <button
              onClick={() => setShowOnlyBookmarks(!showOnlyBookmarks)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                showOnlyBookmarks
                  ? 'bg-[#4f75f2] text-white border-[#4f75f2] shadow-xs'
                  : 'bg-[#f8f9fc] text-[#6b6f82] border-[#e3e6ed] hover:text-[#121217] hover:border-[#4f75f2]'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${showOnlyBookmarks ? 'fill-current' : ''}`} />
              <span>Saved ({bookmarkedIds.length})</span>
            </button>

            {/* Unit Filter */}
            <select
              value={unitFilter}
              onChange={e => setUnitFilter(e.target.value)}
              className="bg-[#f8f9fc] border border-[#e3e6ed] text-[#121217] rounded-xl px-3 py-2 text-xs font-bold outline-none cursor-pointer shadow-xs focus:border-[#4f75f2]"
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
              className="bg-[#f8f9fc] border border-[#e3e6ed] text-[#121217] rounded-xl px-3 py-2 text-xs font-bold outline-none cursor-pointer shadow-xs focus:border-[#4f75f2]"
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
              className="bg-[#f8f9fc] border border-[#e3e6ed] text-[#121217] rounded-xl px-3 py-2 text-xs font-bold outline-none cursor-pointer shadow-xs focus:border-[#4f75f2]"
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

        <div className="flex justify-between items-center text-xs text-[#6b6f82] pt-3 border-t border-[#e3e6ed]">
          <span className="font-medium">Showing <strong className="text-[#121217]">{filteredQuestions.length}</strong> of {questions.length} questions</span>
          <span className="text-[#4f75f2] font-mono text-[11px] font-bold bg-[#edf3fc] px-2.5 py-0.5 rounded-lg border border-[#d0dcf5]">
            {selectedSubject?.code || 'SUBJ'} Repository
          </span>
        </div>
      </div>

      {/* Questions List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#6b6f82] gap-3">
          <Loader2 className="w-8 h-8 text-[#4f75f2] animate-spin" />
          <span className="text-xs font-mono uppercase tracking-wider font-bold">Loading Question Bank...</span>
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-[#e3e6ed] border-dashed">
          <HelpCircle className="w-12 h-12 text-[#8c8fa1] mx-auto mb-3" />
          <h3 className="text-lg font-bold text-[#121217]">No Questions Found</h3>
          <p className="text-[#6b6f82] text-xs mt-1 max-w-md mx-auto">
            Try adjusting filters or click "Add Question" to add items to your QB.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredQuestions.map((q) => {
            const isBookmarked = bookmarkedIds.includes(q.id);
            return (
              <div
                key={q.id}
                className="group bg-white border border-[#e3e6ed] rounded-3xl p-5 md:p-6 shadow-xs hover:shadow-md hover:border-[#4f75f2] transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-5 relative overflow-hidden"
              >
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-[#edf3fc] text-[#4f75f2] border border-[#d0dcf5] px-2.5 py-0.5 rounded-lg text-[11px] font-mono font-bold">
                      {q.unit}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-mono font-bold border ${
                      q.marks >= 10
                        ? 'bg-[#e4e7fd] text-[#3b52c4] border-[#d0d8fb]'
                        : q.marks === 5
                        ? 'bg-[#e1f1fd] text-[#216ea3] border-[#cce5fc]'
                        : 'bg-[#e2f6eb] text-[#1f7247] border-[#c9eed9]'
                    }`}>
                      {q.marks} Marks
                    </span>

                    {q.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className={`px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider border ${
                          tag === 'IAE'
                            ? 'bg-[#fbf5e6] text-[#967018] border-[#f4e8cc]'
                            : tag === 'PYQ'
                            ? 'bg-[#f0eafb] text-[#713fb8] border-[#e3d7fa]'
                            : tag === 'Diagram'
                            ? 'bg-[#e2f6eb] text-[#1f7247] border-[#c9eed9]'
                            : 'bg-[#f8f9fc] text-[#6b6f82] border-[#e3e6ed]'
                        }`}
                      >
                        #{tag}
                      </span>
                    ))}

                    {q.frequencyCount && (
                      <span className="text-[10px] font-mono text-[#6b6f82] bg-[#f8f9fc] px-2 py-0.5 rounded-lg border border-[#e3e6ed]">
                        Appeared {q.frequencyCount}x
                      </span>
                    )}
                  </div>

                  <p className="text-[#121217] font-bold text-sm md:text-base leading-relaxed group-hover:text-[#4f75f2] transition-colors">
                    {q.questionText}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <button
                    onClick={() => toggleBookmark(q.id)}
                    title={isBookmarked ? 'Remove from Bookmarks' : 'Bookmark Question'}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer shadow-xs ${
                      isBookmarked
                        ? 'bg-[#fee2e2]/60 text-[#dc2626] border-[#fca5a5]'
                        : 'bg-white text-[#8c8fa1] border-[#e3e6ed] hover:text-[#121217] hover:border-[#4f75f2]'
                    }`}
                  >
                    <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                  </button>

                  <button
                    disabled={loadingAnswerId === q.id}
                    onClick={() => handleGenerateAnswer(q)}
                    className="bg-[#4f75f2] hover:bg-[#385dd8] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shadow-xs disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {loadingAnswerId === q.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Synthesizing...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-200" />
                        <span>Draft Topper Answer</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
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
          <div className="bg-white border border-[#e3e6ed] w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            <header className="p-6 border-b border-[#e3e6ed] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#f8f9fc]">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#3b52c4] bg-[#e4e7fd] px-3 py-1 rounded-full border border-[#d0d8fb] font-bold">
                    TOPPER MODEL ANSWER ({activeAnswer.marks} MARKS)
                  </span>
                  <span className="text-[10px] font-mono text-[#6b6f82] bg-white px-2.5 py-1 rounded-full border border-[#e3e6ed]">
                    University Exam Standard
                  </span>
                </div>
                <h3 className="text-lg md:text-xl font-extrabold text-[#121217] leading-snug">{activeAnswer.question}</h3>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Edit / Preview Toggle */}
                <button
                  onClick={() => setIsEditingAnswer(!isEditingAnswer)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all border cursor-pointer ${
                    isEditingAnswer
                      ? 'bg-[#4f75f2] text-white border-[#4f75f2]'
                      : 'bg-white text-[#121217] border-[#e3e6ed] hover:border-[#4f75f2]'
                  }`}
                  title="Toggle Edit Answer"
                >
                  {isEditingAnswer ? <Eye className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                  <span>{isEditingAnswer ? 'Preview' : 'Edit Notes'}</span>
                </button>

                {/* Print Answer */}
                <button
                  onClick={() => window.print()}
                  className="p-2 rounded-xl bg-white border border-[#e3e6ed] hover:border-[#4f75f2] text-[#6b6f82] hover:text-[#121217] transition-colors cursor-pointer shadow-xs"
                  title="Print Answer"
                >
                  <Printer className="w-4 h-4" />
                </button>

                {/* Download Markdown */}
                <button
                  onClick={() => {
                    const blob = new Blob([activeAnswer.answer], { type: 'text/markdown' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `Topper_Answer_${activeAnswer.marks}M.md`;
                    a.click();
                  }}
                  className="p-2 rounded-xl bg-white border border-[#e3e6ed] hover:border-[#4f75f2] text-[#6b6f82] hover:text-[#121217] transition-colors cursor-pointer shadow-xs"
                  title="Export Markdown"
                >
                  <Download className="w-4 h-4" />
                </button>

                {/* Close */}
                <button
                  onClick={() => setActiveAnswer(null)}
                  className="p-2 rounded-xl bg-white border border-[#e3e6ed] hover:bg-[#edf3fc] text-[#6b6f82] hover:text-[#121217] transition-colors cursor-pointer shadow-xs"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </header>

            <div className="p-6 md:p-8 overflow-y-auto space-y-4 select-text bg-white">
              {isEditingAnswer ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs font-mono text-[#6b6f82]">
                    <span>Editing custom topper answer notes (supports Markdown & diagrams)</span>
                    <button
                      onClick={() => {
                        setActiveAnswer({ ...activeAnswer, answer: editedAnswerText });
                        setIsEditingAnswer(false);
                      }}
                      className="bg-[#4f75f2] text-white px-3 py-1 rounded-xl font-bold text-xs cursor-pointer shadow-xs"
                    >
                      Apply &amp; Preview
                    </button>
                  </div>
                  <textarea
                    rows={16}
                    value={editedAnswerText}
                    onChange={e => setEditedAnswerText(e.target.value)}
                    className="w-full bg-[#f8f9fc] border border-[#e3e6ed] rounded-2xl p-4 font-mono text-xs md:text-sm text-[#121217] outline-none focus:border-[#4f75f2] leading-relaxed shadow-inner"
                  />
                </div>
              ) : (
                <FormattedAnswer content={activeAnswer.answer} />
              )}
            </div>

            <footer className="p-4 bg-[#f8f9fc] border-t border-[#e3e6ed] flex items-center justify-between">
              <button
                onClick={() => {
                  if (activeAnswer) {
                    navigator.clipboard.writeText(activeAnswer.answer);
                    setCopiedAnswer(true);
                    setTimeout(() => setCopiedAnswer(false), 2000);
                  }
                }}
                className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#212121] hover:text-[#1863dc] px-3.5 py-2 rounded-xl border border-[#d9d9dd] hover:border-[#1863dc] bg-white transition-all cursor-pointer shadow-xs"
              >
                {copiedAnswer ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedAnswer ? 'Copied' : 'Copy Full Answer'}</span>
              </button>

              <button
                onClick={() => setActiveAnswer(null)}
                className="bg-[#212121] hover:bg-black text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                Done
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}

// Fallback QB Data customized to Mumbai University Semester VII subjects
function getDefaultQBForSubject(subjectName: string): QBQuestion[] {
  const s = subjectName.toLowerCase();

  if (s.includes('retrieval') || s.includes('irs')) {
    return [
      { id: 'qb-irs-1', questionText: 'Explain the Classic Vector Space Model with cosine similarity and TF-IDF term weighting formula.', unit: 'Unit 2', marks: 10, tags: ['IAE', 'PYQ', 'Theory'], frequencyCount: 5 },
      { id: 'qb-irs-2', questionText: 'Differentiate between Information Retrieval and Data Retrieval with architecture block diagram.', unit: 'Unit 1', marks: 5, tags: ['IAE', 'Theory'], frequencyCount: 4 },
      { id: 'qb-irs-3', questionText: 'Define Inverted Index and explain dictionary posting list with skip pointers.', unit: 'Unit 5', marks: 10, tags: ['PYQ', 'Diagram'], frequencyCount: 4 },
      { id: 'qb-irs-4', questionText: 'Formulate Rocchio Relevance Feedback algorithm with vector space adjustments.', unit: 'Unit 3', marks: 5, tags: ['Theory', 'Numerical'], frequencyCount: 3 },
      { id: 'qb-irs-5', questionText: 'Explain Porter Stemming algorithm and document clustering using k-Means.', unit: 'Unit 4', marks: 5, tags: ['PYQ', 'Theory'], frequencyCount: 2 }
    ];
  }

  if (s.includes('testing') || s.includes('stqa') || s.includes('qa')) {
    return [
      { id: 'qb-stqa-1', questionText: 'Perform Boundary Value Analysis (BVA) and Equivalence Class Partitioning for an exam grading system.', unit: 'Unit 2', marks: 10, tags: ['IAE', 'PYQ', 'Numerical'], frequencyCount: 6 },
      { id: 'qb-stqa-2', questionText: 'Explain Basis Path Testing. Calculate Cyclomatic Complexity V(G) from a given control flow graph.', unit: 'Unit 2', marks: 10, tags: ['IAE', 'PYQ', 'Diagram'], frequencyCount: 5 },
      { id: 'qb-stqa-3', questionText: 'Differentiate between Verification and Validation with Software Testing Life Cycle (STLC) V-Model.', unit: 'Unit 1', marks: 5, tags: ['IAE', 'Theory'], frequencyCount: 4 },
      { id: 'qb-stqa-4', questionText: 'Describe Function Point Analysis (FPA) with value adjustment factor calculation.', unit: 'Unit 3', marks: 5, tags: ['Theory', 'Numerical'], frequencyCount: 3 },
      { id: 'qb-stqa-5', questionText: 'Explain McCalls Quality Factors and Six Sigma metrics in software quality management.', unit: 'Unit 6', marks: 5, tags: ['PYQ', 'Theory'], frequencyCount: 2 }
    ];
  }

  if (s.includes('cyber') || s.includes('security and laws') || s.includes('csl')) {
    return [
      { id: 'qb-csl-1', questionText: 'Explain the key provisions, offences, and penalties under Indian Information Technology Act 2000 (ITA 2000).', unit: 'Unit 1', marks: 10, tags: ['IAE', 'PYQ', 'Theory'], frequencyCount: 6 },
      { id: 'qb-csl-2', questionText: 'Explain SQL Injection and Cross-Site Scripting (XSS) attack vectors with countermeasures.', unit: 'Unit 3', marks: 10, tags: ['IAE', 'PYQ', 'Diagram'], frequencyCount: 5 },
      { id: 'qb-csl-3', questionText: 'Describe ISO 27001 Information Security Management System (ISMS) compliance framework.', unit: 'Unit 6', marks: 5, tags: ['Theory'], frequencyCount: 3 },
      { id: 'qb-csl-4', questionText: 'Explain DoS and DDoS attack architectures and mitigation methods in enterprise networks.', unit: 'Unit 3', marks: 5, tags: ['IAE', 'Theory'], frequencyCount: 4 },
      { id: 'qb-csl-5', questionText: 'Discuss intellectual property rights (IPR) in cyberspace and electronic contract legality.', unit: 'Unit 4', marks: 5, tags: ['PYQ', 'Theory'], frequencyCount: 2 }
    ];
  }

  if (s.includes('internet of everything') || s.includes('ioe') || s.includes('iot')) {
    return [
      { id: 'qb-ioe-1', questionText: 'Explain the IoT World Forum (IoTWF) 7-Layer Standardized Reference Architecture with block diagram.', unit: 'Unit 2', marks: 10, tags: ['IAE', 'PYQ', 'Diagram'], frequencyCount: 6 },
      { id: 'qb-ioe-2', questionText: 'Compare MQTT and CoAP protocols in terms of transport, messaging paradigms, and overhead.', unit: 'Unit 4', marks: 10, tags: ['IAE', 'PYQ', 'Theory'], frequencyCount: 5 },
      { id: 'qb-ioe-3', questionText: 'Describe LoRa and LoRaWAN physical and MAC layer architecture for smart cities.', unit: 'Unit 3', marks: 5, tags: ['PYQ', 'Theory'], frequencyCount: 4 },
      { id: 'qb-ioe-4', questionText: 'Explain Edge vs Fog vs Cloud computing hierarchy in Internet of Everything ecosystem.', unit: 'Unit 2', marks: 5, tags: ['IAE', 'Theory'], frequencyCount: 3 },
      { id: 'qb-ioe-5', questionText: 'Formulate an end-to-end smart agriculture sensor network with ThingSpeak analytics.', unit: 'Unit 6', marks: 5, tags: ['Diagram', 'Theory'], frequencyCount: 2 }
    ];
  }

  // Default: AI and DS – II (ITC701)
  return [
    { id: 'qb-1', questionText: 'Explain Bayesian Network exact inference with conditional probability tables and factorization proof.', unit: 'Unit 1', marks: 10, tags: ['IAE', 'PYQ', 'Theory'], frequencyCount: 5 },
    { id: 'qb-2', questionText: 'Design a Mamdani Fuzzy Controller system for domestic washing machine with defuzzification methods.', unit: 'Unit 3', marks: 10, tags: ['IAE', 'PYQ', 'Diagram'], frequencyCount: 5 },
    { id: 'qb-3', questionText: 'Differentiate between Convolutional Neural Networks (CNN) and Recurrent Neural Networks (RNN/LSTM).', unit: 'Unit 4', marks: 5, tags: ['IAE', 'Theory'], frequencyCount: 4 },
    { id: 'qb-4', questionText: 'Explain Ensemble Classification: Bagging, AdaBoost, and Random Forest algorithms with error bounds.', unit: 'Unit 5', marks: 10, tags: ['PYQ', 'Numerical'], frequencyCount: 4 },
    { id: 'qb-5', questionText: 'Describe Cognitive Computing design principles and natural language processing pipelines in IBM Watson.', unit: 'Unit 2', marks: 5, tags: ['Theory'], frequencyCount: 3 }
  ];
}

