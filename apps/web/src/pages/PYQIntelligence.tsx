import { BookOpen, FileText, TrendingUp, Filter, AlertTriangle } from 'lucide-react';

export default function PYQIntelligence() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10 font-sans">
      <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-normal text-gemini-text tracking-tight flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-gemini-blue" />
            PYQ Intelligence
          </h1>
          <p className="text-gemini-text-muted mt-2">AI-driven analysis of previous year university papers.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-gemini-surface hover:bg-gemini-surface-hover text-gemini-text px-6 py-2.5 rounded-full text-sm font-medium transition-colors flex items-center gap-2 border border-gemini-border">
            <Filter className="w-4 h-4" />
            Filter Subject
          </button>
          <button className="gemini-gradient-bg text-gemini-bg px-6 py-2.5 rounded-full text-sm font-medium transition-opacity hover:opacity-90">
            Upload New Paper
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Papers Analyzed', value: '24', suffix: ' across 3 subjects' },
          { label: 'Questions Extracted', value: '842', suffix: ' unique questions' },
          { label: 'High Probability Topics', value: '18', suffix: ' for upcoming exams' },
          { label: 'Confidence Score', value: '92%', suffix: ' based on historical trends' }
        ].map((stat, i) => (
          <div key={i} className="bg-gemini-surface p-6 rounded-3xl">
            <div className="text-sm font-medium text-gemini-text-muted mb-4">{stat.label}</div>
            <div className="text-4xl font-normal text-gemini-text mb-1">{stat.value}</div>
            <div className="text-xs text-gemini-text-muted">{stat.suffix}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gemini-surface rounded-3xl p-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-medium text-gemini-text flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-gemini-blue" />
                Predicted Important Questions
              </h2>
              <span className="text-xs bg-gemini-bg text-gemini-text-muted px-4 py-2 rounded-full font-medium">
                Algorithm: Subject-specific Frequency
              </span>
            </div>
            
            <div className="space-y-4">
              {[
                { q: 'Explain the working of A* algorithm with a suitable example.', weight: '95%', marks: '10', repeated: '5 times (2019-2023)' },
                { q: 'Differentiate between BFS and DFS. When is one preferred over the other?', weight: '88%', marks: '5', repeated: '4 times' },
                { q: 'Write short notes on Alpha-Beta Pruning.', weight: '82%', marks: '5', repeated: '3 times' },
                { q: 'Describe the architecture of an Expert System.', weight: '75%', marks: '10', repeated: '3 times' }
              ].map((item, i) => (
                <div key={i} className="p-6 bg-gemini-bg rounded-3xl">
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <p className="text-gemini-text font-medium leading-relaxed">{item.q}</p>
                    <div className="bg-gemini-surface text-gemini-blue px-3 py-1.5 rounded-full text-xs font-bold shrink-0">
                      {item.weight}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gemini-text-muted">
                    <span className="flex items-center gap-1.5"><FileText className="w-4 h-4" /> {item.marks} Marks</span>
                    <span className="flex items-center gap-1.5 text-gemini-red"><AlertTriangle className="w-4 h-4" /> Repeated {item.repeated}</span>
                    <button className="ml-auto text-gemini-text hover:text-gemini-blue font-medium transition-colors">Generate AI Answer</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gemini-surface rounded-3xl p-8">
            <h3 className="text-lg font-medium text-gemini-text mb-2">Topic Heatmap</h3>
            <p className="text-sm text-gemini-text-muted mb-8">AI analysis of syllabus coverage in past papers.</p>
            
            <div className="space-y-6">
              {[
                { name: 'Search Algorithms', val: '40%' },
                { name: 'Knowledge Representation', val: '25%' },
                { name: 'Fuzzy Logic', val: '20%' },
                { name: 'Expert Systems', val: '15%' }
              ].map((topic, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-3">
                    <span className="text-gemini-text">{topic.name}</span>
                    <span className="text-gemini-purple font-medium">{topic.val}</span>
                  </div>
                  <div className="h-1 bg-gemini-bg rounded-full overflow-hidden">
                    <div className="h-full bg-gemini-purple rounded-full" style={{ width: topic.val }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
