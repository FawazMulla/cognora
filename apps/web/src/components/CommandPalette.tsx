import {
  ArrowRight,
  Award,
  BookOpen,
  Bookmark,
  Calendar,
  Clock,
  Compass,
  CornerDownLeft,
  Edit3,
  FileText,
  FlaskConical,
  HelpCircle,
  History,
  Layers,
  Loader2,
  Mic,
  Moon,
  Search,
  Sparkles,
  Sun,
  UserCircle,
  X,
  Zap,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { usePreferences } from '../context/PreferencesContext';
import { fetchApi } from '../lib/api';
import { ATLAS_SUBJECTS } from '../data/atlasCatalogue';

interface SearchItem {
  id: string;
  type: 'navigation' | 'subject' | 'topic' | 'resource' | 'question' | 'action';
  title: string;
  subtitle?: string;
  url: string;
  badge?: string;
  icon?: typeof Compass;
}

const DEFAULT_NAVIGATION: SearchItem[] = [
  { id: 'nav-cic', type: 'navigation', title: 'Academic Intelligence Hub (CIC)', subtitle: 'Syllabus-grounded AI, Hybrid RRF Retrieval & Citations', url: '/intelligence', icon: Sparkles, badge: 'Core AI' },
  { id: 'nav-0', type: 'navigation', title: 'Visual Learning Atlas', subtitle: 'Mumbai University Visual Syllabus & Video Lectures', url: '/atlas', icon: Compass, badge: 'Signature' },
  { id: 'nav-1', type: 'navigation', title: 'Dashboard', subtitle: 'Academic Overview & Metrics', url: '/', icon: Compass, badge: 'Home' },
  { id: 'nav-2', type: 'navigation', title: 'Syllabus & Units', subtitle: 'Mumbai Univ Semester VII Modules', url: '/syllabus', icon: Layers, badge: 'Curriculum' },
  { id: 'nav-3', type: 'navigation', title: 'Exam & IAE Notes', subtitle: 'High-Yield Revision Summaries', url: '/exam-notes', icon: FileText, badge: 'Study' },
  { id: 'nav-4', type: 'navigation', title: 'Question Bank (QB)', subtitle: 'Unit-wise questions (2M, 5M, 10M, 15M)', url: '/question-bank', icon: HelpCircle, badge: 'Exams' },
  { id: 'nav-5', type: 'navigation', title: 'Structured Answers', subtitle: 'University Topper Model Answers', url: '/answers', icon: Award, badge: 'AI Engine' },
  { id: 'nav-6', type: 'navigation', title: 'Answer Optimizer', subtitle: 'Rubric Evaluation & Score Predictor', url: '/answer-optimizer', icon: Edit3, badge: 'Review' },
  { id: 'nav-7', type: 'navigation', title: 'PYQ Intelligence', subtitle: '5-Year Paper Frequency Heatmap', url: '/pyq', icon: BookOpen, badge: 'Analytics' },
  { id: 'nav-8', type: 'navigation', title: 'Practical Generator', subtitle: 'Complete Lab Journals & Python/C++ Code', url: '/practicals', icon: FlaskConical, badge: 'Labs' },
  { id: 'nav-9', type: 'navigation', title: 'Viva Voice Engine', subtitle: 'Examiner Oral Defense Simulation', url: '/viva', icon: Mic, badge: 'Oral Prep' },
  { id: 'nav-10', type: 'navigation', title: 'Smart Revision', subtitle: 'SM-2 Spaced Repetition Flashcards', url: '/revision', icon: Zap, badge: 'Memory' },
  { id: 'nav-11', type: 'navigation', title: 'Digital Student Twin', subtitle: 'Cognitive Readiness & Exam Simulation', url: '/twin', icon: UserCircle, badge: 'AI Model' },
  { id: 'nav-12', type: 'navigation', title: 'Bookmarks & Saved Vault', subtitle: 'Personal saved topics & annotations', url: '/bookmarks', icon: Bookmark, badge: 'Vault' },
];

const DEFAULT_ACTIONS: SearchItem[] = [
  { id: 'act-1', type: 'action', title: 'Draft a 10-Mark Model Answer', subtitle: 'Generate topper response with diagrams', url: '/answers', icon: Sparkles, badge: 'Quick Pick' },
  { id: 'act-2', type: 'action', title: 'Build Lab Practical Journal Entry', subtitle: 'Create complete experiment code & viva', url: '/practicals', icon: FlaskConical, badge: 'Lab Action' },
  { id: 'act-3', type: 'action', title: 'Start a Mock Viva Exam Session', subtitle: 'Interactive oral evaluation with scoring', url: '/viva', icon: Mic, badge: 'Viva' },
  { id: 'act-4', type: 'action', title: 'Browse Saved Bookmarks & Annotations', subtitle: 'Open your centralized academic vault', url: '/bookmarks', icon: Bookmark, badge: 'Vault' },
  { id: 'act-5', type: 'action', title: 'Start Flashcard Revision Session', subtitle: 'Review cards due today using SM-2', url: '/revision', icon: Clock, badge: 'Review' },
];

export function CommandPalette({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [academicResults, setAcademicResults] = useState<{
    subjects: SearchItem[];
    topics: SearchItem[];
    resources: SearchItem[];
    questions: SearchItem[];
  }>({
    subjects: [],
    topics: [],
    resources: [],
    questions: [],
  });

  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('cognora_recent_searches');
      return saved ? (JSON.parse(saved) as string[]) : ['Inverted Index', 'Activation Function', 'Confusion Matrix'];
    } catch {
      return [];
    }
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { theme, setTheme } = usePreferences();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Debounced API Search for academic resources
  useEffect(() => {
    if (!query.trim()) {
      setAcademicResults({ subjects: [], topics: [], resources: [], questions: [] });
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const qLower = query.toLowerCase().trim();
        const atlasSubjects: SearchItem[] = ATLAS_SUBJECTS
          .filter(s => s.name.toLowerCase().includes(qLower) || s.code.toLowerCase().includes(qLower))
          .map(s => ({
            id: `atlas-sub-${s.id}`,
            type: 'subject',
            title: `${s.code}: ${s.name}`,
            subtitle: `${s.modules.length} Modules • Mumbai University`,
            url: `/atlas/${s.code}`,
            badge: 'Atlas',
            icon: Compass
          }));

        const atlasTopics: SearchItem[] = [];
        ATLAS_SUBJECTS.forEach(s => {
          s.modules.forEach(m => {
            m.topics.forEach(t => {
              if (t.title.toLowerCase().includes(qLower) || t.description.toLowerCase().includes(qLower)) {
                atlasTopics.push({
                  id: `atlas-top-${t.id}`,
                  type: 'topic',
                  title: t.title,
                  subtitle: `${s.code} • ${m.title}`,
                  url: `/atlas/${s.code}/${t.id}`,
                  badge: 'Topic',
                  icon: BookOpen
                });
              }
            });
          });
        });

        const res = await fetchApi(`/api/search/academic?q=${encodeURIComponent(query)}`);
        setAcademicResults({
          subjects: [...atlasSubjects, ...(res?.results?.subjects || [])].slice(0, 5),
          topics: [...atlasTopics, ...(res?.results?.topics || [])].slice(0, 8),
          resources: res?.results?.resources || [],
          questions: res?.results?.questions || [],
        });
      } catch {
        // Fallback to client-side atlas match
        const qLower = query.toLowerCase().trim();
        const atlasSubjects: SearchItem[] = ATLAS_SUBJECTS
          .filter(s => s.name.toLowerCase().includes(qLower) || s.code.toLowerCase().includes(qLower))
          .map(s => ({
            id: `atlas-sub-${s.id}`,
            type: 'subject',
            title: `${s.code}: ${s.name}`,
            subtitle: `${s.modules.length} Modules • Mumbai University`,
            url: `/atlas/${s.code}`,
            badge: 'Atlas',
            icon: Compass
          }));

        const atlasTopics: SearchItem[] = [];
        ATLAS_SUBJECTS.forEach(s => {
          s.modules.forEach(m => {
            m.topics.forEach(t => {
              if (t.title.toLowerCase().includes(qLower) || t.description.toLowerCase().includes(qLower)) {
                atlasTopics.push({
                  id: `atlas-top-${t.id}`,
                  type: 'topic',
                  title: t.title,
                  subtitle: `${s.code} • ${m.title}`,
                  url: `/atlas/${s.code}/${t.id}`,
                  badge: 'Topic',
                  icon: BookOpen
                });
              }
            });
          });
        });

        setAcademicResults({
          subjects: atlasSubjects.slice(0, 5),
          topics: atlasTopics.slice(0, 8),
          resources: [],
          questions: [],
        });
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [query]);

  // Filter static navigation & actions
  const filteredNav = DEFAULT_NAVIGATION.filter(
    item =>
      !query.trim() ||
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      (item.subtitle && item.subtitle.toLowerCase().includes(query.toLowerCase()))
  );

  const filteredActions = DEFAULT_ACTIONS.filter(
    item =>
      !query.trim() ||
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      (item.subtitle && item.subtitle.toLowerCase().includes(query.toLowerCase()))
  );

  // Flat list for keyboard navigation
  const allItems: SearchItem[] = [
    ...academicResults.subjects,
    ...academicResults.topics,
    ...academicResults.resources,
    ...academicResults.questions,
    ...filteredNav,
    ...filteredActions,
  ];

  const handleSelect = (item: SearchItem) => {
    if (query.trim()) {
      const nextRecent = [query.trim(), ...recentSearches.filter(q => q !== query.trim())].slice(0, 6);
      setRecentSearches(nextRecent);
      try {
        localStorage.setItem('cognora_recent_searches', JSON.stringify(nextRecent));
      } catch {}
    }
    onClose();
    navigate(item.url);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < allItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : allItems.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const current = allItems[selectedIndex];
      if (current) {
        handleSelect(current);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 md:pt-24 px-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-white dark:bg-[#161720] border border-[#e3e6ed] dark:border-[#262936] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] transition-all"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#e3e6ed] dark:border-[#262936] bg-[#f8f9fc] dark:bg-[#12131b]">
          <Search className="w-5 h-5 text-[#8c8fa1] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command, subject, syllabus topic, PYQ, or formula..."
            className="flex-1 bg-transparent text-[#121217] dark:text-[#f0f2f7] placeholder-[#8c8fa1] outline-none text-sm font-medium font-sans"
          />
          {loading && <Loader2 className="w-4 h-4 animate-spin text-[#4f75f2] shrink-0" />}
          {query && !loading && (
            <button
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="text-[#8c8fa1] hover:text-[#121217] dark:hover:text-white p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="hidden sm:inline text-[10px] font-mono uppercase bg-[#e4e7fd] dark:bg-[#1e2638] text-[#3b52c4] dark:text-[#82aaff] px-2 py-0.5 rounded-lg border border-[#d0dcf5] dark:border-[#313d5a] font-bold">
            ESC to close
          </span>
        </div>

        {/* Recent Search Pills (When query is empty) */}
        {!query && recentSearches.length > 0 && (
          <div className="px-5 py-3 border-b border-[#e3e6ed] dark:border-[#262936] bg-white dark:bg-[#161720] flex items-center gap-2 overflow-x-auto text-xs">
            <span className="text-[10px] font-mono text-[#8c8fa1] uppercase font-bold shrink-0 flex items-center gap-1">
              <History className="w-3 h-3" /> Recent:
            </span>
            {recentSearches.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setQuery(s)}
                className="text-[11px] font-medium bg-[#f8f9fc] dark:bg-[#12131b] hover:bg-[#edf3fc] dark:hover:bg-[#1c253b] text-[#4f5367] dark:text-[#b8bcd2] px-2.5 py-1 rounded-xl border border-[#e3e6ed] dark:border-[#262936] transition-colors shrink-0 cursor-pointer"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 select-none">
          {allItems.length === 0 && !loading && (
            <div className="py-14 text-center space-y-2">
              <Search className="w-8 h-8 text-[#8c8fa1] mx-auto opacity-40" />
              <p className="text-sm font-bold text-[#121217] dark:text-[#f0f2f7]">
                No matching academic results for &ldquo;{query}&rdquo;
              </p>
              <p className="text-xs text-[#8c8fa1] max-w-sm mx-auto">
                Try searching by syllabus topic name (e.g., Vector Space Model, Inverted Index), or jump directly to a tool like &ldquo;Structured Answers&rdquo;.
              </p>
            </div>
          )}

          {/* Academic Content Sections (When Present) */}
          {(academicResults.subjects.length > 0 ||
            academicResults.topics.length > 0 ||
            academicResults.questions.length > 0 ||
            academicResults.resources.length > 0) && (
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold text-[#8c8fa1] uppercase tracking-wider px-3">
                Academic Knowledge Base
              </span>
              {[
                ...academicResults.subjects,
                ...academicResults.topics,
                ...academicResults.questions,
                ...academicResults.resources,
              ].map(item => {
                const itemIndex = allItems.findIndex(x => x.id === item.id);
                const isSelected = selectedIndex === itemIndex;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#edf3fc] dark:bg-[#1c253b] text-[#4f75f2] dark:text-[#82aaff] border border-[#d0dcf5] dark:border-[#313d5a]'
                        : 'text-[#121217] dark:text-[#f0f2f7] hover:bg-[#f8f9fc] dark:hover:bg-[#12131b] border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <div className="w-7 h-7 rounded-xl bg-white dark:bg-[#12131b] border border-[#e3e6ed] dark:border-[#262936] flex items-center justify-center shrink-0">
                        <BookOpen className="w-3.5 h-3.5 text-[#4f75f2]" />
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-bold truncate">{item.title}</div>
                        {item.subtitle && (
                          <div className="text-[10px] text-[#8c8fa1] truncate">{item.subtitle}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {item.badge && (
                        <span className="text-[9px] font-mono uppercase bg-[#edf3fc] dark:bg-[#1c253b] text-[#4f75f2] dark:text-[#82aaff] px-2 py-0.5 rounded-md font-bold">
                          {item.badge}
                        </span>
                      )}
                      {isSelected && <CornerDownLeft className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Navigation Section */}
          {filteredNav.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold text-[#8c8fa1] uppercase tracking-wider px-3">
                Workspace Navigation
              </span>
              {filteredNav.map(item => {
                const itemIndex = allItems.findIndex(x => x.id === item.id);
                const isSelected = selectedIndex === itemIndex;
                const IconComponent = item.icon || Compass;

                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#edf3fc] dark:bg-[#1c253b] text-[#4f75f2] dark:text-[#82aaff] border border-[#d0dcf5] dark:border-[#313d5a]'
                        : 'text-[#121217] dark:text-[#f0f2f7] hover:bg-[#f8f9fc] dark:hover:bg-[#12131b] border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <div className="w-7 h-7 rounded-xl bg-white dark:bg-[#12131b] border border-[#e3e6ed] dark:border-[#262936] flex items-center justify-center shrink-0">
                        <IconComponent className="w-3.5 h-3.5 text-[#4f75f2]" />
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-bold truncate">{item.title}</div>
                        {item.subtitle && (
                          <div className="text-[10px] text-[#8c8fa1] truncate">{item.subtitle}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {item.badge && (
                        <span className="text-[9px] font-mono text-[#8c8fa1] uppercase">
                          {item.badge}
                        </span>
                      )}
                      {isSelected && <ArrowRight className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Quick Actions */}
          {filteredActions.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold text-[#8c8fa1] uppercase tracking-wider px-3">
                Quick Actions
              </span>
              {filteredActions.map(item => {
                const itemIndex = allItems.findIndex(x => x.id === item.id);
                const isSelected = selectedIndex === itemIndex;
                const IconComponent = item.icon || Sparkles;

                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#edf3fc] dark:bg-[#1c253b] text-[#4f75f2] dark:text-[#82aaff] border border-[#d0dcf5] dark:border-[#313d5a]'
                        : 'text-[#121217] dark:text-[#f0f2f7] hover:bg-[#f8f9fc] dark:hover:bg-[#12131b] border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <div className="w-7 h-7 rounded-xl bg-white dark:bg-[#12131b] border border-[#e3e6ed] dark:border-[#262936] flex items-center justify-center shrink-0">
                        <IconComponent className="w-3.5 h-3.5 text-amber-500" />
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-bold truncate">{item.title}</div>
                        {item.subtitle && (
                          <div className="text-[10px] text-[#8c8fa1] truncate">{item.subtitle}</div>
                        )}
                      </div>
                    </div>
                    <span className="text-[9px] font-mono uppercase bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-md font-bold">
                      {item.badge}
                    </span>
                  </div>
                );
              })}

              {/* Theme Toggle Quick Action */}
              <div
                onClick={() => {
                  setTheme(theme === 'dark' ? 'light' : 'dark');
                  onClose();
                }}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl cursor-pointer text-[#121217] dark:text-[#f0f2f7] hover:bg-[#f8f9fc] dark:hover:bg-[#12131b] transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-xl bg-white dark:bg-[#12131b] border border-[#e3e6ed] dark:border-[#262936] flex items-center justify-center shrink-0">
                    {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-500" />}
                  </div>
                  <div>
                    <div className="text-xs font-bold">Toggle Dark / Light Theme</div>
                    <div className="text-[10px] text-[#8c8fa1]">Currently: {theme.toUpperCase()}</div>
                  </div>
                </div>
                <span className="text-[9px] font-mono uppercase bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded-md font-bold">
                  Theme
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer shortcuts helper */}
        <footer className="px-5 py-3 border-t border-[#e3e6ed] dark:border-[#262936] bg-[#f8f9fc] dark:bg-[#12131b] flex items-center justify-between text-[11px] font-mono text-[#8c8fa1]">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-[#161720] border border-[#e3e6ed] dark:border-[#262936] rounded text-[10px]">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-[#161720] border border-[#e3e6ed] dark:border-[#262936] rounded text-[10px]">↓</kbd> to navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-[#161720] border border-[#e3e6ed] dark:border-[#262936] rounded text-[10px]">↵</kbd> to select
            </span>
          </div>
          <span className="text-[10px] font-mono text-[#4f75f2] font-bold">Cognora Intelligent Search</span>
        </footer>
      </div>
    </div>
  );
}

