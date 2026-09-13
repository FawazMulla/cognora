import { useEffect, useState } from 'react';
import { BrainCircuit, Calendar, Flame, CheckCircle, Clock, Zap, RotateCcw, Loader2, Sparkles, Plus, X, Award, ChevronRight } from 'lucide-react';
import { fetchApi } from '../lib/api';
import { getDefaultSubjects } from '../lib/ai-service';

type Subject = { id: string; name: string; code?: string };
type Flashcard = { id: string; front: string; back: string; intervalDays?: number; easeFactor?: number; reviewCount?: number };

const DEFAULT_FLASHCARDS_BY_SUBJECT: Record<string, Flashcard[]> = {
  default: [
    { id: 'fc-1', front: 'What is a consistent (monotonic) heuristic in A* search?', back: 'h(n) <= c(n, a, n\') + h(n\'). A consistent heuristic guarantees optimal graph search without re-expanding closed nodes.', intervalDays: 3, easeFactor: 2.5, reviewCount: 2 },
    { id: 'fc-2', front: 'Differentiate between BFS and DFS in terms of space complexity.', back: 'BFS: O(b^d) memory (exponential). DFS: O(b * m) linear memory with tree depth.', intervalDays: 6, easeFactor: 2.5, reviewCount: 3 },
    { id: 'fc-3', front: 'What is the vanishing gradient problem in Deep Neural Networks?', back: 'Gradients become exponentially small during backpropagation through many layers with saturating activations like sigmoid/tanh. Solved via ReLU and residual skip connections.', intervalDays: 1, easeFactor: 2.3, reviewCount: 1 },
    { id: 'fc-4', front: 'Explain the 4 ACID properties in Database Systems.', back: 'Atomicity (all or none), Consistency (valid state transitions), Isolation (concurrent safety), Durability (persistent commit).', intervalDays: 14, easeFactor: 2.6, reviewCount: 5 },
    { id: 'fc-5', front: 'How does MQTT ensure message delivery across unreliable IoT networks?', back: 'Through 3 QoS levels: QoS 0 (at most once), QoS 1 (at least once with PUBACK), and QoS 2 (exactly once via 4-step handshake).', intervalDays: 8, easeFactor: 2.4, reviewCount: 3 }
  ]
};

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

  useEffect(() => {
    async function loadSubjects() {
      const defaults = getDefaultSubjects();
      try {
        const res = await fetchApi('/api/subjects');
        if (res.subjects?.length > 0) {
          setSubjects(res.subjects);
          setSelectedSubjectId(res.subjects[0].id);
          return;
        }
      } catch (err) {
        console.warn('Backend subjects lookup warning:', err);
      }
      setSubjects(defaults);
      setSelectedSubjectId(defaults[0].id);
    }
    loadSubjects();
  }, []);

  useEffect(() => {
    if (!selectedSubjectId) return;
    async function loadFlashcards() {
      setLoading(true);
      try {
        const res = await fetchApi(`/api/subjects/${selectedSubjectId}/flashcards`);
        if (res.flashcards?.length > 0) {
          setCards(res.flashcards);
          setCurrentIdx(0);
          setFlipped(false);
          setLoading(false);
          return;
        }
      } catch {
        // fallback
      }
      setCards(DEFAULT_FLASHCARDS_BY_SUBJECT.default);
      setCurrentIdx(0);
      setFlipped(false);
      setLoading(false);
    }
    loadFlashcards();
  }, [selectedSubjectId]);

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFront.trim() || !newBack.trim() || adding) return;
    setAdding(true);
    const newCard: Flashcard = {
      id: `fc-${Date.now()}`,
      front: newFront.trim(),
      back: newBack.trim(),
      intervalDays: 1,
      easeFactor: 2.5,
      reviewCount: 0
    };

    try {
      await fetchApi(`/api/subjects/${selectedSubjectId}/flashcards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ front: newFront.trim(), back: newBack.trim() })
      });
    } catch {
      // add locally
    }

    setCards(prev => [newCard, ...prev]);
    setNewFront('');
    setNewBack('');
    setIsAddingCard(false);
    setAdding(false);
    setCurrentIdx(0);
    setFlipped(false);
  };

  const handleReview = async (rating: number) => {
    if (cards.length === 0 || reviewing) return;
    const card = cards[currentIdx];
    setReviewing(true);

    // Calculate local SM-2 updates
    const prevEase = card.easeFactor || 2.5;
    const prevInterval = card.intervalDays || 1;
    let newInterval = 1;
    let newEase = prevEase;

    if (rating >= 3) {
      if (prevInterval <= 1) newInterval = 6;
      else newInterval = Math.round(prevInterval * prevEase);
      newEase = Math.max(1.3, prevEase + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02)));
    } else {
      newInterval = 1;
      newEase = Math.max(1.3, prevEase - 0.2);
    }

    try {
      await fetchApi(`/api/flashcards/${card.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, newInterval, newEase })
      });
    } catch {
      // ignore
    }

    setTotalReviewed(p => p + 1);

    if (currentIdx < cards.length - 1) {
      setCurrentIdx(p => p + 1);
      setFlipped(false);
    } else {
      setCurrentIdx(0);
      setFlipped(false);
    }
    setReviewing(false);
  };

  const activeCard = cards[currentIdx];
  const masteredCount = cards.filter(c => (c.intervalDays || 0) >= 14).length;
  const progressPct = cards.length > 0 ? ((currentIdx + 1) / cards.length) * 100 : 0;
  const selectedSubject = subjects.find(s => s.id === selectedSubjectId);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 font-sans text-[#212121] bg-white min-h-screen">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-[#d9d9dd]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#fcf0ff] border border-[#f2d5fc] text-[#9b60aa] text-[9px] font-mono font-bold tracking-wider uppercase rounded mb-2">
            <BrainCircuit className="w-3 h-3 text-[#9b60aa]" /> Spaced Repetition (FSRS / SM-2)
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-light text-black tracking-tight uppercase">
            Smart Revision
          </h1>
          <p className="text-[#75758a] mt-1 text-xs">
            Optimized active recall calibrated to your personalized cognitive forgetting curve.
          </p>
        </div>

        {subjects.length > 0 && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAddingCard(true)}
              className="bg-black hover:bg-zinc-800 text-white px-4 py-2 rounded-full text-xs font-mono uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-white" />
              <span>Add Card</span>
            </button>
            <div className="flex items-center gap-2 bg-white border border-[#d9d9dd] rounded-full px-4 py-2">
              <Calendar className="w-3.5 h-3.5 text-[#75758a]" />
              <select
                value={selectedSubjectId}
                onChange={e => setSelectedSubjectId(e.target.value)}
                className="bg-transparent text-black outline-none text-xs font-mono font-bold cursor-pointer"
              >
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-[#75758a] font-mono text-xs uppercase">
          <Loader2 className="w-6 h-6 text-black animate-spin" />
          <span>Sorting Active Revision Queue...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stats Sidebar */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Active Streak', val: `${streak}d`, icon: Flame, color: 'text-[#ff7759]' },
                { label: 'Reviews Today', val: `${totalReviewed}`, icon: Zap, color: 'text-black' },
                { label: 'Queue Length', val: `${cards.length}`, icon: Clock, color: 'text-[#1863dc]' },
                { label: 'Mastered', val: `${masteredCount}`, icon: CheckCircle, color: 'text-[#003c33]' }
              ].map((stat, i) => (
                <div key={i} className="bg-[#eeece7] border border-[#d9d9dd] p-4 rounded-xl flex flex-col justify-between min-h-[90px]">
                  <stat.icon className={`w-4 h-4 mb-2 ${stat.color}`} />
                  <div>
                    <div className="text-xl font-mono font-bold text-black">{stat.val}</div>
                    <div className="text-[9px] font-mono text-[#75758a] uppercase tracking-wider mt-0.5">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white border border-[#d9d9dd] p-5 rounded-2xl space-y-3">
              <h3 className="text-xs font-mono font-bold text-black uppercase tracking-wider">Queue Progress</h3>
              <div>
                <div className="flex justify-between text-xs font-mono mb-1.5 text-[#75758a]">
                  <span>Card {currentIdx + 1} of {cards.length}</span>
                  <span className="font-bold text-black">{Math.round(progressPct)}%</span>
                </div>
                <div className="h-1.5 bg-[#eeece7] rounded-full overflow-hidden">
                  <div className="h-full bg-black transition-all duration-300" style={{ width: `${progressPct}%` }} />
                </div>
              </div>
              <p className="text-[10px] text-[#75758a] font-mono leading-relaxed uppercase">
                Subject: {selectedSubject?.name || 'Active Course'}
              </p>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-[#d9d9dd] rounded-2xl p-6 md:p-8 flex flex-col min-h-[500px] relative shadow-none">

              {cards.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 relative z-10">
                  <CheckCircle className="w-16 h-16 text-[#003c33] mb-4 animate-pulse" />
                  <h3 className="text-xl font-bold text-black font-display uppercase">All Caught Up!</h3>
                  <p className="text-[#75758a] max-w-xs mt-2 text-xs font-sans">No pending flashcards for today. Generate more or check back tomorrow.</p>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-4 relative z-10">
                    <h2 className="text-sm font-bold text-black uppercase font-display tracking-wider">Spaced Revision</h2>
                    <span className="text-xs font-mono font-bold text-[#75758a]">{currentIdx + 1} of {cards.length} cards</span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1 bg-[#eeece7] rounded-full mb-6 overflow-hidden relative z-10">
                    <div
                      className="h-full bg-black rounded-full transition-all duration-500"
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
                        className="absolute inset-0 bg-[#fafafb] border border-[#d9d9dd] rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-none"
                        style={{ backfaceVisibility: 'hidden' }}
                      >
                        <div className="text-[10px] font-mono font-bold text-[#75758a] uppercase tracking-widest mb-4">Question Concept</div>
                        <p className="text-lg font-bold text-black leading-relaxed max-w-xl font-display">{activeCard.front}</p>
                        <p className="text-xs font-mono text-[#ff7759] mt-6 font-bold uppercase tracking-wider">Click card to reveal answer →</p>
                      </div>
                      {/* Back */}
                      <div
                        className="absolute inset-0 bg-[#edfce9] border border-[#ccebc5] rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-none"
                        style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                      >
                        <div className="text-[10px] font-mono font-bold text-[#003c33] uppercase tracking-widest mb-4">Recall Answer</div>
                        <p className="text-sm font-sans font-medium text-black leading-relaxed max-w-xl whitespace-pre-wrap">{activeCard.back}</p>
                      </div>
                    </div>
                  </div>

                  {/* Rating buttons */}
                  <div className="mt-6 space-y-4 relative z-10">
                    {flipped && (
                      <div className="flex gap-2 animate-in fade-in duration-300">
                        {[
                          { rating: 0, label: 'Again', color: 'bg-[#fff1ed] hover:bg-white text-[#ff7759] border-[#ffdad0] hover:border-black' },
                          { rating: 1, label: 'Hard', color: 'bg-[#faf6e8] hover:bg-white text-[#967d22] border-[#eadeb5] hover:border-black' },
                          { rating: 2, label: 'Good', color: 'bg-[#f1f5ff] hover:bg-white text-[#1863dc] border-[#d0dcf5] hover:border-black' },
                          { rating: 3, label: 'Easy', color: 'bg-[#edfce9] hover:bg-white text-[#003c33] border-[#ccebc5] hover:border-black' }
                        ].map(({ rating, label, color }) => (
                          <button
                            key={rating}
                            disabled={reviewing}
                            onClick={() => handleReview(rating)}
                            className={`flex-1 font-bold py-2.5 rounded-full border transition-all text-xs font-mono uppercase tracking-wider cursor-pointer disabled:opacity-50 ${color}`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setFlipped(f => !f)}
                        className="flex-1 bg-white hover:bg-[#eeece7] text-black border border-[#d9d9dd] py-2.5 rounded-full text-xs font-mono uppercase tracking-wider font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-black" />
                        {flipped ? 'Hide Answer' : 'Show Answer'}
                      </button>
                      <button
                        onClick={() => { setFlipped(false); setCurrentIdx(p => (p + 1) % cards.length); }}
                        className="flex-1 bg-white hover:bg-[#eeece7] border border-[#d9d9dd] text-black py-2.5 rounded-full text-xs font-mono uppercase tracking-wider font-bold transition-colors cursor-pointer"
                      >
                        Skip Card →
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white border border-[#d9d9dd] w-full max-w-md rounded-2xl overflow-hidden shadow-2xl flex flex-col relative animate-in fade-in zoom-in duration-200 text-black">
            <header className="p-6 border-b border-[#d9d9dd] flex justify-between items-center bg-white">
              <h3 className="text-sm font-bold text-black uppercase font-display tracking-wider flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#ff7759]" />
                Add Flashcard Manually
              </h3>
              <button 
                onClick={() => setIsAddingCard(false)}
                className="text-[#75758a] hover:text-black p-1.5 rounded-full hover:bg-[#eeece7] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </header>
            
            <form onSubmit={handleAddCard} className="p-6 space-y-5 bg-white">
              <div className="space-y-2">
                <label className="block text-[10px] font-mono font-bold text-[#75758a] uppercase tracking-wide">Front (Question / Concept)</label>
                <textarea
                  value={newFront}
                  onChange={e => setNewFront(e.target.value)}
                  placeholder="Type the question or prompt..."
                  rows={3}
                  required
                  className="w-full bg-white border border-[#d9d9dd] rounded px-4 py-2.5 text-xs text-black placeholder-[#93939f] outline-none focus:border-[#9b60aa] transition-colors resize-none font-sans"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-mono font-bold text-[#75758a] uppercase tracking-wide">Back (Recall Answer)</label>
                <textarea
                  value={newBack}
                  onChange={e => setNewBack(e.target.value)}
                  placeholder="Type the model answer or explanation..."
                  rows={4}
                  required
                  className="w-full bg-white border border-[#d9d9dd] rounded px-4 py-2.5 text-xs text-black placeholder-[#93939f] outline-none focus:border-[#9b60aa] transition-colors resize-none font-sans"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setIsAddingCard(false)}
                  className="bg-transparent hover:bg-[#eeece7] border border-[#d9d9dd] text-black px-5 py-2.5 rounded-full text-xs font-semibold transition-colors cursor-pointer font-sans"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={adding || !newFront.trim() || !newBack.trim()}
                  className="bg-black hover:bg-zinc-800 text-white px-6 py-2.5 rounded-full text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 font-sans"
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
