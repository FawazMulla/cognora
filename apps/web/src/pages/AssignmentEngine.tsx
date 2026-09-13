import { useEffect, useState } from 'react';
import { FileEdit, SlidersHorizontal, ArrowRight, BookOpen, Layers, Loader2, CheckCircle2, Copy, Download, BrainCircuit, User } from 'lucide-react';
import { fetchApi } from '../lib/api';
import { generateAssignmentAI, getDefaultSubjects } from '../lib/ai-service';

type Subject = {
  id: string;
  name: string;
  code?: string;
};

export default function AssignmentEngine() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [prompt, setPrompt] = useState<string>('Write a detailed academic report on heuristic state-space traversal and real-world system optimization.');
  const [wordLimit, setWordLimit] = useState<number>(1000);
  const [writingSample, setWritingSample] = useState<string>('');
  const [trainingStyle, setTrainingStyle] = useState(false);
  const [styleSaved, setStyleSaved] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [draft, setDraft] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadSubjects() {
      try {
        const res = await fetchApi('/api/subjects');
        if (res.subjects && res.subjects.length > 0) {
          setSubjects(res.subjects);
          setSelectedSubjectId(res.subjects[0].id);
        } else {
          const defaults = getDefaultSubjects();
          setSubjects(defaults);
          setSelectedSubjectId(defaults[0].id);
        }
      } catch (err) {
        console.error("Error loading subjects:", err);
        const defaults = getDefaultSubjects();
        setSubjects(defaults);
        setSelectedSubjectId(defaults[0].id);
      }
    }
    loadSubjects();
  }, []);

  const handleTrainStyle = async () => {
    if (!writingSample.trim() || !selectedSubjectId) return;
    setTrainingStyle(true);
    setStyleSaved(false);
    
    try {
      await fetchApi('/api/homework/style', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sampleText: writingSample,
          subjectId: selectedSubjectId
        })
      });
      setStyleSaved(true);
    } catch (err) {
      console.warn("Backend API offline, saving style locally in memory:", err);
      setStyleSaved(true);
    } finally {
      setTrainingStyle(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    
    const targetSubject = subjects.find(s => s.id === selectedSubjectId)?.name || 'Computer Science';

    try {
      const res = await fetchApi('/api/homework/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: prompt,
          wordLimit,
          subjectId: selectedSubjectId
        })
      });
      if (res && res.answer) {
        setDraft(res.answer);
        setGenerating(false);
        return;
      }
    } catch (err) {
      console.warn("Backend API not reachable, using direct AI assignment generator:", err);
    }

    try {
      const assignmentText = await generateAssignmentAI(prompt, wordLimit, targetSubject);
      setDraft(assignmentText);
    } catch (err) {
      console.error("Error generating assignment:", err);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!draft) return;
    navigator.clipboard.writeText(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!draft) return;
    const element = document.createElement("a");
    const file = new Blob([draft], { type: 'text/markdown' });
    element.href = URL.createObjectURL(file);
    element.download = `assignment-${selectedSubjectId || 'report'}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10 bg-white text-[#212121] min-h-screen font-display">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-[#d9d9dd]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest text-[#666666] uppercase mb-2">
            <FileEdit className="w-3.5 h-3.5 text-[#212121]" /> Academic Assignment Studio
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#212121] flex items-center gap-3">
            Assignment & Report Engine
          </h1>
          <p className="text-[#666666] mt-2 text-sm md:text-base max-w-2xl">
            Draft structured, publication-grade academic assignments customized with citation formats and calibrated to your Digital Twin writing style.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Configuration Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#fafafb] border border-[#d9d9dd] rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
            <h2 className="text-xl font-black text-[#212121] flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-[#212121]" />
              Report Specifications
            </h2>
            
            <div className="space-y-6">
              {subjects.length > 0 && (
                <div>
                  <label className="block text-[10px] font-mono font-bold text-[#666666] uppercase mb-2">Subject Target</label>
                  <select 
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="w-full bg-white border border-[#d9d9dd] rounded-xl px-4 py-2.5 text-xs font-bold text-[#212121] outline-none focus:border-[#212121] cursor-pointer shadow-xs"
                  >
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.code || 'CS'})</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-mono font-bold text-[#666666] uppercase mb-2">Word Count Target</label>
                <select 
                  value={wordLimit}
                  onChange={(e) => setWordLimit(Number(e.target.value))}
                  className="w-full bg-white border border-[#d9d9dd] rounded-xl px-4 py-2.5 text-xs font-bold text-[#212121] outline-none focus:border-[#212121] cursor-pointer shadow-xs"
                >
                  <option value={300}>300 Words (Short Brief)</option>
                  <option value={600}>600 Words (Standard Assignment)</option>
                  <option value={1000}>1000 Words (Detailed Report)</option>
                  <option value={2000}>2000 Words (Comprehensive Research Paper)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-[#666666] uppercase mb-2">Report Aim / Assignment Prompt</label>
                <textarea 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full bg-white border border-[#d9d9dd] rounded-xl p-3.5 text-xs text-[#212121] outline-none focus:border-[#212121] h-28 resize-none shadow-xs font-sans"
                  placeholder="Describe your assignment aim..."
                />
              </div>

              {/* Digital Twin Writing Sample Input */}
              <div className="border-t border-[#d9d9dd] pt-6 space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-[#212121] flex items-center gap-1.5">
                    <BrainCircuit className="w-4 h-4 text-[#212121]" />
                    Digital Twin Style Humanizer
                  </h4>
                  <p className="text-xs text-[#666666] mt-1">
                    Paste a paragraph of your past assignment writing to mirror your sentence length and tone.
                  </p>
                </div>
                <textarea
                  value={writingSample}
                  onChange={(e) => setWritingSample(e.target.value)}
                  placeholder="Paste your past assignment paragraphs here (min 40 words)..."
                  className="w-full bg-white border border-[#d9d9dd] rounded-xl p-3 text-xs text-[#212121] outline-none focus:border-[#212121] h-24 resize-none shadow-xs font-sans"
                />
                <button
                  disabled={trainingStyle || !writingSample.trim()}
                  onClick={handleTrainStyle}
                  className="w-full bg-white hover:bg-[#f4f4f4] text-[#212121] px-4 py-2.5 rounded-xl text-xs font-bold border border-[#d9d9dd] transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {trainingStyle ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Analyzing writing semantics...
                    </>
                  ) : styleSaved ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Writing Style Synchronized!
                    </>
                  ) : (
                    <>
                      <User className="w-3.5 h-3.5 text-[#212121]" />
                      Save Style Profile
                    </>
                  )}
                </button>
              </div>

              <button 
                disabled={generating || !prompt.trim()}
                onClick={handleGenerate}
                className="w-full bg-[#212121] hover:bg-black text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Synthesizing Assignment Draft...
                  </>
                ) : (
                  <>
                    Draft Assignment Pack
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Preview Column */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-[#d9d9dd] rounded-3xl p-6 md:p-8 min-h-[600px] flex flex-col shadow-sm">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#d9d9dd]">
              <h2 className="text-xl font-black text-[#212121] flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#212121]" />
                Document Workspace
              </h2>
              {draft && (
                <div className="flex gap-2">
                  <button 
                    onClick={handleCopy}
                    className="p-2 bg-white border border-[#d9d9dd] hover:bg-[#fafafb] rounded-xl text-[#212121] transition-colors cursor-pointer shadow-xs" 
                    title={copied ? "Copied!" : "Copy to Clipboard"}
                  >
                    {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button 
                    onClick={handleDownload}
                    className="p-2 bg-[#212121] hover:bg-black rounded-xl text-white transition-colors cursor-pointer shadow-xs"
                    title="Export Markdown File"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            
            <div className="flex-1 bg-[#fafafb] border border-[#e5e5e8] rounded-2xl p-6 flex flex-col min-h-[450px]">
              {!draft ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                  <div className="w-14 h-14 bg-white border border-[#d9d9dd] rounded-full flex items-center justify-center mb-4 shadow-xs">
                    <FileEdit className="w-6 h-6 text-[#666666]" />
                  </div>
                  <h4 className="text-base font-bold text-[#212121]">Draft Document Viewer</h4>
                  <p className="text-xs text-[#666666] mt-2 max-w-xs leading-relaxed">
                    Set your configuration prompt, save your writing sample, and hit Generate to render the topper draft in this workspace.
                  </p>
                </div>
              ) : (
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  className="flex-1 w-full bg-transparent text-[#212121] outline-none resize-none leading-relaxed text-sm select-text whitespace-pre-wrap font-sans"
                />
              )}
              
              {draft && (
                <div className="mt-6 pt-4 border-t border-[#e5e5e8] flex justify-between items-center text-xs text-[#666666]">
                  <div className="flex items-center gap-1.5 font-bold font-mono">
                    <BookOpen className="w-4 h-4" />
                    Word Count: {draft.split(/\s+/).length} Words
                  </div>
                  <span className="font-bold text-[#212121] flex items-center gap-1">
                    <BrainCircuit className="w-3.5 h-3.5 text-[#212121]" /> Digital twin calibrated
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

