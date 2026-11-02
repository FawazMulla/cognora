import { useEffect, useState } from 'react';
import { Sparkles, FileText, Filter, Clock, Copy, Download, Check, Loader2, Zap, AlertTriangle, BookOpen } from 'lucide-react';
import { fetchApi } from '../lib/api';
import { getDefaultSubjects, generateExamNotesAI } from '../lib/ai-service';
import { BookmarkButton } from '../components/BookmarkButton';
import { FocusReadingMode } from '../components/FocusReadingMode';
import { exportToDocx, exportToPdf } from '../lib/export-engine';
import { trackNavigation } from '../lib/navigation-tracker';

type Subject = {
  id: string;
  name: string;
  code?: string;
  type?: string;
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
  const [focusOpen, setFocusOpen] = useState(false);

  useEffect(() => {
    trackNavigation({
      pagePath: '/exam-notes',
      pageTitle: 'Exam & IAE Notes',
      subjectName: subjects.find(s => s.id === selectedSubjectId)?.name || 'Exam Pack',
    });
  }, [selectedSubjectId, examType]);

  useEffect(() => {
    async function loadSubjects() {
      // Helper: keep only theory subjects (exclude labs)
      const theoryOnly = (list: Subject[]) =>
        list.filter(s => s.type !== 'Lab' && !s.name.toLowerCase().includes('lab'));

      try {
        const res = await fetchApi('/api/subjects');
        if (res.subjects && res.subjects.length > 0) {
          const theory = theoryOnly(res.subjects);
          if (theory.length > 0) {
            setSubjects(theory);
            setSelectedSubjectId(theory[0].id);
          } else {
            const defaults = theoryOnly(getDefaultSubjects());
            setSubjects(defaults);
            setSelectedSubjectId(defaults[0]?.id || '');
          }
        } else {
          const defaults = theoryOnly(getDefaultSubjects());
          setSubjects(defaults);
          setSelectedSubjectId(defaults[0]?.id || '');
        }
      } catch (err) {
        console.error("Error loading subjects:", err);
        const defaults = theoryOnly(getDefaultSubjects());
        setSubjects(defaults);
        setSelectedSubjectId(defaults[0]?.id || '');
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

  
  const getExamNotesMarkdown = () => {
    if (!notes) return '';
    let md = `# ${notes.examTitle}\n\n## High Yield Priority Topics\n`;
    notes.highYieldTopics.forEach(t => {
      md += `- **${t.topic}** (${Math.round(t.probability * 100)}% Probability, ${t.markRange}): ${t.rationale}\n`;
    });
    md += `\n## 2-Mark High Yield Definitions\n`;
    notes.twoMarkDefinitions.forEach(d => {
      md += `### ${d.term}\n${d.definition}\n${d.keyFormula ? `**Formula:** ${d.keyFormula}\n` : ''}\n`;
    });
    md += `\n## 5 & 10 Mark Detailed Questions\n`;
    notes.fiveAndTenMarkNotes.forEach(q => {
      md += `### ${q.question} (${q.marks} Marks)\n**Key Points:**\n${q.keyPoints.map(p => `- ${p}`).join('\n')}\n\n**Model Answer Snippet:**\n${q.modelAnswerSnippet}\n\n`;
    });
    md += `\n## Last-Minute Cramming Summary\n`;
    notes.crammingSummary.forEach(c => {
      md += `- ${c}\n`;
    });
    return md;
  };

  const handleExportPdf = () => {
    const md = getExamNotesMarkdown();
    if (!md) return;
    exportToPdf({
      title: notes?.examTitle || 'Exam Notes Pack',
      subject: selectedSubject?.name,
      module: `${examType} - ${selectedUnits.join(', ')}`,
      rawMarkdown: md,
    });
  };

  const handleExportDocx = async () => {
    const md = getExamNotesMarkdown();
    if (!md) return;
    await exportToDocx({
      title: notes?.examTitle || 'Exam Notes Pack',
      subject: selectedSubject?.name,
      module: `${examType} - ${selectedUnits.join(', ')}`,
      rawMarkdown: md,
    });
  };

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
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 bg-[#f8f9fc] dark:bg-slate-950 text-[#2d2d34] dark:text-slate-100 min-h-screen font-sans transition-colors">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-2 border-b border-[#e3e6ed] dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-[#4f75f2] animate-pulse" />
            <span className="text-[11px] font-mono tracking-widest text-[#6b6f82] uppercase font-bold">
              High-Yield Exam Synthesizer
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#121217] dark:text-white flex items-center gap-3">
            Exam &amp; IAE Score Booster
          </h1>
          <p className="text-xs md:text-sm text-[#6b6f82] dark:text-slate-400 mt-1 font-sans max-w-2xl">
            Synthesize high-yield notes tailored for Internal Assessment Exams (IAE-1, IAE-2), 2-mark definitions, formulas, and last-night revision sheets.
          </p>
        </div>

        {subjects.length > 0 && (
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-[#e3e6ed] dark:border-slate-800 rounded-2xl p-1.5 shadow-xs">
            <Filter className="w-3.5 h-3.5 text-[#8c8fa1] ml-2" />
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="bg-transparent text-[#121217] dark:text-slate-200 outline-none text-xs font-bold pr-4 cursor-pointer"
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
      <div className="bg-white dark:bg-slate-900 border border-[#e3e6ed] dark:border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-xs">
        <h2 className="text-lg font-extrabold text-[#121217] dark:text-white flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[#4f75f2]" />
          Configure Exam Parameters
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Exam Type */}
          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase tracking-wider text-[#6b6f82] font-bold block">
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
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-[#f8f9fc] dark:bg-slate-800 border-[#e3e6ed] dark:border-slate-700 text-[#6b6f82] dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white hover:border-indigo-400'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Units Selection */}
          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase tracking-wider text-[#6b6f82] font-bold block">
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
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-[#f8f9fc] dark:bg-slate-800 border-[#e3e6ed] dark:border-slate-700 text-[#6b6f82] dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white'
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
            <label className="text-[10px] font-mono uppercase tracking-wider text-[#6b6f82] font-bold block">
              Preparation Time Horizon
            </label>
            <select
              value={timeRemaining}
              onChange={e => setTimeRemaining(e.target.value)}
              className="w-full bg-[#f8f9fc] dark:bg-slate-800 border border-[#e3e6ed] dark:border-slate-700 rounded-2xl px-4 py-2.5 text-xs font-bold text-[#121217] dark:text-slate-200 outline-none focus:border-[#4f75f2] cursor-pointer shadow-xs"
            >
              <option value="tomorrow">Exam Tomorrow (High-Yield &amp; Concise)</option>
              <option value="3days">Exam in 3 Days (Balanced Theory &amp; Numericals)</option>
              <option value="1week">Exam in 1 Week (Comprehensive Topic Mastery)</option>
            </select>
          </div>
        </div>

        <button
          disabled={loading}
          onClick={handleGenerateNotes}
          className="w-full md:w-auto bg-[#4f75f2] hover:bg-[#385dd8] text-white px-8 py-3.5 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" /> Synthesizing Exam Notes...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-200" /> Synthesize {examType} High-Yield Pack
            </>
          )}
        </button>
      </div>

      {/* Generated Notes Display */}
      {notes && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Notes Top Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 border border-[#e3e6ed] dark:border-slate-800 p-6 rounded-3xl shadow-xs">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#3b52c4] dark:text-indigo-400 bg-[#e4e7fd] dark:bg-indigo-950/60 px-3 py-1 rounded-full border border-[#d0d8fb] dark:border-indigo-800 mb-2 inline-block font-bold">
                GENERATED EXAM PACK
              </span>
              <h2 className="text-2xl font-extrabold text-[#121217] dark:text-white">{notes.examTitle}</h2>
              <p className="text-[#6b6f82] dark:text-slate-400 text-xs mt-0.5 font-medium">{selectedSubject?.name} • {selectedUnits.join(', ')}</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleCopyNotes}
                className="flex items-center gap-2 bg-white dark:bg-slate-800 hover:bg-[#edf3fc] dark:hover:bg-slate-700 text-[#4f75f2] dark:text-indigo-400 border border-[#d0dcf5] dark:border-slate-750 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied to Clipboard' : 'Copy Full Pack'}
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 bg-[#121217] dark:bg-indigo-600 hover:bg-[#252530] dark:hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                <Download className="w-4 h-4" /> Export JSON
              </button>
            </div>
          </div>

          {/* Section 1: High Yield Topics */}
          <div className="bg-white dark:bg-slate-900 border border-[#e3e6ed] dark:border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-xs">
            <h3 className="text-lg font-extrabold text-[#121217] dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" /> High-Yield Priority Topics
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {notes.highYieldTopics.map((item, idx) => (
                <div key={idx} className="bg-[#f8f9fc] dark:bg-slate-800/80 border border-[#e3e6ed] dark:border-slate-700 p-5 rounded-2xl space-y-3 hover:border-[#4f75f2] dark:hover:border-indigo-500 transition-all">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-sm font-bold text-[#121217] dark:text-white">{item.topic}</span>
                    <span className="bg-[#fbf5e6] dark:bg-amber-950/60 text-[#967018] dark:text-amber-300 border border-[#f4e8cc] dark:border-amber-800 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold shrink-0">
                      {Math.round(item.probability * 100)}% Prob.
                    </span>
                  </div>
                  <div className="space-y-1 text-xs text-[#6b6f82] dark:text-slate-400">
                    <span className="bg-[#edf3fc] dark:bg-indigo-950/60 text-[#4f75f2] dark:text-indigo-400 border border-[#d0dcf5] dark:border-indigo-800 px-2 py-0.5 rounded text-[10px] font-mono font-bold inline-block">
                      {item.markRange}
                    </span>
                    <p className="text-[#6b6f82] dark:text-slate-400 text-xs pt-1 leading-relaxed">{item.rationale}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: 2-Mark Definitions & Formula Sheet */}
          <div className="bg-white dark:bg-slate-900 border border-[#e3e6ed] dark:border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-xs">
            <h3 className="text-lg font-extrabold text-[#121217] dark:text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#4f75f2] dark:text-indigo-400" /> 2-Mark Definitions &amp; Invariant Equations
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {notes.twoMarkDefinitions.map((def, idx) => (
                <div key={idx} className="bg-[#f8f9fc] dark:bg-slate-800/80 border border-[#e3e6ed] dark:border-slate-700 p-5 rounded-2xl space-y-2.5">
                  <div className="text-sm font-bold text-[#121217] dark:text-white">{def.term}</div>
                  <p className="text-xs text-[#4f5367] dark:text-slate-300 leading-relaxed">{def.definition}</p>
                  {def.keyFormula && (
                    <div className="bg-white dark:bg-slate-900 text-[#121217] dark:text-cyan-300 border border-[#e3e6ed] dark:border-slate-750 p-2.5 rounded-xl font-mono text-xs mt-2 font-bold select-text">
                      {def.keyFormula}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: 5-Mark & 10-Mark Core Concept Answers */}
          <div className="bg-white dark:bg-slate-900 border border-[#e3e6ed] dark:border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-xs">
            <h3 className="text-lg font-extrabold text-[#121217] dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#4f75f2] dark:text-indigo-400" /> 5-Mark &amp; 10-Mark Standard Concept Answers
            </h3>

            <div className="space-y-6">
              {notes.fiveAndTenMarkNotes.map((note, idx) => (
                <div key={idx} className="bg-[#f8f9fc] dark:bg-slate-800/80 border border-[#e3e6ed] dark:border-slate-700 p-6 rounded-2xl space-y-4">
                  <div className="flex justify-between items-start gap-4">
                    <h4 className="text-base font-bold text-[#121217] dark:text-white leading-snug">{note.question}</h4>
                    <span className="bg-[#e4e7fd] dark:bg-indigo-950/60 text-[#3b52c4] dark:text-indigo-400 border border-[#d0d8fb] dark:border-indigo-800 px-3 py-1 rounded-full text-xs font-mono font-bold shrink-0">
                      {note.marks} Marks
                    </span>
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-[#e3e6ed] dark:border-slate-700 font-mono text-xs text-[#121217] dark:text-emerald-300">
                    <span className="text-[#6b6f82] dark:text-slate-400 block text-[10px] uppercase tracking-wider mb-1 font-sans font-bold">Diagram Architecture</span>
                    {note.diagramOutline}
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-xs font-mono uppercase tracking-wider text-[#6b6f82] dark:text-slate-400 font-bold">Key Scoring Points:</span>
                    <ul className="list-disc list-inside text-xs text-[#4f5367] dark:text-slate-300 space-y-1">
                      {note.keyPoints.map((pt, i) => (
                        <li key={i}>{pt}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="text-xs text-[#2d2d34] dark:text-slate-200 leading-relaxed bg-white dark:bg-slate-900 p-4 rounded-xl border border-[#e3e6ed] dark:border-slate-700 whitespace-pre-wrap font-sans">
                    {note.modelAnswerSnippet}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Cramming Flash Summary */}
          <div className="bg-white dark:bg-slate-900 border border-[#e3e6ed] dark:border-slate-800 rounded-3xl p-6 md:p-8 space-y-4 shadow-xs">
            <h3 className="text-lg font-extrabold text-[#121217] dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> Last-Night Cramming Flash Points
            </h3>

            <div className="space-y-2 bg-[#f8f9fc] dark:bg-slate-800/80 p-5 rounded-2xl border border-[#e3e6ed] dark:border-slate-700">
              {notes.crammingSummary.map((point, idx) => (
                <div key={idx} className="flex items-start gap-3 text-xs text-[#121217] dark:text-slate-100">
                  <span className="w-5 h-5 rounded-full bg-[#4f75f2] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
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

