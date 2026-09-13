import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { optimizeAnswer } from '../../../lib/api';

export default function AnswerOptimizerScreen() {
  const [question, setQuestion] = useState('');
  const [studentAnswer, setStudentAnswer] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedResult, setOptimizedResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleOptimize = async () => {
    if (!question || !studentAnswer) return;
    setIsOptimizing(true);
    setOptimizedResult(null);
    setError(null);

    try {
      const data = await optimizeAnswer({ question, studentAnswer });
      setOptimizedResult(data);
    } catch (err: any) {
      setError(err.message || 'Failed to optimize answer. Please try again.');
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Answer Optimizer</Text>
      <Text style={styles.subtitle}>Paste your draft and we'll polish it.</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Question Context</Text>
        <TextInput
          style={styles.textInputSmall}
          placeholder="What is the question?"
          multiline
          value={question}
          onChangeText={setQuestion}
        />

        <Text style={styles.label}>Your Draft Answer</Text>
        <TextInput
          style={styles.textInputLarge}
          placeholder="Paste your draft here..."
          multiline
          value={studentAnswer}
          onChangeText={setStudentAnswer}
        />

        <TouchableOpacity
          style={[styles.optimizeBtn, (!question || !studentAnswer || isOptimizing) && styles.optimizeBtnDisabled]}
          onPress={handleOptimize}
          disabled={!question || !studentAnswer || isOptimizing}
        >
          {isOptimizing ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.optimizeBtnText}>Optimize Now ⚡</Text>
          )}
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      )}

      {optimizedResult && (
        <View style={styles.resultCard}>
          <View style={styles.scoreRow}>
            <Text style={styles.sectionLabel}>Analysis</Text>
            {optimizedResult.score != null && (
              <View style={styles.scoreBadge}>
                <Text style={styles.scoreText}>{optimizedResult.score}/10</Text>
              </View>
            )}
          </View>

          {optimizedResult.feedback && (
            <Text style={styles.feedbackText}>{optimizedResult.feedback}</Text>
          )}

          {optimizedResult.missingConcepts?.length > 0 && (
            <View style={styles.missingBox}>
              <Text style={styles.missingTitle}>Missing Concepts</Text>
              {optimizedResult.missingConcepts.map((c: string, i: number) => (
                <Text key={i} style={styles.missingItem}>• {c}</Text>
              ))}
            </View>
          )}

          {optimizedResult.improvedAnswer && (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionLabel}>Improved Version</Text>
              <Text style={styles.improvedBody}>{optimizedResult.improvedAnswer}</Text>
            </>
          )}
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
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#64748B',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  textInputSmall: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  textInputLarge: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    minHeight: 140,
    textAlignVertical: 'top',
    marginBottom: 24,
  },
  optimizeBtn: {
    backgroundColor: '#10B981',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  optimizeBtnDisabled: {
    backgroundColor: '#6EE7B7',
  },
  optimizeBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
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
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  scoreBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  scoreText: {
    color: '#D97706',
    fontWeight: '800',
    fontSize: 14,
  },
  feedbackText: {
    fontSize: 15,
    color: '#334155',
    marginBottom: 16,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  missingBox: {
    backgroundColor: '#FFF7ED',
    borderRadius: 10,
    padding: 14,
    marginBottom: 4,
  },
  missingTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#C2410C',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  missingItem: {
    fontSize: 14,
    color: '#9A3412',
    marginBottom: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 16,
  },
  improvedBody: {
    fontSize: 16,
    lineHeight: 24,
    color: '#0F172A',
    marginTop: 8,
  },
});
