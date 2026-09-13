import React, { useState } from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { Sparkles, LogOut, Menu, X, Settings, Loader2 } from 'lucide-react';
import { useAuth, supabase } from './context/AuthContext';
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

function ProtectedRoute({ children, requireProfile = true }: { children: React.ReactNode; requireProfile?: boolean }) {
  const { session, loading, hasProfile } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center text-xs font-mono text-[#75758a] uppercase tracking-wider gap-3">
        <Loader2 className="w-5 h-5 animate-spin text-black" />
        <span>Loading OS...</span>
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

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSidebarOpen(false);
        setSettingsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const { signOut } = useAuth();
  const apiProvider = import.meta.env.VITE_AI_PROVIDER || 'gemini';
  const hasGeminiKey = Boolean(import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GOOGLE_AI_API_KEY);
  const hasCohereKey = Boolean(import.meta.env.VITE_COHERE_API_KEY);

  return (
    <div className="min-h-screen bg-white text-[#212121] font-sans flex flex-col relative overflow-hidden">

      <div className="flex flex-col flex-1 relative z-10">
        {/* Cohere Stark White Navbar */}
        <nav className="bg-white px-6 py-3 flex justify-between items-center sticky top-0 z-50 border-b border-[#d9d9dd]">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button
              className="lg:hidden p-2 rounded hover:bg-[#eeece7] text-[#75758a] transition-colors border border-transparent"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded bg-black flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-sm font-bold tracking-tight text-black font-display uppercase">ArchAdemia</h1>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSettingsOpen(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#212121] hover:bg-[#eeece7] border border-[#d9d9dd] px-3.5 py-1.5 rounded-full transition-colors cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Environment</span>
            </button>
            <button 
              onClick={() => signOut()}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#212121] hover:bg-[#eeece7] border border-[#d9d9dd] px-3.5 py-1.5 rounded-full transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </nav>
        
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
            <div className="absolute left-0 top-0 h-full w-72 bg-white shadow-2xl z-10 flex flex-col border-r border-gemini-border">
              <div className="flex justify-between items-center px-6 py-4 border-b border-gemini-border">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-gemini-blue" />
                  <span className="font-bold text-xs text-gemini-text">ArchAdemia</span>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-lg hover:bg-gemini-bg text-gemini-text-muted border border-transparent hover:border-gemini-border">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div onClick={() => setSidebarOpen(false)} className="flex-1 overflow-y-auto bg-slate-50/50">
                <Sidebar />
              </div>
            </div>
          </div>
        )}

        {/* Main Layout with Sidebar */}
        <div className="flex flex-1">
          {/* Desktop sidebar */}
          <div className="hidden lg:block border-r border-gemini-border/60 bg-white/50 backdrop-blur-sm">
            <Sidebar />
          </div>
          <div className="flex-1 max-h-[calc(100vh-57px)] overflow-y-auto">
            {children}
          </div>
        </div>
      </div>

      {/* Environment Info Modal */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white border border-[#d9d9dd] w-full max-w-md rounded-2xl overflow-hidden flex flex-col relative animate-in fade-in zoom-in duration-200">
            <header className="p-6 border-b border-[#d9d9dd] flex justify-between items-center bg-white">
              <h3 className="text-sm font-bold text-black uppercase tracking-wider flex items-center gap-2 font-display">
                <Settings className="w-4 h-4 text-black" />
                AI Environment Status
              </h3>
              <button 
                onClick={() => setSettingsOpen(false)}
                className="text-[#75758a] hover:text-black p-1.5 rounded-full hover:bg-[#eeece7] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </header>
            
            <div className="p-6 space-y-4 bg-white">
              <div className="bg-[#fafafb] border border-[#d9d9dd] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-[#75758a] uppercase">Primary Model:</span>
                  <span className="font-bold text-black">Google Gemini 2.5 Flash</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-[#75758a] uppercase">Secondary Model:</span>
                  <span className="font-bold text-black">Cohere Command R+</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-[#75758a] uppercase">Backend Gateway:</span>
                  <span className="font-mono text-[#1863dc]">apps/api/src/lib/ai-gateway.ts</span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-black uppercase font-display">Environment Setup:</h4>
                <p className="text-xs text-[#5f6368] leading-relaxed">
                  Keys are configured via your <code className="font-mono text-black font-semibold">.env</code> files:
                </p>
                <ul className="text-xs text-[#5f6368] space-y-1.5 font-mono list-disc list-inside bg-[#fafafb] p-3 rounded border border-[#d9d9dd]">
                  <li><span className="text-black font-semibold">GOOGLE_AI_API_KEY</span> in <code className="text-[#1863dc]">apps/api/.env</code></li>
                  <li><span className="text-black font-semibold">COHERE_API_KEY</span> in <code className="text-[#1863dc]">apps/api/.env</code></li>
                  <li><span className="text-black font-semibold">VITE_GEMINI_API_KEY</span> in <code className="text-[#1863dc]">apps/web/.env</code></li>
                </ul>
              </div>

              <div className="flex justify-end pt-2">
                <button 
                  type="button"
                  onClick={() => setSettingsOpen(false)}
                  className="bg-black hover:bg-zinc-800 text-white px-6 py-2.5 rounded-full text-xs font-semibold transition-all cursor-pointer"
                >
                  Got It
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
