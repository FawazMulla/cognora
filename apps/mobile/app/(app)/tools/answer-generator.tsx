import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';

export default function AnswerGeneratorScreen() {
  const [question, setQuestion] = useState('');
  const [marks, setMarks] = useState('5');
  const [format, setFormat] = useState('Detailed');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAnswer, setGeneratedAnswer] = useState('');

  const handleGenerate = () => {
    if (!question) return;
    setIsGenerating(true);
    setGeneratedAnswer('');
    
    // Simulate generation delay
    setTimeout(() => {
      setGeneratedAnswer("This is a highly structured, generated answer incorporating the specific student model constraints and mark ceilings. It includes step-by-step reasoning and highlights key terms.");
      setIsGenerating(false);
    }, 2000);
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

        <TouchableOpacity style={styles.generateBtn} onPress={handleGenerate} disabled={isGenerating}>
          {isGenerating ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.generateBtnText}>Generate Answer</Text>
          )}
        </TouchableOpacity>
      </View>

      {generatedAnswer ? (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Generated Output</Text>
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
  generateBtnText: {
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
  resultTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3B82F6',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  resultBody: {
    fontSize: 16,
    lineHeight: 24,
    color: '#334155',
  }
});
