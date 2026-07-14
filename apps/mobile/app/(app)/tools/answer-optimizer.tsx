import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';

export default function AnswerOptimizerScreen() {
  const [question, setQuestion] = useState('');
  const [studentAnswer, setStudentAnswer] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedResult, setOptimizedResult] = useState<any>(null);

  const handleOptimize = () => {
    if (!question || !studentAnswer) return;
    setIsOptimizing(true);
    setOptimizedResult(null);
    
    // Simulate generation delay
    setTimeout(() => {
      setOptimizedResult({
        score: 7.5,
        feedback: "Good attempt. You captured the main idea but missed some technical vocabulary.",
        improvedAnswer: "This is the improved, optimized version of the student's answer, rewritten for better readability and completeness while maintaining the student's original stylistic profile."
      });
      setIsOptimizing(false);
    }, 2500);
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

        <TouchableOpacity style={styles.optimizeBtn} onPress={handleOptimize} disabled={isOptimizing}>
          {isOptimizing ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.optimizeBtnText}>Optimize Now ⚡</Text>
          )}
        </TouchableOpacity>
      </View>

      {optimizedResult && (
        <View style={styles.resultCard}>
          <View style={styles.scoreRow}>
            <Text style={styles.resultTitle}>Analysis</Text>
            <View style={styles.scoreBadge}>
              <Text style={styles.scoreText}>{optimizedResult.score}/10</Text>
            </View>
          </View>
          
          <Text style={styles.feedbackText}>{optimizedResult.feedback}</Text>
          
          <View style={styles.divider} />
          
          <Text style={styles.resultTitle}>Improved Version</Text>
          <Text style={styles.improvedBody}>{optimizedResult.improvedAnswer}</Text>
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
  optimizeBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
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
  resultTitle: {
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
  },
  feedbackText: {
    fontSize: 15,
    color: '#334155',
    marginBottom: 16,
    fontStyle: 'italic',
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
  }
});
