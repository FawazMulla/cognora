import { FlaskConical, Wand2, Download, Copy, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

export default function PracticalGenerator() {
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setGenerated(true);
    }, 2000);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10 font-sans">
      <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-normal text-gemini-text tracking-tight flex items-center gap-3">
            <FlaskConical className="w-8 h-8 text-gemini-red" />
            Practical Generator
          </h1>
          <p className="text-gemini-text-muted mt-2">Generate perfect university-format practical files from a single prompt.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Panel */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-gemini-surface rounded-3xl p-8">
            <h2 className="text-lg font-medium text-gemini-text mb-8">Configuration</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gemini-text-muted mb-3">Subject</label>
                <select className="w-full bg-gemini-bg rounded-2xl px-5 py-4 text-gemini-text outline-none focus:ring-1 focus:ring-gemini-border appearance-none">
                  <option>Data Structures & Algorithms</option>
                  <option>Artificial Intelligence</option>
                  <option>Database Management</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gemini-text-muted mb-3">Experiment Title / Aim</label>
                <textarea 
                  className="w-full bg-gemini-bg rounded-2xl px-5 py-4 text-gemini-text outline-none focus:ring-1 focus:ring-gemini-border h-32 resize-none"
                  placeholder="e.g. Implement Binary Search Tree and its traversals (inorder, preorder, postorder)"
                  defaultValue="Implement A* Search Algorithm to solve the 8-puzzle problem."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gemini-text-muted mb-3">College Format / Custom Instructions</label>
                <textarea 
                  className="w-full bg-gemini-bg rounded-2xl px-5 py-4 text-gemini-text outline-none focus:ring-1 focus:ring-gemini-border h-32 resize-none"
                  placeholder="Include Theory, Algorithm, Code in Python, and Output screenshots."
                />
              </div>

              <button 
                onClick={handleGenerate}
                disabled={generating}
                className="w-full mt-4 bg-gemini-text hover:opacity-90 text-gemini-bg font-medium py-4 rounded-full transition-opacity flex items-center justify-center gap-2"
              >
                {generating ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-gemini-bg border-t-transparent rounded-full animate-spin" />
                    Generating...
                  </span>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5" />
                    Generate Practical
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Output Panel */}
        <div className="lg:col-span-8">
          <div className="bg-gemini-surface rounded-3xl h-[700px] flex flex-col overflow-hidden">
            {!generated ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-gemini-surface">
                <div className="w-20 h-20 bg-gemini-bg rounded-full flex items-center justify-center mb-6">
                  <FlaskConical className="w-8 h-8 text-gemini-text-muted" />
                </div>
                <h3 className="text-xl font-medium text-gemini-text mb-2">Ready to Generate</h3>
                <p className="text-gemini-text-muted max-w-sm">
                  The AI will structure the experiment exactly according to your university's standard format.
                </p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center p-6 border-b border-gemini-border bg-gemini-surface">
                  <div className="flex items-center gap-2 text-sm font-medium text-gemini-blue">
                    <CheckCircle2 className="w-5 h-5" />
                    Generation Complete
                  </div>
                  <div className="flex gap-2">
                    <button className="p-3 hover:bg-gemini-bg rounded-full text-gemini-text-muted transition-colors" title="Copy to Clipboard">
                      <Copy className="w-5 h-5" />
                    </button>
                    <button className="flex items-center gap-2 px-6 py-2 bg-gemini-bg hover:bg-gemini-border rounded-full text-gemini-text text-sm font-medium transition-colors">
                      <Download className="w-4 h-4" />
                      Export Document
                    </button>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-10 space-y-8 max-w-3xl mx-auto">
                  <div>
                    <h2 className="text-gemini-text text-xl font-semibold mb-4">Aim</h2>
                    <p className="text-gemini-text-muted leading-relaxed">To implement the A* Search Algorithm to solve the 8-puzzle problem.</p>
                  </div>
                  
                  <div>
                    <h2 className="text-gemini-text text-xl font-semibold mb-4">Theory</h2>
                    <p className="text-gemini-text-muted leading-relaxed mb-4">A* is an informed search algorithm, or a best-first search, meaning that it is formulated in terms of weighted graphs: starting from a specific starting node of a graph, it aims to find a path to the given goal node having the smallest cost (least distance travelled, shortest time, etc.).</p>
                    <p className="text-gemini-text-muted leading-relaxed">It uses a heuristic function h(n) and the cost function g(n) to determine the next node to expand. The evaluation function is f(n) = g(n) + h(n).</p>
                  </div>
                  
                  <div>
                    <h2 className="text-gemini-text text-xl font-semibold mb-4">Algorithm</h2>
                    <ol className="text-gemini-text-muted list-decimal pl-5 space-y-3 leading-relaxed">
                      <li>Initialize the open list and closed list.</li>
                      <li>Put the starting node on the open list.</li>
                      <li>While the open list is not empty, find the node with the least f on the open list, call it "q".</li>
                      <li>Pop q off the open list and generate its successors.</li>
                      <li>For each successor, if it is the goal, stop search.</li>
                    </ol>
                  </div>
                  
                  <div>
                    <h2 className="text-gemini-text text-xl font-semibold mb-4">Code</h2>
                    <pre className="bg-gemini-bg p-6 rounded-2xl overflow-x-auto text-sm text-gemini-text-muted font-mono">
{`class Node:
    def __init__(self, data, level, fval):
        self.data = data
        self.level = level
        self.fval = fval

    def generate_child(self):
        # Code to generate child nodes...
        pass
        
# A* algorithm implementation...`}
                    </pre>
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
