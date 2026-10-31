import { useState, useRef, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, BrainCircuit, User, HelpCircle, Loader2, CheckCircle2, XCircle, Play, Square, Award } from 'lucide-react';
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
    } catch {
      // ignore
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
    <div className="flex flex-col lg:flex-row h-[calc(100vh-65px)] bg-[#f8f9fc] font-sans text-[#121217]">
      
      {/* Left Column: Chat Area */}
      <div className="flex-1 flex flex-col h-full border-r border-[#e3e6ed]">
        <header className="bg-white border-b border-[#e3e6ed] px-6 py-4 flex items-center justify-between shadow-xs z-10">
          <div className="flex items-center gap-4">
            <Link to="/" className="w-9 h-9 flex items-center justify-center rounded-2xl bg-[#f8f9fc] border border-[#e3e6ed] hover:bg-white text-[#121217] transition-colors cursor-pointer shadow-xs">
              <ArrowLeft className="w-4 h-4 text-[#4f75f2]" />
            </Link>
            <div>
              <h2 className="text-[#121217] font-extrabold flex items-center gap-2 text-sm md:text-base">
                <BrainCircuit className="w-4.5 h-4.5 text-[#4f75f2]" />
                Active Study Workspace
              </h2>
              <p className="text-[10px] text-[#6b6f82] font-mono font-bold uppercase tracking-wider">
                Mode: {session?.goalMode || 'General Review'}
              </p>
            </div>
          </div>
          
          <button
            onClick={handleEndSession}
            disabled={endingSession}
            className="bg-[#fef2f2] hover:bg-[#fee2e2] text-[#dc2626] border border-[#fecaca] px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 shadow-xs"
          >
            {endingSession ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Square className="w-3.5 h-3.5 fill-[#dc2626]" />}
            End Session
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#f8f9fc]">
          {messages.map(msg => (
            <div key={msg.id} className={`flex gap-3 max-w-3xl ${msg.role === 'user' ? 'flex-row-reverse ml-auto' : 'mr-auto'}`}>
              <div className={`w-8 h-8 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                msg.role === 'user' ? 'bg-[#4f75f2] text-white' : 'bg-white border border-[#e3e6ed] text-[#4f75f2]'
              }`}>
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <BrainCircuit className="w-4 h-4" />}
              </div>
              <div className={`rounded-3xl px-5 py-3.5 max-w-[85%] text-xs md:text-sm ${
                msg.role === 'user' 
                  ? 'bg-[#4f75f2] text-white rounded-tr-none shadow-xs font-semibold' 
                  : 'bg-white border border-[#e3e6ed] text-[#121217] rounded-tl-none shadow-xs leading-relaxed'
              }`}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3 max-w-3xl mr-auto">
              <div className="w-8 h-8 rounded-2xl bg-white border border-[#e3e6ed] flex items-center justify-center shrink-0 shadow-xs">
                <BrainCircuit className="w-4 h-4 text-[#4f75f2]" />
              </div>
              <div className="bg-white border border-[#e3e6ed] rounded-3xl rounded-tl-none px-5 py-4 flex items-center gap-1.5 shadow-xs">
                <div className="w-1.5 h-1.5 bg-[#4f75f2] rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-1.5 h-1.5 bg-[#4f75f2] rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-1.5 h-1.5 bg-[#4f75f2] rounded-full animate-bounce" />
              </div>
            </div>
          )}
          <div ref={endOfMessagesRef} />
        </main>

        <footer className="bg-white border-t border-[#e3e6ed] p-4">
          <form onSubmit={handleSend} className="max-w-3xl mx-auto relative">
            <input 
              type="text" 
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={loading}
              placeholder="Ask a question about this subject's syllabus, algorithms, or definitions..." 
              className="w-full bg-[#f8f9fc] border border-[#e3e6ed] focus:border-[#4f75f2] rounded-2xl pl-5 pr-14 py-3.5 text-[#121217] text-xs md:text-sm placeholder-[#a0a4b8] outline-none transition-colors shadow-xs"
            />
            <button 
              type="submit"
              disabled={!input.trim() || loading}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-9 h-9 bg-[#4f75f2] hover:bg-[#385dd8] disabled:bg-[#f0f2f7] disabled:text-[#a0a4b8] text-white rounded-xl flex items-center justify-center transition-colors cursor-pointer shadow-xs"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </form>
        </footer>
      </div>

      {/* Right Column: In-Session Quiz Widget */}
      <div className="w-full lg:w-96 bg-white p-6 flex flex-col h-full overflow-y-auto border-l border-[#e3e6ed]">
        <div className="flex items-center justify-between pb-4 border-b border-[#e3e6ed] mb-6">
          <h3 className="font-bold text-xs uppercase tracking-wider text-[#6b6f82] flex items-center gap-2 font-mono">
            <HelpCircle className="w-4 h-4 text-[#4f75f2]" /> Adaptive Quiz Engine
          </h3>
          {quizScore.total > 0 && (
            <div className="flex items-center gap-1 bg-[#edf3fc] text-[#4f75f2] border border-[#d0dcf5] px-3 py-1 rounded-full text-[10px] font-mono font-bold">
              <Award className="w-3.5 h-3.5" /> {quizScore.correct}/{quizScore.total}
            </div>
          )}
        </div>

        {!quizQuestion && !loadingQuestion ? (
          <div className="space-y-4 my-auto text-center bg-[#f8f9fc] border border-[#e3e6ed] rounded-3xl p-6 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-[#edf3fc] flex items-center justify-center mx-auto mb-2 text-[#4f75f2]">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-[#121217] text-sm">Knowledge Check</h4>
            <p className="text-xs text-[#6b6f82] leading-relaxed">
              Generate dynamic, syllabus-specific multiple-choice questions to test your active recall.
            </p>
            <div className="space-y-3 pt-2">
              <input
                type="text"
                value={quizTopic}
                onChange={e => setQuizTopic(e.target.value)}
                placeholder="Topic (e.g. Heuristic Search, MQTT)"
                className="w-full bg-white border border-[#e3e6ed] rounded-2xl px-4 py-2.5 text-xs text-[#121217] outline-none focus:border-[#4f75f2] shadow-xs"
              />
              <button
                onClick={startQuiz}
                className="w-full bg-[#4f75f2] hover:bg-[#385dd8] text-white py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs"
              >
                <Play className="w-3.5 h-3.5 fill-white" /> Start Quiz
              </button>
            </div>
          </div>
        ) : loadingQuestion ? (
          <div className="flex flex-col items-center justify-center my-auto gap-3 text-[#6b6f82]">
            <Loader2 className="w-8 h-8 text-[#4f75f2] animate-spin" />
            <span className="text-xs font-bold font-mono">Synthesizing quiz question...</span>
          </div>
        ) : quizQuestion ? (
          <div className="space-y-5 flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex justify-between items-center text-[10px] font-mono font-bold text-[#6b6f82]">
                <span>{quizQuestion.syllabusUnit || 'Unit 1'}</span>
                {isAnswerSubmitted && (
                  <span className={selectedOption === quizQuestion.correctAnswer ? 'text-[#059669] bg-[#e2f6eb] px-2.5 py-0.5 rounded-lg border border-[#a7f3d0]' : 'text-[#dc2626] bg-[#fef2f2] px-2.5 py-0.5 rounded-lg border border-[#fecaca]'}>
                    {selectedOption === quizQuestion.correctAnswer ? 'CORRECT' : 'INCORRECT'}
                  </span>
                )}
              </div>
              <p className="text-sm font-bold text-[#121217] leading-relaxed">
                {quizQuestion.question}
              </p>

              {quizQuestion.options ? (
                <div className="space-y-2">
                  {quizQuestion.options.map((opt, oidx) => {
                    const isSelected = selectedOption === oidx;
                    const isCorrect = oidx === quizQuestion.correctAnswer;
                    
                    let btnStyle = "bg-[#f8f9fc] border-[#e3e6ed] text-[#121217] hover:border-[#4f75f2]";
                    if (isAnswerSubmitted) {
                      if (isCorrect) btnStyle = "bg-[#e2f6eb] border-[#a7f3d0] text-[#059669] font-bold";
                      else if (isSelected) btnStyle = "bg-[#fef2f2] border-[#fecaca] text-[#dc2626]";
                      else btnStyle = "bg-[#f8f9fc] border-[#e3e6ed] text-[#a0a4b8]";
                    } else if (isSelected) {
                      btnStyle = "bg-[#edf3fc] text-[#4f75f2] border-[#4f75f2] font-bold";
                    }

                    return (
                      <button
                        key={oidx}
                        disabled={isAnswerSubmitted}
                        onClick={() => submitQuizAnswer(oidx)}
                        className={`w-full text-left p-3.5 border rounded-2xl text-xs font-medium transition-all flex items-center justify-between cursor-pointer shadow-xs ${btnStyle}`}
                      >
                        <span>{opt}</span>
                        {isAnswerSubmitted && isCorrect && <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0 ml-2" />}
                        {isAnswerSubmitted && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-[#dc2626] shrink-0 ml-2" />}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-[#6b6f82] italic">Self-assess your answer. Check the explanation below when ready.</p>
                  {!isAnswerSubmitted && (
                    <button
                      onClick={() => setIsAnswerSubmitted(true)}
                      className="w-full bg-[#f8f9fc] border border-[#e3e6ed] hover:bg-white py-2.5 rounded-2xl text-xs font-bold cursor-pointer shadow-xs"
                    >
                      Reveal Explanation
                    </button>
                  )}
                </div>
              )}

              {isAnswerSubmitted && quizQuestion.explanation && (
                <div className="bg-[#f8f9fc] border border-[#e3e6ed] p-4 rounded-2xl space-y-1 shadow-xs">
                  <div className="text-[10px] font-mono font-bold text-[#6b6f82] uppercase tracking-wider">Explanation</div>
                  <p className="text-xs text-[#121217] leading-relaxed">{quizQuestion.explanation}</p>
                </div>
              )}
            </div>

            {isAnswerSubmitted && (
              <button
                onClick={startQuiz}
                className="w-full bg-[#4f75f2] hover:bg-[#385dd8] text-white py-3 rounded-2xl text-xs font-bold transition-colors cursor-pointer mt-4 shadow-xs"
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
