import { useEffect, useState, useRef } from 'react';
import { Mic, Activity, Play, Square, Volume2, Loader2, Award, ArrowRight, MessageSquare, AlertCircle, Sparkles, VolumeX } from 'lucide-react';
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
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 font-sans min-h-screen text-[#212121] bg-white">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-[#d9d9dd] shrink-0">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#edfce9] border border-[#ccebc5] text-[#003c33] text-[9px] font-mono font-bold tracking-wider uppercase rounded mb-2">
            <Mic className="w-3 h-3 text-[#ff7759]" /> Interactive Oral Exam
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-light text-black tracking-tight uppercase">
            Viva Engine
          </h1>
          <p className="text-[#75758a] mt-1 text-xs">
            Oral examination simulation with real-time AI grading, voice transcription, and adaptive follow-up questioning.
          </p>
        </div>
        
        {!active && subjects.length > 0 && (
          <div className="flex items-center gap-2 bg-white border border-[#d9d9dd] rounded-full px-4 py-2">
            <Volume2 className="w-3.5 h-3.5 text-[#75758a]" />
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="bg-transparent text-black outline-none text-xs font-mono font-bold cursor-pointer"
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
        <div className="lg:col-span-2 bg-white border border-[#d9d9dd] rounded-2xl flex flex-col relative overflow-hidden min-h-[480px]">
          <div className="flex-1 p-6 md:p-8 flex flex-col justify-center">
            {active ? (
              loading ? (
                <div className="text-center py-16 space-y-3 font-mono text-xs text-[#75758a] uppercase">
                  <Loader2 className="w-6 h-6 text-black animate-spin mx-auto" />
                  <p>Evaluating Oral Formulation & Reasoning...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Examiner Question Box */}
                  <div className="p-6 bg-[#eeece7] border border-[#d9d9dd] rounded-xl space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] bg-white text-black border border-[#d9d9dd] px-2.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
                        Question #{questionCount}
                      </span>
                      <span className="text-[10px] font-mono text-[#75758a] uppercase">External Examiner AI</span>
                    </div>
                    <p className="text-black font-display text-lg leading-snug">{currentQuestion}</p>
                  </div>

                  {/* Evaluation Box */}
                  {evaluation ? (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <div className={`p-4 rounded-xl border ${
                        evaluation.isCorrect 
                          ? 'bg-[#edfce9] border-[#ccebc5] text-[#003c33]' 
                          : 'bg-[#fff1ed] border-[#ffdad0] text-[#b30000]'
                      } flex items-start gap-3`}>
                        <Award className="w-5 h-5 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-mono font-bold text-sm mb-1">Score: {evaluation.score}/10</div>
                          <p className="text-xs leading-relaxed font-sans">{evaluation.feedback}</p>
                        </div>
                      </div>

                      <div className="p-4 bg-[#eeece7]/40 border border-[#d9d9dd] rounded-xl space-y-1">
                        <h4 className="text-[10px] font-mono font-bold text-[#75758a] uppercase tracking-wide">Model Academic Formulation:</h4>
                        <p className="text-xs text-black leading-relaxed font-sans">{evaluation.suggestedCorrection}</p>
                      </div>

                      <div className="flex justify-end gap-3 pt-2">
                        <button
                          onClick={() => setActive(false)}
                          className="bg-transparent hover:bg-[#eeece7] text-black border border-[#d9d9dd] px-5 py-2 rounded-full text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          End Session
                        </button>
                        <button
                          onClick={handleNextQuestion}
                          className="bg-black hover:bg-zinc-800 text-white px-6 py-2 rounded-full text-xs font-mono uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
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
                          className="w-full bg-white border border-[#d9d9dd] rounded-xl p-4 text-xs text-black outline-none focus:border-[#9b60aa] transition-colors placeholder-[#93939f] resize-none font-sans"
                        />
                        {isListening && (
                          <div className="absolute inset-0 bg-white/95 rounded-xl flex items-center justify-center gap-2 border border-[#ff7759]">
                            <div className="w-2.5 h-2.5 rounded-full bg-[#ff7759] animate-ping" />
                            <span className="text-xs text-black font-mono uppercase tracking-wider">Listening & transcribing vocal response...</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap justify-between items-center gap-3">
                        <button
                          onClick={handleToggleListening}
                          className={`px-4 py-2 rounded-full text-xs font-mono uppercase tracking-wider border transition-colors flex items-center gap-1.5 cursor-pointer ${
                            isListening
                              ? 'bg-[#fff1ed] border-[#ff7759] text-[#ff7759]'
                              : 'bg-[#eeece7] hover:bg-[#e2e0d8] border-[#d9d9dd] text-black'
                          }`}
                        >
                          <Mic className="w-3.5 h-3.5 text-[#ff7759]" />
                          {isListening ? 'Stop Recording' : 'Voice Input (Mic / Sim)'}
                        </button>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={() => setActive(false)}
                            className="bg-transparent hover:bg-[#eeece7] text-[#75758a] hover:text-black border border-[#d9d9dd] px-4 py-2 rounded-full text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
                          >
                            <Square className="w-3 h-3" />
                            Quit
                          </button>
                          <button
                            disabled={!studentAnswer.trim()}
                            onClick={handleSubmitAnswer}
                            className="bg-black hover:bg-zinc-800 text-white px-6 py-2 rounded-full text-xs font-mono uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer"
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
                <div className="w-14 h-14 bg-[#eeece7] rounded-full mx-auto flex items-center justify-center border border-[#d9d9dd]">
                  <Mic className="w-6 h-6 text-black" />
                </div>
                <div className="space-y-1.5 max-w-md mx-auto">
                  <h3 className="text-2xl font-display font-light text-black uppercase">Simulate Oral Viva</h3>
                  <p className="text-[#75758a] text-xs leading-relaxed font-sans">
                    Practice answering theoretical exam questions orally. The AI examiner assesses conceptual clarity, detects missing axioms, and asks follow-ups dynamically.
                  </p>
                </div>
                {subjects.length > 0 ? (
                  <button 
                    onClick={handleStartSession}
                    className="bg-black hover:bg-zinc-800 text-white px-8 py-2.5 rounded-full font-semibold text-xs font-mono uppercase tracking-wider transition-all cursor-pointer shadow-none"
                  >
                    Start Viva Session ({selectedSubject?.name || 'Active Subject'})
                  </button>
                ) : (
                  <div className="text-[#b30000] text-xs flex items-center justify-center gap-1.5 font-mono">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Please set up your subjects on the dashboard first.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Analytics Panel */}
        <div className="bg-white border border-[#d9d9dd] rounded-2xl p-6 h-fit space-y-6">
          <h2 className="text-xs font-mono font-bold text-black uppercase tracking-wider flex items-center gap-2 border-b border-[#d9d9dd] pb-3">
            <Activity className="w-4 h-4 text-[#1863dc]" />
            Session Analytics
          </h2>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-mono mb-1.5">
                <span className="text-[#75758a] uppercase">Average Score</span>
                <span className="text-black font-bold">{scoresList.length > 0 ? `${(Number(averageScore) * 10)}%` : "N/A"}</span>
              </div>
              <div className="h-1 bg-[#eeece7] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-black transition-all duration-500" 
                  style={{ width: scoresList.length > 0 ? `${(Number(averageScore) * 10)}%` : "0%" }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#eeece7] border border-[#d9d9dd] p-3.5 rounded text-center">
                <div className="text-xl font-mono font-bold text-black">{questionCount}</div>
                <div className="text-[9px] font-mono text-[#75758a] uppercase tracking-wider mt-0.5">Questions</div>
              </div>
              <div className="bg-[#eeece7] border border-[#d9d9dd] p-3.5 rounded text-center">
                <div className="text-xl font-mono font-bold text-black">{averageScore}/10</div>
                <div className="text-[9px] font-mono text-[#75758a] uppercase tracking-wider mt-0.5">Avg Grade</div>
              </div>
            </div>

            <div className="p-3.5 bg-[#eeece7]/40 border border-[#d9d9dd] rounded-xl">
              <h3 className="text-[10px] font-mono font-bold text-[#75758a] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <MessageSquare className="w-3 h-3 text-[#1863dc]" />
                Viva Question History
              </h3>
              {scoresList.length === 0 ? (
                <p className="text-[10px] font-mono text-[#93939f] italic">No responses evaluated in this session yet.</p>
              ) : (
                <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
                  {scoresList.map((sc, i) => (
                    <div key={i} className="text-xs font-mono text-black flex justify-between items-center py-1 border-b border-[#d9d9dd] last:border-0">
                      <span>Q#{i + 1} Assessment</span>
                      <span className={`font-bold ${sc >= 6 ? 'text-[#003c33]' : 'text-[#ff7759]'}`}>{sc}/10</span>
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
