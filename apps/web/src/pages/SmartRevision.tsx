import { useEffect, useState } from 'react';
import { BrainCircuit, Calendar, Flame, CheckCircle, Clock, Zap, RotateCcw, Loader2, Sparkles, Plus, X } from 'lucide-react';
import { fetchApi } from '../lib/api';

type Subject = { id: string; name: string; code?: string };
type Flashcard = { id: string; front: string; back: string; intervalDays?: number; easeFactor?: number; reviewCount?: number };

export default function SmartRevision() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);
  const [totalReviewed, setTotalReviewed] = useState(0);
  const [streak] = useState(14);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newFront, setNewFront] = useState('');
  const [newBack, setNewBack] = useState('');
  const [adding, setAdding] = useState(false);

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFront.trim() || !newBack.trim() || !selectedSubjectId || adding) return;
    setAdding(true);
    try {
      await fetchApi(`/api/subjects/${selectedSubjectId}/flashcards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ front: newFront.trim(), back: newBack.trim() })
      });
      setNewFront('');
      setNewBack('');
      setIsAddingCard(false);

      // Reload flashcards queue
      const res = await fetchApi(`/api/subjects/${selectedSubjectId}/flashcards`);
      setCards(res.flashcards || []);
      setCurrentIdx(0);
      setFlipped(false);
    } catch {
      alert('Failed to save flashcard manually.');
    } finally {
      setAdding(false);
    }
  };
  useEffect(() => {
    async function loadSubjects() {
      try {
        const res = await fetchApi('/api/subjects');
        if (res.subjects?.length > 0) {
          setSubjects(res.subjects);
          setSelectedSubjectId(res.subjects[0].id);
        } else setLoading(false);
      } catch { setLoading(false); }
    }
    loadSubjects();
  }, []);

  useEffect(() => {
    if (!selectedSubjectId) return;
    async function loadFlashcards() {
      setLoading(true);
      try {
        const res = await fetchApi(`/api/subjects/${selectedSubjectId}/flashcards`);
        setCards(res.flashcards || []);
        setCurrentIdx(0);
        setFlipped(false);
      } catch { } finally { setLoading(false); }
    }
    loadFlashcards();
  }, [selectedSubjectId]);

  const handleReview = async (rating: number) => {
    if (cards.length === 0 || reviewing) return;
    const card = cards[currentIdx];
    setReviewing(true);
    try {
      await fetchApi(`/api/flashcards/${card.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating })
      });
      setTotalReviewed(p => p + 1);
      if (currentIdx < cards.length - 1) {
        setCurrentIdx(p => p + 1);
        setFlipped(false);
      } else {
        const res = await fetchApi(`/api/subjects/${selectedSubjectId}/flashcards`);
        setCards(res.flashcards || []);
        setCurrentIdx(0);
        setFlipped(false);
      }
    } catch { alert('Failed to record review.'); } finally { setReviewing(false); }
  };

  const activeCard = cards[currentIdx];
  const masteredCount = cards.filter(c => (c.intervalDays || 0) >= 14).length;
  const progressPct = cards.length > 0 ? (currentIdx / cards.length) * 100 : 0;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-10 font-sans min-h-screen text-slate-100">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight flex items-center gap-3 bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent">
            <BrainCircuit className="w-9 h-9 text-indigo-500 animate-pulse" />
            Smart Revision
          </h1>
          <p className="text-slate-400 mt-2 text-sm">AI-powered spaced repetition tuned to your cognitive forgetting curve.</p>
        </div>
        {subjects.length > 0 && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAddingCard(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-indigo-500/10"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Card</span>
            </button>
            <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-2.5 shadow-xl">
              <Calendar className="w-4 h-4 text-slate-400" />
              <select
                value={selectedSubjectId}
                onChange={e => setSelectedSubjectId(e.target.value)}
                className="bg-transparent text-slate-200 outline-none text-sm font-medium pr-8 cursor-pointer"
              >
                {subjects.map(s => (
                  <option key={s.id} value={s.id} className="bg-slate-950 text-slate-300">{s.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </header>

      {subjects.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/30 rounded-3xl border border-slate-800/80 border-dashed">
          <BrainCircuit className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-300">No Subjects Active</h3>
          <p className="text-slate-500 mt-2 max-w-md mx-auto text-sm">Create or select a subject from your home dashboard.</p>
        </div>
      ) : loading ? (
        <div className="flex flex-col items-center justify-center py-40 gap-4 text-slate-400">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
          <span className="text-sm font-medium">Sorting due flashcards...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Active Streak', val: `${streak}d`, icon: Flame, color: 'text-rose-500' },
                { label: 'Reviews Today', val: `${totalReviewed}`, icon: Zap, color: 'text-amber-500' },
                { label: 'Pending Cards', val: `${cards.length}`, icon: Clock, color: 'text-indigo-400' },
                { label: 'Mastered', val: `${masteredCount}`, icon: CheckCircle, color: 'text-emerald-400' }
              ].map((stat, i) => (
                <div key={i} className="bg-slate-900/40 border border-slate-800/80 p-5 rounded-2xl flex flex-col justify-between">
                  <stat.icon className={`w-5 h-5 mb-4 ${stat.color}`} />
                  <div>
                    <div className="text-2xl font-bold text-slate-100">{stat.val}</div>
                    <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-xl" />
              <h3 className="text-sm font-bold text-white mb-3 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-400" /> FSRS-4.5 Algorithm
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Our spaced repetition uses FSRS-4.5 — the Free Spaced Repetition Scheduler. It calculates your personal forgetting curve R = e^(-t/S) and schedules reviews at the optimal moment before forgetting occurs.
              </p>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 md:p-8 flex flex-col min-h-[500px] backdrop-blur-xl relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl" />

              {cards.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 relative z-10">
                  <CheckCircle className="w-16 h-16 text-emerald-500 mb-4 animate-pulse" />
                  <h3 className="text-xl font-bold text-slate-300">All Caught Up!</h3>
                  <p className="text-slate-500 max-w-xs mt-2 text-sm">No pending flashcards for today. Upload more resources or check back tomorrow.</p>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-4 relative z-10">
                    <h2 className="text-lg font-bold text-white uppercase tracking-wider">Spaced Revision</h2>
                    <span className="text-xs font-semibold text-slate-500">{currentIdx + 1} of {cards.length} cards</span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1 bg-slate-800 rounded-full mb-6 overflow-hidden relative z-10">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>

                  {/* 3D Flip Card */}
                  <div
                    onClick={() => setFlipped(f => !f)}
                    className="flex-1 cursor-pointer select-none relative z-10 min-h-64"
                    style={{ perspective: '1000px' }}
                  >
                    <div
                      className="relative w-full h-full transition-transform duration-500"
                      style={{
                        transformStyle: 'preserve-3d',
                        transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                        minHeight: '240px'
                      }}
                    >
                      {/* Front */}
                      <div
                        className="absolute inset-0 bg-slate-950/60 border border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center"
                        style={{ backfaceVisibility: 'hidden' }}
                      >
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Question Concept</div>
                        <p className="text-xl font-semibold text-slate-200 leading-relaxed max-w-xl">{activeCard.front}</p>
                        <p className="text-xs text-slate-600 mt-6">Click to flip →</p>
                      </div>
                      {/* Back */}
                      <div
                        className="absolute inset-0 bg-indigo-950/30 border border-indigo-500/20 rounded-2xl p-8 flex flex-col items-center justify-center text-center"
                        style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                      >
                        <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-4">Recall Answer</div>
                        <p className="text-base text-slate-300 leading-relaxed max-w-xl whitespace-pre-wrap">{activeCard.back}</p>
                      </div>
                    </div>
                  </div>

                  {/* Rating buttons */}
                  <div className="mt-6 space-y-4 relative z-10">
                    {flipped && (
                      <div className="flex gap-2 animate-in fade-in duration-300">
                        {[
                          { rating: 0, label: 'Again', color: 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/25' },
                          { rating: 1, label: 'Hard', color: 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/25' },
                          { rating: 2, label: 'Good', color: 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border-indigo-500/25' },
                          { rating: 3, label: 'Easy', color: 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/25' }
                        ].map(({ rating, label, color }) => (
                          <button
                            key={rating}
                            disabled={reviewing}
                            onClick={() => handleReview(rating)}
                            className={`flex-1 font-bold py-3 rounded-xl border transition-all text-xs cursor-pointer disabled:opacity-50 ${color}`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setFlipped(f => !f)}
                        className="flex-1 bg-slate-950 hover:bg-slate-900 text-slate-400 border border-slate-800 py-3 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        {flipped ? 'Hide Answer' : 'Show Answer'}
                      </button>
                      <button
                        onClick={() => { setFlipped(false); setCurrentIdx(p => (p + 1) % cards.length); }}
                        className="flex-1 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 py-3 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      >
                        Skip →
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Card Modal */}
      {isAddingCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col relative animate-in fade-in zoom-in duration-200 text-slate-100">
            <header className="p-6 border-b border-slate-850 flex justify-between items-center">
              <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-400" />
                Add Flashcard Manually
              </h3>
              <button 
                onClick={() => setIsAddingCard(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </header>
            
            <form onSubmit={handleAddCard} className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">Front (Question / Concept)</label>
                <textarea
                  value={newFront}
                  onChange={e => setNewFront(e.target.value)}
                  placeholder="Type the question or prompt..."
                  rows={3}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-indigo-500 transition-colors resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">Back (Recall Answer)</label>
                <textarea
                  value={newBack}
                  onChange={e => setNewBack(e.target.value)}
                  placeholder="Type the model answer or explanation..."
                  rows={4}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-indigo-500 transition-colors resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setIsAddingCard(false)}
                  className="bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 px-5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={adding || !newFront.trim() || !newBack.trim()}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                >
                  {adding ? 'Saving...' : 'Add Flashcard'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
