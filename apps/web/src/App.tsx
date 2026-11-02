import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { Sparkles, LogOut, Menu, X, Settings, Loader2, Search, Sun, Moon, Bookmark, Layers, Sliders } from 'lucide-react';
import { useAuth, supabase } from './context/AuthContext';
import { usePreferences } from './context/PreferencesContext';
import { CommandPalette } from './components/CommandPalette';
import Sidebar from './components/Sidebar';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SubjectDetail from './pages/SubjectDetail';
import StudySession from './pages/StudySession';
import PYQIntelligence from './pages/PYQIntelligence';
import PracticalGenerator from './pages/PracticalGenerator';
import VivaEngine from './pages/VivaEngine';
import AssignmentEngine from './pages/AssignmentEngine';
import StudentTwin from './pages/StudentTwin';
import SmartRevision from './pages/SmartRevision';
import KnowledgeGraph from './pages/KnowledgeGraph';
import Onboarding from './pages/Onboarding';
import SyllabusManager from './pages/SyllabusManager';
import ExamNotes from './pages/ExamNotes';
import QuestionBank from './pages/QuestionBank';
import StructuredAnswer from './pages/StructuredAnswer';
import AnswerOptimizer from './pages/AnswerOptimizer';
import Bookmarks from './pages/Bookmarks';
import VisualLearningAtlas from './pages/VisualLearningAtlas';
import AcademicIntelligence from './pages/AcademicIntelligence';

function ProtectedRoute({ children, requireProfile = true }: { children: React.ReactNode; requireProfile?: boolean }) {
  const { session, loading, hasProfile } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col items-center justify-center text-xs font-mono text-[#75758a] dark:text-slate-400 uppercase tracking-wider gap-3">
        <Loader2 className="w-5 h-5 animate-spin text-[#4f75f2]" />
        <span>Loading Academic OS...</span>
      </div>
    );
  }
  
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (requireProfile && hasProfile === false) {
    return <Navigate to="/onboarding" replace />;
  }

  if (!requireProfile && hasProfile === true) {
    return <Navigate to="/" replace />;
  }
  
  return children as React.JSX.Element;
}

function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const { theme, setTheme, density, setDensity, isDark } = usePreferences();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSidebarOpen(false);
        setSettingsOpen(false);
        setCmdOpen(false);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmdOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const { signOut } = useAuth();

  const cycleDensity = () => {
    if (density === 'comfortable') setDensity('standard');
    else if (density === 'standard') setDensity('compact');
    else setDensity('comfortable');
  };

  return (
    <div className="min-h-screen bg-[#f8f9fc] dark:bg-slate-950 text-[#2d2d34] dark:text-slate-100 font-sans flex flex-col relative overflow-hidden transition-colors">
      {/* Global Command & Search Palette */}
      <CommandPalette isOpen={cmdOpen} onClose={() => setCmdOpen(false)} />

      <div className="flex flex-col flex-1 relative z-10">
        {/* Sleek Minimal Navbar */}
        <nav className="bg-[#ffffff]/90 dark:bg-slate-900/90 backdrop-blur-md px-6 py-3 flex justify-between items-center sticky top-0 z-40 border-b border-[#e3e6ed] dark:border-slate-800 transition-colors">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button
              className="lg:hidden p-2 rounded-xl hover:bg-[#edf3fc] dark:hover:bg-slate-800 text-[#6b6f82] dark:text-slate-400 transition-colors border border-transparent"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#4f75f2] to-[#713fb8] flex items-center justify-center shadow-xs text-white">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-sm font-extrabold tracking-tight text-[#121217] dark:text-white uppercase font-mono">Cognora</h1>
            </Link>

            {/* Global Search Button with Ctrl+K shortcut badge */}
            <button
              onClick={() => setCmdOpen(true)}
              className="hidden md:flex items-center gap-2.5 ml-4 px-3.5 py-1.5 rounded-xl text-xs text-slate-500 dark:text-slate-400 bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-indigo-500" />
              <span>Search subjects, PYQs, topics...</span>
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded shadow-2xs font-semibold">
                Ctrl K
              </kbd>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Mobile Search Button */}
            <button
              onClick={() => setCmdOpen(true)}
              className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
              title="Search (Ctrl + K)"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Reading Density Cycler */}
            <button
              onClick={cycleDensity}
              className="hidden sm:flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 px-2.5 py-1.5 rounded-xl transition-all capitalize"
              title={`Reading Density: ${density} (Click to toggle)`}
            >
              <Sliders className="w-3.5 h-3.5 text-indigo-500" />
              <span>{density}</span>
            </button>

            {/* Dark / Light Mode Toggle */}
            <button
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-all cursor-pointer shadow-2xs"
              title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            </button>

            {/* Bookmarks Quick Link */}
            <Link
              to="/bookmarks"
              className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-[#4f5367] dark:text-slate-300 hover:text-[#121217] dark:hover:text-white bg-white dark:bg-slate-900 hover:bg-[#edf3fc] dark:hover:bg-slate-800 border border-[#e3e6ed] dark:border-slate-800 hover:border-[#d0dcf5] px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-2xs"
            >
              <Bookmark className="w-3.5 h-3.5 text-amber-500" />
              <span>Vault</span>
            </Link>

            <button
              onClick={() => setSettingsOpen(true)}
              className="flex items-center gap-1.5 text-xs font-bold text-[#4f5367] dark:text-slate-300 hover:text-[#121217] dark:hover:text-white bg-white dark:bg-slate-900 hover:bg-[#edf3fc] dark:hover:bg-slate-800 border border-[#e3e6ed] dark:border-slate-800 hover:border-[#d0dcf5] px-3.5 py-1.5 rounded-xl transition-all cursor-pointer shadow-2xs"
            >
              <Settings className="w-3.5 h-3.5 text-[#4f75f2]" />
              <span className="hidden sm:inline">Environment</span>
            </button>

            <button 
              onClick={() => signOut()}
              className="flex items-center gap-1.5 text-xs font-bold text-[#4f5367] dark:text-slate-300 hover:text-[#e03137] bg-white dark:bg-slate-900 hover:bg-[#fee2e2]/40 border border-[#e3e6ed] dark:border-slate-800 hover:border-[#fca5a5] px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-2xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </nav>
        
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setSidebarOpen(false)} />
            <div className="absolute left-0 top-0 h-full w-72 bg-white dark:bg-slate-900 shadow-2xl z-10 flex flex-col border-r border-slate-200 dark:border-slate-800">
              <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#4f75f2]" />
                  <span className="font-bold text-xs text-slate-900 dark:text-white uppercase font-mono">Cognora</span>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div onClick={() => setSidebarOpen(false)} className="flex-1 overflow-y-auto">
                <Sidebar />
              </div>
            </div>
          </div>
        )}

        {/* Main Layout with Sidebar */}
        <div className="flex flex-1">
          {/* Desktop sidebar */}
          <div className="hidden lg:block border-r border-[#e3e6ed] dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
            <Sidebar />
          </div>
          <div className="flex-1 max-h-[calc(100vh-57px)] overflow-y-auto p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </div>
      </div>

      {/* Environment Info Modal */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-2xl overflow-hidden flex flex-col relative shadow-xl animate-in fade-in zoom-in duration-200">
            <header className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 font-display">
                <Settings className="w-4 h-4 text-[#4f75f2]" />
                AI Environment & System Status
              </h3>
              <button 
                onClick={() => setSettingsOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </header>
            
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-500 dark:text-slate-400 uppercase">Primary Model:</span>
                  <span className="font-bold text-slate-900 dark:text-white">Google Gemini 1.5 Flash</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-500 dark:text-slate-400 uppercase">Secondary Model:</span>
                  <span className="font-bold text-slate-900 dark:text-white">Cohere Command R+</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-500 dark:text-slate-400 uppercase">OCI Backend:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">OCI GenAI (cohere.command-a-03-2025)</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-500 dark:text-slate-400 uppercase">Gateway Router:</span>
                  <span className="font-mono text-[#4f75f2]">apps/api/src/lib/ai-gateway.ts</span>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase font-display">Appearance &amp; Preferences:</h4>
                
                {/* Theme Selector */}
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1.5 font-bold">Theme Mode:</span>
                  <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                    {(['light', 'dark', 'system'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTheme(t)}
                        className={`py-2 px-3 rounded-xl border text-center transition-all capitalize font-bold ${
                          theme === t
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-400'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Density Selector */}
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1.5 font-bold">Reading Density:</span>
                  <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                    {(['standard', 'compact', 'comfortable'] as const).map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDensity(d)}
                        className={`py-2 px-3 rounded-xl border text-center transition-all capitalize font-bold ${
                          density === d
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-400'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button 
                  type="button"
                  onClick={() => setSettingsOpen(false)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/onboarding" element={<ProtectedRoute requireProfile={false}><Onboarding /></ProtectedRoute>} />
      <Route path="/" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
      <Route path="/intelligence" element={<ProtectedRoute><AppLayout><AcademicIntelligence /></AppLayout></ProtectedRoute>} />
      <Route path="/atlas" element={<ProtectedRoute><AppLayout><VisualLearningAtlas /></AppLayout></ProtectedRoute>} />
      <Route path="/atlas/:subjectCode" element={<ProtectedRoute><AppLayout><VisualLearningAtlas /></AppLayout></ProtectedRoute>} />
      <Route path="/atlas/:subjectCode/:topicId" element={<ProtectedRoute><AppLayout><VisualLearningAtlas /></AppLayout></ProtectedRoute>} />
      <Route path="/bookmarks" element={<ProtectedRoute><AppLayout><Bookmarks /></AppLayout></ProtectedRoute>} />
      <Route path="/subject/:id" element={<ProtectedRoute><AppLayout><SubjectDetail /></AppLayout></ProtectedRoute>} />
      <Route path="/session/:id" element={<ProtectedRoute><AppLayout><StudySession /></AppLayout></ProtectedRoute>} />
      
      <Route path="/twin" element={<ProtectedRoute><AppLayout><StudentTwin /></AppLayout></ProtectedRoute>} />
      <Route path="/syllabus" element={<ProtectedRoute><AppLayout><SyllabusManager /></AppLayout></ProtectedRoute>} />
      <Route path="/exam-notes" element={<ProtectedRoute><AppLayout><ExamNotes /></AppLayout></ProtectedRoute>} />
      <Route path="/question-bank" element={<ProtectedRoute><AppLayout><QuestionBank /></AppLayout></ProtectedRoute>} />
      <Route path="/answers" element={<ProtectedRoute><AppLayout><StructuredAnswer /></AppLayout></ProtectedRoute>} />
      <Route path="/answer-optimizer" element={<ProtectedRoute><AppLayout><AnswerOptimizer /></AppLayout></ProtectedRoute>} />
      <Route path="/pyq" element={<ProtectedRoute><AppLayout><PYQIntelligence /></AppLayout></ProtectedRoute>} />
      <Route path="/practicals" element={<ProtectedRoute><AppLayout><PracticalGenerator /></AppLayout></ProtectedRoute>} />
      <Route path="/viva" element={<ProtectedRoute><AppLayout><VivaEngine /></AppLayout></ProtectedRoute>} />
      <Route path="/assignments" element={<ProtectedRoute><AppLayout><AssignmentEngine /></AppLayout></ProtectedRoute>} />
      <Route path="/revision" element={<ProtectedRoute><AppLayout><SmartRevision /></AppLayout></ProtectedRoute>} />
      <Route path="/knowledge" element={<ProtectedRoute><AppLayout><KnowledgeGraph /></AppLayout></ProtectedRoute>} />
    </Routes>
  );
}

export default App;
