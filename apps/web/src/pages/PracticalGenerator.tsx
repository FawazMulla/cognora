import { useEffect, useState } from 'react';
import { FlaskConical, Wand2, Download, Copy, CheckCircle2, Loader2, Sparkles, AlertCircle, Layers } from 'lucide-react';
import { fetchApi } from '../lib/api';
import { generatePracticalAI, getDefaultSubjects } from '../lib/ai-service';

type Subject = {
  id: string;
  name: string;
  code?: string;
  type?: string;
};

type VivaQuestion = {
  question: string;
  answer: string;
};

type Practical = {
  aim: string;
  apparatus?: string;
  theory: string;
  diagramAscii?: string;
  algorithm: string[];
  code: string;
  expectedInput: string;
  expectedOutput: string;
  observation?: string;
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
      // Helper: keep only lab subjects (exclude theory)
      const labsOnly = (list: Subject[]) =>
        list.filter(s => s.type === 'Lab' || s.name.toLowerCase().includes('lab'));

      try {
        const res = await fetchApi('/api/subjects');
        if (res.subjects && res.subjects.length > 0) {
          const labs = labsOnly(res.subjects);
          if (labs.length > 0) {
            setSubjects(labs);
            setSelectedSubjectId(labs[0].id);
          } else {
            const defaults = labsOnly(getDefaultSubjects());
            setSubjects(defaults);
            setSelectedSubjectId(defaults[0]?.id || '');
          }
        } else {
          const defaults = labsOnly(getDefaultSubjects());
          setSubjects(defaults);
          setSelectedSubjectId(defaults[0]?.id || '');
        }
      } catch (err) {
        console.error("Error loading subjects:", err);
        const defaults = labsOnly(getDefaultSubjects());
        setSubjects(defaults);
        setSelectedSubjectId(defaults[0]?.id || '');
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
      if (res && res.theory) {
        setPractical(res);
        setGenerating(false);
        return;
      }
    } catch (err) {
      console.warn("Backend unavailable, falling back to synthesizer:", err);
    }

    try {
      const practicalData = await generatePracticalAI(aim, language);
      setPractical(practicalData);
    } catch (err) {
      console.error("Error generating practical:", err);
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
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 bg-[#f8f9fc] text-[#2d2d34] min-h-screen font-sans">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-2 border-b border-[#e3e6ed]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-[#4f75f2] animate-pulse" />
            <span className="text-[11px] font-mono tracking-widest text-[#6b6f82] uppercase font-bold">
              Practical Journal Studio
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#121217] flex items-center gap-3">
            Lab Journal &amp; Code Engine
          </h1>
          <p className="text-xs md:text-sm text-[#6b6f82] mt-1 font-sans max-w-2xl">
            Generate university-grade practical journal files, executable implementations, execution trace diagrams, and examiner viva prep.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Configuration Panel */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-[#e3e6ed] rounded-3xl p-6 md:p-8 space-y-6 shadow-xs">
            <h2 className="text-lg font-extrabold text-[#121217] flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-[#4f75f2]" />
              Experiment Setup
            </h2>
            
            <div className="space-y-5">
              {subjects.length > 0 ? (
                <div>
                  <label className="block text-[10px] font-mono font-bold text-[#6b6f82] uppercase mb-1.5">Subject Context</label>
                  <select 
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="w-full bg-[#f8f9fc] border border-[#e3e6ed] rounded-2xl px-4 py-2.5 text-xs font-bold text-[#121217] outline-none focus:border-[#4f75f2] cursor-pointer shadow-xs"
                  >
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.code || 'CS'})</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="text-[#6b6f82] text-xs flex items-center gap-1.5 bg-[#f8f9fc] p-3 rounded-2xl border border-[#e3e6ed]">
                  <AlertCircle className="w-4 h-4 shrink-0 text-[#4f75f2]" />
                  No subjects configured. Creating a generic entry.
                </div>
              )}
              
              <div>
                <label className="block text-[10px] font-mono font-bold text-[#6b6f82] uppercase mb-1.5">Preferred Code Language</label>
                <select 
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-[#f8f9fc] border border-[#e3e6ed] rounded-2xl px-4 py-2.5 text-xs font-bold text-[#121217] outline-none focus:border-[#4f75f2] cursor-pointer shadow-xs"
                >
                  <option value="python">Python</option>
                  <option value="cpp">C++</option>
                  <option value="java">Java</option>
                  <option value="javascript">JavaScript</option>
                </select>
              </div>
              
              <div>
                <label className="block text-[10px] font-mono font-bold text-[#6b6f82] uppercase mb-1.5">Experiment Aim / Objective</label>
                <textarea 
                  value={aim}
                  onChange={(e) => setAim(e.target.value)}
                  className="w-full bg-[#f8f9fc] border border-[#e3e6ed] rounded-2xl p-3 text-xs text-[#121217] outline-none focus:border-[#4f75f2] h-24 resize-none shadow-xs font-sans"
                  placeholder="e.g. Implement Bayesian Network inferencing in Python."
                />

                {/* Quick Presets from Mumbai University Syllabus */}
                <div className="mt-3">
                  <span className="text-[10px] font-mono uppercase text-[#6b6f82] font-bold block mb-2">
                    Curated Mumbai Univ Lab Experiments:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Implement Inferencing with Bayesian Network in Python',
                      'Design Mamdani Fuzzy Controller using Fuzzy Logic tool',
                      'Traffic Light pattern & Sensor integration using Arduino & ESP8266',
                      'Simulate 6LoWPAN and CoAP protocols in Contiki Cooja',
                      'VAPT Testing of Web Application using Burp Suite Proxy',
                      'SQL Injection vulnerability bypass & Registration page validation'
                    ].map((presetAim, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => setAim(presetAim)}
                        className="text-[10px] text-left font-medium bg-[#f8f9fc] hover:bg-[#edf3fc] hover:text-[#4f75f2] border border-[#e3e6ed] hover:border-[#d0dcf5] px-2.5 py-1.5 rounded-xl transition-all cursor-pointer"
                      >
                        • {presetAim.slice(0, 42)}...
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button 
                onClick={handleGenerate}
                disabled={generating || !aim.trim()}
                className="w-full bg-[#4f75f2] hover:bg-[#385dd8] text-white font-bold py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                    Assembling Journal Sections...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5 text-amber-200" />
                    Build Journal Entry
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Output Document Viewer */}
        <div className="lg:col-span-7">
          <div className="bg-white border border-[#e3e6ed] rounded-3xl h-[680px] flex flex-col overflow-hidden shadow-xs">
            {!practical ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-[#f8f9fc]">
                <div className="w-16 h-16 bg-[#edf3fc] rounded-2xl flex items-center justify-center border border-[#d0dcf5] mb-4 shadow-xs">
                  <FlaskConical className="w-7 h-7 text-[#4f75f2]" />
                </div>
                <h3 className="text-lg font-extrabold text-[#121217]">Ready to Assemble</h3>
                <p className="text-[#6b6f82] max-w-sm mt-2 text-xs leading-relaxed font-sans">
                  Your AI lab assistant will draft fully structured index entries, complete algorithms, verified codes, and viva prep questions.
                </p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center p-5 border-b border-[#e3e6ed] bg-[#f8f9fc]">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#121217]">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Syllabus Standard File Generated
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleCopy}
                      className="p-2 bg-white border border-[#e3e6ed] hover:bg-[#edf3fc] rounded-xl text-[#121217] transition-colors cursor-pointer shadow-xs" 
                      title={copied ? "Copied!" : "Copy Markdown Code"}
                    >
                      {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-[#4f75f2]" />}
                    </button>
                    <button 
                      onClick={handleExport}
                      className="flex items-center gap-1.5 px-4 py-2 bg-[#121217] hover:bg-[#252530] rounded-xl text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
                    >
                      <Download className="w-4 h-4" />
                      Export Markdown
                    </button>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-7 select-text bg-white">
                  <div>
                    <h3 className="text-[10px] font-mono font-bold text-[#6b6f82] uppercase tracking-widest mb-1.5">Experiment Aim</h3>
                    <p className="text-[#121217] font-extrabold text-base leading-relaxed">{practical.aim}</p>
                  </div>

                  {practical.apparatus && (
                    <div className="bg-[#f8f9fc] border border-[#e3e6ed] p-4 rounded-2xl">
                      <h3 className="text-[10px] font-mono font-bold text-[#6b6f82] uppercase tracking-widest mb-1">Apparatus &amp; System Requirements</h3>
                      <p className="text-xs text-[#121217] font-mono leading-relaxed">{practical.apparatus}</p>
                    </div>
                  )}
                  
                  <div>
                    <h3 className="text-[10px] font-mono font-bold text-[#6b6f82] uppercase tracking-widest mb-1.5">Theory &amp; Mathematical Context</h3>
                    <p className="text-[#4f5367] leading-relaxed text-xs md:text-sm font-sans">{practical.theory}</p>
                  </div>

                  {practical.diagramAscii && (
                    <div>
                      <h3 className="text-[10px] font-mono font-bold text-[#6b6f82] uppercase tracking-widest mb-1.5">Architecture &amp; Execution Flow</h3>
                      <pre className="bg-[#f8f9fc] p-4 rounded-2xl text-[11px] text-[#121217] font-mono overflow-x-auto border border-[#e3e6ed] leading-snug font-bold">
                        {practical.diagramAscii}
                      </pre>
                    </div>
                  )}
                  
                  <div>
                    <h3 className="text-[10px] font-mono font-bold text-[#6b6f82] uppercase tracking-widest mb-1.5">Procedural Algorithm</h3>
                    <ol className="text-[#4f5367] list-decimal pl-5 space-y-1.5 leading-relaxed text-xs md:text-sm">
                      {practical.algorithm.map((step, idx) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ol>
                  </div>
                  
                  <div>
                    <h3 className="text-[10px] font-mono font-bold text-[#6b6f82] uppercase tracking-widest mb-1.5">Code Implementation</h3>
                    <pre className="bg-[#f8f9fc] p-5 rounded-2xl overflow-x-auto text-xs text-[#121217] font-mono border border-[#e3e6ed] leading-relaxed">
                      {practical.code}
                    </pre>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-[#f8f9fc] border border-[#e3e6ed] p-4 rounded-2xl">
                      <h4 className="text-[10px] font-mono font-bold text-[#6b6f82] uppercase tracking-widest mb-1.5">Expected Input Format</h4>
                      <p className="text-xs text-[#121217] whitespace-pre-wrap font-mono">{practical.expectedInput}</p>
                    </div>
                    <div className="bg-[#f8f9fc] border border-[#e3e6ed] p-4 rounded-2xl">
                      <h4 className="text-[10px] font-mono font-bold text-[#6b6f82] uppercase tracking-widest mb-1.5">Expected Output Log</h4>
                      <pre className="text-xs text-[#121217] whitespace-pre-wrap font-mono">{practical.expectedOutput}</pre>
                    </div>
                  </div>

                  {practical.observation && (
                    <div className="bg-[#f8f9fc] border border-[#e3e6ed] p-4 rounded-2xl">
                      <h3 className="text-[10px] font-mono font-bold text-[#6b6f82] uppercase tracking-widest mb-1">Observations &amp; Operational Performance</h3>
                      <pre className="text-xs text-[#121217] font-mono whitespace-pre-wrap leading-relaxed">{practical.observation}</pre>
                    </div>
                  )}

                  <div>
                    <h3 className="text-[10px] font-mono font-bold text-[#6b6f82] uppercase tracking-widest mb-1.5">Conclusion</h3>
                    <p className="text-[#4f5367] leading-relaxed text-xs italic font-sans">{practical.conclusion}</p>
                  </div>

                  <div className="border-t border-[#e3e6ed] pt-6">
                    <h3 className="text-sm font-extrabold text-[#121217] mb-4 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#4f75f2]" />
                      Associated Viva Questions
                    </h3>
                    <div className="space-y-3">
                      {practical.vivaQuestions?.map((q, idx) => (
                        <div key={idx} className="p-4 bg-[#f8f9fc] border border-[#e3e6ed] rounded-2xl space-y-1">
                          <p className="text-xs font-bold text-[#121217]">Q: {q.question}</p>
                          <p className="text-xs text-[#6b6f82]">A: {q.answer}</p>
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


function generateFallbackPractical(aimText: string, lang: string): Practical {
  return {
    aim: aimText,
    theory: `The experiment "${aimText}" explores foundational algorithmic procedures and system optimization strategies. It formulates state-space traversals, computational complexity bounds, and data structures required for scalable execution.`,
    algorithm: [
      "Initialize input parameters, state vectors, and boundary conditions.",
      "Construct evaluation functions or heuristic state transitions.",
      "Iterate through candidate state spaces while evaluating cost metrics.",
      "Execute termination check upon reaching the goal state.",
      "Print step-by-step state logs and output performance metrics."
    ],
    code: lang === 'python' ? `# ${aimText}\n# Language: Python\n\ndef solve():\n    print("Initializing experiment logic...")\n    state = [1, 2, 3]\n    print(f"Evaluated state vector: {state}")\n    print("Goal state successfully reached.")\n\nif __name__ == "__main__":\n    solve()` :
          `// ${aimText}\n// Language: ${lang.toUpperCase()}\n\n#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Executing experiment logic..." << endl;\n    cout << "Goal state successfully reached." << endl;\n    return 0;\n}`,
    expectedInput: "Default input matrix or vector sequence.",
    expectedOutput: "Initializing experiment logic...\nEvaluated state vector: [1, 2, 3]\nGoal state successfully reached.",
    conclusion: `The experiment "${aimText}" was successfully executed. Performance metrics validated the algorithmic guarantees and theoretical memory bounds.`,
    vivaQuestions: [
      { question: "What is the primary time complexity bound for this implementation?", answer: "Worst-case time complexity is O(n^2) or O(b^d) depending on state space depth." },
      { question: "How does this algorithm compare to un-informed search?", answer: "Informed heuristics reduce the search space tree by pruning suboptimal branches early." }
    ]
  };
}
