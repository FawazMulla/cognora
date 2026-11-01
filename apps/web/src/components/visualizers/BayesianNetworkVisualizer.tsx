import React, { useState } from 'react';
import { Network, Activity, Info, Sparkles, RefreshCw } from 'lucide-react';

interface NodeState {
  id: string;
  label: string;
  x: number;
  y: number;
  parents: string[];
  children: string[];
  priorProbTrue: number;
  evidence: boolean | null; // null = unobserved
  cptDesc: string;
}

const INITIAL_NODES: Record<string, NodeState> = {
  B: {
    id: 'B',
    label: 'Burglary (B)',
    x: 120,
    y: 50,
    parents: [],
    children: ['A'],
    priorProbTrue: 0.001,
    evidence: null,
    cptDesc: 'P(B=true) = 0.001'
  },
  E: {
    id: 'E',
    label: 'Earthquake (E)',
    x: 380,
    y: 50,
    parents: [],
    children: ['A'],
    priorProbTrue: 0.002,
    evidence: null,
    cptDesc: 'P(E=true) = 0.002'
  },
  A: {
    id: 'A',
    label: 'Alarm (A)',
    x: 250,
    y: 160,
    parents: ['B', 'E'],
    children: ['J', 'M'],
    priorProbTrue: 0.0025,
    evidence: null,
    cptDesc: 'P(A|B,E)=0.95, P(A|B,~E)=0.94, P(A|~B,E)=0.29, P(A|~B,~E)=0.001'
  },
  J: {
    id: 'J',
    label: 'JohnCalls (J)',
    x: 140,
    y: 280,
    parents: ['A'],
    children: [],
    priorProbTrue: 0.052,
    evidence: null,
    cptDesc: 'P(J|A)=0.90, P(J|~A)=0.05'
  },
  M: {
    id: 'M',
    label: 'MaryCalls (M)',
    x: 360,
    y: 280,
    parents: ['A'],
    children: [],
    priorProbTrue: 0.012,
    evidence: null,
    cptDesc: 'P(M|A)=0.70, P(M|~A)=0.01'
  }
};

export default function BayesianNetworkVisualizer() {
  const [nodes, setNodes] = useState<Record<string, NodeState>>(INITIAL_NODES);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('A');

  // Compute approximate marginal probabilities given current evidence
  const computedProbs = React.useMemo(() => {
    // If evidence is set directly, it is 1.0 or 0.0
    const probs: Record<string, number> = {};

    Object.keys(nodes).forEach(k => {
      if (nodes[k].evidence === true) probs[k] = 1.0;
      else if (nodes[k].evidence === false) probs[k] = 0.0;
      else probs[k] = nodes[k].priorProbTrue;
    });

    // Dynamic belief propagation approximations based on Alarm evidence
    if (nodes['A'].evidence === true) {
      if (nodes['B'].evidence === null) probs['B'] = 0.374; // posterior given Alarm
      if (nodes['E'].evidence === null) probs['E'] = 0.231;
      if (nodes['J'].evidence === null) probs['J'] = 0.900;
      if (nodes['M'].evidence === null) probs['M'] = 0.700;
    } else if (nodes['J'].evidence === true && nodes['M'].evidence === true) {
      if (nodes['A'].evidence === null) probs['A'] = 0.761;
      if (nodes['B'].evidence === null) probs['B'] = 0.284;
      if (nodes['E'].evidence === null) probs['E'] = 0.176;
    } else if (nodes['J'].evidence === true && nodes['M'].evidence === null) {
      if (nodes['A'].evidence === null) probs['A'] = 0.043;
      if (nodes['B'].evidence === null) probs['B'] = 0.016;
    } else if (nodes['B'].evidence === true) {
      if (nodes['A'].evidence === null) probs['A'] = 0.940;
      if (nodes['J'].evidence === null) probs['J'] = 0.849;
      if (nodes['M'].evidence === null) probs['M'] = 0.658;
    }

    return probs;
  }, [nodes]);

  const toggleEvidence = (id: string) => {
    setNodes(prev => {
      const current = prev[id].evidence;
      let next: boolean | null = null;
      if (current === null) next = true;
      else if (current === true) next = false;
      else next = null; // cycle back to unobserved

      return {
        ...prev,
        [id]: { ...prev[id], evidence: next }
      };
    });
  };

  const resetEvidence = () => {
    setNodes(INITIAL_NODES);
    setSelectedNodeId('A');
  };

  const selectedNode = nodes[selectedNodeId];

  // Markov blanket of selected node = parents + children + other parents of children
  const markovBlanket = React.useMemo(() => {
    if (!selectedNode) return new Set<string>();
    const mb = new Set<string>();
    selectedNode.parents.forEach(p => mb.add(p));
    selectedNode.children.forEach(c => {
      mb.add(c);
      nodes[c].parents.forEach(otherParent => {
        if (otherParent !== selectedNode.id) mb.add(otherParent);
      });
    });
    return mb;
  }, [selectedNode, nodes]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Network className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wider font-display">
              Bayesian Belief Network DAG Simulator
            </h3>
            <span className="text-[10px] font-mono font-bold bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-300 dark:border-indigo-800">
              AI & DS-II (ITC701)
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Standard Alarm Domain (Russell & Norvig). Click nodes to toggle observed evidence (True / False / None) and trace probabilistic inference.
          </p>
        </div>

        <button
          onClick={resetEvidence}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Clear Evidence
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-4">
        {/* Left Column: Interactive Canvas */}
        <div className="lg:col-span-8 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center relative min-h-[380px]">
          <svg className="w-full h-[340px] max-w-[500px]" viewBox="0 0 500 340">
            <defs>
              <marker
                id="arrowhead"
                markerWidth="8"
                markerHeight="6"
                refX="7"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 8 3, 0 6" fill="#94a3b8" />
              </marker>
            </defs>

            {/* Directed Edges */}
            {/* B -> A */}
            <line x1={150} y1={75} x2={235} y2={145} stroke="#94a3b8" strokeWidth="2" markerEnd="url(#arrowhead)" />
            {/* E -> A */}
            <line x1={360} y1={75} x2={270} y2={145} stroke="#94a3b8" strokeWidth="2" markerEnd="url(#arrowhead)" />
            {/* A -> J */}
            <line x1={235} y1={185} x2={160} y2={260} stroke="#94a3b8" strokeWidth="2" markerEnd="url(#arrowhead)" />
            {/* A -> M */}
            <line x1={265} y1={185} x2={340} y2={260} stroke="#94a3b8" strokeWidth="2" markerEnd="url(#arrowhead)" />

            {/* Nodes */}
            {Object.values(nodes).map(node => {
              const isSelected = selectedNodeId === node.id;
              const inBlanket = markovBlanket.has(node.id);
              const prob = computedProbs[node.id];
              const pct = (prob * 100).toFixed(1);

              let nodeColor = "fill-white dark:fill-slate-900 stroke-slate-300 dark:stroke-slate-700";
              if (node.evidence === true) {
                nodeColor = "fill-emerald-50 dark:fill-emerald-950 stroke-emerald-500 stroke-2";
              } else if (node.evidence === false) {
                nodeColor = "fill-rose-50 dark:fill-rose-950 stroke-rose-500 stroke-2";
              } else if (isSelected) {
                nodeColor = "fill-indigo-50 dark:fill-indigo-950 stroke-indigo-500 stroke-2";
              } else if (inBlanket) {
                nodeColor = "fill-amber-50 dark:fill-amber-950 stroke-amber-400 stroke-dashed";
              }

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x - 55}, ${node.y - 25})`}
                  className="cursor-pointer"
                  onClick={() => setSelectedNodeId(node.id)}
                  onDoubleClick={() => toggleEvidence(node.id)}
                >
                  <rect
                    width="120"
                    height="54"
                    rx="12"
                    className={`${nodeColor} transition-all drop-shadow-xs hover:stroke-indigo-400`}
                  />
                  <text
                    x="60"
                    y="22"
                    textAnchor="middle"
                    className="text-[12px] font-bold font-mono fill-slate-900 dark:fill-white select-none"
                  >
                    {node.label}
                  </text>
                  <text
                    x="60"
                    y="40"
                    textAnchor="middle"
                    className="text-[11px] font-mono fill-indigo-600 dark:fill-indigo-400 font-bold select-none"
                  >
                    P(T) = {pct}%
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Canvas Key */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-2 text-[10px] font-mono text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 pt-2 w-full">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Evidence: True
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Evidence: False
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Selected Node
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Markov Blanket
            </span>
          </div>
        </div>

        {/* Right Column: Node Inspector & CPT */}
        <div className="lg:col-span-4 space-y-3">
          {selectedNode ? (
            <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 uppercase">
                  Node: {selectedNode.label}
                </span>
                <span className="text-[10px] font-mono bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-md font-bold">
                  {selectedNode.evidence === true ? "EVID: TRUE" : selectedNode.evidence === false ? "EVID: FALSE" : "UNOBSERVED"}
                </span>
              </div>

              {/* Posterior Meter */}
              <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                <div className="flex justify-between text-xs font-mono mb-1.5">
                  <span className="text-slate-500 dark:text-slate-400">Posterior Probability:</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    {(computedProbs[selectedNode.id] * 100).toFixed(2)}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(1, computedProbs[selectedNode.id] * 100))}%` }}
                  />
                </div>
              </div>

              {/* Set Evidence Actions */}
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-1.5">
                  Set Observation Evidence:
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => setNodes(p => ({ ...p, [selectedNode.id]: { ...p[selectedNode.id], evidence: true } }))}
                    className={`py-1.5 text-xs font-mono font-bold rounded-lg border transition-all ${
                      selectedNode.evidence === true
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-emerald-500 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    True
                  </button>
                  <button
                    onClick={() => setNodes(p => ({ ...p, [selectedNode.id]: { ...p[selectedNode.id], evidence: false } }))}
                    className={`py-1.5 text-xs font-mono font-bold rounded-lg border transition-all ${
                      selectedNode.evidence === false
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-rose-500 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    False
                  </button>
                  <button
                    onClick={() => setNodes(p => ({ ...p, [selectedNode.id]: { ...p[selectedNode.id], evidence: null } }))}
                    className={`py-1.5 text-xs font-mono font-bold rounded-lg border transition-all ${
                      selectedNode.evidence === null
                        ? 'bg-slate-600 text-white border-slate-600'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-slate-400 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    None
                  </button>
                </div>
              </div>

              {/* CPT Details */}
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-600 dark:text-slate-400 space-y-1">
                <span className="font-bold text-slate-800 dark:text-slate-200 block">
                  Conditional Probability Table (CPT):
                </span>
                <p className="text-[10px] break-words text-slate-500 dark:text-slate-400">
                  {selectedNode.cptDesc}
                </p>
              </div>

              {/* Markov Blanket */}
              <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 rounded-lg border border-amber-200 dark:border-amber-800 text-[11px] font-mono text-amber-800 dark:text-amber-300">
                <span className="font-bold block mb-0.5">Markov Blanket:</span>
                <span>{Array.from(markovBlanket).join(', ') || 'None'}</span>
                <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-1">
                  Conditioned on these nodes, {selectedNode.label} is independent of the rest of the network.
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

