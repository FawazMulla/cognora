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
        <div className="w-full max-w-md">
          {/* Logo Section */}
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 rounded-full flex items-center justify-center gemini-gradient-bg">
              <Sparkles className="text-gemini-bg w-8 h-8" />
            </div>
          </div>
          
          <div className="text-center mb-10">
            <h1 className="text-3xl font-medium text-gemini-text mb-2 tracking-tight">AI Academic OS</h1>
            <p className="text-gemini-text-muted">Sign in to your intelligent workspace.</p>
          </div>

          {/* Login Form */}
          <div className="bg-gemini-surface p-8 rounded-3xl">
            <form onSubmit={handleLogin} className="space-y-6">
              {error && (
                <div className="bg-gemini-red/10 text-gemini-red p-4 rounded-2xl text-sm text-center font-medium">
                  {error}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gemini-text-muted mb-2">Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-gemini-bg rounded-2xl px-5 py-4 text-gemini-text placeholder-gemini-text-muted focus:ring-1 focus:ring-gemini-border outline-none transition-all" 
                  placeholder="name@university.edu"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gemini-text-muted mb-2">Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-gemini-bg rounded-2xl px-5 py-4 text-gemini-text placeholder-gemini-text-muted focus:ring-1 focus:ring-gemini-border outline-none transition-all" 
                  placeholder="••••••••"
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-gemini-text hover:bg-gemini-text-muted text-gemini-bg font-medium py-4 rounded-full transition-colors flex justify-center items-center gap-2 group mt-4"
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
      <div className="hidden lg:flex flex-1 bg-gemini-surface relative overflow-hidden items-center justify-center p-12">
        <div className="relative max-w-lg z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gemini-bg text-gemini-text text-sm font-medium border border-gemini-border mb-6">
            <Sparkles className="w-4 h-4 text-gemini-purple" />
            The Academic Operating System
          </div>
          <h2 className="text-4xl font-normal text-gemini-text mb-6 leading-tight">Master your subjects with a unified intelligence.</h2>
          <p className="text-lg text-gemini-text-muted leading-relaxed">Your entire academic journey powered by a dedicated Digital Twin, automatically predicting PYQs, generating practicals, and conducting live vivas.</p>
        </div>
      </div>
    </div>
  );
}
