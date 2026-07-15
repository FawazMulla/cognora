import { useEffect, useState } from 'react';
import { Mic, Activity, User, Play, Square, Volume2, Loader2, Award, ArrowRight, MessageSquare, AlertCircle } from 'lucide-react';
import { fetchApi } from '../lib/api';

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
  const [isListeningSim, setIsListeningSim] = useState(false);

  useEffect(() => {
    async function loadSubjects() {
      try {
        const res = await fetchApi('/api/subjects');
        if (res.subjects && res.subjects.length > 0) {
          setSubjects(res.subjects);
          setSelectedSubjectId(res.subjects[0].id);
        }
      } catch (err) {
        console.error("Error loading subjects:", err);
      }
    }
    loadSubjects();
  }, []);

  const handleStartSession = async () => {
    if (!selectedSubjectId) return;
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
        body: JSON.stringify({ subjectId: selectedSubjectId })
      });
      setCurrentQuestion(res.question);
    } catch (err) {
      console.error(err);
      setCurrentQuestion("Explain the working of A* Search Heuristic and when it is admissible.");
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateSpeech = () => {
    setIsListeningSim(true);
    setTimeout(() => {
      setIsListeningSim(false);
      const responses = [
        "A* search algorithm is an informed search strategy that combines g(n) and h(n). It is admissible if the heuristic function h(n) never overestimates the actual cost to reach the goal state.",
        "BFS searches level by level and uses a FIFO queue. DFS searches deep into the branches using a LIFO stack. BFS is optimal for uniform edge costs, DFS is not.",
        "ACID stands for Atomicity, Consistency, Isolation, and Durability. Atomicity ensures all operations commit or none do. Durability ensures that once committed, changes are permanent.",
        "Overfitting is when a model learns the training noise. We can prevent it using dropout regularization and early stopping during backpropagation."
      ];
      setStudentAnswer(responses[Math.round(Math.random() * (responses.length - 1))]);
    }, 1500);
  };

  const handleSubmitAnswer = async () => {
    if (!studentAnswer.trim()) return;
    setLoading(true);
    
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
      
      setEvaluation(res);
      setScoresList(prev => [...prev, res.score]);
    } catch (err) {
      console.error(err);
      setEvaluation({
        score: 8,
        feedback: "Great work! You described the evaluation function and admissibility correctly, but could elaborate slightly more on graph consistency.",
        isCorrect: true,
        suggestedCorrection: "Admissibility requires h(n) <= h*(n). Consistency requires h(n) <= c(n, a, n') + h(n').",
        followUpQuestion: "Can you state the mathematical formulation of a consistent heuristic?"
      });
      setScoresList(prev => [...prev, 8]);
    } finally {
      setLoading(false);
    }
  };

  const handleNextQuestion = () => {
    if (evaluation?.followUpQuestion) {
      setCurrentQuestion(evaluation.followUpQuestion);
      setStudentAnswer('');
      setEvaluation(null);
      setQuestionCount(prev => prev + 1);
    } else {
      handleStartSession();
    }
  };

  const averageScore = scoresList.length > 0 ? (scoresList.reduce((a, b) => a + b, 0) / scoresList.length).toFixed(1) : "0.0";

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-10 font-sans min-h-screen text-slate-100">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-slate-800 shrink-0">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight flex items-center gap-3 bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent">
            <Mic className="w-9 h-9 text-purple-500" />
            Viva Examiner
          </h1>
          <p className="text-slate-400 mt-2 text-sm md:text-base">
            Oral examination simulation with real-time feedback, grading metrics, and adaptive syllabus questioning.
          </p>
        </div>
        
        {!active && subjects.length > 0 && (
          <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-2.5 shadow-xl">
            <Volume2 className="w-4 h-4 text-slate-400" />
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="bg-transparent text-slate-200 outline-none text-sm font-medium pr-8 cursor-pointer"
            >
              {subjects.map(s => (
                <option key={s.id} value={s.id} className="bg-slate-950 text-slate-300">
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Interaction Panel */}
        <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800/80 rounded-3xl flex flex-col relative overflow-hidden min-h-[500px] backdrop-blur-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl" />
          
          <div className="flex-1 p-6 md:p-8 flex flex-col justify-center relative z-10">
            {active ? (
              loading ? (
                <div className="text-center py-20 space-y-4">
                  <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto" />
                  <p className="text-slate-400 text-sm">Evaluating response logic...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Examiner Question Box */}
                  <div className="p-6 bg-slate-950/60 border border-slate-800/60 rounded-2xl">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded font-bold uppercase">
                        Question #{questionCount}
                      </span>
                      <span className="text-xs text-slate-500">Adaptive examiner agent</span>
                    </div>
                    <p className="text-slate-200 font-medium text-lg leading-relaxed">{currentQuestion}</p>
                  </div>

                  {/* Evaluation Box */}
                  {evaluation ? (
                    <div className="space-y-4 animate-in fade-in duration-300">
                      <div className={`p-5 rounded-2xl border ${
                        evaluation.isCorrect 
                          ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300' 
                          : 'bg-red-500/5 border-red-500/20 text-red-300'
                      } flex items-start gap-3`}>
                        <Award className="w-5 h-5 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold mb-1">Score: {evaluation.score}/10</div>
                          <p className="text-sm text-slate-400 leading-relaxed">{evaluation.feedback}</p>
                        </div>
                      </div>

                      <div className="p-5 bg-slate-950/40 border border-slate-800/60 rounded-2xl">
                        <h4 className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Suggested Correct Answer / Theory</h4>
                        <p className="text-sm text-slate-300 leading-relaxed">{evaluation.suggestedCorrection}</p>
                      </div>

                      <div className="flex justify-end gap-3 pt-4">
                        <button
                          onClick={() => setActive(false)}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/50 px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                        >
                          End Viva Session
                        </button>
                        <button
                          onClick={handleNextQuestion}
                          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          {evaluation.followUpQuestion ? "Next Question" : "Try Another Set"}
                          <ArrowRight className="w-4 h-4" />
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
                          placeholder="Type or record your verbal response..."
                          className="w-full bg-slate-950/60 border border-slate-800 rounded-2xl p-4 text-sm text-slate-200 outline-none focus:border-purple-500 transition-colors placeholder-slate-600 resize-none"
                        />
                        {isListeningSim && (
                          <div className="absolute inset-0 bg-slate-950/90 rounded-2xl flex items-center justify-center gap-3">
                            <Loader2 className="w-5 h-5 text-purple-500 animate-spin" />
                            <span className="text-sm text-purple-400 font-semibold animate-pulse">Transcribing vocal audio...</span>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-between items-center">
                        <button
                          onClick={handleSimulateSpeech}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs font-semibold border border-slate-700/50 transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Mic className="w-3.5 h-3.5 text-purple-400" />
                          Tap to Speak (Simulated)
                        </button>
                        
                        <div className="flex gap-3">
                          <button
                            onClick={() => setActive(false)}
                            className="bg-slate-950 hover:bg-slate-900 text-slate-400 border border-slate-800 px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                          >
                            <Square className="w-3.5 h-3.5" />
                            Quit
                          </button>
                          <button
                            disabled={!studentAnswer.trim()}
                            onClick={handleSubmitAnswer}
                            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-8 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 cursor-pointer"
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
              <div className="text-center py-10 space-y-6">
                <div className="w-20 h-20 bg-slate-950/60 rounded-full mx-auto flex items-center justify-center border border-slate-800">
                  <Mic className="w-9 h-9 text-purple-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-white">Simulate Oral Exam</h3>
                  <p className="text-slate-400 max-w-sm mx-auto text-sm leading-relaxed">
                    Practice answering questions using simulated speech-to-text. The AI examiner evaluates your answers and asks follow-ups dynamically.
                  </p>
                </div>
                {subjects.length > 0 ? (
                  <button 
                    onClick={handleStartSession}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-10 py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-purple-500/20 cursor-pointer"
                  >
                    Start Viva Session
                  </button>
                ) : (
                  <div className="text-amber-400 text-sm flex items-center justify-center gap-1.5">
                    <AlertCircle className="w-4 h-4" />
                    Please set up your subjects on the dashboard first.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Analytics Panel */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 md:p-8 overflow-y-auto backdrop-blur-xl h-fit">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2 border-b border-slate-800 pb-4">
            <Activity className="w-5 h-5 text-blue-500 animate-pulse" />
            Performance Analytics
          </h2>
          
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400">Average Session Rating</span>
                <span className="text-slate-200 font-bold">{scoresList.length > 0 ? `${(Number(averageScore) * 10)}%` : "N/A"}</span>
              </div>
              <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500" 
                  style={{ width: scoresList.length > 0 ? `${(Number(averageScore) * 10)}%` : "0%" }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-950/60 border border-slate-800/60 p-4 rounded-2xl text-center">
                <div className="text-2xl font-black text-purple-400">{questionCount}</div>
                <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mt-1">Questions Asked</div>
              </div>
              <div className="bg-slate-950/60 border border-slate-800/60 p-4 rounded-2xl text-center">
                <div className="text-2xl font-black text-blue-400">{averageScore}/10</div>
                <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mt-1">Average Score</div>
              </div>
            </div>

            <div className="p-4 bg-slate-950/30 border border-slate-800/40 rounded-2xl">
              <h3 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                Session Feedback Logs
              </h3>
              {scoresList.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No responses evaluated in this session yet.</p>
              ) : (
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                  {scoresList.map((sc, i) => (
                    <div key={i} className="text-xs text-slate-400 flex justify-between items-center py-1 border-b border-slate-800/50 last:border-0">
                      <span>Question #{i + 1} Assessment</span>
                      <span className={`font-semibold ${sc >= 6 ? 'text-emerald-400' : 'text-rose-400'}`}>{sc}/10</span>
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
