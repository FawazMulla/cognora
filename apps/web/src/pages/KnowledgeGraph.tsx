import { useEffect, useState, useRef } from 'react';
import { Network, Loader2, ZoomIn, ZoomOut, RefreshCw, BookOpen, BrainCircuit, Sparkles, Layers, Info } from 'lucide-react';
import { fetchApi } from '../lib/api';
import { getDefaultSubjects, generateKnowledgeGraphAI } from '../lib/ai-service';

type Subject = { id: string; name: string; code?: string };
type KGNode = { id: string; label: string; type: string; mastery: string; x: number; y: number };
type KGEdge = { source: string; target: string; label: string };
type PYQ = { id: string; questionText: string; markValue: number };
type Card = { id: string; front: string; back: string };

const NODE_COLORS: Record<string, { fill: string; stroke: string; text: string }> = {
  Algorithm: { fill: '#eff6ff', stroke: '#3b82f6', text: '#1d4ed8' },
  Concept: { fill: '#f5f3ff', stroke: '#8b5cf6', text: '#6d28d9' },
  Property: { fill: '#ecfdf5', stroke: '#10b981', text: '#047857' },
  Component: { fill: '#fff7ed', stroke: '#f97316', text: '#c2410c' },
  System: { fill: '#fdf2f8', stroke: '#ec4899', text: '#be185d' },
  'Data Structure': { fill: '#f0fdfa', stroke: '#14b8a6', text: '#0f766e' },
  default: { fill: '#f8fafc', stroke: '#64748b', text: '#334155' }
};

const MASTERY_RING: Record<string, string> = {
  weak: '#ef4444',
  improving: '#f59e0b',
  strong: '#10b981',
  none: '#cbd5e1'
};

export default function KnowledgeGraph() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [nodes, setNodes] = useState<KGNode[]>([]);
  const [edges, setEdges] = useState<KGEdge[]>([]);
  const [pyqs, setPyqs] = useState<PYQ[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState<KGNode | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

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
        console.error(err);
        const defaults = getDefaultSubjects();
        setSubjects(defaults);
        setSelectedSubjectId(defaults[0].id);
      }
    }
    loadSubjects();
  }, []);

  useEffect(() => {
    if (!selectedSubjectId) return;
    async function loadGraph() {
      setLoading(true);
      setSelectedNode(null);
      const sub = subjects.find(s => s.id === selectedSubjectId);
      const subName = sub?.name || 'Computer Science';

      try {
        const res = await fetchApi(`/api/subjects/${selectedSubjectId}/knowledge-graph`);
        if (res.nodes && res.nodes.length > 0) {
          setNodes(res.nodes);
          setEdges(res.edges || []);
          setPyqs(res.pyqs || []);
          setCards(res.cards || []);
        } else {
          const fallbackData = generateKnowledgeGraphAI(subName);
          setNodes(fallbackData.nodes);
          setEdges(fallbackData.edges);
          setPyqs(fallbackData.pyqs);
          setCards(fallbackData.cards);
        }
      } catch (err) {
        console.warn('Knowledge graph API fallback:', err);
        const fallbackData = generateKnowledgeGraphAI(subName);
        setNodes(fallbackData.nodes);
        setEdges(fallbackData.edges);
        setPyqs(fallbackData.pyqs);
        setCards(fallbackData.cards);
      } finally {
        setLoading(false);
      }
    }
    loadGraph();
  }, [selectedSubjectId, subjects]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === svgRef.current || (e.target as Element).classList.contains('pan-target')) {
      isDragging.current = true;
      lastPos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => { isDragging.current = false; };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(z => Math.min(2.5, Math.max(0.4, z + delta)));
  };

  const selectedNodePyqs = selectedNode ? pyqs.slice(0, 3) : [];
  const selectedNodeCards = selectedNode ? cards.slice(0, 2) : [];
  const selectedSubject = subjects.find(s => s.id === selectedSubjectId);

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto min-h-screen bg-white text-[#212121] space-y-8 font-display">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-6 border-b border-[#d9d9dd]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest text-[#666666] uppercase mb-2">
            <Layers className="w-3.5 h-3.5 text-[#212121]" /> Semantic Concept Graph
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#212121] flex items-center gap-3">
            Interactive Knowledge Graph
            {nodes.length > 0 && (
              <span className="text-xs bg-[#f4f4f4] text-[#444444] px-3 py-1 rounded-full border border-[#d9d9dd] font-mono">
                {nodes.length} Nodes
              </span>
            )}
          </h1>
          <p className="text-[#666666] mt-2 text-sm max-w-2xl">
            Autonomous multi-dimensional graph of core topics, dependencies, mastery retention, and linked university questions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {subjects.length > 0 && (
            <select
              value={selectedSubjectId}
              onChange={e => setSelectedSubjectId(e.target.value)}
              className="bg-white border border-[#d9d9dd] rounded-xl px-4 py-2.5 text-xs font-bold text-[#212121] outline-none focus:border-[#212121] cursor-pointer shadow-sm"
            >
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.code || 'CS'})</option>
              ))}
            </select>
          )}
          <div className="flex gap-1 bg-[#f4f4f4] p-1 rounded-xl border border-[#d9d9dd]">
            <button
              onClick={() => setZoom(z => Math.min(2.5, z + 0.2))}
              className="p-2 hover:bg-white rounded-lg text-[#212121] cursor-pointer transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoom(z => Math.max(0.4, z - 0.2))}
              className="p-2 hover:bg-white rounded-lg text-[#212121] cursor-pointer transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
              className="p-2 hover:bg-white rounded-lg text-[#212121] cursor-pointer transition-colors"
              title="Reset View"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Graph Canvas */}
        <div className="lg:col-span-3 bg-[#fafafb] border border-[#d9d9dd] rounded-3xl overflow-hidden relative shadow-sm" style={{ height: '620px' }}>
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-[#666666]">
              <Loader2 className="w-8 h-8 text-[#212121] animate-spin" />
              <span className="text-xs font-mono uppercase tracking-wider">Rendering Semantic Graph...</span>
            </div>
          ) : nodes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <Network className="w-16 h-16 text-[#cccccc] mb-4" />
              <h3 className="text-[#212121] font-bold text-lg">No Graph Data</h3>
              <p className="text-[#666666] text-xs mt-1">Select a subject to render syllabus concept graph.</p>
            </div>
          ) : (
            <svg
              ref={svgRef}
              width="100%" height="100%"
              className="cursor-grab active:cursor-grabbing select-none"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
            >
              <g transform={`translate(${pan.x + 80},${pan.y + 60}) scale(${zoom})`}>
                <rect className="pan-target" x="-5000" y="-5000" width="10000" height="10000" fill="transparent" />
                
                {/* Edges */}
                {edges.map((edge, i) => {
                  const src = nodes.find(n => n.id === edge.source);
                  const tgt = nodes.find(n => n.id === edge.target);
                  if (!src || !tgt) return null;
                  return (
                    <g key={i}>
                      <line
                        x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
                        stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4"
                      />
                      <rect
                        x={(src.x + tgt.x) / 2 - 35}
                        y={(src.y + tgt.y) / 2 - 10}
                        width="70"
                        height="16"
                        rx="4"
                        fill="white"
                        stroke="#e2e8f0"
                      />
                      <text
                        x={(src.x + tgt.x) / 2} y={(src.y + tgt.y) / 2 + 2}
                        textAnchor="middle" fontSize="8" fill="#64748b" fontWeight="600" fontFamily="sans-serif"
                      >
                        {edge.label}
                      </text>
                    </g>
                  );
                })}

                {/* Nodes */}
                {nodes.map(node => {
                  const colorConfig = NODE_COLORS[node.type] || NODE_COLORS.default;
                  const ringColor = MASTERY_RING[node.mastery] || MASTERY_RING.none;
                  const isSelected = selectedNode?.id === node.id;
                  return (
                    <g
                      key={node.id}
                      onClick={() => setSelectedNode(isSelected ? null : node)}
                      className="cursor-pointer transition-transform hover:scale-105"
                      style={{ filter: isSelected ? 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.05))' }}
                    >
                      {/* Outer Mastery Halo */}
                      <circle cx={node.x} cy={node.y} r="32" fill={ringColor} opacity="0.15" />
                      {/* Main Node Circle */}
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r="24"
                        fill={colorConfig.fill}
                        stroke={isSelected ? '#212121' : colorConfig.stroke}
                        strokeWidth={isSelected ? 3 : 2}
                      />
                      <text
                        x={node.x}
                        y={node.y + 1}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize="9"
                        fill={colorConfig.text}
                        fontWeight="800"
                        fontFamily="sans-serif"
                      >
                        {node.label.slice(0, 10)}
                      </text>
                      <text
                        x={node.x}
                        y={node.y + 42}
                        textAnchor="middle"
                        fontSize="10"
                        fill="#212121"
                        fontWeight="700"
                        fontFamily="sans-serif"
                      >
                        {node.label}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>
          )}

          {/* Type Legend */}
          <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
            {Object.entries(NODE_COLORS).filter(([k]) => k !== 'default').slice(0, 5).map(([type, colors]) => (
              <div key={type} className="flex items-center gap-1.5 bg-white/95 px-2.5 py-1 rounded-lg border border-[#d9d9dd] shadow-xs">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors.stroke }} />
                <span className="text-[10px] text-[#212121] font-semibold">{type}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Node Detail Drawer */}
        <div className="space-y-6">
          {selectedNode ? (
            <div className="bg-white border border-[#d9d9dd] rounded-3xl p-6 space-y-5 shadow-sm">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: NODE_COLORS[selectedNode.type]?.stroke || '#64748b' }}
                  />
                  <span className="text-[10px] font-mono font-bold text-[#666666] uppercase">{selectedNode.type}</span>
                </div>
                <h3 className="text-xl font-black text-[#212121] leading-tight">{selectedNode.label}</h3>
                <div className="mt-2 flex items-center gap-2">
                  <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase border ${
                    selectedNode.mastery === 'weak' ? 'bg-red-50 text-red-700 border-red-200' :
                    selectedNode.mastery === 'improving' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                    selectedNode.mastery === 'strong' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                    'bg-slate-50 text-slate-700 border-slate-200'
                  }`}>
                    Retention: {selectedNode.mastery}
                  </span>
                </div>
              </div>

              {selectedNodePyqs.length > 0 && (
                <div className="pt-4 border-t border-[#d9d9dd]">
                  <h4 className="text-xs font-bold text-[#212121] uppercase mb-3 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-[#212121]" /> Related Exam Questions
                  </h4>
                  <div className="space-y-2.5">
                    {selectedNodePyqs.map((q, i) => (
                      <div key={i} className="text-xs text-[#444444] bg-[#fafafb] p-3 rounded-xl border border-[#e5e5e8] leading-relaxed">
                        <div className="font-bold text-[#212121] mb-1">{q.markValue} Marks Weightage</div>
                        {q.questionText}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedNodeCards.length > 0 && (
                <div className="pt-4 border-t border-[#d9d9dd]">
                  <h4 className="text-xs font-bold text-[#212121] uppercase mb-3 flex items-center gap-1.5">
                    <BrainCircuit className="w-3.5 h-3.5 text-[#212121]" /> Associated Flashcard
                  </h4>
                  {selectedNodeCards.map((c, i) => (
                    <div key={i} className="text-xs bg-[#fafafb] p-3 rounded-xl border border-[#e5e5e8] mb-2">
                      <div className="font-bold text-[#212121] mb-1">Q: {c.front}</div>
                      <div className="text-[#666666]">A: {c.back}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-[#fafafb] border border-[#d9d9dd] border-dashed rounded-3xl p-8 text-center flex flex-col items-center justify-center min-h-[220px]">
              <Sparkles className="w-8 h-8 text-[#999999] mb-3" />
              <h4 className="font-bold text-sm text-[#212121]">Concept Inspector</h4>
              <p className="text-xs text-[#666666] mt-1 max-w-xs leading-relaxed">
                Click any concept node in the canvas to view detailed syllabus links, previous questions, and flashcards.
              </p>
            </div>
          )}

          {/* Mastery Key */}
          <div className="bg-white border border-[#d9d9dd] rounded-3xl p-5 shadow-xs">
            <h4 className="text-[10px] font-mono font-bold text-[#666666] uppercase mb-3 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-[#212121]" /> Mastery Ring Key
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-medium">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>Strong Mastery (&gt;80%)</span>
                </div>
                <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">High Retention</span>
              </div>
              <div className="flex items-center justify-between text-xs font-medium">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span>Improving (50-80%)</span>
                </div>
                <span className="font-mono text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded">Review Due</span>
              </div>
              <div className="flex items-center justify-between text-xs font-medium">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <span>Weak / Unassessed (&lt;50%)</span>
                </div>
                <span className="font-mono text-[10px] text-red-700 bg-red-50 px-2 py-0.5 rounded">Priority</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

