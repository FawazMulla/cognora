import { useEffect, useState } from 'react';
import { Sparkles, FileText, Filter, Clock, Copy, Download, Check, Loader2, Zap, AlertTriangle, Layers, BookOpen, ChevronRight } from 'lucide-react';
import { fetchApi } from '../lib/api';
import { getDefaultSubjects, generateExamNotesAI } from '../lib/ai-service';

type Subject = {
  id: string;
  name: string;
  code?: string;
};

type ExamNotesResult = {
  examTitle: string;
  highYieldTopics: { topic: string; probability: number; markRange: string; rationale: string }[];
  twoMarkDefinitions: { term: string; definition: string; keyFormula?: string }[];
  fiveAndTenMarkNotes: { question: string; marks: number; diagramOutline: string; keyPoints: string[]; modelAnswerSnippet: string }[];
  crammingSummary: string[];
};

export default function ExamNotes() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [examType, setExamType] = useState<'IAE-1' | 'IAE-2' | 'End-Sem' | 'Mid-Term'>('IAE-1');
  const [selectedUnits, setSelectedUnits] = useState<string[]>(['Unit 1', 'Unit 2']);
  const [timeRemaining, setTimeRemaining] = useState<string>('tomorrow');
  
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [notes, setNotes] = useState<ExamNotesResult | null>(null);

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
        console.error("Error loading subjects:", err);
        const defaults = getDefaultSubjects();
        setSubjects(defaults);
        setSelectedSubjectId(defaults[0].id);
      }
    }
    loadSubjects();
  }, []);

  const handleToggleUnit = (unit: string) => {
    setSelectedUnits(prev => 
      prev.includes(unit) ? (prev.length > 1 ? prev.filter(u => u !== unit) : prev) : [...prev, unit]
    );
  };

  const handleGenerateNotes = async () => {
    if (!selectedSubjectId) return;
    setLoading(true);
    const selectedSub = subjects.find(s => s.id === selectedSubjectId);
    const subName = selectedSub?.name || 'Computer Science';

    try {
      const res = await fetchApi('/api/exam-notes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectId: selectedSubjectId,
          subjectName: subName,
          examType,
          units: selectedUnits,
          timeRemaining
        })
      });

      if (res && res.notes) {
        setNotes(res.notes);
      } else {
        setNotes(generateExamNotesAI(subName, examType, selectedUnits));
      }
    } catch (err) {
      console.warn('Backend API offline, synthesizing exam notes:', err);
      setNotes(generateExamNotesAI(subName, examType, selectedUnits));
    } finally {
      setLoading(false);
    }
  };

  const selectedSubject = subjects.find(s => s.id === selectedSubjectId);

  const handleCopyNotes = () => {
    if (!notes) return;
    const text = `
# ${notes.examTitle}
Subject: ${selectedSubject?.name || 'Subject'}

## High-Yield Priority Topics
${notes.highYieldTopics.map(t => `- [${t.markRange}] ${t.topic} (${Math.round(t.probability * 100)}% Probability): ${t.rationale}`).join('\n')}

## 2-Mark Definitions & Formula Sheet
${notes.twoMarkDefinitions.map(d => `### ${d.term}\n${d.definition}\n${d.keyFormula ? `Formula: ${d.keyFormula}` : ''}`).join('\n\n')}

## 5-Mark & 10-Mark Core Concepts
${notes.fiveAndTenMarkNotes.map(n => `### ${n.question} (${n.marks} Marks)\nDiagram: ${n.diagramOutline}\n\nPoints:\n${n.keyPoints.map(p => `- ${p}`).join('\n')}\n\nAnswer: ${n.modelAnswerSnippet}`).join('\n\n')}

## Last-Night Cramming Flash Summary
${notes.crammingSummary.map((s, i) => `${i + 1}. ${s}`).join('\n')}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!notes) return;
    const element = document.createElement("a");
    const file = new Blob([JSON.stringify(notes, null, 2)], { type: 'application/json' });
    element.href = URL.createObjectURL(file);
    element.download = `${notes.examTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.json`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10 bg-white text-[#212121] min-h-screen font-display">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-[#d9d9dd]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest text-[#666666] uppercase mb-2">
            <Zap className="w-3.5 h-3.5 text-[#212121]" /> High-Yield Exam Synthesizer
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#212121] flex items-center gap-3">
            Exam & IAE Score Booster
          </h1>
          <p className="text-[#666666] mt-2 text-sm md:text-base max-w-2xl">
            Synthesize high-yield notes tailored for Internal Assessment Exams (IAE-1, IAE-2), 2-mark definitions, formulas, and last-night revision sheets.
          </p>
        </div>

        {subjects.length > 0 && (
          <div className="flex items-center gap-2 bg-white border border-[#d9d9dd] rounded-2xl p-2 shadow-sm">
            <Filter className="w-4 h-4 text-[#666666] ml-2" />
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="bg-transparent text-[#212121] outline-none text-xs font-bold pr-4 cursor-pointer"
            >
              {subjects.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code || 'CS'})
                </option>
              ))}
            </select>
          </div>
        )}
      </header>

      {/* Control Configuration Panel */}
      <div className="bg-[#fafafb] border border-[#d9d9dd] rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
        <h2 className="text-lg font-black text-[#212121] flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[#212121]" />
          Configure Exam Parameters
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Exam Type */}
          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase tracking-wider text-[#666666] font-bold block">
              Exam Scope
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['IAE-1', 'IAE-2', 'Mid-Term', 'End-Sem'] as const).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setExamType(type)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    examType === type
                      ? 'bg-[#212121] text-white border-[#212121] shadow-xs'
                      : 'bg-white border-[#d9d9dd] text-[#666666] hover:text-[#212121] hover:border-[#212121]'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Units Selection */}
          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase tracking-wider text-[#666666] font-bold block">
              Syllabus Units
            </label>
            <div className="flex flex-wrap gap-2">
              {['Unit 1', 'Unit 2', 'Unit 3', 'Unit 4', 'Unit 5'].map(unit => {
                const isSelected = selectedUnits.includes(unit);
                return (
                  <button
                    key={unit}
                    type="button"
                    onClick={() => handleToggleUnit(unit)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-[#212121] text-white border-[#212121]'
                        : 'bg-white border-[#d9d9dd] text-[#666666] hover:text-[#212121]'
                    }`}
                  >
                    {unit}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Left */}
          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase tracking-wider text-[#666666] font-bold block">
              Preparation Time Horizon
            </label>
            <select
              value={timeRemaining}
              onChange={e => setTimeRemaining(e.target.value)}
              className="w-full bg-white border border-[#d9d9dd] rounded-xl px-4 py-2.5 text-xs font-bold text-[#212121] outline-none focus:border-[#212121] cursor-pointer shadow-xs"
            >
              <option value="tomorrow">Exam Tomorrow (High-Yield & Concise)</option>
              <option value="3days">Exam in 3 Days (Balanced Theory & Numericals)</option>
              <option value="1week">Exam in 1 Week (Comprehensive Topic Mastery)</option>
            </select>
          </div>
        </div>

        <button
          disabled={loading}
          onClick={handleGenerateNotes}
          className="w-full md:w-auto bg-[#212121] hover:bg-black text-white px-8 py-3.5 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Synthesizing Exam Notes...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" /> Synthesize {examType} High-Yield Pack
            </>
          )}
        </button>
      </div>

      {/* Generated Notes Display */}
      {notes && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Notes Top Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#fafafb] border border-[#d9d9dd] p-6 rounded-3xl shadow-sm">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#212121] bg-white px-3 py-1 rounded-full border border-[#d9d9dd] mb-2 inline-block font-bold">
                GENERATED EXAM PACK
              </span>
              <h2 className="text-2xl font-black text-[#212121]">{notes.examTitle}</h2>
              <p className="text-[#666666] text-xs mt-0.5 font-medium">{selectedSubject?.name} • {selectedUnits.join(', ')}</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleCopyNotes}
                className="flex items-center gap-2 bg-white hover:bg-[#f4f4f4] text-[#212121] border border-[#d9d9dd] px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied to Clipboard' : 'Copy Full Pack'}
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 bg-[#212121] hover:bg-black text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                <Download className="w-4 h-4" /> Export JSON
              </button>
            </div>
          </div>

          {/* Section 1: High Yield Topics */}
          <div className="bg-white border border-[#d9d9dd] rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
            <h3 className="text-lg font-black text-[#212121] flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" /> High-Yield Priority Topics
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {notes.highYieldTopics.map((item, idx) => (
                <div key={idx} className="bg-[#fafafb] border border-[#e5e5e8] p-5 rounded-2xl space-y-3 hover:border-[#212121] transition-all">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-sm font-bold text-[#212121]">{item.topic}</span>
                    <span className="bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold shrink-0">
                      {Math.round(item.probability * 100)}% Prob.
                    </span>
                  </div>
                  <div className="space-y-1 text-xs text-[#666666]">
                    <span className="bg-white text-[#212121] border border-[#d9d9dd] px-2 py-0.5 rounded text-[10px] font-mono font-bold inline-block">
                      {item.markRange}
                    </span>
                    <p className="text-[#666666] text-xs pt-1 leading-relaxed">{item.rationale}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: 2-Mark Definitions & Formula Sheet */}
          <div className="bg-white border border-[#d9d9dd] rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
            <h3 className="text-lg font-black text-[#212121] flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#212121]" /> 2-Mark Definitions & Invariant Equations
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {notes.twoMarkDefinitions.map((def, idx) => (
                <div key={idx} className="bg-[#fafafb] border border-[#e5e5e8] p-5 rounded-2xl space-y-2.5">
                  <div className="text-sm font-bold text-[#212121]">{def.term}</div>
                  <p className="text-xs text-[#444444] leading-relaxed">{def.definition}</p>
                  {def.keyFormula && (
                    <div className="bg-white text-[#212121] border border-[#d9d9dd] p-2.5 rounded-xl font-mono text-xs mt-2 font-bold">
                      {def.keyFormula}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: 5-Mark & 10-Mark Core Concept Answers */}
          <div className="bg-white border border-[#d9d9dd] rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
            <h3 className="text-lg font-black text-[#212121] flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#212121]" /> 5-Mark & 10-Mark Standard Concept Answers
            </h3>

            <div className="space-y-6">
              {notes.fiveAndTenMarkNotes.map((note, idx) => (
                <div key={idx} className="bg-[#fafafb] border border-[#e5e5e8] p-6 rounded-2xl space-y-4">
                  <div className="flex justify-between items-start gap-4">
                    <h4 className="text-base font-bold text-[#212121] leading-snug">{note.question}</h4>
                    <span className="bg-[#212121] text-white px-3 py-1 rounded-full text-xs font-mono font-bold shrink-0">
                      {note.marks} Marks
                    </span>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-[#d9d9dd] font-mono text-xs text-[#212121]">
                    <span className="text-[#666666] block text-[10px] uppercase tracking-wider mb-1 font-sans font-bold">Diagram Architecture</span>
                    {note.diagramOutline}
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-xs font-mono uppercase tracking-wider text-[#666666] font-bold">Key Scoring Points:</span>
                    <ul className="list-disc list-inside text-xs text-[#444444] space-y-1">
                      {note.keyPoints.map((pt, i) => (
                        <li key={i}>{pt}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="text-xs text-[#333333] leading-relaxed bg-white p-4 rounded-xl border border-[#d9d9dd] whitespace-pre-wrap font-sans">
                    {note.modelAnswerSnippet}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Cramming Flash Summary */}
          <div className="bg-white border border-[#d9d9dd] rounded-3xl p-6 md:p-8 space-y-4 shadow-sm">
            <h3 className="text-lg font-black text-[#212121] flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-600" /> Last-Night Cramming Flash Points
            </h3>

            <div className="space-y-2 bg-[#fafafb] p-5 rounded-2xl border border-[#e5e5e8]">
              {notes.crammingSummary.map((point, idx) => (
                <div key={idx} className="flex items-start gap-3 text-xs text-[#212121]">
                  <span className="w-5 h-5 rounded-full bg-[#212121] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <p className="leading-relaxed pt-0.5 font-medium">{point}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

