import { BrainCircuit, Calendar, Flame, CheckCircle, Clock, Zap, RotateCcw } from 'lucide-react';
import { useState } from 'react';

const flashcards = [
  { q: 'What is the time complexity of A* Search?', a: 'O(b^d) in the worst case, where b is the branching factor and d is the depth of the solution.' },
  { q: 'Define Atomicity in ACID properties.', a: 'A transaction is treated as a single unit — either all operations execute or none do.' },
  { q: 'What is the difference between normalization and denormalization?', a: 'Normalization reduces redundancy; Denormalization intentionally adds it to improve read performance.' },
  { q: 'What is Dynamic Programming?', a: 'An optimization technique that solves complex problems by breaking them into overlapping subproblems and storing results (memoization).' }
];

const schedule = [
  { subject: 'Artificial Intelligence', topic: 'A* Algorithm & Heuristics', due: 'Today', urgency: 'high', time: '45 min' },
  { subject: 'Data Mining', topic: 'Association Rule Mining', due: 'Tomorrow', urgency: 'medium', time: '30 min' },
  { subject: 'Cryptography', topic: 'RSA & Public Key Infra.', due: 'In 3 days', urgency: 'low', time: '20 min' },
];

export default function SmartRevision() {
  const [currentCard, setCurrentCard] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const nextCard = () => {
    setFlipped(false);
    setCurrentCard(prev => (prev + 1) % flashcards.length);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10 font-sans">
      <header className="mb-10">
        <h1 className="text-3xl font-normal text-gemini-text tracking-tight flex items-center gap-3">
          <BrainCircuit className="w-8 h-8 text-gemini-purple" />
          Smart Revision
        </h1>
        <p className="text-gemini-text-muted mt-2">AI-powered spaced repetition and adaptive flashcards, tuned to your forgetting curve.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Stats + Schedule */}
        <div className="space-y-6">
          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Streak', val: '14d', icon: Flame, color: 'text-gemini-red' },
              { label: 'Cards Today', val: '32', icon: Zap, color: 'text-gemini-blue' },
              { label: 'Review Due', val: '8', icon: Clock, color: 'text-gemini-purple' },
              { label: 'Mastered', val: '124', icon: CheckCircle, color: 'text-gemini-text-muted' }
            ].map((stat, i) => (
              <div key={i} className="bg-gemini-surface p-6 rounded-3xl">
                <stat.icon className={`w-5 h-5 mb-4 ${stat.color}`} />
                <div className="text-2xl font-normal text-gemini-text">{stat.val}</div>
                <div className="text-xs text-gemini-text-muted mt-1">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* AI Revision Schedule */}
          <div className="bg-gemini-surface rounded-3xl p-6">
            <h2 className="text-lg font-medium text-gemini-text mb-6 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gemini-text-muted" />
              Revision Schedule
            </h2>
            <div className="space-y-3">
              {schedule.map((item, i) => (
                <div key={i} className="bg-gemini-bg rounded-2xl p-4 cursor-pointer hover:bg-gemini-surface-hover transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-sm font-medium text-gemini-text leading-snug">{item.topic}</p>
                    <div className={`text-xs px-2 py-1 rounded-full font-medium ml-3 shrink-0 ${
                      item.urgency === 'high' ? 'bg-gemini-red/10 text-gemini-red' :
                      item.urgency === 'medium' ? 'bg-gemini-blue/10 text-gemini-blue' :
                      'bg-gemini-surface text-gemini-text-muted'
                    }`}>
                      {item.due}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gemini-text-muted">
                    <span>{item.subject}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{item.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Flashcard Engine */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gemini-surface rounded-3xl p-8 flex flex-col">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-medium text-gemini-text">Adaptive Flashcards</h2>
              <span className="text-sm text-gemini-text-muted">{currentCard + 1} / {flashcards.length}</span>
            </div>

            {/* Flashcard */}
            <div
              className="flex-1 bg-gemini-bg rounded-3xl p-10 flex flex-col items-center justify-center text-center cursor-pointer min-h-64 transition-all duration-300 group"
              onClick={() => setFlipped(!flipped)}
            >
              {!flipped ? (
                <div className="space-y-4">
                  <div className="text-xs font-medium text-gemini-text-muted uppercase tracking-wider mb-4">Question</div>
                  <p className="text-xl font-normal text-gemini-text leading-relaxed">
                    {flashcards[currentCard].q}
                  </p>
                  <p className="text-sm text-gemini-text-muted mt-6 opacity-0 group-hover:opacity-100 transition-opacity">Tap to reveal answer</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-xs font-medium text-gemini-blue uppercase tracking-wider mb-4">Answer</div>
                  <p className="text-lg text-gemini-text leading-relaxed">
                    {flashcards[currentCard].a}
                  </p>
                </div>
              )}
            </div>

            {/* Card Actions */}
            <div className="mt-6 space-y-4">
              {flipped && (
                <div className="flex gap-3 animate-in fade-in duration-300">
                  <button className="flex-1 bg-gemini-red/10 text-gemini-red font-medium py-3 rounded-full hover:bg-gemini-red/20 transition-colors text-sm">
                    Again
                  </button>
                  <button className="flex-1 bg-gemini-blue/10 text-gemini-blue font-medium py-3 rounded-full hover:bg-gemini-blue/20 transition-colors text-sm">
                    Hard
                  </button>
                  <button className="flex-1 bg-gemini-purple/10 text-gemini-purple font-medium py-3 rounded-full hover:bg-gemini-purple/20 transition-colors text-sm">
                    Good
                  </button>
                  <button className="flex-1 bg-gemini-text/10 text-gemini-text font-medium py-3 rounded-full hover:bg-gemini-text/20 transition-colors text-sm">
                    Easy
                  </button>
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => setFlipped(!flipped)}
                  className="flex-1 bg-gemini-bg hover:bg-gemini-surface-hover text-gemini-text-muted py-3 rounded-full text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  {flipped ? 'Hide Answer' : 'Show Answer'}
                </button>
                <button
                  onClick={nextCard}
                  className="flex-1 bg-gemini-text hover:bg-gemini-text-muted text-gemini-bg py-3 rounded-full text-sm font-medium transition-colors"
                >
                  Next Card →
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
