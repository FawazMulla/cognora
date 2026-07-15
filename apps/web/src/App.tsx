import React, { useState } from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { Sparkles, LogOut, Menu, X, Settings } from 'lucide-react';
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

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen bg-gemini-bg flex items-center justify-center text-gemini-text-muted">Loading OS...</div>;
  }
  
  if (!session) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [byokKey, setByokKey] = useState(localStorage.getItem('byok_gemini_key') || '');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (byokKey.trim()) {
      localStorage.setItem('byok_gemini_key', byokKey.trim());
    } else {
      localStorage.removeItem('byok_gemini_key');
    }
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setSettingsOpen(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gemini-bg text-gemini-text font-sans selection:bg-gemini-blue/10 flex flex-col relative overflow-hidden">
      {/* Background Glowing Blobs */}
      <div className="absolute top-[-20%] left-[-15%] w-[60vw] h-[60vw] rounded-full bg-blue-300/10 blur-[130px] pointer-events-none animate-drift-slow z-0" />
      <div className="absolute bottom-[-15%] right-[-15%] w-[70vw] h-[70vw] rounded-full bg-purple-300/10 blur-[160px] pointer-events-none animate-drift-medium z-0" />
      
      {/* Floating Particles Container */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {[...Array(6)].map((_, i) => {
          const size = Math.random() * 8 + 4; // 4px to 12px
          const left = Math.random() * 100; // 0% to 100%
          const delay = Math.random() * 10; // 0s to 10s
          const duration = Math.random() * 12 + 15; // 15s to 27s
          return (
            <div
              key={i}
              className="floating-particle"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                left: `${left}%`,
                animationDelay: `${delay}s`,
                animationDuration: `${duration}s`,
              }}
            />
          );
        })}
      </div>

      <div className="flex flex-col flex-1 relative z-10">
        {/* Top Navbar */}
        <nav className="bg-white/70 backdrop-blur-md px-6 py-3 flex justify-between items-center sticky top-0 z-50 border-b border-gemini-border/60 shadow-sm shadow-slate-100/50">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-gemini-surface text-gemini-text-muted transition-colors border border-transparent hover:border-gemini-border"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-white border border-gemini-border flex items-center justify-center shadow-sm group-hover:border-gemini-blue transition-colors">
                <Sparkles className="w-4 h-4 text-gemini-blue" />
              </div>
              <h1 className="text-sm font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">AI Academic OS</h1>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSettingsOpen(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-gemini-text-muted hover:text-gemini-text transition-colors bg-white hover:bg-gemini-surface border border-gemini-border px-3 py-1.5 rounded-lg shadow-sm cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Settings</span>
            </button>
            <button 
              onClick={() => supabase.auth.signOut()}
              className="flex items-center gap-1.5 text-xs font-semibold text-gemini-text-muted hover:text-gemini-text transition-colors bg-white hover:bg-gemini-surface border border-gemini-border px-3 py-1.5 rounded-lg shadow-sm cursor-pointer"
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
                  <span className="font-bold text-xs text-gemini-text">AI Academic OS</span>
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

      {/* Settings Modal */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col relative animate-in fade-in zoom-in duration-200">
            <header className="p-6 border-b border-slate-850 flex justify-between items-center">
              <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-400" />
                Twin Settings
              </h3>
              <button 
                onClick={() => setSettingsOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </header>
            
            <form onSubmit={handleSaveSettings} className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">Bring Your Own Key (Gemini API)</label>
                <input
                  type="password"
                  value={byokKey}
                  onChange={e => setByokKey(e.target.value)}
                  placeholder="Paste your Gemini API key here..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-indigo-500 transition-colors"
                />
                <p className="text-[10px] text-slate-500 leading-normal">
                  Your key is stored securely in your browser's local storage and used directly for requests. Leave empty to use system defaults (or Offline mode).
                </p>
              </div>

              {saveSuccess && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs py-2 px-3 rounded-lg text-center font-semibold animate-pulse">
                  Settings Saved Successfully!
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setSettingsOpen(false)}
                  className="bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 px-5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Save Configuration
                </button>
              </div>
            </form>
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
      <Route path="/" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
      <Route path="/subject/:id" element={<ProtectedRoute><AppLayout><SubjectDetail /></AppLayout></ProtectedRoute>} />
      <Route path="/session/:id" element={<ProtectedRoute><AppLayout><StudySession /></AppLayout></ProtectedRoute>} />
      
      <Route path="/twin" element={<ProtectedRoute><AppLayout><StudentTwin /></AppLayout></ProtectedRoute>} />
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
