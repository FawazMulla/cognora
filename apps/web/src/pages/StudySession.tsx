import { useState, useRef, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, BrainCircuit, User, HelpCircle, Loader2, CheckCircle2, XCircle, Play, Square, Award, Sparkles } from 'lucide-react';
import { fetchApi } from '../lib/api';
import { generateStudyChatAI, generateStudyQuizAI } from '../lib/ai-service';

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
    { id: '1', role: 'assistant', content: "Hi! I'm your AI Academic Study Companion. Ask me anything about your syllabus, theoretical proofs, or use the interactive adaptive quiz on the right to test your recall." }
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
        } else {
          setSession({ id: sessionId, goalMode: 'Deep Exam Mastery', startedAt: new Date().toISOString() });
        }
      } catch (err) {
        setSession({ id: sessionId, goalMode: 'Deep Exam Mastery', startedAt: new Date().toISOString() });
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

    const userPrompt = input.trim();
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: userPrompt };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetchApi(`/api/sessions/${sessionId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userPrompt })
      });
      
      if (res && res.answer) {
        setMessages(prev => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: res.answer
          }
        ]);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.warn("Backend session chat offline, using client AI tutor:", err);
    }

    try {
      const aiReply = await generateStudyChatAI(userPrompt, session?.goalMode || 'Engineering Syllabus');
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: aiReply
        }
      ]);
    } catch (err) {
      console.error(err);
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
      if (res && res.question) {
        setQuizQuestion(res);
        setLoadingQuestion(false);
        return;
      }
    } catch (err) {
      console.warn('Backend quiz API offline, generating local quiz:', err);
    }

    try {
      const q = await generateStudyQuizAI(quizTopic, session?.goalMode || 'Computer Science');
      setQuizQuestion(q);
    } catch (err) {
      console.error(err);
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
      // offline silent ok
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
      navigate('/');
    } finally {
      setEndingSession(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-65px)] bg-white font-display text-[#212121]">
      
      {/* Left Column: Chat Area */}
      <div className="flex-1 flex flex-col h-full border-r border-[#d9d9dd]">
        <header className="bg-[#fafafb] border-b border-[#d9d9dd] px-6 py-4 flex items-center justify-between shadow-xs z-10">
          <div className="flex items-center gap-4">
            <Link to="/" className="w-8 h-8 flex items-center justify-center rounded-xl bg-white border border-[#d9d9dd] hover:bg-[#f4f4f4] text-[#212121] transition-colors cursor-pointer shadow-xs">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h2 className="text-[#212121] font-black flex items-center gap-2 text-sm md:text-base">
                <BrainCircuit className="w-4.5 h-4.5 text-[#212121]" />
                Active Study Workspace
              </h2>
              <p className="text-[10px] text-[#666666] font-mono font-bold uppercase tracking-wider">
                Mode: {session?.goalMode || 'General Review'}
              </p>
            </div>
          </div>
          
          <button
            onClick={handleEndSession}
            disabled={endingSession}
            className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
          >
            {endingSession ? <Loader2 className="w-3 h-3 animate-spin" /> : <Square className="w-3 h-3 fill-red-700" />}
            End Session
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
          {messages.map(msg => (
            <div key={msg.id} className={`flex gap-4 max-w-3xl ${msg.role === 'user' ? 'flex-row-reverse ml-auto' : 'mr-auto'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === 'user' ? 'bg-[#212121] text-white' : 'bg-[#fafafb] border border-[#d9d9dd] text-[#212121]'
              }`}>
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <BrainCircuit className="w-4 h-4" />}
              </div>
              <div className={`rounded-2xl px-5 py-3.5 max-w-[85%] text-sm ${
                msg.role === 'user' 
                  ? 'bg-[#212121] text-white rounded-tr-none shadow-xs' 
                  : 'bg-[#fafafb] border border-[#e5e5e8] text-[#212121] rounded-tl-none shadow-xs leading-relaxed font-sans'
              }`}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-4 max-w-3xl mr-auto">
              <div className="w-8 h-8 rounded-full bg-[#fafafb] border border-[#d9d9dd] flex items-center justify-center shrink-0">
                <BrainCircuit className="w-4 h-4 text-[#212121]" />
              </div>
              <div className="bg-[#fafafb] border border-[#e5e5e8] rounded-2xl rounded-tl-none px-5 py-4 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-[#212121] rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-1.5 h-1.5 bg-[#212121] rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-1.5 h-1.5 bg-[#212121] rounded-full animate-bounce" />
              </div>
            </div>
          )}
          <div ref={endOfMessagesRef} />
        </main>

        <footer className="bg-[#fafafb] border-t border-[#d9d9dd] p-4">
          <form onSubmit={handleSend} className="max-w-3xl mx-auto relative">
            <input 
              type="text" 
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={loading}
              placeholder="Ask a question about this subject's syllabus, algorithms, or definitions..." 
              className="w-full bg-white border border-[#d9d9dd] focus:border-[#212121] rounded-2xl pl-5 pr-14 py-3.5 text-[#212121] text-sm placeholder-[#999999] outline-none transition-colors shadow-xs"
            />
            <button 
              type="submit"
              disabled={!input.trim() || loading}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-9 h-9 bg-[#212121] hover:bg-black disabled:bg-[#e5e5e8] disabled:text-[#999999] text-white rounded-xl flex items-center justify-center transition-colors cursor-pointer shadow-xs"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </form>
        </footer>
      </div>

      {/* Right Column: In-Session Quiz Widget */}
      <div className="w-full lg:w-96 bg-[#fafafb] p-6 flex flex-col h-full overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-[#d9d9dd] mb-6">
          <h3 className="font-bold text-xs uppercase tracking-wider text-[#666666] flex items-center gap-2 font-mono">
            <HelpCircle className="w-4 h-4 text-[#212121]" /> Adaptive Quiz Engine
          </h3>
          {quizScore.total > 0 && (
            <div className="flex items-center gap-1 bg-[#212121] text-white px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold">
              <Award className="w-3.5 h-3.5" /> {quizScore.correct}/{quizScore.total}
            </div>
          )}
        </div>

        {!quizQuestion && !loadingQuestion ? (
          <div className="space-y-4 my-auto text-center">
            <BrainCircuit className="w-12 h-12 text-[#999999] mx-auto mb-2" />
            <h4 className="font-bold text-[#212121]">Knowledge Check</h4>
            <p className="text-xs text-[#666666] leading-relaxed">
              Generate dynamic, syllabus-specific multiple-choice questions to test your active recall.
            </p>
            <div className="space-y-3 pt-2">
              <input
                type="text"
                value={quizTopic}
                onChange={e => setQuizTopic(e.target.value)}
                placeholder="Topic (e.g. Heuristic Search, MQTT)"
                className="w-full bg-white border border-[#d9d9dd] rounded-xl px-4 py-2.5 text-xs text-[#212121] outline-none focus:border-[#212121] shadow-xs"
              />
              <button
                onClick={startQuiz}
                className="w-full bg-[#212121] hover:bg-black text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs"
              >
                <Play className="w-3.5 h-3.5 fill-white" /> Start Quiz
              </button>
            </div>
          </div>
        ) : loadingQuestion ? (
          <div className="flex flex-col items-center justify-center my-auto gap-3 text-[#666666]">
            <Loader2 className="w-8 h-8 text-[#212121] animate-spin" />
            <span className="text-xs font-bold font-mono">Synthesizing quiz question...</span>
          </div>
        ) : quizQuestion ? (
          <div className="space-y-5 flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex justify-between items-center text-[10px] font-mono font-bold text-[#666666]">
                <span>{quizQuestion.syllabusUnit || 'Unit 1'}</span>
                {isAnswerSubmitted && (
                  <span className={selectedOption === quizQuestion.correctAnswer ? 'text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200' : 'text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200'}>
                    {selectedOption === quizQuestion.correctAnswer ? 'CORRECT' : 'INCORRECT'}
                  </span>
                )}
              </div>
              <p className="text-sm font-bold text-[#212121] leading-relaxed">
                {quizQuestion.question}
              </p>

              {quizQuestion.options ? (
                <div className="space-y-2">
                  {quizQuestion.options.map((opt, oidx) => {
                    const isSelected = selectedOption === oidx;
                    const isCorrect = oidx === quizQuestion.correctAnswer;
                    
                    let btnStyle = "bg-white border-[#d9d9dd] text-[#212121] hover:border-[#212121]";
                    if (isAnswerSubmitted) {
                      if (isCorrect) btnStyle = "bg-emerald-50 border-emerald-300 text-emerald-900 font-bold";
                      else if (isSelected) btnStyle = "bg-red-50 border-red-300 text-red-900";
                      else btnStyle = "bg-[#f4f4f4] border-[#e5e5e8] text-[#888888]";
                    } else if (isSelected) {
                      btnStyle = "bg-[#212121] text-white border-[#212121]";
                    }

                    return (
                      <button
                        key={oidx}
                        disabled={isAnswerSubmitted}
                        onClick={() => submitQuizAnswer(oidx)}
                        className={`w-full text-left p-3.5 border rounded-xl text-xs font-medium transition-all flex items-center justify-between cursor-pointer shadow-xs ${btnStyle}`}
                      >
                        <span>{opt}</span>
                        {isAnswerSubmitted && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 ml-2" />}
                        {isAnswerSubmitted && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-red-600 shrink-0 ml-2" />}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-[#666666] italic">Self-assess your answer. Check the explanation below when ready.</p>
                  {!isAnswerSubmitted && (
                    <button
                      onClick={() => setIsAnswerSubmitted(true)}
                      className="w-full bg-white border border-[#d9d9dd] hover:bg-[#fafafb] py-2.5 rounded-xl text-xs font-bold cursor-pointer shadow-xs"
                    >
                      Reveal Explanation
                    </button>
                  )}
                </div>
              )}

              {isAnswerSubmitted && quizQuestion.explanation && (
                <div className="bg-white border border-[#d9d9dd] p-4 rounded-xl space-y-1 shadow-xs">
                  <div className="text-[10px] font-mono font-bold text-[#666666] uppercase tracking-wider">Explanation</div>
                  <p className="text-xs text-[#444444] leading-relaxed">{quizQuestion.explanation}</p>
                </div>
              )}
            </div>

            {isAnswerSubmitted && (
              <button
                onClick={startQuiz}
                className="w-full bg-[#212121] hover:bg-black text-white py-3 rounded-xl text-xs font-bold transition-colors cursor-pointer mt-4 shadow-xs"
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

