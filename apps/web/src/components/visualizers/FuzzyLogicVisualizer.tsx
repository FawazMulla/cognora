import React, { useState, useMemo } from 'react';
import { Sliders, Cpu, ArrowRight, Zap, RefreshCw, Sparkles } from 'lucide-react';

export default function FuzzyLogicVisualizer() {
  const [dirtiness, setDirtiness] = useState<number>(65); // 0 to 100
  const [fabricWeight, setFabricWeight] = useState<number>(7); // 1 to 10

  // Calculate membership functions for Dirtiness: Low (0-40), Med (20-80), High (60-100)
  const dirtMu = useMemo(() => {
    // Low: triangular [0, 0, 40]
    let low = 0;
    if (dirtiness <= 20) low = 1;
    else if (dirtiness < 40) low = (40 - dirtiness) / 20;

    // Med: triangular [20, 50, 80]
    let med = 0;
    if (dirtiness >= 20 && dirtiness <= 50) med = (dirtiness - 20) / 30;
    else if (dirtiness > 50 && dirtiness <= 80) med = (80 - dirtiness) / 30;

    // High: triangular [60, 100, 100]
    let high = 0;
    if (dirtiness >= 60 && dirtiness <= 80) high = (dirtiness - 60) / 20;
    else if (dirtiness > 80) high = 1;

    return { low, med, high };
  }, [dirtiness]);

  // Calculate membership functions for Fabric: Delicate (1-4), Normal (3-8), Heavy (6-10)
  const fabricMu = useMemo(() => {
    let delicate = 0;
    if (fabricWeight <= 2) delicate = 1;
    else if (fabricWeight < 5) delicate = (5 - fabricWeight) / 3;

    let normal = 0;
    if (fabricWeight >= 3 && fabricWeight <= 5.5) normal = (fabricWeight - 3) / 2.5;
    else if (fabricWeight > 5.5 && fabricWeight <= 8) normal = (8 - fabricWeight) / 2.5;

    let heavy = 0;
    if (fabricWeight >= 6 && fabricWeight <= 8) heavy = (fabricWeight - 6) / 2;
    else if (fabricWeight > 8) heavy = 1;

    return { delicate, normal, heavy };
  }, [fabricWeight]);

  // Mamdani Rule Base (Min operator for AND):
  // R1: IF Dirt=Low AND Fabric=Delicate THEN WashTime=Short (15m)
  // R2: IF Dirt=Low AND Fabric=Normal THEN WashTime=Short (18m)
  // R3: IF Dirt=Med AND Fabric=Normal THEN WashTime=Medium (35m)
  // R4: IF Dirt=High AND Fabric=Normal THEN WashTime=Long (50m)
  // R5: IF Dirt=High AND Fabric=Heavy THEN WashTime=VeryLong (65m)
  const rules = useMemo(() => {
    const r1 = Math.min(dirtMu.low, fabricMu.delicate); // Short
    const r2 = Math.min(dirtMu.low, fabricMu.normal);   // Short
    const r3 = Math.min(dirtMu.med, fabricMu.normal);   // Medium
    const r4 = Math.min(dirtMu.high, fabricMu.normal);  // Long
    const r5 = Math.min(dirtMu.high, fabricMu.heavy);   // VeryLong

    const shortStrength = Math.max(r1, r2);
    const medStrength = r3;
    const longStrength = r4;
    const veryLongStrength = r5;

    // Defuzzification: Center of Gravity (Centroid) across discrete points z from 10 to 75
    // Short centroid ~ 15m, Med ~ 35m, Long ~ 50m, VeryLong ~ 65m
    const num = shortStrength * 15 + medStrength * 35 + longStrength * 50 + veryLongStrength * 65;
    const den = shortStrength + medStrength + longStrength + veryLongStrength;
    const crispWashTime = den > 0 ? (num / den) : 30;

    return {
      r1, r2, r3, r4, r5,
      shortStrength,
      medStrength,
      longStrength,
      veryLongStrength,
      crispWashTime: Math.round(crispWashTime)
    };
  }, [dirtMu, fabricMu]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wider font-display">
              Mamdani Fuzzy Controller & Centroid Defuzzifier
            </h3>
            <span className="text-[10px] font-mono font-bold bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-300 dark:border-indigo-800">
              Washing Machine Model
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Simulate continuous linguistic variable fuzzification, Min-Max rule aggregation, and Center of Gravity defuzzification.
          </p>
        </div>

        <button
          onClick={() => { setDirtiness(50); setFabricWeight(5); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Default Inputs
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-4">
        {/* Sliders & Inputs */}
        <div className="lg:col-span-5 space-y-4">
          {/* Dirtiness Slider */}
          <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-2">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="font-bold text-slate-700 dark:text-slate-300">Input 1: Dirtiness Level</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                {dirtiness}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={dirtiness}
              onChange={e => setDirtiness(Number(e.target.value))}
              className="w-full accent-indigo-600 h-2 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
            />
            {/* Fuzzified Degrees */}
            <div className="grid grid-cols-3 gap-1.5 text-[11px] font-mono text-center pt-1">
              <div className="p-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 block text-[9px]">Low</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{dirtMu.low.toFixed(2)}</span>
              </div>
              <div className="p-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 block text-[9px]">Medium</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{dirtMu.med.toFixed(2)}</span>
              </div>
              <div className="p-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 block text-[9px]">High</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{dirtMu.high.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Fabric Weight Slider */}
          <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-2">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="font-bold text-slate-700 dark:text-slate-300">Input 2: Fabric Thickness</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                Level {fabricWeight} / 10
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              step="0.5"
              value={fabricWeight}
              onChange={e => setFabricWeight(Number(e.target.value))}
              className="w-full accent-indigo-600 h-2 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
            />
            {/* Fuzzified Degrees */}
            <div className="grid grid-cols-3 gap-1.5 text-[11px] font-mono text-center pt-1">
              <div className="p-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 block text-[9px]">Delicate</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{fabricMu.delicate.toFixed(2)}</span>
              </div>
              <div className="p-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 block text-[9px]">Normal</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{fabricMu.normal.toFixed(2)}</span>
              </div>
              <div className="p-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 block text-[9px]">Heavy</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{fabricMu.heavy.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Crisp Output Gauge */}
          <div className="bg-indigo-600 text-white rounded-xl p-4 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-indigo-200 block">
                Centroid Output (z*)
              </span>
              <span className="text-2xl font-bold font-mono">
                {rules.crispWashTime} <span className="text-sm font-normal text-indigo-200">Minutes</span>
              </span>
              <span className="text-[10px] text-indigo-100 block mt-0.5">
                Defuzzified via Center of Gravity z* = (∑ z·μ) / (∑ μ)
              </span>
            </div>
            <div className="w-12 h-12 rounded-full border-4 border-white/30 flex items-center justify-center font-bold text-sm">
              {rules.crispWashTime}m
            </div>
          </div>
        </div>

        {/* Right Column: Rule Execution Matrix */}
        <div className="lg:col-span-7">
          <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-3">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">
              Active Mamdani Inference Rules (Min Operator):
            </span>

            <div className="space-y-2 text-xs font-mono">
              {[
                { name: "Rule 1", desc: "IF Dirt=Low AND Fabric=Delicate THEN Time=Short", firing: rules.r1, target: "Short (15m)" },
                { name: "Rule 2", desc: "IF Dirt=Low AND Fabric=Normal THEN Time=Short", firing: rules.r2, target: "Short (18m)" },
                { name: "Rule 3", desc: "IF Dirt=Med AND Fabric=Normal THEN Time=Medium", firing: rules.r3, target: "Medium (35m)" },
                { name: "Rule 4", desc: "IF Dirt=High AND Fabric=Normal THEN Time=Long", firing: rules.r4, target: "Long (50m)" },
                { name: "Rule 5", desc: "IF Dirt=High AND Fabric=Heavy THEN Time=VeryLong", firing: rules.r5, target: "VeryLong (65m)" }
              ].map(r => (
                <div
                  key={r.name}
                  className={`p-2.5 rounded-lg border flex items-center justify-between transition-all ${
                    r.firing > 0.05
                      ? 'bg-white dark:bg-slate-900 border-indigo-400 dark:border-indigo-700 shadow-2xs'
                      : 'bg-slate-100/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60'
                  }`}
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px] block">{r.name}:</span>
                    <span className="text-[11px] text-slate-600 dark:text-slate-400">{r.desc}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                      r.firing > 0.05
                        ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                    }`}>
                      α = {r.firing.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Aggregated Output Levels */}
            <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px] font-mono text-center">
              <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 block text-[9px]">Short Clip</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{rules.shortStrength.toFixed(2)}</span>
              </div>
              <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 block text-[9px]">Medium Clip</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{rules.medStrength.toFixed(2)}</span>
              </div>
              <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 block text-[9px]">Long Clip</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{rules.longStrength.toFixed(2)}</span>
              </div>
              <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 block text-[9px]">V.Long Clip</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{rules.veryLongStrength.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

