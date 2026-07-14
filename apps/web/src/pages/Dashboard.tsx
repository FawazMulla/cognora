import { Link } from 'react-router-dom';
import { BookOpen, Activity, Search, Flame, Target, Clock, Sparkles } from 'lucide-react';

export default function Dashboard() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10 font-sans">
      
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gemini-surface text-gemini-text-muted text-xs font-medium mb-4 border border-gemini-border">
            <Flame className="w-3 h-3 text-gemini-red" />
            14 Day Academic Streak
          </div>
          <h2 className="text-3xl font-normal text-gemini-text tracking-tight">Welcome back</h2>
          <p className="text-gemini-text-muted mt-1">Semester VII Overview • Computer Science</p>
        </div>
        <div className="relative">
          <Search className="w-5 h-5 text-gemini-text-muted absolute left-4 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Ask Gemini to search notes, PYQs..." 
            className="w-full md:w-96 bg-gemini-surface rounded-full pl-12 pr-4 py-3.5 text-sm text-gemini-text placeholder-gemini-text-muted outline-none focus:ring-1 focus:ring-gemini-blue transition-all"
          />
        </div>
      </header>

      {/* Global Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Overall Confidence', val: '82%', icon: Target, color: 'text-gemini-blue' },
          { label: 'Exam Prediction', val: 'A Grade', icon: Activity, color: 'text-gemini-purple' },
          { label: 'Study Time (Week)', val: '18h 45m', icon: Clock, color: 'text-gemini-red' },
          { label: 'Assignments Due', val: '2', icon: BookOpen, color: 'text-gemini-text-muted' }
        ].map((stat, i) => (
          <div key={i} className="bg-gemini-surface p-6 rounded-3xl group transition-colors">
            <div className="w-12 h-12 rounded-full bg-gemini-bg flex items-center justify-center mb-6">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div className="text-4xl font-normal text-gemini-text mb-2">{stat.val}</div>
            <div className="text-sm font-medium text-gemini-text-muted">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Subjects */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-end">
            <h3 className="text-xl font-medium text-gemini-text">Active Subjects</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { id: '1', name: 'Artificial Intelligence', code: 'CS701', progress: 65, status: 'On Track', color: 'bg-gemini-blue' },
              { id: '2', name: 'Data Mining', code: 'CS702', progress: 40, status: 'Needs Attention', color: 'bg-gemini-red' },
              { id: '3', name: 'Cryptography', code: 'CS703', progress: 85, status: 'Excellent', color: 'bg-gemini-purple' },
            ].map(subj => (
              <Link to={`/subject/${subj.id}`} key={subj.id} className="bg-gemini-surface p-6 rounded-3xl hover:bg-gemini-surface-hover transition-colors group">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="text-xs font-medium text-gemini-text-muted mb-1">{subj.code}</div>
                    <h4 className="font-medium text-lg text-gemini-text group-hover:text-gemini-blue transition-colors">{subj.name}</h4>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-gemini-text-muted">Syllabus Progress</span>
                    <span className="font-medium text-gemini-text">{subj.progress}%</span>
                  </div>
                  <div className="h-1 bg-gemini-bg rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${subj.color}`} style={{ width: `${subj.progress}%` }} />
                  </div>
                  <div className="mt-4 text-xs font-medium text-gemini-text-muted">
                    {subj.status}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Smart Revision Plan */}
        <div className="space-y-6">
          <h3 className="text-xl font-medium text-gemini-text flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-gemini-blue" />
            Smart Revision
          </h3>
          
          <div className="bg-gemini-surface rounded-3xl p-6">
            <div className="mb-6">
              <h4 className="font-medium text-gemini-text">Today's Focus</h4>
              <p className="text-sm text-gemini-text-muted mt-1">Curated from your Digital Twin behavior.</p>
            </div>

            <div className="space-y-2">
              {[
                { title: 'A* Algorithm Practice', type: 'Weak Topic', time: '45 mins' },
                { title: 'Data Mining PYQs', type: 'High Priority', time: '30 mins' },
                { title: 'Cryptography Flashcards', type: 'Spaced Repetition', time: '15 mins' }
              ].map((task, i) => (
                <div key={i} className="bg-gemini-bg p-4 rounded-2xl flex justify-between items-center cursor-pointer hover:bg-gemini-surface-hover transition-colors">
                  <div>
                    <h5 className="text-sm font-medium text-gemini-text">{task.title}</h5>
                    <p className="text-xs text-gemini-text-muted mt-1">{task.type}</p>
                  </div>
                  <div className="text-xs font-medium text-gemini-text-muted">
                    {task.time}
                  </div>
                </div>
              ))}
            </div>

            <button className="w-full mt-6 bg-gemini-text text-gemini-bg font-medium py-3 rounded-full hover:opacity-90 transition-opacity">
              Start Session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
