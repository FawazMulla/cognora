import React, { useState, useEffect } from 'react';
import {
  Sparkles, Search, BookOpen, FileText, CheckCircle2, AlertTriangle,
  Upload, Trash2, ArrowRight, ShieldCheck, Gauge, HelpCircle,
  Copy, Check, RefreshCw, BarChart2, Layers, Cpu, Database, Eye
} from 'lucide-react';
import { FormattedAnswer } from '../components/FormattedAnswer';
import { fetchApi } from '../lib/api';

interface Citation {
  sourceId: string;
  sourceTitle: string;
  sourceType: string;
  pageNumber?: number;
  sectionHeading?: string;
  extractedSnippet: string;
  verificationStatus: string;
}

interface VerificationReport {
  isFullyGrounded: boolean;
  factualGroundednessScore: number;
  citationIntegrityScore: number;
  markSchemeComplianceScore: number;
  disclosedLimitations: string[];
  verifiedCitations: Citation[];
  wordCount: number;
  status: 'OPTIMAL' | 'ACCEPTABLE' | 'NEEDS_DISCLOSURE';
}

interface AskResponse {
  answer: string;
  query: string;
  intent: string;
  marks: number;
  language: string;
  subjectCode?: string;
  citations: Citation[];
  verification: VerificationReport;
  retrievedChunksCount: number;
  isGroundedInOfficialSyllabus: boolean;
  executionTimeMs: number;
  cached: boolean;
  modelUsed: string;
}

interface IngestedDoc {
  id: string;
  filename: string;
  fileType: string;
  sizeBytes: number;
  status: string;
  intelligenceData?: any;
  createdAt: string;
}

interface BenchmarkReport {
  timestamp: string;
  totalEvaluated: number;
  overallPassRate: number;
  averageGroundednessScore: number;
  averageCitationIntegrity: number;
  averageComplianceScore: number;
  averageLatencyMs: number;
  resultsBySubject: Record<
    string,
    {
      subjectName: string;
      evaluated: number;
      passRate: number;
      avgScore: number;
    }
  >;
  results: Array<{
    questionId: string;
    subjectCode: string;
    question: string;
    marks: number;
    wordCount: number;
    factualGroundednessScore: number;
    citationIntegrityScore: number;
    markSchemeComplianceScore: number;
    citationsCount: number;
    latencyMs: number;
    passed: boolean;
  }>;
}

const SUBJECT_OPTIONS = [
  { code: '', label: 'All Subjects (Cross-Curricular)' },
  { code: 'ITC701', label: 'AI and DS - II (ITC701)' },
  { code: 'ILO7016', label: 'Cyber Security & Laws (ILO7016)' },
  { code: 'ITC702', label: 'Internet of Everything (ITC702)' },
  { code: 'ITD07014', label: 'Software Testing & QA (ITD07014)' },
  { code: 'ITD07024', label: 'Information Retrieval System (ITD07024)' },
];

const QUICK_PROMPTS = [
  {
    subjectCode: 'ITC701',
    marks: 10,
    text: 'What are the important properties of activation function used in neural network? Explain all activation functions with neat diagram.',
  },
  {
    subjectCode: 'ITC702',
    marks: 10,
    text: 'Explain MQTT and CoAP protocols in detail with architectural differences and message format.',
  },
  {
    subjectCode: 'ITD07014',
    marks: 10,
    text: 'Explain McCall software quality model categorizing factors into product operation, revision, and transition.',
  },
  {
    subjectCode: 'ILO7016',
    marks: 10,
    text: 'Explain Section 66 of Information Technology Act 2000 along with penalties and hacking provisions.',
  },
  {
    subjectCode: 'ITD07024',
    marks: 5,
    text: 'Explain Inverted Index construction and posting lists in Information Retrieval.',
  },
];

export default function AcademicIntelligence() {
  const [activeTab, setActiveTab] = useState<'ask' | 'search' | 'documents' | 'benchmark'>('ask');

  // Grounded Ask State
  const [query, setQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [marks, setMarks] = useState<2 | 5 | 10 | 15>(10);
  const [language, setLanguage] = useState<'english' | 'hinglish'>('english');
  const [sourceScope, setSourceScope] = useState<'ALL_ACADEMIC_RESOURCES' | 'OFFICIAL_SYLLABUS' | 'STUDENT_UPLOADS'>('ALL_ACADEMIC_RESOURCES');
  const [forceLive, setForceLive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<AskResponse | null>(null);
  const [copied, setCopied] = useState(false);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Documents State
  const [documents, setDocuments] = useState<IngestedDoc[]>([]);
  const [uploadText, setUploadText] = useState('');
  const [uploadFilename, setUploadFilename] = useState('');
  const [uploadSubject, setUploadSubject] = useState('ITC701');
  const [ingesting, setIngesting] = useState(false);
  const [ingestStatus, setIngestStatus] = useState<string | null>(null);

  // Benchmark State
  const [benchmarkLoading, setBenchmarkLoading] = useState(false);
  const [benchmarkReport, setBenchmarkReport] = useState<BenchmarkReport | null>(null);

  // Load indexed documents
  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const data = await fetchApi('/api/intelligence/documents');
      if (data && data.documents) {
        setDocuments(data.documents);
      }
    } catch (e) {
      console.warn('Failed to fetch documents', e);
    }
  };

  const handleAsk = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setResponse(null);

    try {
      const json = await fetchApi('/api/intelligence/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          subjectCode: selectedSubject || undefined,
          marks,
          language,
          sourceScope,
          forceLive,
        }),
      });

      if (json && json.success && json.data) {
        setResponse(json.data);
      }
    } catch (err) {
      console.error('Ask query error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearchLoading(true);
    try {
      const data = await fetchApi('/api/intelligence/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          subjectCode: selectedSubject || undefined,
          sourceScope,
          limit: 8,
        }),
      });
      if (data && data.success && data.chunks) {
        setSearchResults(data.chunks);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleIngestDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFilename.trim() || !uploadText.trim()) return;

    setIngesting(true);
    setIngestStatus('Executing 10-stage Academic Resource Intelligence pipeline...');

    try {
      const data = await fetchApi('/api/intelligence/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: uploadFilename,
          content: uploadText,
          subjectCode: uploadSubject,
          fileType: 'text/markdown',
          sourceType: 'FACULTY_MATERIAL',
        }),
      });

      if (data && data.success) {
        setIngestStatus(`Document indexed! ${data.chunkCount} semantic chunks generated with ${data.qualityScore}% quality score.`);
        setUploadText('');
        setUploadFilename('');
        fetchDocuments();
      } else {
        setIngestStatus(`Error: ${data?.error || 'Failed to index document'}`);
      }
    } catch (err: any) {
      setIngestStatus(`Pipeline Error: ${err.message}`);
    } finally {
      setIngesting(false);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    try {
      await fetchApi(`/api/intelligence/documents/${id}`, { method: 'DELETE' });
      fetchDocuments();
    } catch (err) {
      console.warn('Delete error', err);
    }
  };

  const handleRunBenchmark = async () => {
    setBenchmarkLoading(true);
    try {
      const data = await fetchApi('/api/intelligence/evaluation/benchmark');
      if (data && data.success && data.report) {
        setBenchmarkReport(data.report);
      }
    } catch (err) {
      console.error('Benchmark run error:', err);
    } finally {
      setBenchmarkLoading(false);
    }
  };

  const handleCopy = () => {
    if (!response?.answer) return;
    navigator.clipboard.writeText(response.answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-linear-to-r from-[#edf3fc] via-[#f5f8ff] to-[#edf3fc] dark:from-slate-900 dark:via-indigo-950/30 dark:to-slate-900 border border-[#d0dcf5] dark:border-indigo-900/50 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-[#4f75f2] animate-pulse" />
            <span className="text-[10px] font-mono font-bold tracking-widest text-[#4f75f2] dark:text-indigo-400 uppercase">
              COGNORA INTELLIGENCE CORE 2.0 (CIC)
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#121217] dark:text-slate-100 tracking-tight">
            Academic Intelligence Hub
          </h1>
          <p className="text-xs text-[#6b6f82] dark:text-slate-400 mt-1 max-w-2xl">
            Syllabus-grounded answer generation, hybrid Reciprocal Rank Fusion retrieval, verified university citations, and zero-hallucination academic evaluation.
          </p>
        </div>

        {/* Engine Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-[#e3e6ed] dark:border-slate-700 backdrop-blur-xs shrink-0">
          <button
            onClick={() => setActiveTab('ask')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-semibold transition-all ${
              activeTab === 'ask'
                ? 'bg-[#4f75f2] text-white shadow-xs'
                : 'text-[#6b6f82] dark:text-slate-400 hover:text-[#121217] dark:hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Grounded Q&A
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-semibold transition-all ${
              activeTab === 'search'
                ? 'bg-[#4f75f2] text-white shadow-xs'
                : 'text-[#6b6f82] dark:text-slate-400 hover:text-[#121217] dark:hover:text-slate-200'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            Hybrid Search
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-semibold transition-all ${
              activeTab === 'documents'
                ? 'bg-[#4f75f2] text-white shadow-xs'
                : 'text-[#6b6f82] dark:text-slate-400 hover:text-[#121217] dark:hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Ingest ({documents.length})
          </button>
          <button
            onClick={() => setActiveTab('benchmark')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-semibold transition-all ${
              activeTab === 'benchmark'
                ? 'bg-[#4f75f2] text-white shadow-xs'
                : 'text-[#6b6f82] dark:text-slate-400 hover:text-[#121217] dark:hover:text-slate-200'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            Benchmark
          </button>
        </div>
      </div>

      {/* TAB 1: Grounded Q&A */}
      {activeTab === 'ask' && (
        <div className="space-y-6">
          {/* Query Form */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-[#e3e6ed] dark:border-slate-800 shadow-xs space-y-4">
            <form onSubmit={handleAsk} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-semibold text-[#6b6f82] dark:text-slate-400 mb-2">
                  EXAMINATION QUESTION OR TOPIC PROMPT
                </label>
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  rows={3}
                  placeholder="e.g. Explain activation functions in deep learning (Sigmoid, Tanh, ReLU) with neat diagrams and mathematical formulas..."
                  className="w-full px-4 py-3 rounded-2xl bg-[#f8f9fc] dark:bg-slate-950 border border-[#dcdfe6] dark:border-slate-800 text-sm text-[#121217] dark:text-slate-100 placeholder-[#8c8fa1] dark:placeholder-slate-600 focus:outline-hidden focus:ring-2 focus:ring-[#4f75f2]"
                />
              </div>

              {/* Controls Row */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-[#f0f2f7] dark:border-slate-800/60">
                {/* Subject Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-[#8c8fa1] dark:text-slate-500">Subject:</span>
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-[#f8f9fc] dark:bg-slate-950 border border-[#dcdfe6] dark:border-slate-800 text-xs font-medium text-[#121217] dark:text-slate-200 focus:outline-hidden"
                  >
                    {SUBJECT_OPTIONS.map((sub) => (
                      <option key={sub.code} value={sub.code}>
                        {sub.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Mark Weightage Scheme */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono text-[#8c8fa1] dark:text-slate-500 mr-1">Scheme:</span>
                  {([2, 5, 10, 15] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMarks(m)}
                      className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all ${
                        marks === m
                          ? 'bg-[#4f75f2] text-white shadow-xs'
                          : 'bg-[#f8f9fc] dark:bg-slate-950 text-[#6b6f82] dark:text-slate-400 border border-[#dcdfe6] dark:border-slate-800 hover:text-[#121217]'
                      }`}
                    >
                      {m}M
                    </button>
                  ))}
                </div>

                {/* Language Toggle */}
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#f8f9fc] dark:bg-slate-950 border border-[#dcdfe6] dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setLanguage('english')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold ${
                      language === 'english' ? 'bg-white dark:bg-slate-800 text-[#4f75f2] shadow-xs' : 'text-[#8c8fa1]'
                    }`}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage('hinglish')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold ${
                      language === 'hinglish' ? 'bg-white dark:bg-slate-800 text-[#4f75f2] shadow-xs' : 'text-[#8c8fa1]'
                    }`}
                  >
                    Hinglish
                  </button>
                </div>

                {/* Source Scope */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-[#8c8fa1] dark:text-slate-500">Source:</span>
                  <select
                    value={sourceScope}
                    onChange={(e: any) => setSourceScope(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-[#f8f9fc] dark:bg-slate-950 border border-[#dcdfe6] dark:border-slate-800 text-xs font-medium text-[#121217] dark:text-slate-200 focus:outline-hidden"
                  >
                    <option value="ALL_ACADEMIC_RESOURCES">All Courseware & Uploads</option>
                    <option value="OFFICIAL_SYLLABUS">Official Syllabus Only</option>
                    <option value="STUDENT_UPLOADS">Student Uploads Only</option>
                  </select>
                </div>

                {/* Generate Button */}
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-[11px] font-mono text-[#6b6f82] dark:text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={forceLive}
                      onChange={(e) => setForceLive(e.target.checked)}
                      className="rounded text-[#4f75f2]"
                    />
                    Bypass Cache
                  </label>

                  <button
                    type="submit"
                    disabled={loading || !query.trim()}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#4f75f2] hover:bg-[#3f64de] disabled:opacity-50 text-white font-mono text-xs font-bold transition-all shadow-sm"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Generating Grounded {marks}M Answer...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        Generate {marks}-Mark Answer
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>

            {/* Quick Prompts */}
            <div className="pt-3 border-t border-[#f0f2f7] dark:border-slate-800/60">
              <span className="text-[11px] font-mono font-semibold text-[#8c8fa1] dark:text-slate-500 block mb-2">
                HIGH-FREQUENCY MUMBAI UNIVERSITY PROMPTS:
              </span>
              <div className="flex flex-wrap gap-2">
                {QUICK_PROMPTS.map((qp, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setQuery(qp.text);
                      setSelectedSubject(qp.subjectCode);
                      setMarks(qp.marks as any);
                    }}
                    className="text-left px-3 py-1.5 rounded-xl bg-[#f8f9fc] dark:bg-slate-950 border border-[#e3e6ed] dark:border-slate-800 hover:border-[#4f75f2] text-xs text-[#4c4f63] dark:text-slate-300 transition-colors flex items-center gap-2"
                  >
                    <span className="font-mono text-[10px] text-[#4f75f2] dark:text-indigo-400 font-bold">
                      [{qp.subjectCode} • {qp.marks}M]
                    </span>
                    <span className="truncate max-w-xs">{qp.text}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Response Section */}
          {response && (
            <div className="space-y-6">
              {/* Quality & Grounding Inspector Bar */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-[#e3e6ed] dark:border-slate-800 flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#8c8fa1] dark:text-slate-500 block">
                      Factual Grounding
                    </span>
                    <span className="text-base font-bold text-[#121217] dark:text-slate-100">
                      {Math.round(response.verification.factualGroundednessScore * 100)}%
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-[#e3e6ed] dark:border-slate-800 flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#8c8fa1] dark:text-slate-500 block">
                      Citation Integrity
                    </span>
                    <span className="text-base font-bold text-[#121217] dark:text-slate-100">
                      {Math.round(response.verification.citationIntegrityScore * 100)}% ({response.citations.length} cited)
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-[#e3e6ed] dark:border-slate-800 flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
                    <Gauge className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#8c8fa1] dark:text-slate-500 block">
                      {response.marks}M Compliance
                    </span>
                    <span className="text-base font-bold text-[#121217] dark:text-slate-100">
                      {response.verification.wordCount} words
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-[#e3e6ed] dark:border-slate-800 flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#8c8fa1] dark:text-slate-500 block">
                      Model / Cache
                    </span>
                    <span className="text-xs font-mono font-bold text-[#121217] dark:text-slate-100 truncate block">
                      {response.cached ? '⚡ Cached (0ms)' : `${response.executionTimeMs}ms • ${response.modelUsed}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Limitations Notice if applicable */}
              {response.verification.disclosedLimitations.length > 0 && (
                <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-800 dark:text-amber-300">
                    <span className="font-bold">Honest Disclosure: </span>
                    {response.verification.disclosedLimitations.join(' ')}
                  </div>
                </div>
              )}

              {/* Main Formatted Answer */}
              <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-[#e3e6ed] dark:border-slate-800 shadow-sm space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-[#f0f2f7] dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[#4f75f2] dark:text-indigo-400 uppercase">
                      {response.subjectCode || 'CURRICULUM'} • {response.marks} MARKS TOPPER STANDARD
                    </span>
                    <span className="text-xs text-[#8c8fa1]">•</span>
                    <span className="text-xs text-[#6b6f82] dark:text-slate-400 font-mono">
                      {response.language.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#f8f9fc] dark:bg-slate-950 border border-[#dcdfe6] dark:border-slate-800 text-xs font-mono font-semibold text-[#6b6f82] dark:text-slate-300 hover:text-[#121217]"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                {/* Formatted Content */}
                <div className="prose dark:prose-invert max-w-none">
                  <FormattedAnswer content={response.answer} />
                </div>

                {/* Citations Drawer */}
                {response.citations.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-[#f0f2f7] dark:border-slate-800 space-y-3">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-[#4f75f2]" />
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#121217] dark:text-slate-200">
                        Verified Primary Citations ({response.citations.length})
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {response.citations.map((c, i) => (
                        <div
                          key={i}
                          className="p-3.5 rounded-2xl bg-[#f8f9fc] dark:bg-slate-950 border border-[#e3e6ed] dark:border-slate-800/80 space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#121217] dark:text-slate-200 truncate">
                              {c.sourceTitle}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
                              {c.verificationStatus}
                            </span>
                          </div>
                          {c.pageNumber && (
                            <span className="text-[11px] font-mono text-[#8c8fa1] dark:text-slate-500 block">
                              Page: {c.pageNumber} {c.sectionHeading ? `• ${c.sectionHeading}` : ''}
                            </span>
                          )}
                          <p className="text-xs text-[#6b6f82] dark:text-slate-400 italic line-clamp-2">
                            "{c.extractedSnippet}"
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Universal Hybrid Search */}
      {activeTab === 'search' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-[#e3e6ed] dark:border-slate-800 shadow-xs">
            <form onSubmit={handleSearch} className="flex gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#8c8fa1] absolute left-4 top-3.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search across all 5 Mumbai University subjects, modules, PYQs, and uploaded documents..."
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#f8f9fc] dark:bg-slate-950 border border-[#dcdfe6] dark:border-slate-800 text-sm text-[#121217] dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#4f75f2]"
                />
              </div>
              <button
                type="submit"
                disabled={searchLoading || !searchQuery.trim()}
                className="px-6 py-3 rounded-2xl bg-[#4f75f2] hover:bg-[#3f64de] disabled:opacity-50 text-white font-mono text-xs font-bold transition-all shadow-xs shrink-0"
              >
                {searchLoading ? 'Searching...' : 'Hybrid Search'}
              </button>
            </form>
          </div>

          {/* Results list */}
          <div className="space-y-3">
            {searchResults.map((item, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-[#e3e6ed] dark:border-slate-800 space-y-2 hover:border-[#4f75f2] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg bg-[#edf3fc] dark:bg-indigo-950/60 text-[#4f75f2] dark:text-indigo-400 font-mono text-[10px] font-bold uppercase">
                      {item.sourceType}
                    </span>
                    <span className="text-xs font-bold text-[#121217] dark:text-slate-200">
                      {item.sourceTitle}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-[#8c8fa1] dark:text-slate-500">
                    RRF Score: {item.score}
                  </span>
                </div>
                <p className="text-xs text-[#4c4f63] dark:text-slate-300 whitespace-pre-line leading-relaxed">
                  {item.content}
                </p>
              </div>
            ))}
            {searchResults.length === 0 && !searchLoading && (
              <div className="p-12 text-center text-xs font-mono text-[#8c8fa1] dark:text-slate-500">
                Enter an academic search query to inspect multi-stage Reciprocal Rank Fusion results.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Academic Document Ingestion */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Ingestion Form */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-[#e3e6ed] dark:border-slate-800 shadow-xs space-y-4">
              <h2 className="text-base font-bold text-[#121217] dark:text-slate-100 flex items-center gap-2">
                <Upload className="w-4 h-4 text-[#4f75f2]" />
                10-Stage Document Ingestion Pipeline
              </h2>
              <p className="text-xs text-[#6b6f82] dark:text-slate-400">
                Upload faculty notes, syllabus excerpts, or university question banks. The system will extract formulas, tables, and classify modules against Mumbai University Sem VII.
              </p>

              <form onSubmit={handleIngestDocument} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-mono text-[#8c8fa1] mb-1">DOCUMENT TITLE</label>
                  <input
                    type="text"
                    value={uploadFilename}
                    onChange={(e) => setUploadFilename(e.target.value)}
                    placeholder="e.g. Unit-3-Deep-Learning-Notes.md"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#f8f9fc] dark:bg-slate-950 border border-[#dcdfe6] dark:border-slate-800 text-xs text-[#121217] dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-[#8c8fa1] mb-1">TARGET SUBJECT</label>
                  <select
                    value={uploadSubject}
                    onChange={(e) => setUploadSubject(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#f8f9fc] dark:bg-slate-950 border border-[#dcdfe6] dark:border-slate-800 text-xs text-[#121217] dark:text-slate-100"
                  >
                    {SUBJECT_OPTIONS.filter((s) => s.code).map((s) => (
                      <option key={s.code} value={s.code}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-[#8c8fa1] mb-1">DOCUMENT CONTENT / NOTES</label>
                  <textarea
                    value={uploadText}
                    onChange={(e) => setUploadText(e.target.value)}
                    rows={6}
                    placeholder="Paste textbook excerpt, lecture notes, or syllabus content..."
                    className="w-full px-3.5 py-2 rounded-xl bg-[#f8f9fc] dark:bg-slate-950 border border-[#dcdfe6] dark:border-slate-800 text-xs text-[#121217] dark:text-slate-100"
                  />
                </div>

                <button
                  type="submit"
                  disabled={ingesting || !uploadFilename.trim() || !uploadText.trim()}
                  className="w-full py-2.5 rounded-xl bg-[#4f75f2] hover:bg-[#3f64de] disabled:opacity-50 text-white font-mono text-xs font-bold transition-all shadow-xs"
                >
                  {ingesting ? 'Processing 10-Stage Pipeline...' : 'Start Ingestion Pipeline'}
                </button>
              </form>

              {ingestStatus && (
                <div className="p-3 rounded-xl bg-[#edf3fc] dark:bg-slate-800 text-xs font-mono text-[#4f75f2] dark:text-indigo-400">
                  {ingestStatus}
                </div>
              )}
            </div>

            {/* Pipeline Stage Visualizer */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-[#e3e6ed] dark:border-slate-800 shadow-xs space-y-4">
              <h2 className="text-base font-bold text-[#121217] dark:text-slate-100 flex items-center gap-2">
                <Database className="w-4 h-4 text-[#4f75f2]" />
                Indexed Academic Documents ({documents.length})
              </h2>

              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {documents.map((doc) => {
                  const intel = doc.intelligenceData || {};
                  return (
                    <div
                      key={doc.id}
                      className="p-3.5 rounded-2xl bg-[#f8f9fc] dark:bg-slate-950 border border-[#e3e6ed] dark:border-slate-800/80 space-y-1.5 flex items-center justify-between"
                    >
                      <div>
                        <span className="text-xs font-bold text-[#121217] dark:text-slate-200 block truncate max-w-xs">
                          {doc.filename}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-[#8c8fa1] dark:text-slate-500">
                          <span>{intel.subjectCode || 'General'}</span>
                          <span>•</span>
                          <span>{intel.chunksCount || 'Indexed'} chunks</span>
                          <span>•</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold uppercase">{doc.status}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
                        title="Delete Document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}

                {documents.length === 0 && (
                  <div className="p-8 text-center text-xs font-mono text-[#8c8fa1]">
                    No custom academic documents indexed yet. The system is actively grounded in the 5 Mumbai University Syllabus PDFs and 58 video lectures.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Academic Benchmark Suite */}
      {activeTab === 'benchmark' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-[#e3e6ed] dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-[#121217] dark:text-slate-100 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-[#4f75f2]" />
                Mumbai University Academic Evaluation Suite
              </h2>
              <p className="text-xs text-[#6b6f82] dark:text-slate-400 mt-1">
                Automated regression benchmark verifying factual grounding, citation integrity, and mark scheme compliance across all 5 Semester VII engineering subjects.
              </p>
            </div>

            <button
              onClick={handleRunBenchmark}
              disabled={benchmarkLoading}
              className="px-6 py-2.5 rounded-2xl bg-[#4f75f2] hover:bg-[#3f64de] disabled:opacity-50 text-white font-mono text-xs font-bold transition-all shadow-xs flex items-center gap-2 shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${benchmarkLoading ? 'animate-spin' : ''}`} />
              {benchmarkLoading ? 'Running 6-Question Benchmark...' : 'Run Academic Benchmark'}
            </button>
          </div>

          {benchmarkReport && (
            <div className="space-y-6">
              {/* Aggregate Score Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-[#e3e6ed] dark:border-slate-800">
                  <span className="text-[10px] font-mono uppercase text-[#8c8fa1] block">Overall Pass Rate</span>
                  <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {benchmarkReport.overallPassRate}%
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-[#e3e6ed] dark:border-slate-800">
                  <span className="text-[10px] font-mono uppercase text-[#8c8fa1] block">Avg Groundedness</span>
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {Math.round(benchmarkReport.averageGroundednessScore * 100)}%
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-[#e3e6ed] dark:border-slate-800">
                  <span className="text-[10px] font-mono uppercase text-[#8c8fa1] block">Citation Integrity</span>
                  <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {Math.round(benchmarkReport.averageCitationIntegrity * 100)}%
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-[#e3e6ed] dark:border-slate-800">
                  <span className="text-[10px] font-mono uppercase text-[#8c8fa1] block">Avg Response Latency</span>
                  <span className="text-2xl font-bold text-[#121217] dark:text-slate-100">
                    {benchmarkReport.averageLatencyMs}ms
                  </span>
                </div>
              </div>

              {/* Subject Breakdowns */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {Object.entries(benchmarkReport.resultsBySubject).map(([code, sub]) => (
                  <div
                    key={code}
                    className="p-4 rounded-2xl bg-[#f8f9fc] dark:bg-slate-950 border border-[#e3e6ed] dark:border-slate-800 text-center space-y-1"
                  >
                    <span className="text-xs font-mono font-bold text-[#4f75f2] block">{code}</span>
                    <span className="text-[11px] font-bold text-[#121217] dark:text-slate-200 block truncate">
                      {sub.subjectName}
                    </span>
                    <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      {sub.passRate}% Pass
                    </span>
                  </div>
                ))}
              </div>

              {/* Detailed Question Table */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-[#e3e6ed] dark:border-slate-800 space-y-3">
                <span className="text-xs font-mono font-bold text-[#8c8fa1] uppercase">EVALUATED TEST CASES</span>
                <div className="divide-y divide-[#f0f2f7] dark:divide-slate-800">
                  {benchmarkReport.results.map((r) => (
                    <div key={r.questionId} className="py-3 flex items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-[#edf3fc] dark:bg-indigo-950/60 text-[#4f75f2] font-mono text-[10px] font-bold">
                            {r.subjectCode} • {r.marks}M
                          </span>
                          <span className="text-xs font-bold text-[#121217] dark:text-slate-200 truncate max-w-xl">
                            {r.question}
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-[#8c8fa1] mt-1 flex items-center gap-3">
                          <span>{r.wordCount} words</span>
                          <span>•</span>
                          <span>Grounded: {Math.round(r.factualGroundednessScore * 100)}%</span>
                          <span>•</span>
                          <span>Citations: {r.citationsCount}</span>
                          <span>•</span>
                          <span>{r.latencyMs}ms</span>
                        </div>
                      </div>

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase shrink-0 ${
                          r.passed
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400'
                        }`}
                      >
                        {r.passed ? 'PASSED' : 'FLAGGED'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
