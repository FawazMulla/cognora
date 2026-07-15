import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useAuth, supabase } from '../context/AuthContext';

export default function Login() {
  const { session } = useAuth();
  const [email, setEmail] = useState('demo@aisemos.com');
  const [password, setPassword] = useState('DemoPass123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (session) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gemini-bg flex font-sans">
      <div className="flex-1 flex flex-col justify-center items-center p-8 z-10">
        <div className="w-full max-w-sm">
          {/* Logo Section */}
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 rounded bg-white flex items-center justify-center border border-gemini-border">
              <Sparkles className="text-black w-6 h-6" />
            </div>
          </div>
          
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gemini-text mb-1 tracking-tight">AI Academic OS</h1>
            <p className="text-xs text-gemini-text-muted">Sign in to your intelligent workspace.</p>
          </div>

          {/* Login Form */}
          <div className="bg-gemini-surface/30 border border-gemini-border p-6 rounded-lg">
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="bg-gemini-red/10 border border-gemini-red/20 text-gemini-red p-3 rounded-lg text-xs text-center font-semibold">
                  {error}
                </div>
              )}
              
              <div>
                <label className="block text-xs font-bold text-gemini-text-muted uppercase tracking-wider mb-2">Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-gemini-bg border border-gemini-border rounded-lg px-4 py-2.5 text-xs text-gemini-text placeholder-gemini-text-muted focus:border-white outline-none transition-all" 
                  placeholder="name@university.edu"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gemini-text-muted uppercase tracking-wider mb-2">Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-gemini-bg border border-gemini-border rounded-lg px-4 py-2.5 text-xs text-gemini-text placeholder-gemini-text-muted focus:border-white outline-none transition-all" 
                  placeholder="••••••••"
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-white hover:bg-zinc-200 text-black font-semibold py-2.5 rounded-lg transition-colors flex justify-center items-center gap-1.5 group mt-6 text-xs uppercase tracking-wider cursor-pointer"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-gemini-bg border-t-transparent rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
      
      {/* Decorative Side Panel */}
      <div className="hidden lg:flex flex-1 bg-gemini-surface relative overflow-hidden items-center justify-center p-12 border-l border-gemini-border">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293710_1px,transparent_1px),linear-gradient(to_bottom,#1f293710_1px,transparent_1px)] bg-[size:4rem_4rem]" />
        
        <div className="relative max-w-md z-10 space-y-6">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gemini-bg text-gemini-text text-[10px] font-bold tracking-wider uppercase border border-gemini-border">
            <Sparkles className="w-3.5 h-3.5 text-white" />
            The Academic Operating System
          </div>
          <h2 className="text-3xl font-extrabold text-white leading-tight tracking-tight">Master your subjects with a unified intelligence.</h2>
          <p className="text-sm text-gemini-text-muted leading-relaxed">Your entire academic journey powered by a dedicated Digital Twin, automatically predicting PYQs, generating practicals, and conducting live vivas.</p>
        </div>
      </div>
    </div>
  );
}
