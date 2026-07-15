import { useState, useRef, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, BrainCircuit, User, HelpCircle, Loader2, CheckCircle2, XCircle, Play, Square, Award } from 'lucide-react';
import { fetchApi } from '../lib/api';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

type QuizQuestion = {
  question: string;
  options?: string[];
  correctAnswer?: number;
  explanation?: string;
  syllabusUnit?: string;
};

export default function StudySession() {
  const { id: sessionId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: "Hi! I'm your AI Study Assistant. Ask me anything about your resources, or use the interactive quiz on the right to test your knowledge!" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [endingSession, setEndingSession] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  // Quiz states
  const [quizTopic, setQuizTopic] = useState('');
  const [quizQuestion, setQuizQuestion] = useState<QuizQuestion | null>(null);
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState({ correct: 0, total: 0 });

  useEffect(() => {
    async function loadSession() {
      try {
        const res = await fetchApi('/api/sessions');
        const found = res.sessions?.find((s: any) => s.id === sessionId);
        if (found) {
          setSession(found);
        }
      } catch (err) {
        console.error('Error loading session:', err);
      }
    }
    if (sessionId) loadSession();
  }, [sessionId]);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetchApi(`/api/sessions/${sessionId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: input })
      });
      
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: res.answer || "I couldn't find a detailed answer in your notes. Try refining your question."
        }
      ]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: "Sorry, I encountered an issue processing your request. Please try again."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = async () => {
    setLoadingQuestion(true);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    try {
      const res = await fetchApi(`/api/sessions/${sessionId}/quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_question', topic: quizTopic })
      });
      setQuizQuestion(res);
    } catch (err) {
      console.error('Error getting quiz question:', err);
    } finally {
      setLoadingQuestion(false);
    }
  };

  const submitQuizAnswer = async (optionIdx: number) => {
    if (isAnswerSubmitted || !quizQuestion) return;
    setSelectedOption(optionIdx);
    setIsAnswerSubmitted(true);

    const isCorrect = optionIdx === quizQuestion.correctAnswer;
    if (isCorrect) {
      setQuizScore(s => ({ correct: s.correct + 1, total: s.total + 1 }));
    } else {
      setQuizScore(s => ({ ...s, total: s.total + 1 }));
    }

    try {
      await fetchApi(`/api/sessions/${sessionId}/quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit_answer',
          answer: optionIdx,
          correctAnswer: quizQuestion.correctAnswer,
          isCorrect,
          topic: quizTopic || quizQuestion.syllabusUnit
        })
      });
    } catch (err) {
      console.error('Error submitting quiz answer:', err);
    }
  };

  const handleEndSession = async () => {
    setEndingSession(true);
    try {
      await fetchApi(`/api/sessions/${sessionId}/end`, {
        method: 'POST'
      });
      navigate('/');
    } catch (err) {
      console.error('Error ending session:', err);
    } finally {
      setEndingSession(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-57px)] bg-slate-950 font-sans text-slate-100">
      
      {/* Left Column: Chat Area */}
      <div className="flex-1 flex flex-col h-full border-r border-slate-900">
        <header className="bg-slate-900/60 border-b border-slate-900 px-6 py-4 flex items-center justify-between shadow-sm z-10">
          <div className="flex items-center gap-4">
            <Link to="/" className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-800 text-slate-400 transition-colors cursor-pointer">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h2 className="text-white font-bold flex items-center gap-2 text-sm md:text-base">
                <BrainCircuit className="w-4.5 h-4.5 text-indigo-400" />
                Active Study Workspace
              </h2>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                Goal Mode: {session?.goalMode || 'General Review'}
              </p>
            </div>
          </div>
          
          <button
            onClick={handleEndSession}
            disabled={endingSession}
            className="bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/25 px-4.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
          >
            {endingSession ? <Loader2 className="w-3 h-3 animate-spin" /> : <Square className="w-3.5 h-3.5 fill-rose-400" />}
            End Session
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map(msg => (
            <div key={msg.id} className={`flex gap-4 max-w-3xl ${msg.role === 'user' ? 'flex-row-reverse ml-auto' : 'mr-auto'}`}>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === 'user' ? 'bg-indigo-600' : 'bg-slate-900 border border-slate-800'
              }`}>
                {msg.role === 'user' ? <User className="w-4.5 h-4.5 text-white" /> : <BrainCircuit className="w-4.5 h-4.5 text-indigo-400" />}
              </div>
              <div className={`rounded-2xl px-5 py-3.5 max-w-[85%] text-sm ${
                msg.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-tr-none' 
                  : 'bg-slate-900 border border-slate-800/80 text-slate-200 rounded-tl-none shadow-sm leading-relaxed'
              }`}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-4 max-w-3xl mr-auto">
              <div className="w-9 h-9 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                <BrainCircuit className="w-4.5 h-4.5 text-indigo-400" />
              </div>
              <div className="bg-slate-900 border border-slate-800/80 rounded-2xl rounded-tl-none px-5 py-4 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
              </div>
            </div>
          )}
          <div ref={endOfMessagesRef} />
        </main>

        <footer className="bg-slate-900/30 border-t border-slate-900 p-4">
          <form onSubmit={handleSend} className="max-w-3xl mx-auto relative">
            <input 
              type="text" 
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={loading}
              placeholder="Ask a question about this subject's syllabus or notes..." 
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-2xl pl-5 pr-14 py-3.5 text-white text-sm placeholder-slate-600 outline-none transition-colors duration-300"
            />
            <button 
              type="submit"
              disabled={!input.trim() || loading}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-900 disabled:text-slate-700 text-white rounded-xl flex items-center justify-center transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </form>
        </footer>
      </div>

      {/* Right Column: In-Session Quiz Widget */}
      <div className="w-full lg:w-96 bg-slate-900/20 p-6 flex flex-col h-full overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-900 mb-6">
          <h3 className="font-bold text-sm uppercase tracking-wider text-indigo-400 flex items-center gap-2">
            <HelpCircle className="w-4 h-4" /> Adaptive Quiz Engine
          </h3>
          {quizScore.total > 0 && (
            <div className="flex items-center gap-1 bg-indigo-500/10 border border-indigo-500/25 px-2 py-0.5 rounded text-[10px] font-black text-indigo-400">
              <Award className="w-3.5 h-3.5" /> {quizScore.correct}/{quizScore.total}
            </div>
          )}
        </div>

        {!quizQuestion && !loadingQuestion ? (
          <div className="space-y-4 my-auto text-center">
            <BrainCircuit className="w-12 h-12 text-slate-700 mx-auto mb-2" />
            <h4 className="font-bold text-slate-300">Test Your Knowledge</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Generate dynamic, course-specific questions to check your concept recall.
            </p>
            <div className="space-y-3 pt-2">
              <input
                type="text"
                value={quizTopic}
                onChange={e => setQuizTopic(e.target.value)}
                placeholder="Topic (e.g. A* Search, Normalization)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500"
              />
              <button
                onClick={startQuiz}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-white" /> Start Quiz
              </button>
            </div>
          </div>
        ) : loadingQuestion ? (
          <div className="flex flex-col items-center justify-center my-auto gap-3 text-slate-500">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            <span className="text-xs font-semibold">Generating quiz question...</span>
          </div>
        ) : quizQuestion ? (
          <div className="space-y-5 flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                <span>{quizQuestion.syllabusUnit || 'Unit 1'}</span>
                {isAnswerSubmitted && (
                  <span className={selectedOption === quizQuestion.correctAnswer ? 'text-emerald-400' : 'text-rose-400'}>
                    {selectedOption === quizQuestion.correctAnswer ? 'CORRECT' : 'INCORRECT'}
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold text-slate-200 leading-relaxed">
                {quizQuestion.question}
              </p>

              {quizQuestion.options ? (
                <div className="space-y-2">
                  {quizQuestion.options.map((opt, oidx) => {
                    const isSelected = selectedOption === oidx;
                    const isCorrect = oidx === quizQuestion.correctAnswer;
                    
                    let btnStyle = "bg-slate-950 border-slate-850 text-slate-300 hover:border-slate-700";
                    if (isAnswerSubmitted) {
                      if (isCorrect) btnStyle = "bg-emerald-500/10 border-emerald-500/30 text-emerald-300";
                      else if (isSelected) btnStyle = "bg-rose-500/10 border-rose-500/30 text-rose-300";
                      else btnStyle = "bg-slate-950/40 border-slate-900 text-slate-600";
                    } else if (isSelected) {
                      btnStyle = "bg-indigo-600/10 border-indigo-500 text-indigo-300";
                    }

                    return (
                      <button
                        key={oidx}
                        disabled={isAnswerSubmitted}
                        onClick={() => submitQuizAnswer(oidx)}
                        className={`w-full text-left p-3.5 border rounded-xl text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${btnStyle}`}
                      >
                        <span>{opt}</span>
                        {isAnswerSubmitted && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />}
                        {isAnswerSubmitted && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-rose-400 shrink-0 ml-2" />}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500 italic">Self-assess your answer. Check the explanation below when ready.</p>
                  {!isAnswerSubmitted && (
                    <button
                      onClick={() => setIsAnswerSubmitted(true)}
                      className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700 py-2.5 rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      Reveal Explanation
                    </button>
                  )}
                </div>
              )}

              {isAnswerSubmitted && quizQuestion.explanation && (
                <div className="bg-slate-900/60 border border-slate-850 p-4 rounded-xl space-y-1">
                  <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Explanation</div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{quizQuestion.explanation}</p>
                </div>
              )}
            </div>

            {isAnswerSubmitted && (
              <button
                onClick={startQuiz}
                className="w-full bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 py-3 rounded-xl text-xs font-bold text-slate-200 transition-colors cursor-pointer mt-4"
              >
                Next Question
              </button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
