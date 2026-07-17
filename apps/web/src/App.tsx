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
  const [byokCohereKey, setByokCohereKey] = useState(localStorage.getItem('byok_cohere_key') || '');
  const [byokProvider, setByokProvider] = useState(localStorage.getItem('byok_provider') || 'gemini');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Save Gemini key
    if (byokKey.trim()) {
      localStorage.setItem('byok_gemini_key', byokKey.trim());
    } else {
      localStorage.removeItem('byok_gemini_key');
    }

    // Save Cohere key
    if (byokCohereKey.trim()) {
      localStorage.setItem('byok_cohere_key', byokCohereKey.trim());
    } else {
      localStorage.removeItem('byok_cohere_key');
    }

    // Save Provider
    localStorage.setItem('byok_provider', byokProvider);

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setSettingsOpen(false);
    }, 1500);
  };

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
              <span>Settings</span>
            </button>
            <button 
              onClick={() => supabase.auth.signOut()}
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

      {/* Settings Modal */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white border border-[#d9d9dd] w-full max-w-md rounded-2xl overflow-hidden flex flex-col relative animate-in fade-in zoom-in duration-200">
            <header className="p-6 border-b border-[#d9d9dd] flex justify-between items-center bg-white">
              <h3 className="text-sm font-bold text-black uppercase tracking-wider flex items-center gap-2 font-display">
                <Settings className="w-4 h-4 text-black" />
                Twin Settings
              </h3>
              <button 
                onClick={() => setSettingsOpen(false)}
                className="text-[#75758a] hover:text-black p-1.5 rounded-full hover:bg-[#eeece7] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </header>
            
            <form onSubmit={handleSaveSettings} className="p-6 space-y-5 bg-white">
              <div className="space-y-2">
                <label className="block text-[11px] font-mono text-[#75758a] uppercase tracking-wide">Preferred AI Provider</label>
                <select
                  value={byokProvider}
                  onChange={e => setByokProvider(e.target.value)}
                  className="w-full bg-white border border-[#d9d9dd] rounded px-4 py-2.5 text-xs text-[#212121] outline-none focus:border-[#9b60aa] cursor-pointer"
                >
                  <option value="gemini">Google Gemini (2.5 Flash)</option>
                  <option value="cohere">Cohere AI (Command R+)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-[11px] font-mono text-[#75758a] uppercase tracking-wide">Gemini API Key (BYOK)</label>
                <input
                  type="password"
                  value={byokKey}
                  onChange={e => setByokKey(e.target.value)}
                  placeholder="Paste your Gemini API key here..."
                  className="w-full bg-white border border-[#d9d9dd] rounded px-4 py-2.5 text-xs text-[#212121] placeholder-[#93939f] outline-none focus:border-[#9b60aa] transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[11px] font-mono text-[#75758a] uppercase tracking-wide">Cohere API Key (BYOK)</label>
                <input
                  type="password"
                  value={byokCohereKey}
                  onChange={e => setByokCohereKey(e.target.value)}
                  placeholder="Paste your Cohere API key here..."
                  className="w-full bg-white border border-[#d9d9dd] rounded px-4 py-2.5 text-xs text-[#212121] placeholder-[#93939f] outline-none focus:border-[#9b60aa] transition-colors"
                />
              </div>

              <p className="text-[10px] text-[#75758a] leading-normal font-sans">
                Your keys are stored locally in your browser's memory and used directly for requests. Leave empty to use system defaults (or Offline mode).
              </p>

              {saveSuccess && (
                <div className="bg-[#edfce9] border border-[#003c33]/30 text-[#003c33] text-[10px] font-mono py-2 px-3 rounded text-center animate-pulse">
                  Settings Saved Successfully!
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setSettingsOpen(false)}
                  className="bg-transparent hover:bg-[#eeece7] border border-[#d9d9dd] text-[#212121] px-5 py-2.5 rounded-full text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-black hover:bg-zinc-800 text-white px-6 py-2.5 rounded-full text-xs font-semibold transition-all cursor-pointer"
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
