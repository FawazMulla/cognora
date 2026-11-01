import { useEffect, useState, useRef } from 'react';
import { Network, Loader2, ZoomIn, ZoomOut, RefreshCw, BookOpen, BrainCircuit, Sparkles, Layers, Info } from 'lucide-react';
import { fetchApi } from '../lib/api';
import { getDefaultSubjects, generateKnowledgeGraphAI } from '../lib/ai-service';
import { usePreferences } from '../context/PreferencesContext';

type Subject = { id: string; name: string; code?: string };
type KGNode = { id: string; label: string; type: string; mastery: string; x: number; y: number };
type KGEdge = { source: string; target: string; label: string };
type PYQ = { id: string; questionText: string; markValue: number };
type Card = { id: string; front: string; back: string };

const NODE_COLORS: Record<string, { fill: string; stroke: string; text: string }> = {
  Algorithm: { fill: '#edf3fc', stroke: '#4f75f2', text: '#2d4ab8' },
  Concept: { fill: '#f5effe', stroke: '#8b5cf6', text: '#6d28d9' },
  Property: { fill: '#e2f6eb', stroke: '#10b981', text: '#047857' },
  Component: { fill: '#fbf5e6', stroke: '#f59e0b', text: '#b45309' },
  System: { fill: '#fdf2f8', stroke: '#ec4899', text: '#be185d' },
  'Data Structure': { fill: '#f0fdfa', stroke: '#14b8a6', text: '#0f766e' },
  default: { fill: '#f8fafc', stroke: '#64748b', text: '#334155' }
};


const DARK_NODE_COLORS: Record<string, { fill: string; stroke: string; text: string }> = {
  Algorithm: { fill: '#17223b', stroke: '#60a5fa', text: '#bfdbfe' },
  Concept: { fill: '#241b36', stroke: '#a78bfa', text: '#ddd6fe' },
  Property: { fill: '#132a22', stroke: '#34d399', text: '#a7f3d0' },
  Component: { fill: '#2e2415', stroke: '#fbbf24', text: '#fde68a' },
  System: { fill: '#33192b', stroke: '#f472b6', text: '#fbcfe8' },
  'Data Structure': { fill: '#132a2f', stroke: '#2dd4bf', text: '#99f6e4' },
  default: { fill: '#1e293b', stroke: '#94a3b8', text: '#f1f5f9' }
};

const MASTERY_RING: Record<string, string> = {
  weak: '#ef4444',
  improving: '#f59e0b',
  strong: '#10b981',
  none: '#cbd5e1'
};

export default function KnowledgeGraph() {
  const { isDark } = usePreferences();
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

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto min-h-screen bg-[#f8f9fc] dark:bg-slate-950 text-[#121217] dark:text-slate-100 space-y-8 font-sans transition-colors">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-6 border-b border-[#e3e6ed] dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-[#4f75f2] animate-pulse" />
            <span className="text-[11px] font-mono tracking-widest text-[#6b6f82] dark:text-slate-400 uppercase font-bold">
              SEMANTIC CONCEPT GRAPH
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#121217] dark:text-white flex items-center gap-3">
            Interactive Knowledge Graph
            {nodes.length > 0 && (
              <span className="text-xs bg-[#edf3fc] text-[#4f75f2] px-3 py-1 rounded-full border border-[#d0dcf5] font-mono font-bold">
                {nodes.length} Nodes
              </span>
            )}
          </h1>
          <p className="text-[#6b6f82] dark:text-slate-400 mt-1 text-xs md:text-sm max-w-2xl">
            Autonomous multi-dimensional graph of core topics, dependencies, mastery retention, and linked university questions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {subjects.length > 0 && (
            <select
              value={selectedSubjectId}
              onChange={e => setSelectedSubjectId(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-[#e3e6ed] dark:border-slate-800 rounded-2xl px-4 py-2.5 text-xs font-bold text-[#121217] dark:text-slate-200 outline-none cursor-pointer shadow-xs"
            >
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.code || 'CS'})</option>
              ))}
            </select>
          )}
          <div className="flex gap-1 bg-white dark:bg-slate-900 p-1 rounded-2xl border border-[#e3e6ed] dark:border-slate-800 shadow-xs">
            <button
              onClick={() => setZoom(z => Math.min(2.5, z + 0.2))}
              className="p-2 hover:bg-[#f8f9fc] dark:hover:bg-slate-800 rounded-xl text-[#121217] dark:text-slate-200 cursor-pointer transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4 text-[#4f75f2]" />
            </button>
            <button
              onClick={() => setZoom(z => Math.max(0.4, z - 0.2))}
              className="p-2 hover:bg-[#f8f9fc] rounded-xl text-[#121217] cursor-pointer transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4 text-[#4f75f2]" />
            </button>
            <button
              onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
              className="p-2 hover:bg-[#f8f9fc] rounded-xl text-[#121217] cursor-pointer transition-colors"
              title="Reset View"
            >
              <RefreshCw className="w-4 h-4 text-[#6b6f82]" />
            </button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Graph Canvas */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-[#e3e6ed] dark:border-slate-800 rounded-3xl overflow-hidden relative shadow-xs" style={{ height: '620px' }}>
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-[#6b6f82]">
              <Loader2 className="w-8 h-8 text-[#4f75f2] animate-spin" />
              <span className="text-xs font-mono uppercase tracking-wider">Rendering Semantic Graph...</span>
            </div>
          ) : nodes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <Network className="w-16 h-16 text-[#cbd5e1] mb-4" />
              <h3 className="text-[#121217] font-bold text-lg">No Graph Data</h3>
              <p className="text-[#6b6f82] text-xs mt-1">Select a subject to render syllabus concept graph.</p>
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
                        stroke={isDark ? "#334155" : "#d0dcf5"} strokeWidth="2" strokeDasharray="4 4"
                      />
                      <rect
                        x={(src.x + tgt.x) / 2 - 35}
                        y={(src.y + tgt.y) / 2 - 10}
                        width="70"
                        height="18"
                        rx="6"
                        fill={isDark ? "#1e293b" : "white"}
                        stroke={isDark ? "#334155" : "#e3e6ed"}
                      />
                      <text
                        x={(src.x + tgt.x) / 2} y={(src.y + tgt.y) / 2 + 3}
                        textAnchor="middle" fontSize="8" fill={isDark ? "#94a3b8" : "#6b6f82"} fontWeight="600" fontFamily="sans-serif"
                      >
                        {edge.label}
                      </text>
                    </g>
                  );
                })}

                {/* Nodes */}
                {nodes.map(node => {
                  const colorConfig = isDark ? (DARK_NODE_COLORS[node.type] || DARK_NODE_COLORS.default) : (NODE_COLORS[node.type] || NODE_COLORS.default);
                  const ringColor = MASTERY_RING[node.mastery] || MASTERY_RING.none;
                  const isSelected = selectedNode?.id === node.id;
                  return (
                    <g
                      key={node.id}
                      onClick={() => setSelectedNode(isSelected ? null : node)}
                      className="cursor-pointer transition-transform hover:scale-105"
                      style={{ filter: isSelected ? 'drop-shadow(0 6px 16px rgba(79,117,242,0.25))' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.04))' }}
                    >
                      {/* Outer Mastery Halo */}
                      <circle cx={node.x} cy={node.y} r="32" fill={ringColor} opacity={isDark ? 0.35 : 0.18} />
                      {/* Main Node Circle */}
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r="24"
                        fill={colorConfig.fill}
                        stroke={isSelected ? '#4f75f2' : colorConfig.stroke}
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
                        y={node.y + 44}
                        textAnchor="middle"
                        fontSize="10"
                        fill={isDark ? "#f8fafc" : "#121217"}
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
              <div key={type} className="flex items-center gap-1.5 bg-white/95 dark:bg-slate-800/95 px-3 py-1 rounded-xl border border-[#e3e6ed] dark:border-slate-700 shadow-xs">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors.stroke }} />
                <span className="text-[10px] text-[#121217] dark:text-slate-200 font-bold">{type}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Node Detail Drawer */}
        <div className="space-y-6">
          {selectedNode ? (
            <div className="bg-white dark:bg-slate-900 border border-[#e3e6ed] dark:border-slate-800 rounded-3xl p-6 space-y-5 shadow-xs">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: NODE_COLORS[selectedNode.type]?.stroke || '#64748b' }}
                  />
                  <span className="text-[10px] font-mono font-bold text-[#6b6f82] uppercase">{selectedNode.type}</span>
                </div>
                <h3 className="text-xl font-extrabold text-[#121217] dark:text-white leading-tight">{selectedNode.label}</h3>
                <div className="mt-2.5 flex items-center gap-2">
                  <span className={`text-[10px] font-mono font-bold px-3 py-1 rounded-full uppercase border ${
                    selectedNode.mastery === 'weak' ? 'bg-[#fef2f2] text-[#dc2626] border-[#fecaca]' :
                    selectedNode.mastery === 'improving' ? 'bg-[#fbf5e6] text-[#b45309] border-[#f5e0b8]' :
                    selectedNode.mastery === 'strong' ? 'bg-[#e2f6eb] text-[#059669] border-[#a7f3d0]' :
                    'bg-[#f8f9fc] text-[#6b6f82] border-[#e3e6ed]'
                  }`}>
                    Retention: {selectedNode.mastery}
                  </span>
                </div>
              </div>

              {selectedNodePyqs.length > 0 && (
                <div className="pt-4 border-t border-[#e3e6ed]">
                  <h4 className="text-xs font-bold text-[#121217] uppercase mb-3 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-[#4f75f2]" /> Related Exam Questions
                  </h4>
                  <div className="space-y-2.5">
                    {selectedNodePyqs.map((q, i) => (
                      <div key={i} className="text-xs text-[#2d2d34] bg-[#f8f9fc] p-3.5 rounded-2xl border border-[#e3e6ed] leading-relaxed">
                        <div className="font-bold text-[#121217] mb-1">{q.markValue} Marks Weightage</div>
                        {q.questionText}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedNodeCards.length > 0 && (
                <div className="pt-4 border-t border-[#e3e6ed]">
                  <h4 className="text-xs font-bold text-[#121217] uppercase mb-3 flex items-center gap-1.5">
                    <BrainCircuit className="w-3.5 h-3.5 text-[#713fb8]" /> Associated Flashcard
                  </h4>
                  {selectedNodeCards.map((c, i) => (
                    <div key={i} className="text-xs bg-[#f8f9fc] p-3.5 rounded-2xl border border-[#e3e6ed] mb-2">
                      <div className="font-bold text-[#121217] mb-1">Q: {c.front}</div>
                      <div className="text-[#6b6f82]">A: {c.back}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-[#e3e6ed] dark:border-slate-800 border-dashed rounded-3xl p-8 text-center flex flex-col items-center justify-center min-h-[220px] shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-[#edf3fc] flex items-center justify-center mb-3 text-[#4f75f2]">
                <Sparkles className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-sm text-[#121217] dark:text-white">Concept Inspector</h4>
              <p className="text-xs text-[#6b6f82] dark:text-slate-400 mt-1 max-w-xs leading-relaxed">
                Click any concept node in the canvas to view detailed syllabus links, previous questions, and flashcards.
              </p>
            </div>
          )}

          {/* Mastery Key */}
          <div className="bg-white dark:bg-slate-900 border border-[#e3e6ed] dark:border-slate-800 rounded-3xl p-6 shadow-xs">
            <h4 className="text-[11px] font-mono font-bold text-[#6b6f82] uppercase mb-3.5 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-[#4f75f2]" /> Mastery Ring Key
            </h4>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs font-medium">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
                  <span className="text-[#121217] dark:text-slate-200 font-semibold">Strong Mastery (&gt;80%)</span>
                </div>
                <span className="font-mono text-[10px] text-[#059669] bg-[#e2f6eb] px-2 py-0.5 rounded-lg border border-[#a7f3d0]">High Retention</span>
              </div>
              <div className="flex items-center justify-between text-xs font-medium">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
                  <span className="text-[#121217] font-semibold">Improving (50-80%)</span>
                </div>
                <span className="font-mono text-[10px] text-[#b45309] bg-[#fbf5e6] px-2 py-0.5 rounded-lg border border-[#f5e0b8]">Review Due</span>
              </div>
              <div className="flex items-center justify-between text-xs font-medium">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
                  <span className="text-[#121217] font-semibold">Weak / Unassessed</span>
                </div>
                <span className="font-mono text-[10px] text-[#dc2626] bg-[#fef2f2] px-2 py-0.5 rounded-lg border border-[#fecaca]">Priority</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
