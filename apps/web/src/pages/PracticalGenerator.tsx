import { useEffect, useState } from 'react';
import { FlaskConical, Wand2, Download, Copy, CheckCircle2, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { fetchApi } from '../lib/api';

type Subject = {
  id: string;
  name: string;
  code?: string;
};

type VivaQuestion = {
  question: string;
  answer: string;
};

type Practical = {
  aim: string;
  theory: string;
  algorithm: string[];
  code: string;
  expectedInput: string;
  expectedOutput: string;
  conclusion: string;
  vivaQuestions: VivaQuestion[];
};

export default function PracticalGenerator() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [aim, setAim] = useState<string>('Implement A* Search Heuristic to solve the 8-Puzzle Problem.');
  const [language, setLanguage] = useState<string>('python');
  const [generating, setGenerating] = useState(false);
  const [practical, setPractical] = useState<Practical | null>(null);
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

  const handleGenerate = async () => {
    if (!aim.trim()) return;
    setGenerating(true);
    setCopied(false);
    
    try {
      const res = await fetchApi('/api/practicals/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aim,
          subjectId: selectedSubjectId,
          codeLanguage: language
        })
      });
      setPractical(res);
    } catch (err) {
      console.error(err);
      alert("Failed to generate practical. Please check backend connections.");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!practical) return;
    const fullText = `
AIM:
${practical.aim}

THEORY:
${practical.theory}

ALGORITHM:
${practical.algorithm.map((step, idx) => `${idx + 1}. ${step}`).join('\n')}

CODE (${language.toUpperCase()}):
${practical.code}

EXPECTED INPUT:
${practical.expectedInput}

EXPECTED OUTPUT:
${practical.expectedOutput}

CONCLUSION:
${practical.conclusion}
    `;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = () => {
    if (!practical) return;
    const fullText = `
# AIM
${practical.aim}

## Theory & Concepts
${practical.theory}

## Algorithm / Logic
${practical.algorithm.map((step, idx) => `${idx + 1}. ${step}`).join('\n')}

## Code Implementation
\`\`\`${language}
${practical.code}
\`\`\`

## Expected Input
${practical.expectedInput}

## Expected Output
\`\`\`text
${practical.expectedOutput}
\`\`\`

## Conclusion
${practical.conclusion}
    `;
    
    const element = document.createElement("a");
    const file = new Blob([fullText], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${practical.aim.slice(0, 30).toLowerCase().replace(/[^a-z0-9]+/g, "-")}-journal.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-10 font-sans min-h-screen text-slate-100">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight flex items-center gap-3 bg-gradient-to-r from-red-400 via-rose-400 to-amber-400 bg-clip-text text-transparent">
            <FlaskConical className="w-9 h-9 text-rose-500" />
            Lab Journal Engine
          </h1>
          <p className="text-slate-400 mt-2 text-sm md:text-base">
            Generate publication-quality university practical files, code bases, and experiment analyses.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Configuration Panel */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 md:p-8 backdrop-blur-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl" />
            
            <h2 className="text-2xl font-bold text-white mb-6 relative z-10">Configure Journal</h2>
            
            <div className="space-y-6 relative z-10">
              {subjects.length > 0 ? (
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Subject Context</label>
                  <select 
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-rose-500 cursor-pointer"
                  >
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="text-amber-400 text-xs flex items-center gap-1.5 bg-slate-950 p-3 rounded-xl border border-slate-800/60">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  No subjects configured. Creating a generic entry.
                </div>
              )}
              
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Preferred Code Language</label>
                <select 
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-rose-500 cursor-pointer"
                >
                  <option value="python">Python</option>
                  <option value="cpp">C++</option>
                  <option value="java">Java</option>
                  <option value="javascript">JavaScript</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Experiment Aim / Objective</label>
                <textarea 
                  value={aim}
                  onChange={(e) => setAim(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-rose-500 h-28 resize-none"
                  placeholder="e.g. Implement DFS search and solve water jug problem."
                />
              </div>

              <button 
                onClick={handleGenerate}
                disabled={generating || !aim.trim()}
                className="w-full mt-4 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-rose-500/10 disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Assembling sections...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5" />
                    Build Journal Entry
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Output Document Viewer */}
        <div className="lg:col-span-8">
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl h-[650px] flex flex-col overflow-hidden backdrop-blur-xl relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl" />

            {!practical ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 relative z-10">
                <div className="w-20 h-20 bg-slate-950/60 rounded-full flex items-center justify-center border border-slate-800 mb-6">
                  <FlaskConical className="w-8 h-8 text-rose-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-300">Ready to Assemble</h3>
                <p className="text-slate-500 max-w-sm mt-2 text-sm leading-relaxed">
                  Your AI lab assistant will draft fully structured index entries, complete algorithms, verified codes, and viva prep questions.
                </p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center p-5 border-b border-slate-800 bg-slate-950/40 relative z-10">
                  <div className="flex items-center gap-2 text-sm font-bold text-rose-400">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    Syllabus Standard File Created
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleCopy}
                      className="p-2.5 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl text-slate-300 hover:text-white transition-colors cursor-pointer" 
                      title={copied ? "Copied!" : "Copy Markdown Code"}
                    >
                      {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button 
                      onClick={handleExport}
                      className="flex items-center gap-1.5 px-5 py-2 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl text-slate-200 text-sm font-semibold transition-colors cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      Export Markdown
                    </button>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 select-text relative z-10 max-w-none">
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Experiment Aim</h3>
                    <p className="text-slate-200 font-semibold text-lg leading-relaxed">{practical.aim}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Theory & Mathematical Context</h3>
                    <p className="text-slate-400 leading-relaxed text-sm md:text-base">{practical.theory}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Procedural Algorithm</h3>
                    <ol className="text-slate-400 list-decimal pl-5 space-y-2 leading-relaxed text-sm md:text-base">
                      {practical.algorithm.map((step, idx) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ol>
                  </div>
                  
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Code Implementation</h3>
                    <pre className="bg-slate-950/80 p-5 rounded-2xl overflow-x-auto text-xs md:text-sm text-emerald-400 font-mono border border-slate-800/80 leading-relaxed">
                      {practical.code}
                    </pre>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-950/40 border border-slate-800/50 p-5 rounded-2xl">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Expected Input Format</h4>
                      <p className="text-xs text-slate-300 whitespace-pre-wrap">{practical.expectedInput}</p>
                    </div>
                    <div className="bg-slate-950/40 border border-slate-800/50 p-5 rounded-2xl">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Expected Output Log</h4>
                      <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono">{practical.expectedOutput}</pre>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Conclusion</h3>
                    <p className="text-slate-400 leading-relaxed text-sm italic">{practical.conclusion}</p>
                  </div>

                  <div className="border-t border-slate-800/60 pt-6">
                    <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-rose-400 animate-pulse" />
                      Associated Viva Questions
                    </h3>
                    <div className="space-y-4">
                      {practical.vivaQuestions?.map((q, idx) => (
                        <div key={idx} className="p-4 bg-slate-950/40 border border-slate-800/40 rounded-xl space-y-1">
                          <p className="text-xs font-bold text-rose-400">Q: {q.question}</p>
                          <p className="text-xs text-slate-400">A: {q.answer}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
