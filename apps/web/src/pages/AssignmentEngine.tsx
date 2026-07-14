import { FileEdit, SlidersHorizontal, ArrowRight, BookOpen, Layers } from 'lucide-react';

export default function AssignmentEngine() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10 font-sans">
      <header className="mb-10">
        <h1 className="text-3xl font-normal text-gemini-text tracking-tight flex items-center gap-3">
          <FileEdit className="w-8 h-8 text-gemini-blue" />
          Assignment Engine
        </h1>
        <p className="text-gemini-text-muted mt-2">Generate structured, high-quality assignments tailored to your teacher's format.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Configuration Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-gemini-surface rounded-3xl p-8">
            <h2 className="text-xl font-medium text-gemini-text mb-8 flex items-center gap-3">
              <SlidersHorizontal className="w-6 h-6 text-gemini-text-muted" />
              Generation Parameters
            </h2>
            
            <div className="space-y-8">
              <div>
                <label className="block text-sm font-medium text-gemini-text-muted mb-3">Topic / Prompt</label>
                <textarea 
                  className="w-full bg-gemini-bg rounded-2xl px-5 py-4 text-gemini-text outline-none focus:ring-1 focus:ring-gemini-border h-32 resize-none"
                  placeholder="e.g. Write a detailed report on the evolution of Operating Systems..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gemini-text-muted mb-3">Word Limit</label>
                  <select className="w-full bg-gemini-bg rounded-2xl px-5 py-4 text-gemini-text outline-none focus:ring-1 focus:ring-gemini-border appearance-none">
                    <option>500 Words</option>
                    <option>1000 Words</option>
                    <option>2000 Words</option>
                    <option>No Limit</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gemini-text-muted mb-3">Citation Style</label>
                  <select className="w-full bg-gemini-bg rounded-2xl px-5 py-4 text-gemini-text outline-none focus:ring-1 focus:ring-gemini-border appearance-none">
                    <option>APA 7th</option>
                    <option>IEEE</option>
                    <option>MLA</option>
                    <option>Harvard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gemini-text-muted mb-3">AI Detection Shield</label>
                <div className="flex items-center gap-4 bg-gemini-bg p-5 rounded-2xl">
                  <input type="range" className="flex-1 accent-gemini-text" min="0" max="100" defaultValue="75" />
                  <span className="text-sm font-medium text-gemini-text">High Humanization</span>
                </div>
                <p className="text-xs text-gemini-text-muted mt-3 leading-relaxed">Adjusts perplexity and burstiness to mimic natural student writing styles extracted from your Digital Twin.</p>
              </div>

              <button className="w-full mt-4 bg-gemini-text hover:bg-gemini-text-muted text-gemini-bg font-medium py-4 rounded-full transition-colors flex items-center justify-center gap-2 group">
                Generate Draft
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* Preview / Outline Column */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-gemini-surface rounded-3xl p-8 min-h-[600px] flex flex-col">
            <h2 className="text-xl font-medium text-gemini-text mb-8 flex items-center gap-3">
              <Layers className="w-6 h-6 text-gemini-blue" />
              Structure & Outline
            </h2>
            
            <div className="flex-1 bg-gemini-bg rounded-3xl p-8">
              <div className="space-y-8">
                <div>
                  <h3 className="text-gemini-text font-medium flex items-center gap-3 mb-2">
                    <div className="w-6 h-6 rounded-full bg-gemini-surface text-gemini-text flex items-center justify-center text-xs">1</div>
                    Introduction
                  </h3>
                  <p className="text-sm text-gemini-text-muted pl-9">Hook, thesis statement, and background on batch processing systems.</p>
                </div>
                <div>
                  <h3 className="text-gemini-text font-medium flex items-center gap-3 mb-2">
                    <div className="w-6 h-6 rounded-full bg-gemini-surface text-gemini-text flex items-center justify-center text-xs">2</div>
                    The Era of Multiprogramming
                  </h3>
                  <p className="text-sm text-gemini-text-muted pl-9">Explanation of memory partitioning, CPU scheduling concepts introduced in the 1960s.</p>
                </div>
                <div>
                  <h3 className="text-gemini-text font-medium flex items-center gap-3 mb-2">
                    <div className="w-6 h-6 rounded-full bg-gemini-surface text-gemini-text flex items-center justify-center text-xs">3</div>
                    Time-Sharing and Modern OS
                  </h3>
                  <p className="text-sm text-gemini-text-muted pl-9">UNIX development, virtual memory, and GUI evolution (Windows/Mac).</p>
                </div>
                <div>
                  <h3 className="text-gemini-text font-medium flex items-center gap-3 mb-2">
                    <div className="w-6 h-6 rounded-full bg-gemini-surface text-gemini-text flex items-center justify-center text-xs">4</div>
                    Conclusion
                  </h3>
                  <p className="text-sm text-gemini-text-muted pl-9">Summary of evolution and future trends (distributed OS, real-time OS).</p>
                </div>
              </div>
              
              <div className="mt-12 pt-6 border-t border-gemini-border flex justify-between items-center">
                <div className="text-sm text-gemini-text-muted flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Estimated: 1200 Words
                </div>
                <button className="text-gemini-text hover:text-gemini-blue text-sm font-medium transition-colors">
                  Edit Outline
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
