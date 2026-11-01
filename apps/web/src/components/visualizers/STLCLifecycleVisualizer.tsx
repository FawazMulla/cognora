import React, { useState } from 'react';
import { CheckSquare, ArrowRight, Layers, FileCheck, AlertCircle, RefreshCw } from 'lucide-react';

interface STLCPhase {
  id: string;
  name: string;
  shortName: string;
  activities: string[];
  deliverables: string[];
  entryCriteria: string[];
  exitCriteria: string[];
}

const STLC_PHASES: STLCPhase[] = [
  {
    id: "req",
    name: "1. Requirement Analysis",
    shortName: "Requirement",
    activities: [
      "Identify types of tests to be executed (functional, non-functional).",
      "Gather details about testing priorities and focus areas.",
      "Prepare Requirement Traceability Matrix (RTM).",
      "Identify test environment details where testing is supposed to be carried out."
    ],
    deliverables: ["RTM (Requirement Traceability Matrix)", "Automation Feasibility Report"],
    entryCriteria: ["BRS/SRS (System Requirement Specification) signed off", "Client acceptance criteria defined"],
    exitCriteria: ["RTM drafted and approved", "Test environment requirements documented"]
  },
  {
    id: "plan",
    name: "2. Test Planning",
    shortName: "Planning",
    activities: [
      "Prepare Test Plan according to IEEE 829 format.",
      "Estimate testing effort using Function Point or Work Breakdown Structure.",
      "Determine staffing, roles, and training requirements.",
      "Identify testing tools and licenses."
    ],
    deliverables: ["Test Plan / Strategy Document", "Effort Estimation Matrix", "Resource allocation matrix"],
    entryCriteria: ["RTM and requirement documents available"],
    exitCriteria: ["Test Plan approved by project management and QA leads"]
  },
  {
    id: "design",
    name: "3. Test Case Design",
    shortName: "Case Design",
    activities: [
      "Create test cases with preconditions, test steps, test data, and expected results.",
      "Apply black-box techniques (Boundary Value Analysis, Equivalence Partitioning).",
      "Develop automated test scripts (Selenium WebDriver, Cypress).",
      "Map test cases to requirements in RTM."
    ],
    deliverables: ["Test Cases Suite", "Test Data Sets", "Automation Test Scripts"],
    entryCriteria: ["Approved Test Plan document"],
    exitCriteria: ["Test cases reviewed and baselined", "Test data ready in test database"]
  },
  {
    id: "env",
    name: "4. Test Environment Setup",
    shortName: "Env Setup",
    activities: [
      "Set up test servers, databases, and network topologies.",
      "Deploy application build under test (AUT).",
      "Execute smoke testing to verify build stability before formal test cycles."
    ],
    deliverables: ["Test Environment ready", "Smoke Test Execution Report"],
    entryCriteria: ["Architecture design and environment specifications available"],
    exitCriteria: ["Environment verified and stable; smoke tests 100% passed"]
  },
  {
    id: "exec",
    name: "5. Test Execution",
    shortName: "Execution",
    activities: [
      "Execute test cases as per the test plan.",
      "Log bugs in defect tracking tools (JIRA, Bugzilla) with severity and reproduction steps.",
      "Retest fixed defects and execute regression test suites.",
      "Track defect metrics: Defect Density and Defect Age."
    ],
    deliverables: ["Test Execution Status Reports", "Logged Defect Reports (JIRA)", "RTM with test results"],
    entryCriteria: ["Test environment stable, test cases approved, test data loaded"],
    exitCriteria: ["All planned test cases executed, critical and major defects closed"]
  },
  {
    id: "close",
    name: "6. Test Closure",
    shortName: "Closure",
    activities: [
      "Evaluate test cycle completion criteria (test coverage, defect leakage).",
      "Calculate Defect Removal Efficiency (DRE) and test execution velocity.",
      "Conduct lessons-learned retrospective meeting.",
      "Archive test artifacts (test cases, scripts, environment config)."
    ],
    deliverables: ["Test Summary Report (IEEE 829)", "Quality Metrics Dashboard", "Retrospective Action Plan"],
    entryCriteria: ["Testing cycle complete, all critical bugs resolved"],
    exitCriteria: ["Test Closure Report signed off by client and stakeholders"]
  }
];

export default function STLCLifecycleVisualizer() {
  const [activePhaseIndex, setActivePhaseIndex] = useState<number>(0);
  const [bvaMin, setBvaMin] = useState<number>(18);
  const [bvaMax, setBvaMax] = useState<number>(60);
  const [testInput, setTestInput] = useState<number>(18);

  const activePhase = STLC_PHASES[activePhaseIndex];

  // BVA test values
  const bvaValues = [
    { label: "Min - 1 (Robust Invalid)", val: bvaMin - 1, valid: false },
    { label: "Min (Boundary Valid)", val: bvaMin, valid: true },
    { label: "Min + 1 (Boundary Valid)", val: bvaMin + 1, valid: true },
    { label: "Nominal (Mid Valid)", val: Math.round((bvaMin + bvaMax) / 2), valid: true },
    { label: "Max - 1 (Boundary Valid)", val: bvaMax - 1, valid: true },
    { label: "Max (Boundary Valid)", val: bvaMax, valid: true },
    { label: "Max + 1 (Robust Invalid)", val: bvaMax + 1, valid: false }
  ];

  const testStatus = testInput >= bvaMin && testInput <= bvaMax ? "VALID" : "INVALID";

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wider font-display">
              STLC Phase Navigator & Boundary Value Analysis Sandbox
            </h3>
            <span className="text-[10px] font-mono font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-800">
              STQA (ITD07014)
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Explore the 6 Software Testing Life Cycle phases (IEEE 829) and dynamically test black-box boundary values.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActivePhaseIndex((prev) => (prev > 0 ? prev - 1 : 5))}
            className="px-2.5 py-1 text-xs font-mono rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            ← Prev
          </button>
          <button
            onClick={() => setActivePhaseIndex((prev) => (prev < 5 ? prev + 1 : 0))}
            className="px-2.5 py-1 text-xs font-mono rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold"
          >
            Next Phase →
          </button>
        </div>
      </div>

      {/* STLC Stepper Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 my-4">
        {STLC_PHASES.map((phase, idx) => {
          const isActive = idx === activePhaseIndex;
          return (
            <button
              key={phase.id}
              onClick={() => setActivePhaseIndex(idx)}
              className={`p-2.5 rounded-xl border text-left font-mono transition-all relative ${
                isActive
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 dark:border-amber-600 text-amber-900 dark:text-amber-100 shadow-xs ring-2 ring-amber-500/20'
                  : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span className="text-[10px] text-amber-600 dark:text-amber-400 block font-bold">
                STAGE 0{idx + 1}
              </span>
              <span className="text-[11px] font-bold block truncate">
                {phase.shortName}
              </span>
            </button>
          );
        })}
      </div>

      {/* Phase Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-4">
        <div className="lg:col-span-7 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <span className="text-xs font-mono font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              {activePhase.name}
            </span>
            <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-bold bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded">
              Phase {activePhaseIndex + 1} of 6
            </span>
          </div>

          {/* Activities */}
          <div>
            <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-500" /> Core Engineering Activities:
            </span>
            <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 font-sans">
              {activePhase.activities.map((act, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  <span>{act}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Deliverables */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center gap-1.5">
              <FileCheck className="w-3.5 h-3.5 text-emerald-500" /> Key Deliverables & Artifacts:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {activePhase.deliverables.map((deliv, i) => (
                <span
                  key={i}
                  className="px-2 py-1 rounded text-[11px] font-mono bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-semibold"
                >
                  ✓ {deliv}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Boundary Value Analysis (BVA) Sandbox */}
        <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <span className="text-xs font-mono font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Boundary Value Sandbox
            </span>
            <span className="text-[10px] font-mono text-slate-500">Black-Box Testing</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div>
              <span className="text-slate-500 block text-[10px]">Min Bound:</span>
              <input
                type="number"
                value={bvaMin}
                onChange={e => setBvaMin(Number(e.target.value))}
                className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs font-bold"
              />
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Max Bound:</span>
              <input
                type="number"
                value={bvaMax}
                onChange={e => setBvaMax(Number(e.target.value))}
                className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs font-bold"
              />
            </div>
          </div>

          {/* Test Live Value */}
          <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1.5 font-mono">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-600 dark:text-slate-400">Evaluate Test Input:</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                testStatus === "VALID"
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                  : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
              }`}>
                {testStatus}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={testInput}
                onChange={e => setTestInput(Number(e.target.value))}
                className="flex-1 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs font-bold"
              />
              <span className="text-[11px] text-slate-500">[{bvaMin} .. {bvaMax}]</span>
            </div>
          </div>

          {/* Generated BVA Test Cases Table */}
          <div className="space-y-1 max-h-[160px] overflow-y-auto pr-1 text-[11px] font-mono">
            {bvaValues.map((item, idx) => (
              <div
                key={idx}
                className={`p-1.5 rounded border flex items-center justify-between ${
                  item.val === testInput
                    ? 'bg-amber-100 dark:bg-amber-950 border-amber-400 font-bold'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                }`}
              >
                <span className="text-slate-600 dark:text-slate-400">{item.label}</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-white">{item.val}</span>
                  <span className={`text-[9px] px-1 rounded ${
                    item.valid
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600'
                      : 'bg-rose-100 dark:bg-rose-950 text-rose-600'
                  }`}>
                    {item.valid ? "Pass" : "Fail"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

