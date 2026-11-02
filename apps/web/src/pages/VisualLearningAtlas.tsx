import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Compass, BookOpen, Layers, CheckCircle2, Clock, Play, Award,
  Sparkles, Search, ArrowRight, ArrowLeft, Bookmark, ExternalLink,
  RotateCcw, Sliders, FileText, Share2, Printer, Maximize2, Minimize2,
  HelpCircle, ChevronRight, ChevronDown, Check, AlertCircle, Eye,
  BrainCircuit, Mic, Network, Download, Video
} from 'lucide-react';

import {
  ATLAS_SUBJECTS,
  getSubjectByCode,
  getTopicById
} from '../data/atlasCatalogue';
import type {
  Subject,
  Module,
  Topic,
  TopicStatus
} from '../data/atlasCatalogue';

// Visualizers
import InvertedIndexVisualizer from '../components/visualizers/InvertedIndexVisualizer';
import BayesianNetworkVisualizer from '../components/visualizers/BayesianNetworkVisualizer';
import FuzzyLogicVisualizer from '../components/visualizers/FuzzyLogicVisualizer';
import STLCLifecycleVisualizer from '../components/visualizers/STLCLifecycleVisualizer';
import IoTDataFlowVisualizer from '../components/visualizers/IoTDataFlowVisualizer';
import CyberAttackVisualizer from '../components/visualizers/CyberAttackVisualizer';

interface UserTopicProgress {
  status: TopicStatus;
  videoWatched: boolean;
  readingDone: boolean;
  quizScore: number | null; // percentage
  pyqExplored: boolean;
  notes: string;
  isBookmarked: boolean;
}

const STORAGE_KEY = 'cognora_atlas_progress_v1';

export default function VisualLearningAtlas() {
  const { subjectCode, topicId } = useParams<{ subjectCode?: string; topicId?: string }>();
  const navigate = useNavigate();

  // Navigation states
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'video' | 'visualizer' | 'notes' | 'pyq-quiz'>('video');
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [languageMode, setLanguageMode] = useState<'english' | 'hinglish'>('english');
  const [focusMode, setFocusMode] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // User Progress Persistence
  const [progressState, setProgressState] = useState<Record<string, UserTopicProgress>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  // Quiz state for selected topic
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);

  // Save progress to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progressState));
    } catch (e) {
      console.error('Failed to save atlas progress', e);
    }
  }, [progressState]);

  // Sync route params with selection
  useEffect(() => {
    if (subjectCode) {
      const sub = getSubjectByCode(subjectCode);
      if (sub) {
        setSelectedSubject(sub);
        if (topicId) {
          const res = getTopicById(topicId);
          if (res) {
            setSelectedModule(res.module);
            setSelectedTopic(res.topic);
            setQuizAnswers({});
            setQuizSubmitted(false);
          }
        } else {
          setSelectedTopic(null);
          setSelectedModule(null);
        }
      } else {
        setSelectedSubject(null);
        setSelectedTopic(null);
      }
    } else {
      setSelectedSubject(null);
      setSelectedTopic(null);
    }
  }, [subjectCode, topicId]);

  // Helper for topic progress
  const getTopicProgress = (tId: string): UserTopicProgress => {
    return (
      progressState[tId] || {
        status: 'NOT_STARTED',
        videoWatched: false,
        readingDone: false,
        quizScore: null,
        pyqExplored: false,
        notes: '',
        isBookmarked: false
      }
    );
  };

  // Calculate mastery score (0-100)
  const calculateMastery = (tId: string): number => {
    const p = getTopicProgress(tId);
    let score = 0;
    if (p.videoWatched) score += 25;
    if (p.readingDone) score += 25;
    if (p.quizScore !== null) score += Math.round((p.quizScore / 100) * 30);
    if (p.pyqExplored) score += 20;
    return Math.min(100, score);
  };

  // Calculate subject-level completion %
  const calculateSubjectProgress = (subject: Subject): { pct: number; completedCount: number; totalCount: number; attentionCount: number } => {
    const allTopics = subject.modules.flatMap(m => m.topics);
    let completedCount = 0;
    let attentionCount = 0;

    allTopics.forEach(t => {
      const mastery = calculateMastery(t.id);
      if (mastery >= 75) completedCount++;
      else if (mastery > 0 && mastery < 75) attentionCount++;
    });

    const pct = allTopics.length > 0 ? Math.round((completedCount / allTopics.length) * 100) : 0;
    return { pct, completedCount, totalCount: allTopics.length, attentionCount };
  };

  const updateTopicProgress = (tId: string, updates: Partial<UserTopicProgress>) => {
    setProgressState(prev => {
      const current = prev[tId] || {
        status: 'NOT_STARTED',
        videoWatched: false,
        readingDone: false,
        quizScore: null,
        pyqExplored: false,
        notes: '',
        isBookmarked: false
      };
      const updated = { ...current, ...updates };

      // Update status automatically based on mastery
      let score = 0;
      if (updated.videoWatched) score += 25;
      if (updated.readingDone) score += 25;
      if (updated.quizScore !== null) score += Math.round((updated.quizScore / 100) * 30);
      if (updated.pyqExplored) score += 20;

      if (score >= 80) updated.status = 'MASTERED';
      else if (score >= 50) updated.status = 'PRACTICED';
      else if (score > 0) updated.status = 'LEARNING';
      else updated.status = 'NOT_STARTED';

      return { ...prev, [tId]: updated };
    });
  };

  // Render Visualizer Component based on topic
  const renderVisualizer = (type: string) => {
    switch (type) {
      case 'inverted-index':
        return <InvertedIndexVisualizer />;
      case 'bayesian-network':
        return <BayesianNetworkVisualizer />;
      case 'fuzzy-mamdani':
        return <FuzzyLogicVisualizer />;
      case 'stlc-lifecycle':
      case 'boundary-value':
        return <STLCLifecycleVisualizer />;
      case 'mqtt-flow':
        return <IoTDataFlowVisualizer />;
      case 'cyber-killchain':
        return <CyberAttackVisualizer />;
      default:
        return (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <Sparkles className="w-8 h-8 text-indigo-500 mx-auto mb-2 opacity-60" />
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Interactive Concept Diagram</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              This topic uses structured formulas and architectural breakdowns in the Notes tab.
            </p>
          </div>
        );
    }
  };

  // ==========================================
  // LEVEL 3: TOPIC LEARNING WORKSPACE
  // ==========================================
  if (selectedSubject && selectedTopic && selectedModule) {
    const currentProgress = getTopicProgress(selectedTopic.id);
    const masteryScore = calculateMastery(selectedTopic.id);

    // Find next and prev topics in subject
    const allTopics = selectedSubject.modules.flatMap(m => m.topics);
    const currentIndex = allTopics.findIndex(t => t.id === selectedTopic.id);
    const prevTopic = currentIndex > 0 ? allTopics[currentIndex - 1] : null;
    const nextTopic = currentIndex < allTopics.length - 1 ? allTopics[currentIndex + 1] : null;

    // Handle quiz submission
    const handleQuizSubmit = () => {
      let correct = 0;
      selectedTopic.quiz.forEach(q => {
        if (quizAnswers[q.id] === q.correctAnswer) {
          correct++;
        }
      });
      const pct = selectedTopic.quiz.length > 0 ? Math.round((correct / selectedTopic.quiz.length) * 100) : 100;
      setQuizSubmitted(true);
      updateTopicProgress(selectedTopic.id, { quizScore: pct });
    };

    return (
      <div className={`space-y-6 ${focusMode ? 'fixed inset-0 z-50 bg-[#f8f9fc] dark:bg-slate-950 p-6 overflow-y-auto' : ''}`}>
        {/* Top Breadcrumb & Actions Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-3">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
            <button
              onClick={() => navigate('/atlas')}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 font-bold"
            >
              Atlas
            </button>
            <ChevronRight className="w-3.5 h-3.5" />
            <button
              onClick={() => navigate(`/atlas/${selectedSubject.code}`)}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 font-bold"
            >
              {selectedSubject.shortName}
            </button>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-800 dark:text-slate-200 font-bold truncate max-w-[200px] sm:max-w-xs">
              {selectedTopic.shortTitle}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <div className="flex items-center bg-slate-200 dark:bg-slate-800 p-0.5 rounded-xl text-[11px] font-mono">
              <button
                onClick={() => setLanguageMode('english')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${languageMode === 'english'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguageMode('hinglish')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${languageMode === 'hinglish'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
              >
                Hinglish
              </button>
            </div>

            {/* Bookmark button */}
            <button
              onClick={() => updateTopicProgress(selectedTopic.id, { isBookmarked: !currentProgress.isBookmarked })}
              className={`p-2 rounded-xl border text-xs font-mono transition-colors ${currentProgress.isBookmarked
                  ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-800 text-amber-600'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              title="Bookmark Topic"
            >
              <Bookmark className="w-4 h-4 fill-current" />
            </button>

            {/* Focus Mode Toggle */}
            <button
              onClick={() => setFocusMode(!focusMode)}
              className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
              title={focusMode ? "Exit Focus Mode" : "Focus Mode"}
            >
              {focusMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Navigation buttons */}
            {prevTopic && (
              <button
                onClick={() => navigate(`/atlas/${selectedSubject.code}/${prevTopic.id}`)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-mono font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Prev
              </button>
            )}
            {nextTopic && (
              <button
                onClick={() => navigate(`/atlas/${selectedSubject.code}/${nextTopic.id}`)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-mono font-bold shadow-xs"
              >
                Next <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Topic Title Header Banner */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  {selectedModule.title}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {selectedTopic.examWeightage}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  Bloom's: {selectedTopic.coMapping}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-display">
                {selectedTopic.title}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
                {selectedTopic.description}
              </p>
            </div>

            {/* Topic Mastery Score Circle */}
            <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0">
              <div className="text-right font-mono">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Topic Mastery</span>
                <span className="text-2xl font-bold text-slate-900 dark:text-white">{masteryScore}%</span>
                <span className={`text-[10px] font-bold block ${masteryScore >= 75 ? 'text-emerald-500' : masteryScore >= 40 ? 'text-amber-500' : 'text-slate-400'
                  }`}>
                  {currentProgress.status}
                </span>
              </div>
              <div className="w-14 h-14 rounded-full border-4 border-slate-200 dark:border-slate-800 relative flex items-center justify-center">
                <div
                  className="absolute inset-0 rounded-full border-4 border-indigo-500 transition-all duration-500"
                  style={{
                    clipPath: `polygon(50% 50%, 50% 0%, ${masteryScore >= 25 ? '100% 0%,' : ''} ${masteryScore >= 50 ? '100% 100%,' : ''
                      } ${masteryScore >= 75 ? '0% 100%,' : ''} ${masteryScore >= 100 ? '0% 0%,' : ''
                      } 50% 50%)`
                  }}
                />
                <Award className="w-5 h-5 text-indigo-500" />
              </div>
            </div>
          </div>

          {/* Quick learning checklist bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] font-mono">
            <button
              onClick={() => updateTopicProgress(selectedTopic.id, { videoWatched: !currentProgress.videoWatched })}
              className={`p-2 rounded-lg border text-left flex items-center gap-2 transition-all ${currentProgress.videoWatched
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200'
                  : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
            >
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] ${currentProgress.videoWatched ? 'bg-emerald-500 text-white border-emerald-500' : 'border-slate-400'
                }`}>
                {currentProgress.videoWatched && '✓'}
              </div>
              <span>Video (+25%)</span>
            </button>

            <button
              onClick={() => updateTopicProgress(selectedTopic.id, { readingDone: !currentProgress.readingDone })}
              className={`p-2 rounded-lg border text-left flex items-center gap-2 transition-all ${currentProgress.readingDone
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200'
                  : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
            >
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] ${currentProgress.readingDone ? 'bg-emerald-500 text-white border-emerald-500' : 'border-slate-400'
                }`}>
                {currentProgress.readingDone && '✓'}
              </div>
              <span>Notes (+25%)</span>
            </button>

            <div className={`p-2 rounded-lg border text-left flex items-center gap-2 ${currentProgress.quizScore !== null
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200'
                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}>
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] ${currentProgress.quizScore !== null ? 'bg-emerald-500 text-white border-emerald-500' : 'border-slate-400'
                }`}>
                {currentProgress.quizScore !== null && '✓'}
              </div>
              <span>Quiz ({currentProgress.quizScore !== null ? `${currentProgress.quizScore}%` : '+30%'})</span>
            </div>

            <button
              onClick={() => updateTopicProgress(selectedTopic.id, { pyqExplored: !currentProgress.pyqExplored })}
              className={`p-2 rounded-lg border text-left flex items-center gap-2 transition-all ${currentProgress.pyqExplored
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200'
                  : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
            >
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] ${currentProgress.pyqExplored ? 'bg-emerald-500 text-white border-emerald-500' : 'border-slate-400'
                }`}>
                {currentProgress.pyqExplored && '✓'}
              </div>
              <span>PYQs (+20%)</span>
            </button>
          </div>
        </div>

        {/* Study Mode Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 text-xs font-mono font-bold">
          <button
            onClick={() => setActiveTab('video')}
            className={`pb-3 flex items-center gap-2 transition-all relative ${activeTab === 'video'
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
          >
            <Video className="w-4 h-4" />
            <span>Lecture & Notes ({selectedTopic.videos.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('visualizer')}
            className={`pb-3 flex items-center gap-2 transition-all relative ${activeTab === 'visualizer'
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Interactive Visualizer</span>
          </button>

          <button
            onClick={() => setActiveTab('notes')}
            className={`pb-3 flex items-center gap-2 transition-all relative ${activeTab === 'notes'
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Academic Reading & Notes</span>
          </button>

          <button
            onClick={() => setActiveTab('pyq-quiz')}
            className={`pb-3 flex items-center gap-2 transition-all relative ${activeTab === 'pyq-quiz'
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>PYQs & Quiz ({selectedTopic.pyqs.length + selectedTopic.quiz.length})</span>
          </button>
        </div>

        {/* Tab Content Areas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Study Pane */}
          <div className="lg:col-span-8 space-y-6">
            {/* TAB 1: VIDEO & EMBEDDED PLAYER */}
            {activeTab === 'video' && (
              <div className="space-y-4">
                {selectedTopic.videos.length > 0 ? (
                  selectedTopic.videos.map((vid, idx) => (
                    <div
                      key={idx}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800 font-mono text-xs">
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white block">{vid.title}</span>
                          <span className="text-[11px] text-slate-500">{vid.channel}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href={vid.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                          >
                            <ExternalLink className="w-3 h-3" /> YouTube
                          </a>
                          <button
                            onClick={() => updateTopicProgress(selectedTopic.id, { videoWatched: !currentProgress.videoWatched })}
                            className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${currentProgress.videoWatched
                                ? 'bg-emerald-600 text-white'
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                              }`}
                          >
                            {currentProgress.videoWatched ? '✓ Watched' : 'Mark Watched'}
                          </button>
                        </div>
                      </div>

                      {/* Responsive 16:9 YouTube Embed */}
                      <div className="aspect-video w-full rounded-xl overflow-hidden bg-black shadow-inner">
                        <iframe
                          src={vid.embedUrl}
                          title={vid.title}
                          className="w-full h-full border-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                    <Video className="w-8 h-8 text-slate-400 mx-auto" />
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Direct Video Mapped</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Review the comprehensive syllabus notes or check module-level video lectures in the catalogue.
                    </p>
                  </div>
                )}

                {/* Personal Timestamped Notes */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-slate-900 dark:text-white uppercase flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-indigo-500" /> Personal Lecture Annotations
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">Autosaved</span>
                  </div>
                  <textarea
                    value={currentProgress.notes}
                    onChange={e => updateTopicProgress(selectedTopic.id, { notes: e.target.value })}
                    placeholder="Type key formulas, lecture timestamps (e.g. 14:20 - CPT calculation), or questions for your professor..."
                    className="w-full h-28 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}

            {/* TAB 2: INTERACTIVE VISUALIZER */}
            {activeTab === 'visualizer' && (
              <div className="space-y-4">
                {renderVisualizer(selectedTopic.visualizerType)}
              </div>
            )}

            {/* TAB 3: ACADEMIC READING & NOTES */}
            {activeTab === 'notes' && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
                {/* Language Mode Clarification */}
                {languageMode === 'hinglish' ? (
                  <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-2">
                    <span className="text-xs font-mono font-bold text-indigo-700 dark:text-indigo-300 uppercase flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" /> Hinglish Concept Clarification:
                    </span>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                      {selectedTopic.hinglishSummary}
                    </p>
                  </div>
                ) : null}

                {/* Key Theoretical Points */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white font-mono uppercase tracking-wider">
                    Core Academic Formulation & Key Principles:
                  </h3>
                  <div className="space-y-2">
                    {selectedTopic.keyPoints.map((pt, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed flex items-start gap-2.5 font-sans"
                      >
                        <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 font-mono font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span>{pt}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Learning Objectives */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <h4 className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 uppercase">
                    Mumbai University Syllabus Objectives:
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    {selectedTopic.objectives.map((obj, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>{obj}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Authoritative Textbook Reference */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-xs font-mono text-slate-500">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Textbook Reference:
                  </span>
                  <span>{selectedTopic.textbookRef}</span>
                </div>
              </div>
            )}

            {/* TAB 4: PYQs & PRACTICE QUIZ */}
            {activeTab === 'pyq-quiz' && (
              <div className="space-y-6">
                {/* University PYQs */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-mono font-bold text-slate-900 dark:text-white uppercase flex items-center gap-2">
                      <Award className="w-4 h-4 text-indigo-500" /> Mumbai University PYQs ({selectedTopic.pyqs.length})
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">Predicted Recurrence</span>
                  </div>

                  <div className="space-y-3">
                    {selectedTopic.pyqs.map(pyq => (
                      <div
                        key={pyq.id}
                        className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2.5 font-sans"
                      >
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="font-bold text-indigo-600 dark:text-indigo-400">{pyq.exam}</span>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold">
                              {pyq.recurrence}
                            </span>
                            <span className="font-bold text-slate-700 dark:text-slate-300">{pyq.marks} Marks</span>
                          </div>
                        </div>

                        <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                          "{pyq.question}"
                        </p>

                        <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400">
                          <span className="font-bold font-mono text-slate-800 dark:text-slate-200 block mb-0.5">
                            Exam Blueprint Advice:
                          </span>
                          <span>{pyq.blueprintAdvice}</span>
                        </div>

                        <div className="flex justify-end pt-1">
                          <Link
                            to={{
                              pathname: '/answers',
                              search: `?q=${encodeURIComponent(pyq.question)}&marks=${pyq.marks}`,
                            }}
                            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-mono font-bold transition-all shadow-2xs flex items-center gap-1.5"
                          >
                            <Sparkles className="w-3.5 h-3.5" /> Draft Topper Answer
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Multiple Choice Quiz */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-mono font-bold text-slate-900 dark:text-white uppercase flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-emerald-500" /> Interactive Knowledge Check ({selectedTopic.quiz.length} Questions)
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">+30% Mastery Weight</span>
                  </div>

                  <div className="space-y-5">
                    {selectedTopic.quiz.map((q, qIndex) => {
                      const selectedOpt = quizAnswers[q.id];
                      return (
                        <div key={q.id} className="space-y-2.5">
                          <span className="text-xs font-bold text-slate-900 dark:text-white block font-sans">
                            Q{qIndex + 1}: {q.question}
                          </span>

                          <div className="grid grid-cols-1 gap-1.5 font-sans">
                            {q.options.map((opt, optIndex) => {
                              const isSelected = selectedOpt === optIndex;
                              const isCorrect = q.correctAnswer === optIndex;
                              let btnClass = "bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300";

                              if (quizSubmitted) {
                                if (isCorrect) {
                                  btnClass = "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-400 text-emerald-800 dark:text-emerald-200 font-bold";
                                } else if (isSelected && !isCorrect) {
                                  btnClass = "bg-rose-50 dark:bg-rose-950/60 border-rose-400 text-rose-800 dark:text-rose-200";
                                }
                              } else if (isSelected) {
                                btnClass = "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-400 text-indigo-700 dark:text-indigo-300 font-bold ring-2 ring-indigo-500/20";
                              }

                              return (
                                <button
                                  key={optIndex}
                                  onClick={() => !quizSubmitted && setQuizAnswers(p => ({ ...p, [q.id]: optIndex }))}
                                  className={`w-full p-2.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${btnClass}`}
                                >
                                  <span>{opt}</span>
                                  {quizSubmitted && isCorrect && <Check className="w-4 h-4 text-emerald-500 shrink-0" />}
                                </button>
                              );
                            })}
                          </div>

                          {quizSubmitted && (
                            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 font-sans">
                              <span className="font-bold text-slate-800 dark:text-slate-200 block mb-0.5">Explanation:</span>
                              <span>{q.explanation}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    <div className="pt-2 flex justify-end">
                      {!quizSubmitted ? (
                        <button
                          onClick={handleQuizSubmit}
                          disabled={Object.keys(quizAnswers).length === 0}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-mono font-bold transition-all shadow-xs"
                        >
                          Submit Quiz Answers
                        </button>
                      ) : (
                        <button
                          onClick={() => { setQuizSubmitted(false); setQuizAnswers({}); }}
                          className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-mono font-bold hover:bg-slate-300"
                        >
                          Retake Quiz
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Rail: Topic Intelligence & Integrations */}
          <div className="lg:col-span-4 space-y-5">
            {/* Topic Prerequisites Box */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3 font-mono text-xs">
              <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider block">
                Topic Prerequisites
              </span>
              <div className="space-y-1.5">
                {selectedTopic.prerequisites.map((prereq, i) => (
                  <div
                    key={i}
                    className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300 flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{prereq}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cognora Module Integrations */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3 font-mono text-xs">
              <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider block">
                Academic Integrations
              </span>
              <div className="space-y-2">
                <Link
                  to="/viva"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:border-indigo-300 text-slate-700 dark:text-slate-300 flex items-center justify-between transition-all group"
                >
                  <div className="flex items-center gap-2">
                    <Mic className="w-4 h-4 text-indigo-500" />
                    <span>Start Topic Viva Session</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </Link>

                <Link
                  to="/revision"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:border-indigo-300 text-slate-700 dark:text-slate-300 flex items-center justify-between transition-all group"
                >
                  <div className="flex items-center gap-2">
                    <BrainCircuit className="w-4 h-4 text-purple-500" />
                    <span>Send to Smart Revision</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </Link>

                <Link
                  to="/knowledge"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:border-indigo-300 text-slate-700 dark:text-slate-300 flex items-center justify-between transition-all group"
                >
                  <div className="flex items-center gap-2">
                    <Network className="w-4 h-4 text-sky-500" />
                    <span>View in Knowledge Graph</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Official Syllabus Document Link */}
            <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-2 text-xs font-mono">
              <span className="font-bold text-slate-900 dark:text-white uppercase block">
                Authoritative Syllabus PDF
              </span>
              <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
                Official Mumbai University Syllabus (Rev 2016 CBCS) for {selectedSubject.name}.
              </p>
              <a
                href={selectedSubject.syllabusPdfUrl}
                download
                className="w-full mt-2 py-2 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-bold flex items-center justify-center gap-2 hover:bg-slate-100"
              >
                <Download className="w-3.5 h-3.5 text-indigo-500" /> Download PDF
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // LEVEL 2: SUBJECT LEARNING MAP
  // ==========================================
  if (selectedSubject) {
    const { pct, completedCount, totalCount, attentionCount } = calculateSubjectProgress(selectedSubject);

    // Filtered modules & topics
    const filteredModules = selectedSubject.modules.map(mod => ({
      ...mod,
      topics: mod.topics.filter(t =>
        !searchQuery ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })).filter(mod => mod.topics.length > 0 || !searchQuery);

    return (
      <div className="space-y-6">
        {/* Level 2 Header with Breadcrumbs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-3">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
            <button
              onClick={() => navigate('/atlas')}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 font-bold"
            >
              Atlas
            </button>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-900 dark:text-white font-bold">
              {selectedSubject.code} — {selectedSubject.name}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle: Map vs List */}
            <div className="flex items-center bg-slate-200 dark:bg-slate-800 p-0.5 rounded-xl text-xs font-mono">
              <button
                onClick={() => setViewMode('map')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${viewMode === 'map'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
              >
                Visual Map
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${viewMode === 'list'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
              >
                Structured List
              </button>
            </div>

            {/* Back to catalogue */}
            <button
              onClick={() => navigate('/atlas')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-mono font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> All Subjects
            </button>
          </div>
        </div>

        {/* Subject Overview Banner */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                  {selectedSubject.code}
                </span>
                <span className="text-xs font-mono text-slate-400">{selectedSubject.semester}</span>
                <span className="text-xs font-mono text-slate-400">• {selectedSubject.totalLectureHours} Syllabus Hours</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-display">
                {selectedSubject.name}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
                {selectedSubject.description}
              </p>
            </div>

            {/* Completion Gauge */}
            <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0">
              <div className="text-right font-mono">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Syllabus Progress</span>
                <span className="text-2xl font-bold text-slate-900 dark:text-white">{pct}%</span>
                <span className="text-[10px] text-slate-500 block">
                  {completedCount} of {totalCount} Topics Mastered
                </span>
              </div>
              <div className="w-14 h-14 rounded-full border-4 border-slate-200 dark:border-slate-800 flex items-center justify-center font-bold font-mono text-xs">
                {pct}%
              </div>
            </div>
          </div>

          {/* Search bar inside map */}
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-6" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search topics, algorithms, or modules in this syllabus..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* MAP VIEW: Visual Connected Syllabus Pathway */}
        {viewMode === 'map' ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredModules.map((mod, modIdx) => (
                <div
                  key={mod.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-indigo-400 dark:hover:border-indigo-700 transition-all group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                        MODULE 0{mod.moduleNumber}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {mod.lectureHours} Hours • {mod.coMapping}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 dark:text-white text-sm font-display group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {mod.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                      {mod.description}
                    </p>

                    {/* Topics List within Module */}
                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      {mod.topics.map(topic => {
                        const mastery = calculateMastery(topic.id);
                        return (
                          <button
                            key={topic.id}
                            onClick={() => navigate(`/atlas/${selectedSubject.code}/${topic.id}`)}
                            className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:border-indigo-300 dark:hover:border-indigo-700 text-left transition-all flex items-center justify-between group/topic"
                          >
                            <div className="space-y-0.5 truncate pr-2">
                              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block truncate group-hover/topic:text-indigo-600 dark:group-hover/topic:text-indigo-400">
                                {topic.shortTitle}
                              </span>
                              <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
                                <span>{topic.estimatedDuration}</span>
                                <span>•</span>
                                <span className="text-amber-500">{topic.examWeightage.split(' ')[0]}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${mastery >= 75
                                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                  : mastery > 0
                                    ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                                    : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                                }`}>
                                {mastery}%
                              </span>
                              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover/topic:translate-x-0.5 transition-transform" />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* ACCESSIBLE STRUCTURED LIST VIEW */
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
            {filteredModules.map(mod => (
              <div key={mod.id} className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <div className="p-4 bg-slate-50 dark:bg-slate-950/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 block">
                      MODULE 0{mod.moduleNumber} • {mod.lectureHours} HOURS
                    </span>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm font-display">
                      {mod.title}
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-slate-400">{mod.topics.length} Topics</span>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {mod.topics.map(topic => {
                    const mastery = calculateMastery(topic.id);
                    return (
                      <div
                        key={topic.id}
                        className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-950/40 flex items-center justify-between transition-colors"
                      >
                        <div className="space-y-1">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                            {topic.title}
                          </span>
                          <p className="text-[11px] text-slate-500 line-clamp-1">{topic.description}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                            {mastery}%
                          </span>
                          <button
                            onClick={() => navigate(`/atlas/${selectedSubject.code}/${topic.id}`)}
                            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-mono font-bold"
                          >
                            Study →
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // LEVEL 1: SUBJECT EXPLORER (CATALOGUE)
  // ==========================================
  const filteredSubjects = ATLAS_SUBJECTS.filter(s =>
    !searchQuery ||
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Level 1 Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-md">
        <div className="max-w-3xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-mono font-semibold">
            <Compass className="w-3.5 h-3.5 text-indigo-400" />
            <span>Academic Syllabus Navigator • Semester VII</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight font-display">
            Visual Learning Atlas
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
            Transform university syllabi into interactive visual knowledge pathways. Seamlessly explore lecture videos, concept visualizers, topper-standard notes, PYQs, and mastery analytics for Mumbai University curricula.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2 text-xs font-mono text-slate-300">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> 5 Core Subjects
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-400" /> 30 Syllabus Modules
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-400" /> 58 Verified YouTube Lectures
            </span>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search subjects, course codes, or topics..."
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400 self-end sm:self-auto">
          <span>University of Mumbai CBCS Scheme</span>
        </div>
      </div>

      {/* Subject Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSubjects.map(subject => {
          const { pct, completedCount, totalCount, attentionCount } = calculateSubjectProgress(subject);
          const nextTopic = subject.modules[0]?.topics[0];

          return (
            <div
              key={subject.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col justify-between hover:border-indigo-400 dark:hover:border-indigo-700 hover:shadow-md transition-all group"
            >
              <div className="space-y-4">
                {/* Header tag and code */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    {subject.code}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {subject.modules.length} Modules
                  </span>
                </div>

                {/* Subject Title */}
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white font-display group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {subject.name}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed line-clamp-2">
                    {subject.description}
                  </p>
                </div>

                {/* Progress Bar & Stats */}
                <div className="space-y-1.5 font-mono">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">Coverage:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{pct}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 transition-all duration-500"
                      style={{ width: `${Math.max(4, pct)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 pt-1">
                    <span>{completedCount} of {totalCount} Topics Mastered</span>
                    {attentionCount > 0 && (
                      <span className="text-amber-500 font-bold">{attentionCount} Need Attention</span>
                    )}
                  </div>
                </div>

                {/* Next Recommended Topic Pill */}
                {nextTopic && (
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs font-mono">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">
                      Next Recommended:
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block truncate">
                      {nextTopic.shortTitle}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-5 mt-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                <a
                  href={subject.syllabusPdfUrl}
                  download
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-mono font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5"
                  title="Download Syllabus PDF"
                >
                  <Download className="w-3.5 h-3.5" /> PDF
                </a>

                <button
                  onClick={() => navigate(`/atlas/${subject.code}`)}
                  className="flex-1 py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-mono font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
                >
                  <span>Explore Atlas</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
