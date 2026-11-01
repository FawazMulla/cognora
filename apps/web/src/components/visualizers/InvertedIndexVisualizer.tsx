import React, { useState, useMemo } from 'react';
import { Database, Search, ArrowRight, CheckCircle2, Play, RefreshCw, Sparkles, Layers } from 'lucide-react';

interface DocItem {
  id: number;
  text: string;
}

const DEFAULT_DOCS: DocItem[] = [
  { id: 1, text: "new home sales top forecasts" },
  { id: 2, text: "home sales rise in july" },
  { id: 3, text: "rise in home sales forecasts" }
];

const STOPWORDS = new Set(["in", "a", "the", "and", "or", "to", "of"]);

export default function InvertedIndexVisualizer() {
  const [docs, setDocs] = useState<DocItem[]>(DEFAULT_DOCS);
  const [searchQuery, setSearchQuery] = useState("home AND sales");
  const [activeStep, setActiveStep] = useState<number>(3); // 0: Raw, 1: Tokens, 2: Postings, 3: Full Index & Search
  const [highlightedTerm, setHighlightedTerm] = useState<string | null>(null);

  // Compute inverted index from docs
  const invertedIndex = useMemo(() => {
    const index: Record<string, { df: number; postings: { docId: number; positions: number[] }[] }> = {};

    docs.forEach(doc => {
      const tokens = doc.text.toLowerCase().split(/\s+/).filter(Boolean);
      tokens.forEach((rawToken, pos) => {
        const clean = rawToken.replace(/[^a-z0-9]/g, '');
        if (!clean || STOPWORDS.has(clean)) return;

        if (!index[clean]) {
          index[clean] = { df: 0, postings: [] };
        }

        let posting = index[clean].postings.find(p => p.docId === doc.id);
        if (!posting) {
          posting = { docId: doc.id, positions: [] };
          index[clean].postings.push(posting);
          index[clean].df++;
        }
        posting.positions.push(pos + 1);
      });
    });

    // Sort terms alphabetically
    const sortedTerms = Object.keys(index).sort();
    const sortedIndex: Record<string, typeof index[string]> = {};
    sortedTerms.forEach(t => {
      sortedIndex[t] = index[t];
    });

    return sortedIndex;
  }, [docs]);

  // Compute query matches
  const searchResults = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return [];

    if (q.includes(" and ")) {
      const parts = q.split(" and ").map(s => s.trim());
      const postLists = parts.map(term => {
        const entry = invertedIndex[term];
        return entry ? new Set(entry.postings.map(p => p.docId)) : new Set<number>();
      });

      if (postLists.length === 0) return [];
      let intersection = Array.from(postLists[0]);
      for (let i = 1; i < postLists.length; i++) {
        intersection = intersection.filter(id => postLists[i].has(id));
      }
      return intersection;
    } else if (q.includes(" or ")) {
      const parts = q.split(" or ").map(s => s.trim());
      const union = new Set<number>();
      parts.forEach(term => {
        const entry = invertedIndex[term];
        if (entry) entry.postings.forEach(p => union.add(p.docId));
      });
      return Array.from(union).sort();
    } else {
      // Single term
      const entry = invertedIndex[q];
      return entry ? entry.postings.map(p => p.docId) : [];
    }
  }, [searchQuery, invertedIndex]);

  const addCustomDoc = () => {
    const newId = docs.length + 1;
    setDocs([...docs, { id: newId, text: `forecasts top quarterly growth doc ${newId}` }]);
  };

  const resetDocs = () => {
    setDocs(DEFAULT_DOCS);
    setSearchQuery("home AND sales");
    setHighlightedTerm(null);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-sky-500" />
            <h3 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wider font-display">
              Interactive Inverted Index Builder
            </h3>
            <span className="text-[10px] font-mono font-bold bg-sky-100 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 px-2 py-0.5 rounded-full border border-sky-300 dark:border-sky-800">
              IRS Architecture
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Simulate document tokenization, dictionary vocabulary construction, posting lists, and Boolean query intersection.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={resetDocs}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset
          </button>
          <button
            onClick={addCustomDoc}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-semibold bg-sky-600 hover:bg-sky-700 text-white transition-colors shadow-2xs"
          >
            + Add Doc
          </button>
        </div>
      </div>

      {/* Process Stepper */}
      <div className="grid grid-cols-4 gap-2 my-4">
        {[
          { label: "1. Raw Documents", step: 0 },
          { label: "2. Tokenization & Filter", step: 1 },
          { label: "3. Sorted Lexicon", step: 2 },
          { label: "4. Inverted Postings", step: 3 }
        ].map(item => (
          <button
            key={item.step}
            onClick={() => setActiveStep(item.step)}
            className={`py-2 px-2.5 rounded-xl text-[11px] font-mono font-bold transition-all text-center border ${
              activeStep === item.step
                ? 'bg-sky-50 dark:bg-sky-950/50 border-sky-300 dark:border-sky-700 text-sky-600 dark:text-sky-300 shadow-xs'
                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-4">
        {/* Left Column: Documents & Search Engine */}
        <div className="lg:col-span-5 space-y-4">
          {/* Document Corpus */}
          <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Document Corpus ({docs.length})
              </span>
              <span className="text-[10px] font-mono text-slate-400">Stopwords filtered: in, a, the, of</span>
            </div>
            <div className="space-y-2">
              {docs.map(doc => {
                const isMatched = searchResults.includes(doc.id);
                return (
                  <div
                    key={doc.id}
                    className={`p-2.5 rounded-lg border text-xs font-mono transition-all ${
                      isMatched
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700 text-slate-800 dark:text-slate-100 ring-2 ring-emerald-500/20'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold mb-1">
                      <span className="text-sky-600 dark:text-sky-400">Doc {doc.id}</span>
                      {isMatched && (
                        <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-md">
                          <CheckCircle2 className="w-3 h-3" /> MATCH
                        </span>
                      )}
                    </div>
                    <div className="text-[13px] leading-relaxed">
                      "{doc.text}"
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live Query Box */}
          <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-2">
              Boolean Query Processor
            </span>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Try: home AND sales, or rise OR top"
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="flex flex-wrap gap-1.5 mt-2.5">
              <span className="text-[10px] font-mono text-slate-400 self-center">Presets:</span>
              {["home AND sales", "rise AND forecasts", "home AND sales AND forecasts", "top OR july"].map(preset => (
                <button
                  key={preset}
                  onClick={() => setSearchQuery(preset)}
                  className="px-2 py-0.5 rounded text-[10px] font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-sky-400 transition-colors"
                >
                  {preset}
                </button>
              ))}
            </div>

            {/* Results Output */}
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-500 dark:text-slate-400">Retrieved Postings:</span>
              <div className="flex items-center gap-1.5">
                {searchResults.length > 0 ? (
                  searchResults.map(id => (
                    <span key={id} className="bg-emerald-600 text-white font-bold px-2 py-0.5 rounded text-xs shadow-2xs">
                      Doc {id}
                    </span>
                  ))
                ) : (
                  <span className="text-rose-500 font-semibold text-xs">No documents match</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Inverted Index Table */}
        <div className="lg:col-span-7">
          <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 h-full">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-500" />
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Vocabulary Lexicon & Postings Linked Lists
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                Dictionary Size: {Object.keys(invertedIndex).length} Terms
              </span>
            </div>

            {/* Inverted Index Representation */}
            <div className="space-y-2 overflow-y-auto max-h-[380px] pr-1">
              {Object.entries(invertedIndex).map(([term, data]) => {
                const isSearched = searchQuery.toLowerCase().includes(term);
                const isHovered = highlightedTerm === term;
                return (
                  <div
                    key={term}
                    onMouseEnter={() => setHighlightedTerm(term)}
                    onMouseLeave={() => setHighlightedTerm(null)}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-lg border font-mono transition-all gap-2 ${
                      isSearched || isHovered
                        ? 'bg-sky-50/80 dark:bg-sky-950/40 border-sky-300 dark:border-sky-600 shadow-xs'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {/* Term + DF */}
                    <div className="flex items-center gap-2.5 min-w-[130px]">
                      <span className={`text-xs font-bold ${isSearched ? 'text-sky-600 dark:text-sky-300' : 'text-slate-800 dark:text-slate-200'}`}>
                        {term}
                      </span>
                      <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                        df={data.df}
                      </span>
                    </div>

                    <ArrowRight className="hidden sm:block w-3.5 h-3.5 text-slate-400 shrink-0" />

                    {/* Postings Node List */}
                    <div className="flex flex-wrap items-center gap-1.5 flex-1">
                      {data.postings.map(post => (
                        <div
                          key={post.docId}
                          className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] border font-mono ${
                            searchResults.includes(post.docId) && isSearched
                              ? 'bg-emerald-100 dark:bg-emerald-950 border-emerald-400 text-emerald-800 dark:text-emerald-200 font-bold'
                              : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <span>Doc {post.docId}</span>
                          <span className="text-[9px] text-slate-400">
                            [{post.positions.join(',')}]
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pedagogical footnote */}
            <div className="mt-4 p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
              <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-sky-500" /> Exam Takeaway (Mumbai University):
              </span>
              <p>
                Two-pointer merge algorithm computes <code className="text-sky-600 dark:text-sky-400 font-bold">AND</code> conjunction in <code className="font-bold">O(x + y)</code> time by advancing the smaller document ID pointer. Skip pointers speed up queries by bypassing non-matching spans.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

