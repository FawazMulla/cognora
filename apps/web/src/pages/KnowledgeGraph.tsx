import { useEffect, useState, useRef } from 'react';
import { Network, Loader2, ZoomIn, ZoomOut, RefreshCw, BookOpen, BrainCircuit, Sparkles } from 'lucide-react';
import { fetchApi } from '../lib/api';

type Subject = { id: string; name: string };
type KGNode = { id: string; label: string; type: string; mastery: string; x: number; y: number };
type KGEdge = { source: string; target: string; label: string };
type PYQ = { id: string; questionText: string; markValue: number };
type Card = { id: string; front: string; back: string };

const NODE_COLORS: Record<string, string> = {
  Algorithm: '#6366f1',
  Concept: '#8b5cf6',
  Property: '#06b6d4',
  Component: '#14b8a6',
  System: '#f59e0b',
  'Data Structure': '#ec4899',
  default: '#64748b'
};

const MASTERY_RING: Record<string, string> = {
  weak: '#f43f5e',
  improving: '#f59e0b',
  strong: '#10b981',
  none: '#475569'
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
        if (res.subjects?.length > 0) {
          setSubjects(res.subjects);
          setSelectedSubjectId(res.subjects[0].id);
        }
      } catch (err) { console.error(err); }
    }
    loadSubjects();
  }, []);

  useEffect(() => {
    if (!selectedSubjectId) return;
    async function loadGraph() {
      setLoading(true);
      setSelectedNode(null);
      try {
        const res = await fetchApi(`/api/subjects/${selectedSubjectId}/knowledge-graph`);
        setNodes(res.nodes || []);
        setEdges(res.edges || []);
        setPyqs(res.pyqs || []);
        setCards(res.cards || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    loadGraph();
  }, [selectedSubjectId]);

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
    setZoom(z => Math.min(3, Math.max(0.3, z + delta)));
  };

  const selectedNodePyqs = selectedNode ? pyqs.slice(0, 3) : [];
  const selectedNodeCards = selectedNode ? cards.slice(0, 2) : [];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto min-h-screen font-sans text-slate-100 space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight flex items-center gap-3 bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
            <Network className="w-9 h-9 text-teal-500" /> Knowledge Graph
            {nodes.length > 0 && (
              <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded-full border border-slate-700">
                {nodes.length} concepts
              </span>
            )}
          </h1>
          <p className="text-slate-400 mt-2 text-sm">Interactive concept map extracted from your notes and resources. Click nodes to explore.</p>
        </div>

        <div className="flex items-center gap-3">
          {subjects.length > 0 && (
            <select
              value={selectedSubjectId}
              onChange={e => setSelectedSubjectId(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-teal-500 cursor-pointer"
            >
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          )}
          <div className="flex gap-1">
            <button onClick={() => setZoom(z => Math.min(3, z + 0.2))} className="p-2 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl text-slate-300 cursor-pointer transition-colors">
              <ZoomIn className="w-4 h-4" />
            </button>
            <button onClick={() => setZoom(z => Math.max(0.3, z - 0.2))} className="p-2 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl text-slate-300 cursor-pointer transition-colors">
              <ZoomOut className="w-4 h-4" />
            </button>
            <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} className="p-2 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl text-slate-300 cursor-pointer transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Graph Canvas */}
        <div className="lg:col-span-3 bg-slate-900/40 border border-slate-800/80 rounded-3xl overflow-hidden relative" style={{ height: '580px' }}>
          {loading ? (
            <div className="flex items-center justify-center h-full gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
              <span className="text-sm">Building knowledge graph...</span>
            </div>
          ) : nodes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <Network className="w-16 h-16 text-slate-600 mb-4" />
              <h3 className="text-slate-300 font-bold">No Graph Data Yet</h3>
              <p className="text-slate-500 text-sm mt-1">Upload notes or resources to auto-build your concept map.</p>
            </div>
          ) : (
            <svg
              ref={svgRef}
              width="100%" height="100%"
              className="cursor-grab active:cursor-grabbing"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
            >
              <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
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
                        stroke="rgba(99,102,241,0.25)" strokeWidth="1.5"
                      />
                      <text
                        x={(src.x + tgt.x) / 2} y={(src.y + tgt.y) / 2 - 4}
                        textAnchor="middle" fontSize="7" fill="rgba(148,163,184,0.5)" fontFamily="sans-serif"
                      >
                        {edge.label}
                      </text>
                    </g>
                  );
                })}
                {/* Nodes */}
                {nodes.map(node => {
                  const color = NODE_COLORS[node.type] || NODE_COLORS.default;
                  const ringColor = MASTERY_RING[node.mastery] || MASTERY_RING.none;
                  const isSelected = selectedNode?.id === node.id;
                  return (
                    <g key={node.id} onClick={() => setSelectedNode(isSelected ? null : node)}
                      className="cursor-pointer"
                      style={{ filter: isSelected ? 'drop-shadow(0 0 12px rgba(99,102,241,0.8))' : 'none' }}
                    >
                      <circle cx={node.x} cy={node.y} r="28" fill={ringColor} opacity="0.2" />
                      <circle cx={node.x} cy={node.y} r="22" fill={color} fillOpacity="0.9" stroke={ringColor} strokeWidth={isSelected ? 3 : 1.5} />
                      <text x={node.x} y={node.y} textAnchor="middle" dominantBaseline="middle"
                        fontSize="8" fill="white" fontWeight="700" fontFamily="sans-serif"
                      >
                        {node.label.slice(0, 8)}
                      </text>
                      <text x={node.x} y={node.y + 35} textAnchor="middle"
                        fontSize="7" fill="rgb(148,163,184)" fontFamily="sans-serif"
                      >
                        {node.label}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>
          )}

          {/* Legend */}
          <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
            {Object.entries(NODE_COLORS).filter(([k]) => k !== 'default').slice(0, 5).map(([type, color]) => (
              <div key={type} className="flex items-center gap-1.5 bg-slate-950/80 px-2 py-1 rounded-lg border border-slate-800/60">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-[9px] text-slate-400 font-semibold">{type}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Node Info Panel */}
        <div className="space-y-4">
          {selectedNode ? (
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-5 space-y-4 backdrop-blur-xl">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: NODE_COLORS[selectedNode.type] || '#64748b' }} />
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{selectedNode.type}</span>
                </div>
                <h3 className="text-lg font-bold text-white">{selectedNode.label}</h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded mt-1 inline-block ${
                  selectedNode.mastery === 'weak' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                  selectedNode.mastery === 'improving' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                  selectedNode.mastery === 'strong' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                  'bg-slate-800 text-slate-500 border border-slate-700'
                }`}>{selectedNode.mastery.toUpperCase()}</span>
              </div>

              {selectedNodePyqs.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" /> Related PYQs
                  </h4>
                  <div className="space-y-2">
                    {selectedNodePyqs.map((q, i) => (
                      <div key={i} className="text-[10px] text-slate-400 bg-slate-950/60 p-2 rounded-lg border border-slate-800/40 leading-relaxed">
                        {q.questionText?.slice(0, 80)}...
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedNodeCards.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-1.5">
                    <BrainCircuit className="w-3.5 h-3.5" /> Flashcards
                  </h4>
                  {selectedNodeCards.map((c, i) => (
                    <div key={i} className="text-[10px] text-slate-400 bg-slate-950/60 p-2 rounded-lg border border-slate-800/40 mb-2">
                      <div className="font-bold text-slate-300 mb-1">{c.front?.slice(0, 60)}</div>
                      <div className="text-slate-500">{c.back?.slice(0, 60)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-5 text-center flex flex-col items-center justify-center min-h-[180px]">
              <Sparkles className="w-8 h-8 text-slate-600 mb-3" />
              <p className="text-xs text-slate-500">Click any concept node to see related PYQs and flashcards.</p>
            </div>
          )}

          {/* Mastery legend */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-3">Mastery Key</h4>
            {Object.entries(MASTERY_RING).filter(([k]) => k !== 'none').map(([key, color]) => (
              <div key={key} className="flex items-center gap-2 mb-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-xs text-slate-400 capitalize font-semibold">{key}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
