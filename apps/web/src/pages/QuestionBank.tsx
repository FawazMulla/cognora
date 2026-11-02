import {
  Bookmark,
  Check,
  Cloud,
  Copy,
  Download,
  Edit3,
  ExternalLink,
  Eye,
  Filter,
  Loader2,
  Plus,
  Printer,
  Search,
  Sparkles,
  X,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { FormattedAnswer } from '../components/FormattedAnswer';
import { QuickPickSelector } from '../components/QuickPickSelector';
import { getDefaultSubjects, generateStructuredAnswerAI } from '../lib/ai-service';
import { fetchApi } from '../lib/api';
import { executeHybridQuery } from '../lib/hybrid-router';
import type { QuickPickItem } from '../lib/quick-picks-data';

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

// Fallback QB Data customized to Mumbai University Semester VII subjects
function getDefaultQBForSubject(subjectName: string): QBQuestion[] {
  const s = subjectName.toLowerCase();

  if (s.includes('retrieval') || s.includes('irs')) {
    return [
      {
        id: 'qb-irs-1',
        questionText:
          'Explain the Classic Vector Space Model with cosine similarity and TF-IDF term weighting formula.',
        unit: 'Unit 2',
        marks: 10,
        tags: ['IAE', 'PYQ', 'Theory'],
        frequencyCount: 5,
      },
      {
        id: 'qb-irs-2',
        questionText:
          'Differentiate between Information Retrieval and Data Retrieval with architecture block diagram.',
        unit: 'Unit 1',
        marks: 5,
        tags: ['IAE', 'Theory'],
        frequencyCount: 4,
      },
      {
        id: 'qb-irs-3',
        questionText:
          'Define Inverted Index and explain dictionary posting list with skip pointers.',
        unit: 'Unit 5',
        marks: 10,
        tags: ['PYQ', 'Diagram'],
        frequencyCount: 4,
      },
      {
        id: 'qb-irs-4',
        questionText:
          'Formulate Rocchio Relevance Feedback algorithm with vector space adjustments.',
        unit: 'Unit 3',
        marks: 5,
        tags: ['Theory', 'Numerical'],
        frequencyCount: 3,
      },
      {
        id: 'qb-irs-5',
        questionText: 'Explain Porter Stemming algorithm and document clustering using k-Means.',
        unit: 'Unit 4',
        marks: 5,
        tags: ['PYQ', 'Theory'],
        frequencyCount: 2,
      },
    ];
  }

  if (s.includes('testing') || s.includes('stqa') || s.includes('qa')) {
    return [
      {
        id: 'qb-stqa-1',
        questionText:
          'Perform Boundary Value Analysis (BVA) and Equivalence Class Partitioning for an exam grading system.',
        unit: 'Unit 2',
        marks: 10,
        tags: ['IAE', 'PYQ', 'Numerical'],
        frequencyCount: 6,
      },
      {
        id: 'qb-stqa-2',
        questionText:
          'Explain Basis Path Testing. Calculate Cyclomatic Complexity V(G) from a given control flow graph.',
        unit: 'Unit 2',
        marks: 10,
        tags: ['IAE', 'PYQ', 'Diagram'],
        frequencyCount: 5,
      },
      {
        id: 'qb-stqa-3',
        questionText:
          'Differentiate between Verification and Validation with Software Testing Life Cycle (STLC) V-Model.',
        unit: 'Unit 1',
        marks: 5,
        tags: ['IAE', 'Theory'],
        frequencyCount: 4,
      },
      {
        id: 'qb-stqa-4',
        questionText:
          'Describe Function Point Analysis (FPA) with value adjustment factor calculation.',
        unit: 'Unit 3',
        marks: 5,
        tags: ['Theory', 'Numerical'],
        frequencyCount: 3,
      },
      {
        id: 'qb-stqa-5',
        questionText:
          'Explain McCalls Quality Factors and Six Sigma metrics in software quality management.',
        unit: 'Unit 6',
        marks: 5,
        tags: ['PYQ', 'Theory'],
        frequencyCount: 2,
      },
    ];
  }

  if (s.includes('cyber') || s.includes('security and laws') || s.includes('csl')) {
    return [
      {
        id: 'qb-csl-1',
        questionText:
          'Explain the key provisions, offences, and penalties under Indian Information Technology Act 2000 (ITA 2000).',
        unit: 'Unit 1',
        marks: 10,
        tags: ['IAE', 'PYQ', 'Theory'],
        frequencyCount: 6,
      },
      {
        id: 'qb-csl-2',
        questionText:
          'Explain SQL Injection and Cross-Site Scripting (XSS) attack vectors with countermeasures.',
        unit: 'Unit 3',
        marks: 10,
        tags: ['IAE', 'PYQ', 'Diagram'],
        frequencyCount: 5,
      },
      {
        id: 'qb-csl-3',
        questionText:
          'Describe ISO 27001 Information Security Management System (ISMS) compliance framework.',
        unit: 'Unit 6',
        marks: 5,
        tags: ['Theory'],
        frequencyCount: 3,
      },
      {
        id: 'qb-csl-4',
        questionText:
          'Explain DoS and DDoS attack architectures and mitigation methods in enterprise networks.',
        unit: 'Unit 3',
        marks: 5,
        tags: ['IAE', 'Theory'],
        frequencyCount: 4,
      },
      {
        id: 'qb-csl-5',
        questionText:
          'Discuss intellectual property rights (IPR) in cyberspace and electronic contract legality.',
        unit: 'Unit 4',
        marks: 5,
        tags: ['PYQ', 'Theory'],
        frequencyCount: 2,
      },
    ];
  }

  if (s.includes('internet of everything') || s.includes('ioe') || s.includes('iot')) {
    return [
      {
        id: 'qb-ioe-1',
        questionText:
          'Explain the IoT World Forum (IoTWF) 7-Layer Standardized Reference Architecture with block diagram.',
        unit: 'Unit 2',
        marks: 10,
        tags: ['IAE', 'PYQ', 'Diagram'],
        frequencyCount: 6,
      },
      {
        id: 'qb-ioe-2',
        questionText:
          'Compare MQTT and CoAP protocols in terms of transport, messaging paradigms, and overhead.',
        unit: 'Unit 4',
        marks: 10,
        tags: ['IAE', 'PYQ', 'Theory'],
        frequencyCount: 5,
      },
      {
        id: 'qb-ioe-3',
        questionText:
          'Describe LoRa and LoRaWAN physical and MAC layer architecture for smart cities.',
        unit: 'Unit 3',
        marks: 5,
        tags: ['PYQ', 'Theory'],
        frequencyCount: 4,
      },
      {
        id: 'qb-ioe-4',
        questionText:
          'Explain Edge vs Fog vs Cloud computing hierarchy in Internet of Everything ecosystem.',
        unit: 'Unit 2',
        marks: 5,
        tags: ['IAE', 'Theory'],
        frequencyCount: 3,
      },
      {
        id: 'qb-ioe-5',
        questionText:
          'Formulate an end-to-end smart agriculture sensor network with ThingSpeak analytics.',
        unit: 'Unit 6',
        marks: 5,
        tags: ['Diagram', 'Theory'],
        frequencyCount: 2,
      },
    ];
  }

  // Default: AI and DS – II (ITC701)
  return [
    {
      id: 'qb-1',
      questionText:
        'Explain Bayesian Network exact inference with conditional probability tables and factorization proof.',
      unit: 'Unit 1',
      marks: 10,
      tags: ['IAE', 'PYQ', 'Theory'],
      frequencyCount: 5,
    },
    {
      id: 'qb-2',
      questionText:
        'Design a Mamdani Fuzzy Controller system for domestic washing machine with defuzzification methods.',
      unit: 'Unit 3',
      marks: 10,
      tags: ['IAE', 'PYQ', 'Diagram'],
      frequencyCount: 5,
    },
    {
      id: 'qb-3',
      questionText:
        'Differentiate between Convolutional Neural Networks (CNN) and Recurrent Neural Networks (RNN/LSTM).',
      unit: 'Unit 4',
      marks: 5,
      tags: ['IAE', 'Theory'],
      frequencyCount: 4,
    },
    {
      id: 'qb-4',
      questionText:
        'Explain Ensemble Classification: Bagging, AdaBoost, and Random Forest algorithms with error bounds.',
      unit: 'Unit 5',
      marks: 10,
      tags: ['PYQ', 'Numerical'],
      frequencyCount: 4,
    },
    {
      id: 'qb-5',
      questionText:
        'Describe Cognitive Computing design principles and natural language processing pipelines in IBM Watson.',
      unit: 'Unit 2',
      marks: 5,
      tags: ['Theory'],
      frequencyCount: 3,
    },
  ];
}

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
  const [activeAnswer, setActiveAnswer] = useState<{
    question: string;
    marks: number;
    answer: string;
  } | null>(null);
  const [loadingAnswerId, setLoadingAnswerId] = useState<string | null>(null);
  const [copiedAnswer, setCopiedAnswer] = useState(false);
  const [isEditingAnswer, setIsEditingAnswer] = useState(false);
  const [editedAnswerText, setEditedAnswerText] = useState('');
  const [responseSource, setResponseSource] = useState<
    'quick_pick_cache' | 'oci_genai_live' | null
  >(null);
  const [activeQuickPickId, setActiveQuickPickId] = useState<string | undefined>(undefined);

  // Bookmarking & Saved Items
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('cognora_qb_bookmarks');
      return saved ? (JSON.parse(saved) as string[]) : [];
    } catch {
      return [];
    }
  });
  const [showOnlyBookmarks, setShowOnlyBookmarks] = useState(false);

  const toggleBookmark = (id: string) => {
    setBookmarkedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
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
        list.filter((s) => s.type !== 'Lab' && !s.name.toLowerCase().includes('lab'));

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
    void loadSubjects();
  }, []);

  useEffect(() => {
    if (!selectedSubjectId) return;

    async function loadQuestions() {
      setLoading(true);
      const selectedSub = subjects.find((s) => s.id === selectedSubjectId);
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

    void loadQuestions();
  }, [selectedSubjectId, subjects]);

  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionText.trim()) return;

    const parsedTags = newTags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const newQbItem: QBQuestion = {
      id: `qb-${Date.now()}`,
      questionText: newQuestionText.trim(),
      unit: newUnit,
      marks: Number(newMarks),
      tags: parsedTags.length > 0 ? parsedTags : ['Theory'],
      frequencyCount: 1,
    };

    setQuestions((prev) => [newQbItem, ...prev]);
    setShowAddModal(false);
    setNewQuestionText('');
  };

  const handleGenerateAnswer = async (q: QBQuestion) => {
    setLoadingAnswerId(q.id);
    const selectedSub = subjects.find((s) => s.id === selectedSubjectId);
    const subName = selectedSub?.name || 'Computer Science';

    try {
      const res = await executeHybridQuery(q.questionText, {
        category: 'qb',
        endpoint: '/api/answers/generate',
        payload: {
          question: q.questionText,
          markValue: q.marks,
          format: 'Topper Standard',
          subjectId: selectedSubjectId,
          topic: q.unit,
        },
        marks: q.marks,
      });

      if (res && res.data) {
        const ans = (res.data.answer as string) || res.matchedItem?.answerMarkdown || '';
        setActiveAnswer({
          question: q.questionText,
          marks: q.marks,
          answer: ans,
        });
        setEditedAnswerText(ans);
        setResponseSource(res.source);
        setIsEditingAnswer(false);
        return;
      }
    } catch (err) {
      console.warn('Hybrid answer generation error, falling back:', err);
    }

    try {
      const answer = await generateStructuredAnswerAI(
        q.questionText,
        q.marks,
        'Topper Standard',
        subName,
      );
      setActiveAnswer({
        question: q.questionText,
        marks: q.marks,
        answer,
      });
      setEditedAnswerText(answer);
      setResponseSource('oci_genai_live');
      setIsEditingAnswer(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAnswerId(null);
    }
  };

  const handleQuickPickSelect = (item: QuickPickItem) => {
    setActiveQuickPickId(item.id);
    setActiveAnswer({
      question: item.title,
      marks: item.marks,
      answer: item.answerMarkdown,
    });
    setEditedAnswerText(item.answerMarkdown);
    setResponseSource('quick_pick_cache');
    setIsEditingAnswer(false);
  };

  // Filter logic
  const filteredQuestions = questions.filter((q) => {
    const matchesUnit = unitFilter === 'All' || q.unit === unitFilter;
    const matchesMarks = marksFilter === 'All' || q.marks === Number(marksFilter);
    const matchesTag = tagFilter === 'All' || q.tags.includes(tagFilter);
    const matchesSearch =
      searchQuery === '' || q.questionText.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBookmark = !showOnlyBookmarks || bookmarkedIds.includes(q.id);
    return matchesUnit && matchesMarks && matchesTag && matchesSearch && matchesBookmark;
  });

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 bg-[#f8f9fc] dark:bg-slate-950 text-[#2d2d34] dark:text-slate-100 min-h-screen font-sans transition-colors">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-2 border-b border-[#e3e6ed] dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-[#4f75f2] animate-pulse" />
            <span className="text-[11px] font-mono tracking-widest text-[#6b6f82] dark:text-slate-400 uppercase font-bold">
              Question Bank Repository
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#121217] dark:text-white flex items-center gap-3">
            Question Bank (QB) Explorer
          </h1>
          <p className="text-xs md:text-sm text-[#6b6f82] dark:text-slate-400 mt-1 font-sans max-w-2xl">
            Unit-wise question banks, mark distributions (2M, 5M, 10M, 15M), IAE/PYQ tagging, and
            instant topper model answers with schematic architecture diagrams.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {subjects.length > 0 && (
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-[#e3e6ed] dark:border-slate-800 rounded-2xl p-1.5 shadow-xs">
              <Filter className="w-3.5 h-3.5 text-[#8c8fa1] dark:text-slate-400 ml-2" />
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="bg-transparent text-[#121217] dark:text-slate-200 outline-none text-xs font-bold pr-3 cursor-pointer"
              >
                {subjects.map((s) => (
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

      {/* Quick Pick Pre-Mapped Answers Toolbar */}
      <QuickPickSelector
        category="all"
        onSelect={handleQuickPickSelect}
        activeId={activeQuickPickId}
      />

      {/* Search & Filters Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-[#e3e6ed] dark:border-slate-800 rounded-3xl p-5 md:p-6 space-y-4 shadow-xs">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-[#8c8fa1] dark:text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search syllabus questions, concepts, or algorithms..."
              className="w-full bg-[#f8f9fc] dark:bg-slate-800 border border-[#e3e6ed] dark:border-slate-700 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-[#121217] dark:text-slate-100 placeholder-[#8c8fa1] dark:placeholder-slate-500 outline-none focus:border-[#4f75f2] shadow-xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Unit Filter */}
            <select
              value={unitFilter}
              onChange={(e) => setUnitFilter(e.target.value)}
              className="bg-[#f8f9fc] dark:bg-slate-800 border border-[#e3e6ed] dark:border-slate-700 rounded-2xl px-3 py-2 text-xs font-bold text-[#121217] dark:text-slate-200 outline-none focus:border-[#4f75f2] cursor-pointer shadow-xs"
            >
              <option value="All">All Units</option>
              <option value="Unit 1">Unit 1</option>
              <option value="Unit 2">Unit 2</option>
              <option value="Unit 3">Unit 3</option>
              <option value="Unit 4">Unit 4</option>
              <option value="Unit 5">Unit 5</option>
              <option value="Unit 6">Unit 6</option>
            </select>

            {/* Marks Filter */}
            <select
              value={marksFilter}
              onChange={(e) => setMarksFilter(e.target.value)}
              className="bg-[#f8f9fc] dark:bg-slate-800 border border-[#e3e6ed] dark:border-slate-700 rounded-2xl px-3 py-2 text-xs font-bold text-[#121217] dark:text-slate-200 outline-none focus:border-[#4f75f2] cursor-pointer shadow-xs"
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
              onChange={(e) => setTagFilter(e.target.value)}
              className="bg-[#f8f9fc] dark:bg-slate-800 border border-[#e3e6ed] dark:border-slate-700 rounded-2xl px-3 py-2 text-xs font-bold text-[#121217] dark:text-slate-200 outline-none focus:border-[#4f75f2] cursor-pointer shadow-xs"
            >
              <option value="All">All Tags</option>
              <option value="IAE">IAE</option>
              <option value="PYQ">PYQ</option>
              <option value="Theory">Theory</option>
              <option value="Numerical">Numerical</option>
              <option value="Diagram">Diagram</option>
            </select>

            {/* Bookmarks Toggle */}
            <button
              onClick={() => setShowOnlyBookmarks(!showOnlyBookmarks)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all border cursor-pointer shadow-xs ${
                showOnlyBookmarks
                  ? 'bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800'
                  : 'bg-[#f8f9fc] dark:bg-slate-800 border-[#e3e6ed] dark:border-slate-700 text-[#6b6f82] dark:text-slate-300 hover:text-[#121217] dark:hover:text-white'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${showOnlyBookmarks ? 'fill-current' : ''}`} />
              <span>Saved ({bookmarkedIds.length})</span>
            </button>
          </div>
        </div>

        {/* Status bar */}
        <div className="flex justify-between items-center text-[11px] font-mono text-[#8c8fa1] dark:text-slate-400 pt-1">
          <span>Displaying {filteredQuestions.length} exam questions</span>
          <span>Semester VII Curriculum Standard</span>
        </div>
      </div>

      {/* Questions Listing */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-[#6b6f82] dark:text-slate-400 font-mono text-xs uppercase">
          <Loader2 className="w-6 h-6 text-[#4f75f2] animate-spin" />
          <span>Curating Unit-Wise Question Bank...</span>
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-[#e3e6ed] dark:border-slate-800 rounded-3xl p-12 text-center space-y-3 shadow-xs">
          <p className="text-sm font-bold text-[#121217] dark:text-white">
            No questions match the applied filters.
          </p>
          <p className="text-xs text-[#8c8fa1] dark:text-slate-400">
            Try adjusting your search query, unit selection, or bookmark filter.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQuestions.map((q, idx) => {
            const isBookmarked = bookmarkedIds.includes(q.id);

            return (
              <div
                key={q.id}
                className="bg-white dark:bg-slate-900 border border-[#e3e6ed] dark:border-slate-800 hover:border-[#4f75f2] dark:hover:border-indigo-500 rounded-3xl p-6 transition-all space-y-4 shadow-xs"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-mono font-bold bg-[#edf3fc] dark:bg-indigo-950/60 text-[#4f75f2] dark:text-indigo-400 border border-[#d0dcf5] dark:border-indigo-800 px-2.5 py-0.5 rounded-lg uppercase">
                      {q.unit}
                    </span>
                    <span className="text-[10px] font-mono font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/80 px-2.5 py-0.5 rounded-lg">
                      {q.marks} Marks
                    </span>
                    {q.tags.map((tag) => (
                      <span
                        key={tag}
                        className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-lg uppercase border ${
                          tag === 'IAE'
                            ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                            : tag === 'PYQ'
                              ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-750'
                        }`}
                      >
                        {tag}
                      </span>
                    ))}
                    {q.frequencyCount && q.frequencyCount > 1 && (
                      <span className="text-[9px] font-mono font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-lg">
                        Repeated {q.frequencyCount}x
                      </span>
                    )}
                  </div>

                  <span className="text-[10px] font-mono text-[#8c8fa1] dark:text-slate-500">Q#{idx + 1}</span>
                </div>

                <p className="text-sm md:text-base font-bold text-[#121217] dark:text-slate-100 leading-relaxed">
                  {q.questionText}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-[#f0f2f7] dark:border-slate-800">
                  <button
                    onClick={() => toggleBookmark(q.id)}
                    title={isBookmarked ? 'Remove from Bookmarks' : 'Bookmark Question'}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer shadow-xs ${
                      isBookmarked
                        ? 'bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800'
                        : 'bg-white dark:bg-slate-800 text-[#8c8fa1] dark:text-slate-400 border-[#e3e6ed] dark:border-slate-700 hover:text-[#121217] dark:hover:text-white hover:border-[#4f75f2]'
                    }`}
                  >
                    <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                  </button>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/answers?q=${encodeURIComponent(q.questionText)}&marks=${q.marks}`}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-400 transition-colors shadow-xs"
                      title="Open in Full Model Answers Studio"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>

                    <button
                      disabled={loadingAnswerId === q.id}
                      onClick={() => {
                        void handleGenerateAnswer(q);
                      }}
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
              </div>
            );
          })}
        </div>
      )}

      {/* Add Question Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-[#e3e6ed] dark:border-slate-800 w-full max-w-lg rounded-3xl p-6 md:p-8 space-y-5 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-[#e3e6ed] dark:border-slate-800">
              <h3 className="text-base font-extrabold text-[#121217] dark:text-white">Add New Question to Bank</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#6b6f82] dark:text-slate-400 hover:text-[#121217] dark:hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddQuestion} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-bold">Question Text</label>
                <textarea
                  required
                  rows={3}
                  value={newQuestionText}
                  onChange={(e) => setNewQuestionText(e.target.value)}
                  placeholder="Enter complete university syllabus question prompt..."
                  className="w-full bg-[#fafafb] dark:bg-slate-800 border border-[#d9d9dd] dark:border-slate-700 rounded-xl p-3 text-[#212121] dark:text-white outline-none focus:border-[#4f75f2] leading-relaxed resize-none shadow-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-bold">Syllabus Unit</label>
                  <select
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    className="w-full bg-[#fafafb] dark:bg-slate-800 border border-[#d9d9dd] dark:border-slate-700 rounded-xl px-3 py-2.5 text-[#212121] dark:text-white outline-none focus:border-[#4f75f2] cursor-pointer shadow-xs font-bold"
                  >
                    <option value="Unit 1">Unit 1</option>
                    <option value="Unit 2">Unit 2</option>
                    <option value="Unit 3">Unit 3</option>
                    <option value="Unit 4">Unit 4</option>
                    <option value="Unit 5">Unit 5</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-bold">Marks</label>
                  <select
                    value={newMarks}
                    onChange={(e) => setNewMarks(Number(e.target.value))}
                    className="w-full bg-[#fafafb] dark:bg-slate-800 border border-[#d9d9dd] dark:border-slate-700 rounded-xl px-3 py-2.5 text-[#212121] dark:text-white outline-none focus:border-[#4f75f2] cursor-pointer shadow-xs font-bold"
                  >
                    <option value={2}>2 Marks</option>
                    <option value={5}>5 Marks</option>
                    <option value={10}>10 Marks</option>
                    <option value={15}>15 Marks</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-bold">
                  Tags (Comma-separated)
                </label>
                <input
                  type="text"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  placeholder="IAE, PYQ, Theory, Numerical"
                  className="w-full bg-[#fafafb] dark:bg-slate-800 border border-[#d9d9dd] dark:border-slate-700 rounded-xl px-4 py-2.5 text-[#212121] dark:text-white outline-none focus:border-[#4f75f2] shadow-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#d9d9dd] dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-5 py-2.5 rounded-xl font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#4f75f2] hover:bg-[#385dd8] text-white px-6 py-2.5 rounded-xl font-bold transition-colors cursor-pointer shadow-xs"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-[#e3e6ed] dark:border-slate-800 w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            <header className="p-6 border-b border-[#e3e6ed] dark:border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#f8f9fc] dark:bg-slate-850">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#3b52c4] dark:text-indigo-400 bg-[#e4e7fd] dark:bg-indigo-950/60 px-3 py-1 rounded-full border border-[#d0d8fb] dark:border-indigo-800 font-bold">
                    TOPPER MODEL ANSWER ({activeAnswer.marks} MARKS)
                  </span>
                  {responseSource === 'quick_pick_cache' ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 rounded-full">
                      <Zap className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Pre-computed Quick Pick
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-2.5 py-0.5 rounded-full">
                      <Cloud className="w-3 h-3 text-blue-600 dark:text-blue-400" /> Live OCI GenAI
                    </span>
                  )}
                </div>
                <h3 className="text-lg md:text-xl font-extrabold text-[#121217] dark:text-white leading-snug">
                  {activeAnswer.question}
                </h3>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Edit / Preview Toggle */}
                <button
                  onClick={() => setIsEditingAnswer(!isEditingAnswer)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all border cursor-pointer ${
                    isEditingAnswer
                      ? 'bg-[#4f75f2] text-white border-[#4f75f2]'
                      : 'bg-white dark:bg-slate-800 text-[#121217] dark:text-slate-200 border-[#e3e6ed] dark:border-slate-700 hover:border-[#4f75f2]'
                  }`}
                  title="Toggle Edit Answer"
                >
                  {isEditingAnswer ? (
                    <Eye className="w-3.5 h-3.5" />
                  ) : (
                    <Edit3 className="w-3.5 h-3.5" />
                  )}
                  <span>{isEditingAnswer ? 'Preview' : 'Edit Notes'}</span>
                </button>

                {/* Print Answer */}
                <button
                  onClick={() => window.print()}
                  className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-[#e3e6ed] dark:border-slate-700 hover:border-[#4f75f2] text-[#6b6f82] dark:text-slate-400 hover:text-[#121217] dark:hover:text-white transition-colors cursor-pointer shadow-xs"
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
                  className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-[#e3e6ed] dark:border-slate-700 hover:border-[#4f75f2] text-[#6b6f82] dark:text-slate-400 hover:text-[#121217] dark:hover:text-white transition-colors cursor-pointer shadow-xs"
                  title="Export Markdown"
                >
                  <Download className="w-4 h-4" />
                </button>

                {/* Close */}
                <button
                  onClick={() => setActiveAnswer(null)}
                  className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-[#e3e6ed] dark:border-slate-700 hover:bg-[#edf3fc] dark:hover:bg-slate-700 text-[#6b6f82] dark:text-slate-400 hover:text-[#121217] dark:hover:text-white transition-colors cursor-pointer shadow-xs"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </header>

            <div className="p-6 md:p-8 overflow-y-auto space-y-4 select-text bg-white dark:bg-slate-900">
              {isEditingAnswer ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs font-mono text-[#6b6f82] dark:text-slate-400">
                    <span>
                      Editing custom topper answer notes (supports Markdown &amp; diagrams)
                    </span>
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
                    onChange={(e) => setEditedAnswerText(e.target.value)}
                    className="w-full bg-[#f8f9fc] dark:bg-slate-800 border border-[#e3e6ed] dark:border-slate-700 rounded-2xl p-4 font-mono text-xs md:text-sm text-[#121217] dark:text-slate-100 outline-none focus:border-[#4f75f2] leading-relaxed shadow-inner"
                  />
                </div>
              ) : (
                <FormattedAnswer content={activeAnswer.answer} />
              )}
            </div>

            <footer className="p-4 bg-[#f8f9fc] dark:bg-slate-850 border-t border-[#e3e6ed] dark:border-slate-800 flex items-center justify-between">
              <button
                onClick={() => {
                  if (activeAnswer) {
                    void navigator.clipboard.writeText(activeAnswer.answer);
                    setCopiedAnswer(true);
                    setTimeout(() => setCopiedAnswer(false), 2000);
                  }
                }}
                className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 hover:text-[#1863dc] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-[#1863dc] bg-white dark:bg-slate-800 transition-all cursor-pointer shadow-xs"
              >
                {copiedAnswer ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
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
