import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { generateVivaQuestion, evaluateVivaAnswer } from '../../../lib/api';

type Phase = 'setup' | 'question' | 'evaluating' | 'result';

type EvalResult = {
  score: number;
  isCorrect: boolean;
  feedback: string;
  suggestedCorrection: string;
  followUpQuestion: string;
};

export default function VivaScreen() {
  const [topic, setTopic] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [currentTopic, setCurrentTopic] = useState('');
  const [studentAnswer, setStudentAnswer] = useState('');
  const [evaluation, setEvaluation] = useState<EvalResult | null>(null);
  const [phase, setPhase] = useState<Phase>('setup');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionScore, setSessionScore] = useState<number[]>([]);
  const [showCorrection, setShowCorrection] = useState(false);

  const scoreAnim = useRef(new Animated.Value(0)).current;

  const animateScore = (score: number) => {
    Animated.timing(scoreAnim, {
      toValue: score / 10,
      duration: 800,
      useNativeDriver: false,
    }).start();
  };

  const handleStartSession = async () => {
    setIsLoading(true);
    setError(null);
    setStudentAnswer('');
    setEvaluation(null);
    setShowCorrection(false);

    try {
      const data = await generateVivaQuestion({ topic: topic || undefined });
      setCurrentQuestion(data.question);
      setCurrentTopic(data.topic || topic || 'General');
      setPhase('question');
    } catch (err: any) {
      setError(err.message || 'Failed to fetch a question. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!studentAnswer.trim()) return;
    setPhase('evaluating');
    setError(null);

    try {
      const data = await evaluateVivaAnswer({
        question: currentQuestion,
        answer: studentAnswer.trim(),
        topic: currentTopic,
      });
      setEvaluation(data);
      setSessionScore(prev => [...prev, data.score]);
      scoreAnim.setValue(0);
      animateScore(data.score);
      setPhase('result');
    } catch (err: any) {
      setError(err.message || 'Evaluation failed. Please try again.');
      setPhase('question');
    }
  };

  const handleNextQuestion = async () => {
    setIsLoading(true);
    setError(null);
    setStudentAnswer('');
    setEvaluation(null);
    setShowCorrection(false);
    setPhase('setup');

    // If there's a follow-up question, use it directly
    const followUp = evaluation?.followUpQuestion;

    try {
      if (followUp) {
        setCurrentQuestion(followUp);
        setPhase('question');
      } else {
        const data = await generateVivaQuestion({ topic: currentTopic || undefined });
        setCurrentQuestion(data.question);
        setCurrentTopic(data.topic || currentTopic);
        setPhase('question');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load next question.');
      setPhase('setup');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setPhase('setup');
    setCurrentQuestion('');
    setCurrentTopic('');
    setStudentAnswer('');
    setEvaluation(null);
    setError(null);
    setShowCorrection(false);
    setSessionScore([]);
    scoreAnim.setValue(0);
  };

  const avgScore =
    sessionScore.length > 0
      ? (sessionScore.reduce((a, b) => a + b, 0) / sessionScore.length).toFixed(1)
      : null;

  const scoreColor = (s: number) => {
    if (s >= 8) return '#16A34A';
    if (s >= 5) return '#D97706';
    return '#DC2626';
  };

  const scoreBg = (s: number) => {
    if (s >= 8) return '#F0FDF4';
    if (s >= 5) return '#FFFBEB';
    return '#FEF2F2';
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Viva Practice</Text>
        <Text style={styles.subtitle}>Practice oral exam questions with AI feedback.</Text>
      </View>

      {/* Session stats bar */}
      {sessionScore.length > 0 && (
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{sessionScore.length}</Text>
            <Text style={styles.statLabel}>Questions</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: scoreColor(parseFloat(avgScore!)) }]}>
              {avgScore}/10
            </Text>
            <Text style={styles.statLabel}>Avg Score</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {sessionScore.filter(s => s >= 5).length}/{sessionScore.length}
            </Text>
            <Text style={styles.statLabel}>Passed</Text>
          </View>
          <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
            <Text style={styles.resetBtnText}>Reset</Text>
          </TouchableOpacity>
        </View>
      )}

      {error && (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      )}

      {/* SETUP PHASE */}
      {(phase === 'setup' || isLoading) && (
        <View style={styles.card}>
          <Text style={styles.label}>Topic (Optional)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. A* Search, ACID Properties, Backpropagation…"
            value={topic}
            onChangeText={setTopic}
            editable={!isLoading}
          />
          <Text style={styles.hintText}>Leave blank for a random important topic from your syllabus.</Text>

          <TouchableOpacity
            style={[styles.primaryBtn, isLoading && styles.primaryBtnDisabled]}
            onPress={handleStartSession}
            disabled={isLoading}
          >
            {isLoading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color="#FFF" size="small" />
                <Text style={styles.primaryBtnText}> Fetching question…</Text>
              </View>
            ) : (
              <Text style={styles.primaryBtnText}>🎓 Start Viva</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* QUESTION PHASE */}
      {phase === 'question' && (
        <View>
          <View style={styles.questionCard}>
            <View style={styles.questionMeta}>
              <View style={styles.topicBadge}>
                <Text style={styles.topicBadgeText}>{currentTopic}</Text>
              </View>
              <Text style={styles.questionNum}>Q{sessionScore.length + 1}</Text>
            </View>
            <Text style={styles.questionText}>{currentQuestion}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Your Answer</Text>
            <TextInput
              style={styles.answerInput}
              placeholder="Type your answer here — think aloud, use definitions, give examples…"
              multiline
              value={studentAnswer}
              onChangeText={setStudentAnswer}
            />
            <TouchableOpacity
              style={[styles.primaryBtn, !studentAnswer.trim() && styles.primaryBtnDisabled]}
              onPress={handleSubmitAnswer}
              disabled={!studentAnswer.trim()}
            >
              <Text style={styles.primaryBtnText}>Submit Answer →</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* EVALUATING PHASE */}
      {phase === 'evaluating' && (
        <View style={styles.card}>
          <View style={styles.loadingRow}>
            <ActivityIndicator color="#7C3AED" />
            <Text style={styles.evaluatingText}> Evaluating your answer…</Text>
          </View>
        </View>
      )}

      {/* RESULT PHASE */}
      {phase === 'result' && evaluation && (
        <View>
          {/* Score card */}
          <View style={[styles.scoreCard, { backgroundColor: scoreBg(evaluation.score) }]}>
            <View style={styles.scoreRow}>
              <View>
                <Text style={styles.scoreLabel}>Score</Text>
                <Text style={[styles.scoreValue, { color: scoreColor(evaluation.score) }]}>
                  {evaluation.score}<Text style={styles.scoreMax}>/10</Text>
                </Text>
              </View>
              <View style={[
                styles.resultBadge,
                evaluation.isCorrect ? styles.resultBadgePass : styles.resultBadgeFail
              ]}>
                <Text style={styles.resultBadgeText}>
                  {evaluation.isCorrect ? '✓ Passed' : '✗ Needs Work'}
                </Text>
              </View>
            </View>

            {/* Score bar */}
            <View style={styles.scoreBarBg}>
              <Animated.View
                style={[
                  styles.scoreBarFill,
                  {
                    width: scoreAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                    backgroundColor: scoreColor(evaluation.score),
                  },
                ]}
              />
            </View>
          </View>

          {/* Feedback */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Feedback</Text>
            <Text style={styles.feedbackText}>{evaluation.feedback}</Text>
          </View>

          {/* Model answer toggle */}
          <TouchableOpacity
            style={styles.correctionToggle}
            onPress={() => setShowCorrection(v => !v)}
          >
            <Text style={styles.correctionToggleText}>
              {showCorrection ? '▲ Hide Model Answer' : '▼ Show Model Answer'}
            </Text>
          </TouchableOpacity>
          {showCorrection && (
            <View style={styles.correctionCard}>
              <Text style={styles.sectionLabel}>Model Answer</Text>
              <Text style={styles.correctionText}>{evaluation.suggestedCorrection}</Text>
            </View>
          )}

          {/* Follow-up question preview */}
          {evaluation.followUpQuestion && (
            <View style={styles.followUpCard}>
              <Text style={styles.followUpLabel}>Next Question (Follow-Up)</Text>
              <Text style={styles.followUpText}>{evaluation.followUpQuestion}</Text>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={handleReset}>
              <Text style={styles.secondaryBtnText}>New Topic</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryBtn} onPress={handleNextQuestion}>
              <Text style={styles.primaryBtnText}>
                {evaluation.followUpQuestion ? 'Answer Follow-Up →' : 'Next Question →'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: '#F8FAFC',
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 15,
    color: '#64748B',
    marginTop: 4,
  },
  statsBar: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  statLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E2E8F0',
  },
  resetBtn: {
    marginLeft: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  resetBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  errorCard: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#64748B',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    marginBottom: 8,
  },
  hintText: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 20,
  },
  primaryBtn: {
    backgroundColor: '#7C3AED',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  primaryBtnDisabled: {
    backgroundColor: '#C4B5FD',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  evaluatingText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#7C3AED',
  },
  questionCard: {
    backgroundColor: '#1E1B4B',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
  },
  questionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  topicBadge: {
    backgroundColor: 'rgba(167,139,250,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  topicBadgeText: {
    color: '#A78BFA',
    fontWeight: '700',
    fontSize: 12,
  },
  questionNum: {
    color: '#6366F1',
    fontWeight: '800',
    fontSize: 14,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F1F5F9',
    lineHeight: 28,
  },
  answerInput: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    minHeight: 140,
    textAlignVertical: 'top',
    marginBottom: 20,
    lineHeight: 22,
  },
  scoreCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  scoreValue: {
    fontSize: 40,
    fontWeight: '800',
    lineHeight: 48,
  },
  scoreMax: {
    fontSize: 20,
    fontWeight: '600',
    color: '#94A3B8',
  },
  resultBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  resultBadgePass: {
    backgroundColor: '#DCFCE7',
  },
  resultBadgeFail: {
    backgroundColor: '#FEE2E2',
  },
  resultBadgeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  scoreBarBg: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  feedbackText: {
    fontSize: 15,
    color: '#334155',
    lineHeight: 24,
  },
  correctionToggle: {
    alignItems: 'center',
    paddingVertical: 14,
    marginBottom: 4,
  },
  correctionToggleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#7C3AED',
  },
  correctionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#7C3AED',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  correctionText: {
    fontSize: 15,
    color: '#1E293B',
    lineHeight: 24,
  },
  followUpCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  followUpLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2563EB',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  followUpText: {
    fontSize: 15,
    color: '#1E40AF',
    fontWeight: '600',
    lineHeight: 22,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: '#475569',
    fontWeight: '700',
    fontSize: 15,
  },
});
