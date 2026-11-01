import { useEffect, useState, useRef } from 'react';
import { Mic, Activity, Square, Volume2, Loader2, Award, ArrowRight, MessageSquare, AlertCircle } from 'lucide-react';
import { fetchApi } from '../lib/api';
import { getDefaultSubjects, generateVivaQuestionAI, evaluateVivaAI } from '../lib/ai-service';

type Subject = {
  id: string;
  name: string;
  code?: string;
};

type Evaluation = {
  score: number;
  feedback: string;
  isCorrect: boolean;
  suggestedCorrection: string;
  followUpQuestion?: string;
};

export default function VivaEngine() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [studentAnswer, setStudentAnswer] = useState<string>('');
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [questionCount, setQuestionCount] = useState<number>(0);
  const [scoresList, setScoresList] = useState<number[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    async function loadSubjects() {
      const defaults = getDefaultSubjects();
      try {
        const res = await fetchApi('/api/subjects');
        if (res.subjects && res.subjects.length > 0) {
          setSubjects(res.subjects);
          setSelectedSubjectId(res.subjects[0].id);
          return;
        }
      } catch (err) {
        console.warn("Backend subjects lookup warning, using defaults:", err);
      }
      setSubjects(defaults);
      setSelectedSubjectId(defaults[0].id);
    }
    loadSubjects();

    // Check browser SpeechRecognition support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setStudentAnswer(prev => prev + (prev ? ' ' : '') + transcript);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const selectedSubject = subjects.find(s => s.id === selectedSubjectId);

  const handleStartSession = async () => {
    if (!selectedSubjectId && subjects.length > 0) {
      setSelectedSubjectId(subjects[0].id);
    }
    setActive(true);
    setLoading(true);
    setEvaluation(null);
    setScoresList([]);
    setQuestionCount(1);
    setStudentAnswer('');
    
    try {
      const res = await fetchApi('/api/viva/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectId: selectedSubjectId || subjects[0]?.id })
      });
      if (res.question) {
        setCurrentQuestion(res.question);
        setLoading(false);
        return;
      }
    } catch {
      // fallback to AI generator
    }

    const question = await generateVivaQuestionAI(selectedSubject?.name || 'Computer Science');
    setCurrentQuestion(question);
    setLoading(false);
  };

  const handleToggleListening = () => {
    if (speechSupported && recognitionRef.current) {
      if (isListening) {
        recognitionRef.current.stop();
        setIsListening(false);
      } else {
        try {
          recognitionRef.current.start();
          setIsListening(true);
        } catch {
          handleSimulateSpeech();
        }
      }
    } else {
      handleSimulateSpeech();
    }
  };

  const handleSimulateSpeech = () => {
    setIsListening(true);
    setTimeout(() => {
      setIsListening(false);
      const responses = [
        "A* search algorithm is an informed strategy that combines path cost g(n) with estimated heuristic h(n). It is guaranteed admissible if h(n) never overestimates the true remaining cost to the goal.",
        "BFS explores graph levels exhaustively using a FIFO queue and is optimal for unit step costs. DFS traverses branches deeply via a LIFO stack but is not guaranteed optimal.",
        "ACID ensures Atomicity, Consistency, Isolation, and Durability. Atomicity guarantees all-or-nothing execution, while Durability commits state changes permanently to non-volatile storage.",
        "Overfitting happens when a model learns noise in training data. We prevent it via Dropout regularization, L1/L2 penalties, and early stopping."
      ];
      setStudentAnswer(responses[Math.floor(Math.random() * responses.length)]);
    }, 1200);
  };

  const handleSubmitAnswer = async () => {
    if (!studentAnswer.trim()) return;
    setLoading(true);
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
    
    try {
      const res = await fetchApi('/api/viva/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentQuestion,
          answer: studentAnswer,
          subjectId: selectedSubjectId,
          topic: "Core Concept"
        })
      });
      
      if (res && res.score !== undefined) {
        setEvaluation(res);
        setScoresList(prev => [...prev, res.score]);
        setLoading(false);
        return;
      }
    } catch {
      // fallback to AI evaluator
    }

    const evalRes = await evaluateVivaAI(currentQuestion, studentAnswer, selectedSubject?.name || 'Computer Science');
    setEvaluation(evalRes);
    setScoresList(prev => [...prev, evalRes.score]);
    setLoading(false);
  };

  const handleNextQuestion = async () => {
    if (evaluation?.followUpQuestion) {
      setCurrentQuestion(evaluation.followUpQuestion);
      setStudentAnswer('');
      setEvaluation(null);
      setQuestionCount(prev => prev + 1);
    } else {
      setLoading(true);
      setEvaluation(null);
      setStudentAnswer('');
      setQuestionCount(prev => prev + 1);
      const nextQ = await generateVivaQuestionAI(selectedSubject?.name || 'Computer Science');
      setCurrentQuestion(nextQ);
      setLoading(false);
    }
  };

  const averageScore = scoresList.length > 0 ? (scoresList.reduce((a, b) => a + b, 0) / scoresList.length).toFixed(1) : "0.0";

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 font-sans min-h-screen text-[#2d2d34] dark:text-slate-100 bg-[#f8f9fc] dark:bg-slate-950 transition-colors">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-2 border-b border-[#e3e6ed] shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-[#4f75f2] animate-pulse" />
            <span className="text-[11px] font-mono tracking-widest text-[#6b6f82] uppercase font-bold">
              Interactive Oral Exam
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#121217] dark:text-white tracking-tight">
            Viva Engine
          </h1>
          <p className="text-xs md:text-sm text-[#6b6f82] mt-1 font-sans">
            Oral examination simulation with real-time AI grading, voice transcription, and adaptive follow-up questioning.
          </p>
        </div>
        
        {!active && subjects.length > 0 && (
          <div className="flex items-center gap-2 bg-white border border-[#e3e6ed] rounded-2xl p-1.5 shadow-xs">
            <Volume2 className="w-3.5 h-3.5 text-[#8c8fa1] ml-2" />
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="bg-transparent text-[#121217] outline-none text-xs font-bold pr-3 cursor-pointer"
            >
              {subjects.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Interaction Panel */}
        <div className="lg:col-span-2 bg-white border border-[#e3e6ed] rounded-3xl flex flex-col relative overflow-hidden min-h-[480px] shadow-xs">
          <div className="flex-1 p-6 md:p-8 flex flex-col justify-center">
            {active ? (
              loading ? (
                <div className="text-center py-16 space-y-3 font-mono text-xs text-[#6b6f82] uppercase">
                  <Loader2 className="w-6 h-6 text-[#4f75f2] animate-spin mx-auto" />
                  <p>Evaluating Oral Formulation &amp; Reasoning...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Examiner Question Box */}
                  <div className="p-6 bg-[#f8f9fc] border border-[#e3e6ed] rounded-2xl space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] bg-[#edf3fc] text-[#4f75f2] border border-[#d0dcf5] px-2.5 py-0.5 rounded-lg font-mono font-bold uppercase tracking-wider">
                        Question #{questionCount}
                      </span>
                      <span className="text-[10px] font-mono text-[#8c8fa1] uppercase">External Examiner AI</span>
                    </div>
                    <p className="text-[#121217] font-bold text-lg leading-snug">{currentQuestion}</p>
                  </div>

                  {/* Evaluation Box */}
                  {evaluation ? (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <div className={`p-4 rounded-2xl border ${
                        evaluation.isCorrect 
                          ? 'bg-[#e2f6eb] border-[#c9eed9] text-[#1f7247]' 
                          : 'bg-[#fee2e2]/60 border-[#fca5a5] text-[#b91c1c]'
                      } flex items-start gap-3`}>
                        <Award className="w-5 h-5 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-mono font-bold text-sm mb-1">Score: {evaluation.score}/10</div>
                          <p className="text-xs leading-relaxed font-sans">{evaluation.feedback}</p>
                        </div>
                      </div>

                      <div className="p-4 bg-[#edf3fc] border border-[#d0dcf5] rounded-2xl space-y-1">
                        <h4 className="text-[10px] font-mono font-bold text-[#3b52c4] uppercase tracking-wide">Model Academic Formulation:</h4>
                        <p className="text-xs text-[#1e255e] leading-relaxed font-sans">{evaluation.suggestedCorrection}</p>
                      </div>

                      <div className="flex justify-end gap-3 pt-2">
                        <button
                          onClick={() => setActive(false)}
                          className="bg-[#f8f9fc] hover:bg-[#edf3fc] text-[#6b6f82] hover:text-[#121217] border border-[#e3e6ed] px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        >
                          End Session
                        </button>
                        <button
                          onClick={handleNextQuestion}
                          className="bg-[#4f75f2] hover:bg-[#385dd8] text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <span>{evaluation.followUpQuestion ? "Follow-Up Question" : "Next Topic"}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Response Input Area */
                    <div className="space-y-4">
                      <div className="relative">
                        <textarea
                          rows={4}
                          value={studentAnswer}
                          onChange={(e) => setStudentAnswer(e.target.value)}
                          placeholder="Type your verbal response or use microphone..."
                          className="w-full bg-[#f8f9fc] border border-[#e3e6ed] rounded-2xl p-4 text-xs text-[#121217] outline-none focus:border-[#4f75f2] transition-colors placeholder-[#8c8fa1] resize-none font-sans"
                        />
                        {isListening && (
                          <div className="absolute inset-0 bg-white/95 rounded-2xl flex items-center justify-center gap-2 border border-[#4f75f2]">
                            <div className="w-2.5 h-2.5 rounded-full bg-[#4f75f2] animate-ping" />
                            <span className="text-xs text-[#121217] font-mono uppercase tracking-wider font-bold">Listening &amp; transcribing vocal response...</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap justify-between items-center gap-3">
                        <button
                          onClick={handleToggleListening}
                          className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                            isListening
                              ? 'bg-[#fee2e2] border-[#fca5a5] text-[#dc2626]'
                              : 'bg-[#edf3fc] hover:bg-[#e1f1fd] border-[#d0dcf5] text-[#4f75f2]'
                          }`}
                        >
                          <Mic className="w-3.5 h-3.5 text-[#4f75f2]" />
                          {isListening ? 'Stop Recording' : 'Voice Input (Mic / Sim)'}
                        </button>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={() => setActive(false)}
                            className="bg-[#f8f9fc] hover:bg-[#fee2e2]/40 text-[#6b6f82] hover:text-[#dc2626] border border-[#e3e6ed] hover:border-[#fca5a5] px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <Square className="w-3 h-3" />
                            Quit
                          </button>
                          <button
                            disabled={!studentAnswer.trim()}
                            onClick={handleSubmitAnswer}
                            className="bg-[#4f75f2] hover:bg-[#385dd8] text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-40 cursor-pointer shadow-xs"
                          >
                            Submit Answer
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            ) : (
              <div className="text-center py-10 space-y-5">
                <div className="w-16 h-16 bg-[#edf3fc] rounded-2xl mx-auto flex items-center justify-center border border-[#d0dcf5] shadow-xs">
                  <Mic className="w-7 h-7 text-[#4f75f2]" />
                </div>
                <div className="space-y-1.5 max-w-md mx-auto">
                  <h3 className="text-2xl font-extrabold text-[#121217]">Simulate Oral Viva</h3>
                  <p className="text-[#6b6f82] text-xs leading-relaxed font-sans">
                    Practice answering theoretical exam questions orally. The AI examiner assesses conceptual clarity, detects missing axioms, and asks follow-ups dynamically.
                  </p>
                </div>
                {subjects.length > 0 ? (
                  <button 
                    onClick={handleStartSession}
                    className="bg-[#4f75f2] hover:bg-[#385dd8] text-white px-8 py-3 rounded-2xl font-bold text-xs tracking-wider transition-all cursor-pointer shadow-xs"
                  >
                    Start Viva Session ({selectedSubject?.name || 'Active Subject'})
                  </button>
                ) : (
                  <div className="text-[#b91c1c] text-xs flex items-center justify-center gap-1.5 font-mono">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Please set up your subjects on the dashboard first.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Analytics Panel */}
        <div className="bg-white border border-[#e3e6ed] rounded-3xl p-6 h-fit space-y-6 shadow-xs">
          <h2 className="text-xs font-mono font-bold text-[#121217] uppercase tracking-wider flex items-center gap-2 border-b border-[#e3e6ed] pb-3">
            <Activity className="w-4 h-4 text-[#4f75f2]" />
            Session Analytics
          </h2>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-mono mb-1.5">
                <span className="text-[#6b6f82] uppercase">Average Score</span>
                <span className="text-[#121217] font-bold">{scoresList.length > 0 ? `${(Number(averageScore) * 10)}%` : "N/A"}</span>
              </div>
              <div className="h-2 bg-[#f0f2f7] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#4f75f2] to-[#713fb8] transition-all duration-500 rounded-full" 
                  style={{ width: scoresList.length > 0 ? `${(Number(averageScore) * 10)}%` : "0%" }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#f8f9fc] border border-[#e3e6ed] p-3.5 rounded-2xl text-center">
                <div className="text-xl font-mono font-extrabold text-[#121217]">{questionCount}</div>
                <div className="text-[10px] font-mono text-[#6b6f82] uppercase tracking-wider mt-0.5">Questions</div>
              </div>
              <div className="bg-[#f8f9fc] border border-[#e3e6ed] p-3.5 rounded-2xl text-center">
                <div className="text-xl font-mono font-extrabold text-[#4f75f2]">{averageScore}/10</div>
                <div className="text-[10px] font-mono text-[#6b6f82] uppercase tracking-wider mt-0.5">Avg Grade</div>
              </div>
            </div>

            <div className="p-4 bg-[#f8f9fc] border border-[#e3e6ed] rounded-2xl">
              <h3 className="text-[10px] font-mono font-bold text-[#6b6f82] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-[#4f75f2]" />
                Viva Question History
              </h3>
              {scoresList.length === 0 ? (
                <p className="text-[10px] font-mono text-[#8c8fa1] italic">No responses evaluated in this session yet.</p>
              ) : (
                <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
                  {scoresList.map((sc, i) => (
                    <div key={i} className="text-xs font-mono text-[#121217] flex justify-between items-center py-1.5 border-b border-[#e3e6ed] last:border-0">
                      <span>Q#{i + 1} Assessment</span>
                      <span className={`font-bold ${sc >= 6 ? 'text-[#1f7247]' : 'text-[#dc2626]'}`}>{sc}/10</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
