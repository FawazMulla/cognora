import { useEffect, useState } from 'react';
import { Calendar, Flame, CheckCircle, Clock, Zap, RotateCcw, Loader2, Plus, X } from 'lucide-react';
import { fetchApi } from '../lib/api';
import { getDefaultSubjects } from '../lib/ai-service';

type Subject = { id: string; name: string; code?: string };
type Flashcard = { id: string; front: string; back: string; intervalDays?: number; easeFactor?: number; reviewCount?: number };

const DEFAULT_FLASHCARDS_BY_SUBJECT: Record<string, Flashcard[]> = {
  itc701: [
    { id: 'fc-ai-1', front: 'What is a consistent (monotonic) heuristic in A* search?', back: 'h(n) <= c(n, a, n\') + h(n\'). A consistent heuristic guarantees optimal graph search without re-expanding closed nodes.', intervalDays: 3, easeFactor: 2.5, reviewCount: 2 },
    { id: 'fc-ai-2', front: 'What is the vanishing gradient problem in Deep Neural Networks?', back: 'Gradients become exponentially small during backpropagation through many layers with saturating activations like sigmoid/tanh. Solved via ReLU and residual skip connections.', intervalDays: 1, easeFactor: 2.3, reviewCount: 1 },
    { id: 'fc-ai-3', front: 'Define Mamdani Defuzzification Centroid formula.', back: 'z* = (∫ z · μ_A(z) dz) / (∫ μ_A(z) dz). Calculates the center of gravity of the aggregated fuzzy output distribution.', intervalDays: 7, easeFactor: 2.5, reviewCount: 3 },
    { id: 'fc-ai-4', front: 'Differentiate between Bagging and Boosting in Ensemble Learning.', back: 'Bagging trains parallel models independently on bootstrap samples to reduce variance (e.g. Random Forest). Boosting trains sequential models focusing on prior errors to reduce bias (e.g. AdaBoost).', intervalDays: 10, easeFactor: 2.6, reviewCount: 4 },
    { id: 'fc-ai-5', front: 'State Bayes Theorem for Bayesian Network belief updating.', back: 'P(H|E) = [P(E|H) · P(H)] / P(E). Computes posterior belief given evidence likelihood and prior probability.', intervalDays: 14, easeFactor: 2.7, reviewCount: 5 }
  ],
  itc702: [
    { id: 'fc-ioe-1', front: 'How does MQTT ensure message delivery across unreliable IoT networks?', back: 'Through 3 QoS levels: QoS 0 (at most once), QoS 1 (at least once with PUBACK), and QoS 2 (exactly once via 4-step handshake: PUBLISH -> PUBREC -> PUBREL -> PUBCOMP).', intervalDays: 8, easeFactor: 2.4, reviewCount: 3 },
    { id: 'fc-ioe-2', front: 'Differentiate between CoAP and MQTT for resource-constrained IoT.', back: 'CoAP: UDP-based, RESTful client-server, native multicast, header 4 bytes. MQTT: TCP-based, publish-subscribe broker, persistent sessions, header 2 bytes.', intervalDays: 5, easeFactor: 2.5, reviewCount: 2 },
    { id: 'fc-ioe-3', front: 'Explain BLE Generic Attribute Profile (GATT) Architecture.', back: 'Defines how data is organized and exchanged via Services and Characteristics in a client-server hierarchy using 128-bit or 16-bit UUIDs.', intervalDays: 6, easeFactor: 2.5, reviewCount: 3 },
    { id: 'fc-ioe-4', front: 'What are the 4 Pillars of Internet of Everything (Cisco Framework)?', back: 'People (connected individuals), Process (delivering the right info to right person/machine), Data (actionable telemetry), Things (physical edge sensors and actuators).', intervalDays: 12, easeFactor: 2.6, reviewCount: 4 },
    { id: 'fc-ioe-5', front: 'What is 6LoWPAN and what is its primary role?', back: 'IPv6 over Low-Power Wireless Personal Area Networks. It compresses 40-byte IPv6 headers down to 2-4 bytes for transmission over IEEE 802.15.4 radio frames.', intervalDays: 4, easeFactor: 2.4, reviewCount: 2 }
  ],
  itdo7014: [
    { id: 'fc-stqa-1', front: 'Formulate McCabe Cyclomatic Complexity V(G).', back: 'V(G) = E - N + 2P (where E = edges, N = nodes, P = connected components) or V(G) = Predicate Nodes + 1. Determines maximum independent paths for basis path testing.', intervalDays: 5, easeFactor: 2.5, reviewCount: 2 },
    { id: 'fc-stqa-2', front: 'Explain Equivalence Class Partitioning (ECP) & Boundary Value Analysis (BVA).', back: 'ECP divides input domain into valid and invalid partitions (1 test per class). BVA selects boundary points: Min, Min+, Nom, Max-, Max to detect off-by-one fencepost errors.', intervalDays: 7, easeFactor: 2.5, reviewCount: 3 },
    { id: 'fc-stqa-3', front: 'Differentiate between Defect Severity and Priority with examples.', back: 'Severity: Impact on system operation (Critical/Major/Minor). Priority: Urgency of fixing (Immediate/High/Low). Example: Company logo typo on homepage = High Priority, Low Severity.', intervalDays: 4, easeFactor: 2.4, reviewCount: 2 },
    { id: 'fc-stqa-4', front: 'What is the Page Object Model (POM) in Selenium automation?', back: 'A design pattern that models each web page as a class containing UI locators and user actions. Separates test logic from page implementation, eliminating maintenance fragility.', intervalDays: 9, easeFactor: 2.6, reviewCount: 4 },
    { id: 'fc-stqa-5', front: 'List the 3 categories of McCall Software Quality Model.', back: 'Product Operation (Correctness, Reliability, Efficiency, Integrity, Usability), Product Revision (Maintainability, Flexibility, Testability), Product Transition (Portability, Reusability, Interoperability).', intervalDays: 14, easeFactor: 2.7, reviewCount: 5 }
  ],
  itdo7024: [
    { id: 'fc-irs-1', front: 'Formulate Cosine Similarity in the Classic Vector Space Model.', back: 'cos(q, d) = (q · d) / (||q|| · ||d||) = Σ(w_t,q · w_t,d) / (sqrt(Σ w_t,q²) · sqrt(Σ w_t,d²)). Normalizes by document length to prevent long document bias.', intervalDays: 6, easeFactor: 2.5, reviewCount: 3 },
    { id: 'fc-irs-2', front: 'Define TF-IDF Weighting Formula.', back: 'w_t,d = tf_t,d · log(N / df_t). Term frequency measures local importance in document; Inverse Document Frequency penalizes universally frequent stopwords.', intervalDays: 8, easeFactor: 2.6, reviewCount: 3 },
    { id: 'fc-irs-3', front: 'What are Skip Pointers in an Inverted Index Posting List?', back: 'Auxiliary forward links placed at intervals of ~sqrt(L) in sorted posting lists. Enables skipping non-matching document IDs during AND query intersection in O(sqrt(L)) time.', intervalDays: 4, easeFactor: 2.4, reviewCount: 2 },
    { id: 'fc-irs-4', front: 'Explain the Rocchio Relevance Feedback Formula.', back: 'q_m = α · q_0 + (β / |D_r|) · Σ d_r - (γ / |D_nr|) · Σ d_nr. Shifts original query vector toward centroid of relevant documents and away from non-relevant documents.', intervalDays: 5, easeFactor: 2.5, reviewCount: 2 },
    { id: 'fc-irs-5', front: 'State PageRank random surfer formulation with damping factor.', back: 'PR(A) = (1 - d)/N + d · Σ(PR(T_i) / C(T_i)). Where d ≈ 0.85 is probability of following a hyperlink versus jumping to random page.', intervalDays: 12, easeFactor: 2.7, reviewCount: 5 }
  ],
  ilo7016: [
    { id: 'fc-csl-1', front: 'Define the CIA Triad in Information Security.', back: 'Confidentiality (preventing unauthorized disclosure), Integrity (preventing unauthorized modification), Availability (ensuring timely, reliable authorization access).', intervalDays: 4, easeFactor: 2.5, reviewCount: 2 },
    { id: 'fc-csl-2', front: 'Explain Section 66 of the Indian IT Act 2000.', back: 'Deals with computer-related offenses: hacking, identity theft (66C), cheating by personation (66D), cyber terrorism (66F). Punishable with imprisonment up to 3 years and fines.', intervalDays: 6, easeFactor: 2.5, reviewCount: 3 },
    { id: 'fc-csl-3', front: 'What is Chain of Custody in Digital Forensics?', back: 'A chronological, tamper-evident log showing who collected, handled, transferred, analyzed, and stored digital evidence. Guarantees evidence admissibility in a court of law.', intervalDays: 9, easeFactor: 2.6, reviewCount: 4 },
    { id: 'fc-csl-4', front: 'Outline the steps of the SSL/TLS 1.2 Handshake.', back: '1. ClientHello (cipher suites) -> 2. ServerHello + Certificate -> 3. Client Key Exchange (Pre-Master Secret encrypted with server public key) -> 4. Finished (symmetric session key active).', intervalDays: 8, easeFactor: 2.5, reviewCount: 3 },
    { id: 'fc-csl-5', front: 'Differentiate between DAC, MAC, and RBAC Access Control.', back: 'DAC (Discretionary): Owner sets permissions. MAC (Mandatory): System enforces security clearances/labels. RBAC (Role-Based): Permissions assigned to organizational roles.', intervalDays: 14, easeFactor: 2.8, reviewCount: 5 }
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

  const getDeckForSubject = (subjId: string): Flashcard[] => {
    const s = subjects.find(sub => sub.id === subjId);
    const code = (s?.code || '').toLowerCase();
    const name = (s?.name || '').toLowerCase();

    // Check localStorage cache first
    try {
      const cached = localStorage.getItem(`cognora_flashcards_${subjId}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}

    if (code.includes('701') || name.includes('ai') || name.includes('ds')) return DEFAULT_FLASHCARDS_BY_SUBJECT.itc701;
    if (code.includes('702') || name.includes('everything') || name.includes('ioe') || name.includes('iot')) return DEFAULT_FLASHCARDS_BY_SUBJECT.itc702;
    if (code.includes('7014') || name.includes('testing') || name.includes('stqa')) return DEFAULT_FLASHCARDS_BY_SUBJECT.itdo7014;
    if (code.includes('7024') || name.includes('retrieval') || name.includes('irs')) return DEFAULT_FLASHCARDS_BY_SUBJECT.itdo7024;
    if (code.includes('7016') || name.includes('cyber') || name.includes('csl') || name.includes('security')) return DEFAULT_FLASHCARDS_BY_SUBJECT.ilo7016;

    return DEFAULT_FLASHCARDS_BY_SUBJECT.itc701;
  };

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
        // fallback to curated subject deck
      }
      const deck = getDeckForSubject(selectedSubjectId);
      setCards(deck);
      setCurrentIdx(0);
      setFlipped(false);
      setLoading(false);
    }
    loadFlashcards();
  }, [selectedSubjectId, subjects]);

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

    const updated = [newCard, ...cards];
    setCards(updated);
    try {
      localStorage.setItem(`cognora_flashcards_${selectedSubjectId}`, JSON.stringify(updated));
    } catch {}

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

    const updatedCard: Flashcard = {
      ...card,
      intervalDays: newInterval,
      easeFactor: newEase,
      reviewCount: (card.reviewCount || 0) + 1
    };

    const nextCards = [...cards];
    nextCards[currentIdx] = updatedCard;
    setCards(nextCards);

    try {
      localStorage.setItem(`cognora_flashcards_${selectedSubjectId}`, JSON.stringify(nextCards));
    } catch {}

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
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 font-sans text-[#121217] dark:text-slate-100 bg-[#f8f9fc] dark:bg-slate-950 min-h-screen transition-colors">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-[#e3e6ed] dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-[#4f75f2] animate-pulse" />
            <span className="text-[11px] font-mono tracking-widest text-[#6b6f82] dark:text-slate-400 uppercase font-bold">
              SPACED REPETITION ENGINE
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#121217] dark:text-white tracking-tight">
            Smart Revision
          </h1>
          <p className="text-[#6b6f82] dark:text-slate-400 mt-1 text-xs md:text-sm">
            Optimized active recall calibrated to your personalized cognitive forgetting curve.
          </p>
        </div>

        {subjects.length > 0 && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAddingCard(true)}
              className="bg-[#4f75f2] hover:bg-[#385dd8] text-white px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shadow-xs"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>Add Card</span>
            </button>
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-[#e3e6ed] dark:border-slate-800 rounded-2xl px-4 py-2.5 shadow-xs">
              <Calendar className="w-4 h-4 text-[#6b6f82] dark:text-slate-400" />
              <select
                value={selectedSubjectId}
                onChange={e => setSelectedSubjectId(e.target.value)}
                className="bg-transparent text-[#121217] dark:text-slate-200 outline-none text-xs font-bold cursor-pointer"
              >
                {subjects.map(s => (
                  <option key={s.id} value={s.id} className="dark:bg-slate-900 dark:text-white">
                    {s.name} ({s.code || 'CS'})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-[#6b6f82] dark:text-slate-400 font-mono text-xs uppercase">
          <Loader2 className="w-7 h-7 text-[#4f75f2] animate-spin" />
          <span>Sorting Active Revision Queue...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stats Sidebar */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Active Streak', val: `${streak}d`, icon: Flame, bg: 'bg-amber-50 dark:bg-amber-950/40', border: 'border-amber-200 dark:border-amber-800/60', text: 'text-amber-700 dark:text-amber-300' },
                { label: 'Reviews Today', val: `${totalReviewed}`, icon: Zap, bg: 'bg-indigo-50 dark:bg-indigo-950/40', border: 'border-indigo-200 dark:border-indigo-800/60', text: 'text-indigo-700 dark:text-indigo-300' },
                { label: 'Queue Length', val: `${cards.length}`, icon: Clock, bg: 'bg-purple-50 dark:bg-purple-950/40', border: 'border-purple-200 dark:border-purple-800/60', text: 'text-purple-700 dark:text-purple-300' },
                { label: 'Mastered', val: `${masteredCount}`, icon: CheckCircle, bg: 'bg-emerald-50 dark:bg-emerald-950/40', border: 'border-emerald-200 dark:border-emerald-800/60', text: 'text-emerald-700 dark:text-emerald-300' }
              ].map((stat, i) => (
                <div key={i} className={`${stat.bg} border ${stat.border} p-4 rounded-2xl flex flex-col justify-between min-h-[96px] shadow-xs transition-colors`}>
                  <stat.icon className={`w-4 h-4 mb-2 ${stat.text}`} />
                  <div>
                    <div className="text-xl font-mono font-bold text-slate-900 dark:text-white">{stat.val}</div>
                    <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white dark:bg-slate-900 border border-[#e3e6ed] dark:border-slate-800 p-6 rounded-3xl space-y-4 shadow-xs">
              <h3 className="text-xs font-bold text-[#121217] dark:text-white uppercase tracking-wider">Queue Progress</h3>
              <div>
                <div className="flex justify-between text-xs font-mono mb-2 text-[#6b6f82] dark:text-slate-400">
                  <span>Card {currentIdx + 1} of {cards.length}</span>
                  <span className="font-bold text-[#121217] dark:text-white">{Math.round(progressPct)}%</span>
                </div>
                <div className="h-2 bg-[#f0f2f7] dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#4f75f2] via-[#6366f1] to-emerald-500 transition-all duration-300" style={{ width: `${progressPct}%` }} />
                </div>
              </div>
              <p className="text-[11px] text-[#6b6f82] dark:text-slate-400 font-mono leading-relaxed uppercase">
                Subject: {selectedSubject?.name || 'Active Course'}
              </p>
            </div>
          </div>

          {/* Flashcard Area */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-[#e3e6ed] dark:border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col min-h-[500px] relative shadow-xs">
              {cards.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 relative z-10">
                  <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mb-4 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-[#121217] dark:text-white">All Caught Up!</h3>
                  <p className="text-[#6b6f82] dark:text-slate-400 max-w-xs mt-2 text-xs">No pending flashcards for today. Generate more or check back tomorrow.</p>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-4 relative z-10">
                    <h2 className="text-sm font-bold text-[#121217] dark:text-white uppercase tracking-wider">Active Flashcard</h2>
                    <span className="text-xs font-mono font-bold text-[#6b6f82] dark:text-slate-400">{currentIdx + 1} of {cards.length} cards</span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1.5 bg-[#f0f2f7] dark:bg-slate-800 rounded-full mb-6 overflow-hidden relative z-10">
                    <div
                      className="h-full bg-gradient-to-r from-[#4f75f2] via-[#6366f1] to-emerald-500 rounded-full transition-all duration-500"
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
                        minHeight: '260px'
                      }}
                    >
                      {/* Front */}
                      <div
                        className="absolute inset-0 bg-[#f8f9fc] dark:bg-slate-800/90 border border-[#e3e6ed] dark:border-slate-700 rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-xs"
                        style={{ backfaceVisibility: 'hidden' }}
                      >
                        <div className="text-[10px] font-mono font-bold text-[#6b6f82] dark:text-slate-400 uppercase tracking-widest mb-4">Question Concept</div>
                        <p className="text-lg font-bold text-[#121217] dark:text-white leading-relaxed max-w-xl">{activeCard?.front}</p>
                        <p className="text-xs font-mono text-[#4f75f2] dark:text-indigo-400 mt-6 font-bold uppercase tracking-wider">Click card to reveal answer →</p>
                      </div>
                      {/* Back */}
                      <div
                        className="absolute inset-0 bg-indigo-50/70 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-xs"
                        style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                      >
                        <div className="text-[10px] font-mono font-bold text-[#4f75f2] dark:text-indigo-400 uppercase tracking-widest mb-4">Recall Answer</div>
                        <p className="text-sm font-medium text-[#121217] dark:text-slate-100 leading-relaxed max-w-xl whitespace-pre-wrap">{activeCard?.back}</p>
                      </div>
                    </div>
                  </div>

                  {/* Rating buttons */}
                  <div className="mt-6 space-y-4 relative z-10">
                    {flipped && (
                      <div className="flex gap-2 animate-in fade-in duration-300">
                        {[
                          { rating: 0, label: 'Again', color: 'bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900' },
                          { rating: 1, label: 'Hard', color: 'bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900' },
                          { rating: 2, label: 'Good', color: 'bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900' },
                          { rating: 3, label: 'Easy', color: 'bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900' }
                        ].map(({ rating, label, color }) => (
                          <button
                            key={rating}
                            disabled={reviewing}
                            onClick={() => handleReview(rating)}
                            className={`flex-1 font-bold py-3 rounded-2xl border transition-all text-xs font-mono uppercase tracking-wider cursor-pointer disabled:opacity-50 shadow-xs ${color}`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-3">
                      <button
                        onClick={() => setFlipped(f => !f)}
                        className="flex-1 bg-white dark:bg-slate-800 hover:bg-[#f8f9fc] dark:hover:bg-slate-750 text-[#121217] dark:text-white border border-[#e3e6ed] dark:border-slate-700 py-3 rounded-2xl text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-[#4f75f2] dark:text-indigo-400" />
                        {flipped ? 'Hide Answer' : 'Show Answer'}
                      </button>
                      <button
                        onClick={() => { setFlipped(false); setCurrentIdx(p => (p + 1) % cards.length); }}
                        className="flex-1 bg-white dark:bg-slate-800 hover:bg-[#f8f9fc] dark:hover:bg-slate-750 border border-[#e3e6ed] dark:border-slate-700 text-[#121217] dark:text-white py-3 rounded-2xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-[#e3e6ed] dark:border-slate-800 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col relative animate-in fade-in zoom-in duration-200 text-[#121217] dark:text-white">
            <header className="p-6 border-b border-[#e3e6ed] dark:border-slate-800 flex justify-between items-center bg-[#f8f9fc] dark:bg-slate-850">
              <h3 className="text-base font-extrabold text-[#121217] dark:text-white">Create New Flashcard</h3>
              <button
                onClick={() => setIsAddingCard(false)}
                className="text-[#6b6f82] dark:text-slate-400 hover:text-[#121217] dark:hover:text-white p-1 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </header>

            <form onSubmit={handleAddCard} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#6b6f82] dark:text-slate-400 uppercase mb-1">Question / Prompt (Front)</label>
                <textarea
                  rows={3}
                  required
                  value={newFront}
                  onChange={e => setNewFront(e.target.value)}
                  placeholder="e.g. State Cyclomatic Complexity formula and describe its components."
                  className="w-full bg-[#f8f9fc] dark:bg-slate-800 border border-[#e3e6ed] dark:border-slate-700 rounded-2xl p-3 text-xs text-[#121217] dark:text-white outline-none focus:border-[#4f75f2] resize-none shadow-xs font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#6b6f82] dark:text-slate-400 uppercase mb-1">Answer / Concept Recall (Back)</label>
                <textarea
                  rows={4}
                  required
                  value={newBack}
                  onChange={e => setNewBack(e.target.value)}
                  placeholder="e.g. V(G) = E - N + 2P. Gives maximum independent basis paths."
                  className="w-full bg-[#f8f9fc] dark:bg-slate-800 border border-[#e3e6ed] dark:border-slate-700 rounded-2xl p-3 text-xs text-[#121217] dark:text-white outline-none focus:border-[#4f75f2] resize-none shadow-xs font-sans"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingCard(false)}
                  className="px-4 py-2 border border-[#e3e6ed] dark:border-slate-700 text-[#6b6f82] dark:text-slate-300 hover:bg-[#f8f9fc] dark:hover:bg-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adding}
                  className="bg-[#4f75f2] hover:bg-[#385dd8] text-white px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shadow-xs disabled:opacity-50"
                >
                  {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Save Flashcard</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
