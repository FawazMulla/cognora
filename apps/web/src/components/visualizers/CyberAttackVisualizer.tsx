import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle, Mail, Eye, Lock, RefreshCw } from 'lucide-react';

interface KillChainStep {
  step: number;
  name: string;
  attackerGoal: string;
  defenderCountermeasure: string;
}

const KILL_CHAIN: KillChainStep[] = [
  { step: 1, name: "Reconnaissance", attackerGoal: "Harvest email addresses, employee identities, and DNS records.", defenderCountermeasure: "OSINT monitoring, threat intelligence feeds." },
  { step: 2, name: "Weaponization", attackerGoal: "Couple exploit payload with document (PDF/Word macro).", defenderCountermeasure: "Endpoint detection and response (EDR), threat hunting." },
  { step: 3, name: "Delivery", attackerGoal: "Transmit malicious payload via spear-phishing email or USB.", defenderCountermeasure: "Email filtering (SPF, DKIM, DMARC), user awareness training." },
  { step: 4, name: "Exploitation", attackerGoal: "Trigger exploit code to bypass OS memory protections (Buffer Overflow).", defenderCountermeasure: "Patch management, DEP (Data Execution Prevention), ASLR." },
  { step: 5, name: "Installation", attackerGoal: "Install backdoor or remote access trojan (RAT) on victim host.", defenderCountermeasure: "Application whitelisting, file integrity monitoring." },
  { step: 6, name: "Command & Control", attackerGoal: "Establish bidirectional beaconing with external C2 server.", defenderCountermeasure: "Network egress filtering, DNS sinkholing, NIDS." },
  { step: 7, name: "Actions on Objectives", attackerGoal: "Exfiltrate proprietary data or execute ransomware encryption.", defenderCountermeasure: "Data loss prevention (DLP), air-gapped immutable backups." }
];

export default function CyberAttackVisualizer() {
  const [selectedChainStep, setSelectedChainStep] = useState<number>(3); // Delivery
  const [revealedFlags, setRevealedFlags] = useState<Set<number>>(new Set());

  const toggleFlag = (id: number) => {
    setRevealedFlags(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const resetInspector = () => {
    setRevealedFlags(new Set());
    setSelectedChainStep(3);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-500" />
            <h3 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wider font-display">
              Cyber Kill Chain & Phishing Forensics Inspector
            </h3>
            <span className="text-[10px] font-mono font-bold bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 px-2 py-0.5 rounded-full border border-rose-300 dark:border-rose-800">
              CSL (ILO7016)
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Analyze the 7 stages of an advanced persistent cyberattack and interactively inspect red flags in spear-phishing emails.
          </p>
        </div>

        <button
          onClick={resetInspector}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reset Forensics
        </button>
      </div>

      {/* 7-Stage Kill Chain Navigator */}
      <div className="my-4">
        <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
          Lockheed Martin Cyber Kill Chain:
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5">
          {KILL_CHAIN.map(item => {
            const isActive = item.step === selectedChainStep;
            return (
              <button
                key={item.step}
                onClick={() => setSelectedChainStep(item.step)}
                className={`p-2 rounded-xl border text-left font-mono transition-all ${
                  isActive
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-400 dark:border-rose-600 text-rose-900 dark:text-rose-100 ring-2 ring-rose-500/20'
                    : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span className="text-[9px] text-rose-500 block font-bold">STAGE {item.step}</span>
                <span className="text-[11px] font-bold block truncate">{item.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-4">
        {/* Selected Kill Chain Step Detail */}
        <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <span className="font-bold text-slate-900 dark:text-white uppercase">
              Stage {selectedChainStep}: {KILL_CHAIN[selectedChainStep - 1].name}
            </span>
            <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold bg-rose-100 dark:bg-rose-950 px-2 py-0.5 rounded">
              Active Focus
            </span>
          </div>

          <div>
            <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 block mb-1">
              Attacker Objective:
            </span>
            <p className="text-slate-600 dark:text-slate-400 text-xs">
              {KILL_CHAIN[selectedChainStep - 1].attackerGoal}
            </p>
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 block mb-1">
              Defender Mitigation & Control:
            </span>
            <p className="text-slate-600 dark:text-slate-400 text-xs">
              {KILL_CHAIN[selectedChainStep - 1].defenderCountermeasure}
            </p>
          </div>
        </div>

        {/* Phishing Anatomy Interactive Box */}
        <div className="lg:col-span-7 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800 font-mono text-xs">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-rose-500" />
              <span className="font-bold text-slate-900 dark:text-white uppercase">
                Phishing Email Forensic Sandbox
              </span>
            </div>
            <span className="text-[10px] font-bold text-slate-400">
              Found {revealedFlags.size} / 4 Red Flags
            </span>
          </div>

          {/* Fake Phishing Email UI */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-xs space-y-2.5 font-sans">
            {/* Header info */}
            <div className="space-y-1 pb-2 border-b border-slate-100 dark:border-slate-800 font-mono text-[11px]">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 w-14">From:</span>
                <span
                  onClick={() => toggleFlag(1)}
                  className={`cursor-pointer px-1.5 py-0.5 rounded transition-all ${
                    revealedFlags.has(1)
                      ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold border border-rose-300'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  Bank Security &lt;security-alert@hdfc-verifcation-portal.net&gt; 🚩
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 w-14">Subject:</span>
                <span
                  onClick={() => toggleFlag(2)}
                  className={`cursor-pointer px-1.5 py-0.5 rounded transition-all ${
                    revealedFlags.has(2)
                      ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold border border-rose-300'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  URGENT: NetBanking Account Suspended within 24 Hours! 🚩
                </span>
              </div>
            </div>

            {/* Email Body */}
            <div className="space-y-2 text-slate-700 dark:text-slate-300 leading-relaxed text-xs">
              <p>Dear Valued Customer,</p>
              <p>
                Our automated compliance audit detected unauthorized login attempts from an unknown Russian IP address. To prevent permanent fund seizure under RBI guidelines, you must re-verify your KYC credentials immediately.
              </p>
              
              <div className="py-1">
                <span
                  onClick={() => toggleFlag(3)}
                  className={`inline-block cursor-pointer px-3 py-1.5 rounded font-mono text-xs font-bold transition-all ${
                    revealedFlags.has(3)
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  Click Here to Verify KYC Credentials 🚩
                </span>
                {revealedFlags.has(3) && (
                  <span className="block text-[10px] font-mono text-rose-500 mt-1">
                    Actual Link URL: http://194.26.29.112/fake-hdfc-login.php
                  </span>
                )}
              </div>

              <div
                onClick={() => toggleFlag(4)}
                className={`p-2 rounded border font-mono text-[11px] cursor-pointer transition-all ${
                  revealedFlags.has(4)
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-400 text-rose-800 dark:text-rose-300 font-bold'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                📎 Attachment: Security_Notice_Case_99812.pdf.exe (Double extension virus) 🚩
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

