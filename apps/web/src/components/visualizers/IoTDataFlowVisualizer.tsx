import React, { useState } from 'react';
import { Wifi, Server, Radio, ArrowRight, Play, CheckCircle2, ShieldCheck, RefreshCw } from 'lucide-react';

export default function IoTDataFlowVisualizer() {
  const [topic, setTopic] = useState<string>("agri/farm1/soil_moisture");
  const [payloadVal, setPayloadVal] = useState<number>(28); // e.g. 28% moisture
  const [qosLevel, setQosLevel] = useState<0 | 1 | 2>(1);
  const [animating, setAnimating] = useState<boolean>(false);
  const [activeStep, setActiveStep] = useState<number>(0);

  const triggerPublish = () => {
    if (animating) return;
    setAnimating(true);
    setActiveStep(1); // Edge
    setTimeout(() => {
      setActiveStep(2); // Broker
      setTimeout(() => {
        setActiveStep(3); // Consumer
        setTimeout(() => {
          setAnimating(false);
        }, 1000);
      }, 900);
    }, 800);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wider font-display">
              IoT Architecture & MQTT Message Flow Simulator
            </h3>
            <span className="text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
              IOE (ITC702)
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Simulate sensor telemetry transmission, Edge filtering, and MQTT Broker Publish-Subscribe message routing with QoS 0/1/2 handshakes.
          </p>
        </div>

        <button
          onClick={triggerPublish}
          disabled={animating}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white transition-all shadow-sm"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          {animating ? "Transmitting..." : "Publish Telemetry"}
        </button>
      </div>

      {/* Simulator Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
        {/* Topic Selector */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 font-mono text-xs">
          <span className="text-[10px] text-slate-500 block uppercase font-bold mb-1">MQTT Topic:</span>
          <select
            value={topic}
            onChange={e => setTopic(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-800 dark:text-slate-200 font-mono"
          >
            <option value="agri/farm1/soil_moisture">agri/farm1/soil_moisture</option>
            <option value="home/livingroom/temperature">home/livingroom/temperature</option>
            <option value="city/street4/lux_level">city/street4/lux_level</option>
            <option value="factory/boiler/vibration">factory/boiler/vibration</option>
          </select>
        </div>

        {/* Telemetry Value */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 font-mono text-xs">
          <div className="flex justify-between text-[10px] text-slate-500 font-bold uppercase mb-1">
            <span>Sensor Reading:</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">{payloadVal}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={payloadVal}
            onChange={e => setPayloadVal(Number(e.target.value))}
            className="w-full accent-emerald-600 h-2 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
          />
        </div>

        {/* QoS Selector */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 font-mono text-xs">
          <span className="text-[10px] text-slate-500 block uppercase font-bold mb-1">Quality of Service (QoS):</span>
          <div className="grid grid-cols-3 gap-1">
            {([0, 1, 2] as const).map(lvl => (
              <button
                key={lvl}
                onClick={() => setQosLevel(lvl)}
                className={`py-1 rounded text-center font-bold text-xs border transition-all ${
                  qosLevel === lvl
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-emerald-400'
                }`}
              >
                QoS {lvl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4-Tier IoT Architecture Diagram */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 my-4">
        {/* Tier 1: Sensing */}
        <div className={`p-4 rounded-xl border font-mono transition-all ${
          activeStep === 0 || animating
            ? 'bg-white dark:bg-slate-900 border-emerald-400 dark:border-emerald-600 shadow-xs ring-2 ring-emerald-500/20'
            : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <Radio className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase">1. Perception</span>
          </div>
          <span className="text-[10px] text-slate-400 block mb-1">ESP32 + Capacitive Sensor</span>
          <div className="p-2 rounded bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-700 dark:text-slate-300">
            Payload: <code className="font-bold text-emerald-600 dark:text-emerald-400">{payloadVal}%</code>
          </div>
        </div>

        {/* Tier 2: Edge */}
        <div className={`p-4 rounded-xl border font-mono transition-all ${
          activeStep === 1
            ? 'bg-white dark:bg-slate-900 border-emerald-400 dark:border-emerald-600 shadow-xs ring-2 ring-emerald-500/20'
            : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <Wifi className="w-4 h-4 text-sky-500" />
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase">2. Edge Gateway</span>
          </div>
          <span className="text-[10px] text-slate-400 block mb-1">Local Gateway Filter</span>
          <div className="p-2 rounded bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-700 dark:text-slate-300">
            Protocol: <code className="font-bold text-sky-600 dark:text-sky-400">MQTT over TCP</code>
          </div>
        </div>

        {/* Tier 3: Broker */}
        <div className={`p-4 rounded-xl border font-mono transition-all ${
          activeStep === 2
            ? 'bg-white dark:bg-slate-900 border-emerald-400 dark:border-emerald-600 shadow-xs ring-2 ring-emerald-500/20'
            : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <Server className="w-4 h-4 text-indigo-500" />
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase">3. MQTT Broker</span>
          </div>
          <span className="text-[10px] text-slate-400 block mb-1">EMQX / Mosquitto Cloud</span>
          <div className="p-2 rounded bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-700 dark:text-slate-300">
            Routing: <code className="font-bold text-indigo-600 dark:text-indigo-400">{topic}</code>
          </div>
        </div>

        {/* Tier 4: Application */}
        <div className={`p-4 rounded-xl border font-mono transition-all ${
          activeStep === 3
            ? 'bg-white dark:bg-slate-900 border-emerald-400 dark:border-emerald-600 shadow-xs ring-2 ring-emerald-500/20'
            : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase">4. Subscriber</span>
          </div>
          <span className="text-[10px] text-slate-400 block mb-1">Actuator / Dashboard</span>
          <div className="p-2 rounded bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-700 dark:text-slate-300">
            Actuation: <code className="font-bold text-emerald-600 dark:text-emerald-400">{payloadVal < 30 ? "RELAY ON (PUMP)" : "IDLE"}</code>
          </div>
        </div>
      </div>

      {/* QoS Handshake Explanation Footnote */}
      <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-mono space-y-1">
        <span className="font-bold text-slate-800 dark:text-slate-200 block">
          Active Handshake: QoS {qosLevel} ({
            qosLevel === 0 ? "At most once — Fire and forget" :
            qosLevel === 1 ? "At least once — PUBLISH + PUBACK (Duplicate possible)" :
            "Exactly once — 4-step handshake (PUBLISH -> PUBREC -> PUBREL -> PUBCOMP)"
          })
        </span>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Fixed Header Overhead: 2 Bytes (Control Packet Type + Remaining Length). Ideal for low-bandwidth cellular & satellite IoT connections.
        </p>
      </div>
    </div>
  );
}

