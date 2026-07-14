import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Switch, ActivityIndicator } from 'react-native';

export default function HomeworkScreen() {
  const [question, setQuestion] = useState('');
  const [instructions, setInstructions] = useState('');
  const [wordLimit, setWordLimit] = useState('');
  const [useHandwritingStyle, setUseHandwritingStyle] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleGenerate = () => {
    if (!question) return;
    setIsGenerating(true);
    setResult(null);

    // Simulate API call
    setTimeout(() => {
      setResult({
        answer: "This is a meticulously crafted homework response. It incorporates the teacher's instructions regarding formatting and adheres strictly to the word limit requested. Furthermore, it avoids highly complex vocabulary to maintain the student's natural stylistic footprint.",
        wordCount: 42,
        readability: "Grade 9"
      });
      setIsGenerating(false);
    }, 2000);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Homework Assistant</Text>
        <Text style={styles.subtitle}>Draft answers in your own unique style.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Assignment Question</Text>
        <TextInput
          style={styles.textArea}
          placeholder="What is the prompt?"
          multiline
          value={question}
          onChangeText={setQuestion}
        />

        <Text style={styles.label}>Teacher's Instructions (Optional)</Text>
        <TextInput
          style={styles.textInput}
          placeholder="e.g. Include two real-world examples"
          value={instructions}
          onChangeText={setInstructions}
        />

        <View style={styles.row}>
          <View style={styles.flex1}>
            <Text style={styles.label}>Word Limit</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. 500"
              keyboardType="number-pad"
              value={wordLimit}
              onChangeText={setWordLimit}
            />
          </View>
          <View style={styles.spacer} />
          <View style={styles.flex1}>
            <Text style={styles.label}>Handwriting Friendly</Text>
            <View style={styles.switchRow}>
              <Switch 
                value={useHandwritingStyle} 
                onValueChange={setUseHandwritingStyle} 
                trackColor={{ false: "#E2E8F0", true: "#3B82F6" }}
              />
              <Text style={styles.switchLabel}>{useHandwritingStyle ? 'On' : 'Off'}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.uploadStyleBtn}>
          <Text style={styles.uploadStyleIcon}>📸</Text>
          <Text style={styles.uploadStyleText}>Upload Past Sample for Style Matching</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.generateBtn, !question && styles.generateBtnDisabled]} 
          onPress={handleGenerate}
          disabled={!question || isGenerating}
        >
          {isGenerating ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.generateBtnText}>Draft Homework</Text>
          )}
        </TouchableOpacity>
      </View>

      {result && (
        <View style={styles.resultCard}>
          <View style={styles.resultMetaRow}>
            <View style={styles.metaBadge}>
              <Text style={styles.metaBadgeText}>{result.wordCount} words</Text>
            </View>
            <View style={[styles.metaBadge, styles.metaBadgeAlt]}>
              <Text style={styles.metaBadgeAltText}>{result.readability}</Text>
            </View>
          </View>
          <Text style={styles.resultText}>{result.answer}</Text>
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
    marginBottom: 24,
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
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 20,
    shadowColor: '#64748B',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  textArea: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  textInput: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
  },
  flex1: {
    flex: 1,
  },
  spacer: {
    width: 16,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  switchLabel: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  uploadStyleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    justifyContent: 'center',
  },
  uploadStyleIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  uploadStyleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  generateBtn: {
    backgroundColor: '#0F172A',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  generateBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  generateBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  resultMetaRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  metaBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  metaBadgeText: {
    color: '#2563EB',
    fontWeight: '600',
    fontSize: 12,
  },
  metaBadgeAlt: {
    backgroundColor: '#F0FDF4',
  },
  metaBadgeAltText: {
    color: '#16A34A',
    fontWeight: '600',
    fontSize: 12,
  },
  resultText: {
    fontSize: 16,
    lineHeight: 26,
    color: '#1E293B',
  }
});
