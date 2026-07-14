import React, { useState } from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { Sparkles, LogOut, Menu, X } from 'lucide-react';
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

  return (
    <div className="min-h-screen bg-gemini-bg text-gemini-text font-sans selection:bg-gemini-blue/30 flex flex-col">
      {/* Top Navbar */}
      <nav className="bg-gemini-bg px-5 py-4 flex justify-between items-center sticky top-0 z-50 border-b border-gemini-border/30">
        <div className="flex items-center gap-3">
          {/* Mobile hamburger */}
          <button
            className="lg:hidden p-2 rounded-full hover:bg-gemini-surface text-gemini-text-muted transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link to="/" className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-gemini-blue" />
            <h1 className="text-lg font-medium tracking-tight">AI Academic OS</h1>
          </Link>
        </div>
        <button 
          onClick={() => supabase.auth.signOut()}
          className="flex items-center gap-2 text-sm font-medium text-gemini-text-muted hover:text-gemini-text transition-colors bg-gemini-surface hover:bg-gemini-surface-hover px-4 py-2 rounded-full"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </nav>
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 bg-gemini-surface shadow-2xl z-10">
            <div className="flex justify-between items-center px-6 py-5 border-b border-gemini-border/30">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-gemini-blue" />
                <span className="font-medium text-gemini-text">AI Academic OS</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-full hover:bg-gemini-bg text-gemini-text-muted">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div onClick={() => setSidebarOpen(false)}>
              <Sidebar />
            </div>
          </div>
        </div>
      )}

      {/* Main Layout with Sidebar */}
      <div className="flex flex-1">
        {/* Desktop sidebar */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>
        <div className="flex-1 max-h-[calc(100vh-57px)] overflow-y-auto">
          {children}
        </div>
      </div>
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
    </Routes>
  );
}

export default App;
