import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { generateAnswer } from '../../../lib/api';

export default function AnswerGeneratorScreen() {
  const [question, setQuestion] = useState('');
  const [marks, setMarks] = useState('5');
  const [format, setFormat] = useState('Detailed');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAnswer, setGeneratedAnswer] = useState('');
  const [wordCount, setWordCount] = useState<number | null>(null);
  const [qualityWarning, setQualityWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!question) return;
    setIsGenerating(true);
    setGeneratedAnswer('');
    setWordCount(null);
    setQualityWarning(null);
    setError(null);

    try {
      const data = await generateAnswer({
        question,
        markValue: parseInt(marks, 10) || 5,
        format,
      });
      setGeneratedAnswer(data.answer || '');
      setWordCount(data.wordCount ?? null);
      setQualityWarning(data.qualityWarning ?? null);
    } catch (err: any) {
      setError(err.message || 'Failed to generate answer. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Answer Generator</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Question</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Paste or type your question here..."
          multiline
          value={question}
          onChangeText={setQuestion}
        />

        <View style={styles.row}>
          <View style={styles.flex1}>
            <Text style={styles.label}>Marks</Text>
            <TextInput
              style={styles.inputSmall}
              keyboardType="number-pad"
              value={marks}
              onChangeText={setMarks}
            />
          </View>
          <View style={styles.spacer} />
          <View style={styles.flex2}>
            <Text style={styles.label}>Format</Text>
            <View style={styles.formatRow}>
              {['Concise', 'Detailed'].map(f => (
                <TouchableOpacity
                  key={f}
                  style={[styles.formatChip, format === f && styles.formatChipActive]}
                  onPress={() => setFormat(f)}
                >
                  <Text style={[styles.formatText, format === f && styles.formatTextActive]}>{f}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.generateBtn, (!question || isGenerating) && styles.generateBtnDisabled]}
          onPress={handleGenerate}
          disabled={!question || isGenerating}
        >
          {isGenerating ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.generateBtnText}>Generate Answer</Text>
          )}
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      )}

      {generatedAnswer ? (
        <View style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <Text style={styles.resultTitle}>Generated Output</Text>
            {wordCount != null && (
              <View style={styles.wordBadge}>
                <Text style={styles.wordBadgeText}>{wordCount} words</Text>
              </View>
            )}
          </View>
          {qualityWarning && (
            <Text style={styles.warningText}>⚠️ {qualityWarning}</Text>
          )}
          <Text style={styles.resultBody}>{generatedAnswer}</Text>
        </View>
      ) : null}
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
  textInput: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  flex1: { flex: 1 },
  flex2: { flex: 2 },
  spacer: { width: 16 },
  inputSmall: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
  },
  formatRow: {
    flexDirection: 'row',
    gap: 8,
  },
  formatChip: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  formatChipActive: {
    backgroundColor: '#0F172A',
  },
  formatText: {
    fontWeight: '600',
    color: '#64748B',
  },
  formatTextActive: {
    color: '#FFFFFF',
  },
  generateBtn: {
    backgroundColor: '#4F46E5',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  generateBtnDisabled: {
    backgroundColor: '#A5B4FC',
  },
  generateBtnText: {
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
  resultHeader: {
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
  wordBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  wordBadgeText: {
    color: '#2563EB',
    fontWeight: '600',
    fontSize: 12,
  },
  warningText: {
    color: '#D97706',
    fontSize: 13,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  resultBody: {
    fontSize: 16,
    lineHeight: 24,
    color: '#334155',
  },
});
