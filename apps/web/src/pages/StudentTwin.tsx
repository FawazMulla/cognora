import { Activity, Target, Zap, Flame, UserCircle } from 'lucide-react';

export default function StudentTwin() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10 font-sans">
      <header className="mb-10">
        <h1 className="text-3xl font-normal text-gemini-text tracking-tight flex items-center gap-3">
          <UserCircle className="w-8 h-8 text-gemini-purple" />
          Student Digital Twin
        </h1>
        <p className="text-gemini-text-muted mt-2">Your continuously evolving academic profile and learning behaviors.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core Attributes */}
        <div className="bg-gemini-surface p-8 rounded-3xl lg:col-span-2">
          <h2 className="text-xl font-medium text-gemini-text mb-8">
            Cognitive Profile
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Learning Speed', value: '1.2x', icon: Zap },
              { label: 'Knowledge Score', value: '840', icon: Activity },
              { label: 'Exam Readiness', value: '78%', icon: Target },
              { label: 'Study Streak', value: '14 Days', icon: Flame }
            ].map((stat, i) => (
              <div key={i} className="bg-gemini-bg p-6 rounded-3xl">
                <stat.icon className="w-5 h-5 text-gemini-text-muted mb-4" />
                <div className="text-2xl font-normal text-gemini-text">{stat.value}</div>
                <div className="text-sm text-gemini-text-muted font-medium mt-1">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="mt-10">
            <h3 className="text-sm font-medium text-gemini-text-muted mb-4">Knowledge Graph</h3>
            <div className="h-64 bg-gemini-bg rounded-3xl flex items-center justify-center">
              <div className="text-gemini-text-muted text-sm flex flex-col items-center">
                <Activity className="w-6 h-6 mb-3 opacity-50" />
                Graph visualization rendering engine loading...
              </div>
            </div>
          </div>
        </div>

        {/* Behavioral Analytics */}
        <div className="space-y-6">
          <div className="bg-gemini-surface p-8 rounded-3xl">
            <h3 className="text-lg font-medium text-gemini-text mb-8">Learning Behaviors</h3>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-3">
                  <span className="text-gemini-text-muted">Visual Learning Preference</span>
                  <span className="text-gemini-text">85%</span>
                </div>
                <div className="h-1 bg-gemini-bg rounded-full overflow-hidden">
                  <div className="h-full bg-gemini-blue rounded-full w-[85%]" />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-3">
                  <span className="text-gemini-text-muted">Peak Focus Hours</span>
                  <span className="text-gemini-text">10PM - 2AM</span>
                </div>
                <div className="h-1 bg-gemini-bg rounded-full overflow-hidden">
                  <div className="h-full bg-gemini-purple rounded-full w-[60%]" />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-3">
                  <span className="text-gemini-text-muted">Forgetting Curve Rate</span>
                  <span className="text-gemini-text">Slower</span>
                </div>
                <div className="h-1 bg-gemini-bg rounded-full overflow-hidden">
                  <div className="h-full bg-gemini-red rounded-full w-[40%]" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gemini-surface p-8 rounded-3xl">
            <h3 className="text-sm font-medium text-gemini-text-muted mb-4">WEAK TOPICS</h3>
            <div className="space-y-2">
              {['Database Normalization', 'Dynamic Programming', 'Fourier Transforms'].map((topic, i) => (
                <div key={i} className="flex items-center gap-3 bg-gemini-bg p-4 rounded-2xl">
                  <div className="w-1.5 h-1.5 rounded-full bg-gemini-red" />
                  <span className="text-sm font-medium text-gemini-text">{topic}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
