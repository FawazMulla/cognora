import { useEffect, useState } from 'react';
import { FileEdit, SlidersHorizontal, ArrowRight, BookOpen, Layers, Loader2, CheckCircle2, Copy, Download, BrainCircuit, User } from 'lucide-react';
import { fetchApi } from '../lib/api';

type Subject = {
  id: string;
  name: string;
  code?: string;
};

export default function AssignmentEngine() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [prompt, setPrompt] = useState<string>('Write a detailed report on the evolution of Operating Systems from 1950 to present.');
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
        }
      } catch (err) {
        console.error("Error loading subjects:", err);
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
      console.error(err);
      alert("Failed to save style profile. Please check if backend is running.");
    } finally {
      setTrainingStyle(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || !selectedSubjectId) return;
    setGenerating(true);
    
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
      setDraft(res.answer);
    } catch (err) {
      console.error(err);
      alert("Failed to generate assignment. Please check if backend is running.");
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
    const file = new Blob([draft], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `assignment-${selectedSubjectId}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-10 font-sans min-h-screen text-slate-100">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight flex items-center gap-3 bg-gradient-to-r from-blue-400 via-teal-400 to-emerald-400 bg-clip-text text-transparent">
            <FileEdit className="w-9 h-9 text-blue-500" />
            Assignment Engine
          </h1>
          <p className="text-slate-400 mt-2 text-sm md:text-base">
            Draft customized, topper-standard reports humanized by your Digital Twin writing style.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Configuration Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 md:p-8 backdrop-blur-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl" />
            
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2 relative z-10">
              <SlidersHorizontal className="w-6 h-6 text-slate-400" />
              Parameters
            </h2>
            
            <div className="space-y-6 relative z-10">
              {subjects.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Subject Target</label>
                  <select 
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-blue-500 cursor-pointer"
                  >
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Word Count Target</label>
                <select 
                  value={wordLimit}
                  onChange={(e) => setWordLimit(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value={300}>300 Words (Short Essay)</option>
                  <option value={600}>600 Words (Standard Assignment)</option>
                  <option value={1000}>1000 Words (Detailed Report)</option>
                  <option value={2000}>2000 Words (Research Paper)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Report Topic / Prompt</label>
                <textarea 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-blue-500 h-24 resize-none"
                  placeholder="Describe your assignment aim..."
                />
              </div>

              {/* Digital Twin Writing Sample Input */}
              <div className="border-t border-slate-800/80 pt-6 space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-white flex items-center gap-1.5">
                    <BrainCircuit className="w-4 h-4 text-teal-400 animate-pulse" />
                    Digital Twin Humanizer
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Paste a sample of your own previous writing to humanize the generated AI style.
                  </p>
                </div>
                <textarea
                  value={writingSample}
                  onChange={(e) => setWritingSample(e.target.value)}
                  placeholder="Paste your past assignment paragraphs here (min 50 words)..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-200 outline-none focus:border-teal-500 h-24 resize-none"
                />
                <button
                  disabled={trainingStyle || !writingSample.trim()}
                  onClick={handleTrainStyle}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-700/50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {trainingStyle ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Analyzing writing semantics...
                    </>
                  ) : styleSaved ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Style Profile Synchronized!
                    </>
                  ) : (
                    <>
                      <User className="w-3.5 h-3.5 text-teal-400" />
                      Save Style Profile
                    </>
                  )}
                </button>
              </div>

              <button 
                disabled={generating || !prompt.trim()}
                onClick={handleGenerate}
                className="w-full bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-500 hover:to-teal-500 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-500/10 disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Synthesizing draft...
                  </>
                ) : (
                  <>
                    Draft Assignment
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Preview Column */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 md:p-8 min-h-[600px] flex flex-col backdrop-blur-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl" />
            
            <div className="flex justify-between items-center mb-6 relative z-10">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Layers className="w-6 h-6 text-blue-400" />
                Document Editor
              </h2>
              {draft && (
                <div className="flex gap-2">
                  <button 
                    onClick={handleCopy}
                    className="p-2 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl text-slate-300 hover:text-white transition-colors cursor-pointer" 
                    title={copied ? "Copied!" : "Copy to Clipboard"}
                  >
                    {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button 
                    onClick={handleDownload}
                    className="p-2 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl text-slate-300 hover:text-white transition-colors cursor-pointer"
                    title="Export Document"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            
            <div className="flex-1 bg-slate-950/60 border border-slate-800/60 rounded-2xl p-6 relative z-10 flex flex-col min-h-[450px]">
              {!draft ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                  <div className="w-16 h-16 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center mb-4">
                    <FileEdit className="w-6 h-6 text-slate-500" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-300">Draft Document Viewer</h4>
                  <p className="text-xs text-slate-500 mt-2 max-w-xs leading-relaxed">
                    Set your configuration prompt, save your writing sample, and hit Generate to render the topper draft in this workspace.
                  </p>
                </div>
              ) : (
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  className="flex-1 w-full bg-transparent text-slate-300 outline-none resize-none leading-relaxed text-sm md:text-base select-text whitespace-pre-wrap"
                />
              )}
              
              {draft && (
                <div className="mt-6 pt-4 border-t border-slate-800/80 flex justify-between items-center text-xs text-slate-500">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <BookOpen className="w-4 h-4" />
                    Word Count: {draft.split(/\s+/).length} Words
                  </div>
                  <span className="font-semibold text-teal-400 flex items-center gap-1">
                    <BrainCircuit className="w-3.5 h-3.5" /> Hand-written style applied
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
