import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useAuth, supabase } from '../context/AuthContext';

export default function Login() {
  const { session, loginAsDemo } = useAuth();
  const [email, setEmail] = useState('demo@aisemos.com');
  const [password, setPassword] = useState('DemoPass123!');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (session) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    if (isSignUp) {
      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Registration failed');
        }
        
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      } catch (err: any) {
        setError(err.message || 'An error occurred during registration.');
        setLoading(false);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#eeece7] flex font-sans">
      <div className="flex-1 flex flex-col justify-center items-center p-8 z-10">
        <div className="w-full max-w-sm bg-white border border-[#d9d9dd] p-8 rounded-lg shadow-none">
          {/* Logo Section */}
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 rounded bg-black flex items-center justify-center">
              <Sparkles className="text-white w-6 h-6" />
            </div>
          </div>
          
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-black font-display uppercase tracking-tight">ArchAdemia</h1>
            <p className="text-xs text-[#75758a] font-mono uppercase tracking-wider mt-1.5">
              {isSignUp ? 'Create your academic account' : 'Sign in to your intelligent workspace'}
            </p>
          </div>

          {/* Login Form */}
          <div className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-[#b30000]/10 border border-[#b30000]/20 text-[#b30000] p-3 rounded text-xs text-center font-semibold">
                  {error}
                </div>
              )}
              
              <div>
                <label className="block text-[10px] font-mono font-bold text-[#75758a] uppercase tracking-wider mb-2">Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-white border border-[#d9d9dd] rounded px-4 py-2.5 text-xs text-black placeholder-[#93939f] focus:border-[#9b60aa] outline-none transition-all" 
                  placeholder="name@university.edu"
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-mono font-bold text-[#75758a] uppercase tracking-wider mb-2">Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-white border border-[#d9d9dd] rounded px-4 py-2.5 text-xs text-black placeholder-[#93939f] focus:border-[#9b60aa] outline-none transition-all" 
                  placeholder="••••••••"
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-black hover:bg-zinc-800 text-white font-semibold py-2.5 rounded-full transition-colors flex justify-center items-center gap-1.5 group mt-6 text-xs uppercase tracking-wider cursor-pointer"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {isSignUp ? 'Creating account...' : 'Signing in...'}
                  </span>
                ) : (
                  <>
                    {isSignUp ? 'Register' : 'Sign In'}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="text-center mt-3">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError('');
                  if (!isSignUp) {
                    setEmail('');
                    setPassword('');
                  } else {
                    setEmail('demo@aisemos.com');
                    setPassword('DemoPass123!');
                  }
                }}
                className="text-xs text-[#1863dc] hover:underline bg-transparent border-none cursor-pointer p-0 uppercase font-mono tracking-wider"
              >
                {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Create one"}
              </button>
            </div>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#d9d9dd]" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-mono">
                <span className="bg-white px-2 text-[#75758a]">Or</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => loginAsDemo()}
              className="w-full bg-[#eeece7] hover:bg-[#e2e0d8] border border-[#d9d9dd] text-[#212121] font-semibold py-2.5 rounded-full transition-colors flex justify-center items-center gap-2 text-xs uppercase font-mono tracking-wider cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#ff7759]" />
              <span>Explore as Demo Student</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Decorative Side Panel */}
      <div className="hidden lg:flex flex-1 bg-[#eeece7] relative overflow-hidden items-center justify-center p-12 border-l border-[#d9d9dd]">
        <div className="relative max-w-md z-10 space-y-6 text-black">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-white text-[#ff7759] text-[10px] font-mono font-bold tracking-wider uppercase border border-[#d9d9dd]">
            <Sparkles className="w-3.5 h-3.5 text-[#ff7759]" />
            The Academic Operating System
          </div>
          <h2 className="text-4xl font-display font-light text-black leading-tight tracking-tight uppercase">Master your subjects with a unified intelligence.</h2>
          <p className="text-sm text-[#5f6368] leading-relaxed font-sans">Your entire academic journey powered by a dedicated Digital Twin, automatically predicting PYQs, generating practicals, and conducting live vivas.</p>
        </div>
      </div>
    </div>
  );
}
