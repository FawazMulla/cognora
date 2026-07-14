import { Mic, Activity, User, Play, Square, Volume2 } from 'lucide-react';
import { useState } from 'react';

export default function VivaEngine() {
  const [active, setActive] = useState(false);
  
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10 font-sans h-[calc(100vh-140px)] flex flex-col">
      <header className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-normal text-gemini-text tracking-tight flex items-center gap-3">
            <Mic className="w-8 h-8 text-gemini-purple" />
            Viva Engine
          </h1>
          <p className="text-gemini-text-muted mt-2">Real-time voice conversation practice with adaptive questioning and confidence analysis.</p>
        </div>
        <div className="flex gap-3">
          <select className="bg-gemini-surface rounded-full px-6 py-2.5 text-gemini-text outline-none text-sm font-medium appearance-none">
            <option>Database Management Systems</option>
            <option>Operating Systems</option>
            <option>Artificial Intelligence</option>
          </select>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
        
        {/* Interaction Panel */}
        <div className="lg:col-span-2 bg-gemini-surface rounded-3xl flex flex-col relative overflow-hidden">
          
          <div className="flex-1 p-8 flex flex-col items-center justify-center relative z-10">
            {active ? (
              <div className="text-center space-y-10">
                <div className="relative">
                  <div className="w-32 h-32 bg-gemini-bg rounded-full mx-auto flex items-center justify-center relative z-10">
                    <User className="w-12 h-12 text-gemini-text-muted" />
                  </div>
                  {/* Audio waves */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 border-2 border-gemini-blue/30 rounded-full animate-ping" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-gemini-purple/20 rounded-full animate-ping [animation-delay:0.2s]" />
                </div>
                <div>
                  <h3 className="text-xl font-medium text-gemini-text mb-2">Listening...</h3>
                  <p className="text-gemini-text-muted font-medium text-lg">"Explain ACID properties in DBMS."</p>
                </div>
                
                <div className="flex justify-center gap-4 pt-4">
                  <button 
                    onClick={() => setActive(false)}
                    className="w-16 h-16 bg-gemini-red hover:opacity-90 text-white rounded-full flex items-center justify-center transition-opacity"
                  >
                    <Square className="w-6 h-6 fill-current" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-8">
                <div className="w-24 h-24 bg-gemini-bg rounded-full mx-auto flex items-center justify-center">
                  <Mic className="w-10 h-10 text-gemini-text-muted" />
                </div>
                <div>
                  <h3 className="text-2xl font-medium text-gemini-text mb-4">Ready to start?</h3>
                  <p className="text-gemini-text-muted max-w-sm mx-auto leading-relaxed">
                    The AI will act as your examiner, asking questions based on past viva trends and evaluating your answers in real-time.
                  </p>
                </div>
                <button 
                  onClick={() => setActive(true)}
                  className="bg-gemini-text hover:bg-gemini-text-muted text-gemini-bg px-10 py-4 rounded-full font-medium transition-colors flex items-center gap-3 mx-auto"
                >
                  <Play className="w-5 h-5 fill-current" />
                  Start Viva Session
                </button>
              </div>
            )}
          </div>
          
          <div className="p-6 border-t border-gemini-border flex items-center justify-between z-10">
            <div className="flex items-center gap-3 text-sm text-gemini-text-muted">
              <Volume2 className="w-5 h-5" />
              Voice Mode: Examiner 1 (Strict)
            </div>
            <div className="text-sm font-medium text-gemini-text">
              Session Time: 00:00
            </div>
          </div>
        </div>

        {/* Analytics Panel */}
        <div className="bg-gemini-surface rounded-3xl p-8 overflow-y-auto">
          <h2 className="text-xl font-medium text-gemini-text mb-8 flex items-center gap-3">
            <Activity className="w-6 h-6 text-gemini-blue" />
            Live Analytics
          </h2>
          
          <div className="space-y-10">
            <div>
              <div className="flex justify-between text-sm mb-3">
                <span className="text-gemini-text-muted">Confidence Score</span>
                <span className="text-gemini-text font-medium">85%</span>
              </div>
              <div className="h-1 bg-gemini-bg rounded-full overflow-hidden">
                <div className="h-full bg-gemini-purple rounded-full w-[85%]" />
              </div>
              <p className="text-xs text-gemini-text-muted mt-3">Vocal pitch and pace are optimal.</p>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-3">
                <span className="text-gemini-text-muted">Technical Accuracy</span>
                <span className="text-gemini-text font-medium">92%</span>
              </div>
              <div className="h-1 bg-gemini-bg rounded-full overflow-hidden">
                <div className="h-full bg-gemini-blue rounded-full w-[92%]" />
              </div>
              <p className="text-xs text-gemini-text-muted mt-3">Correctly identified Atomicity and Consistency.</p>
            </div>
            
            <div className="p-6 bg-gemini-bg rounded-2xl">
              <h3 className="text-sm font-medium text-gemini-text mb-4">AI Examiner Notes</h3>
              <ul className="text-sm text-gemini-text-muted space-y-3 list-disc pl-4 leading-relaxed">
                <li>Student explained ACID well but fumbled slightly on Isolation.</li>
                <li>Adaptive questioning will now focus on Database Concurrency.</li>
              </ul>
            </div>
            
            <div className="pt-6 border-t border-gemini-border">
              <h3 className="text-sm font-medium text-gemini-text mb-4">Upcoming Questions Queue</h3>
              <div className="space-y-3">
                <div className="p-4 bg-gemini-bg rounded-2xl text-sm text-gemini-text-muted leading-relaxed">
                  "Can you explain the difference between a shared lock and an exclusive lock?"
                </div>
                <div className="p-4 bg-gemini-bg rounded-2xl text-sm text-gemini-text-muted leading-relaxed opacity-50">
                  "What is a deadlock and how is it prevented?"
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
