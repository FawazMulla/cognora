import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { generatePractical } from '../../../lib/api';

const LANGUAGES = ['python', 'java', 'c', 'c++', 'javascript'];

type PracticalResult = {
  aim: string;
  apparatus: string;
  theory: string;
  diagramAscii: string;
  algorithm: string[];
  code: string;
  expectedInput: string;
  expectedOutput: string;
  observation: string;
  conclusion: string;
  vivaQuestions: { question: string; answer: string }[];
};

export default function PracticalGeneratorScreen() {
  const [aim, setAim] = useState('');
  const [language, setLanguage] = useState('python');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<PracticalResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    theory: true,
    algorithm: true,
    code: true,
    io: false,
    observation: false,
    conclusion: true,
    viva: false,
  });

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleGenerate = async () => {
    if (!aim.trim()) return;
    setIsGenerating(true);
    setResult(null);
    setError(null);

    try {
      const data = await generatePractical({ aim: aim.trim(), codeLanguage: language });
      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate practical. Please check your connection and try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={styles.title}>Practical Generator</Text>
        <Text style={styles.subtitle}>Generate a complete lab journal entry from an aim.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Experiment Aim</Text>
        <TextInput
          style={styles.textArea}
          placeholder="e.g. To implement and demonstrate the A* search algorithm in Python"
          multiline
          value={aim}
          onChangeText={setAim}
        />

        <Text style={styles.label}>Programming Language</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.langScroll}>
          {LANGUAGES.map(lang => (
            <TouchableOpacity
              key={lang}
              style={[styles.langChip, language === lang && styles.langChipActive]}
              onPress={() => setLanguage(lang)}
            >
              <Text style={[styles.langChipText, language === lang && styles.langChipTextActive]}>
                {lang.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity
          style={[styles.generateBtn, (!aim.trim() || isGenerating) && styles.generateBtnDisabled]}
          onPress={handleGenerate}
          disabled={!aim.trim() || isGenerating}
        >
          {isGenerating ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#FFF" size="small" />
              <Text style={styles.generateBtnText}> Generating journal…</Text>
            </View>
          ) : (
            <Text style={styles.generateBtnText}>🔬 Generate Practical</Text>
          )}
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      )}

      {result && (
        <View style={styles.resultContainer}>
          {/* AIM */}
          <View style={styles.section}>
            <Text style={styles.sectionBadge}>AIM</Text>
            <Text style={styles.bodyText}>{result.aim}</Text>
          </View>

          {/* APPARATUS */}
          <View style={styles.section}>
            <Text style={styles.sectionBadge}>APPARATUS</Text>
            <Text style={styles.bodyText}>{result.apparatus}</Text>
          </View>

          {/* THEORY */}
          <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection('theory')}>
            <Text style={styles.sectionBadge}>THEORY</Text>
            <Text style={styles.chevron}>{expandedSections.theory ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          {expandedSections.theory && (
            <View style={styles.sectionBody}>
              {result.diagramAscii ? (
                <View style={styles.codeBlock}>
                  <Text style={styles.codeText}>{result.diagramAscii}</Text>
                </View>
              ) : null}
              <Text style={styles.bodyText}>{result.theory}</Text>
            </View>
          )}

          {/* ALGORITHM */}
          <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection('algorithm')}>
            <Text style={styles.sectionBadge}>ALGORITHM</Text>
            <Text style={styles.chevron}>{expandedSections.algorithm ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          {expandedSections.algorithm && (
            <View style={styles.sectionBody}>
              {Array.isArray(result.algorithm)
                ? result.algorithm.map((step, i) => (
                    <View key={i} style={styles.algorithmStep}>
                      <View style={styles.stepNumBadge}>
                        <Text style={styles.stepNum}>{i + 1}</Text>
                      </View>
                      <Text style={styles.stepText}>{step}</Text>
                    </View>
                  ))
                : <Text style={styles.bodyText}>{String(result.algorithm)}</Text>
              }
            </View>
          )}

          {/* CODE */}
          <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection('code')}>
            <Text style={styles.sectionBadge}>CODE ({language.toUpperCase()})</Text>
            <Text style={styles.chevron}>{expandedSections.code ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          {expandedSections.code && (
            <View style={styles.sectionBody}>
              <View style={styles.codeBlock}>
                <Text style={styles.codeText}>{result.code}</Text>
              </View>
            </View>
          )}

          {/* INPUT / OUTPUT */}
          <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection('io')}>
            <Text style={styles.sectionBadge}>INPUT / OUTPUT</Text>
            <Text style={styles.chevron}>{expandedSections.io ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          {expandedSections.io && (
            <View style={styles.sectionBody}>
              <Text style={styles.ioLabel}>Expected Input</Text>
              <View style={styles.codeBlock}>
                <Text style={styles.codeText}>{result.expectedInput}</Text>
              </View>
              <Text style={[styles.ioLabel, { marginTop: 12 }]}>Expected Output</Text>
              <View style={styles.codeBlock}>
                <Text style={styles.codeText}>{result.expectedOutput}</Text>
              </View>
            </View>
          )}

          {/* OBSERVATION */}
          <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection('observation')}>
            <Text style={styles.sectionBadge}>OBSERVATION</Text>
            <Text style={styles.chevron}>{expandedSections.observation ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          {expandedSections.observation && (
            <View style={styles.sectionBody}>
              <Text style={styles.bodyText}>{result.observation}</Text>
            </View>
          )}

          {/* CONCLUSION */}
          <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection('conclusion')}>
            <Text style={styles.sectionBadge}>CONCLUSION</Text>
            <Text style={styles.chevron}>{expandedSections.conclusion ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          {expandedSections.conclusion && (
            <View style={styles.sectionBody}>
              <Text style={styles.bodyText}>{result.conclusion}</Text>
            </View>
          )}

          {/* VIVA QUESTIONS */}
          {Array.isArray(result.vivaQuestions) && result.vivaQuestions.length > 0 && (
            <>
              <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection('viva')}>
                <Text style={styles.sectionBadge}>VIVA QUESTIONS</Text>
                <Text style={styles.chevron}>{expandedSections.viva ? '▲' : '▼'}</Text>
              </TouchableOpacity>
              {expandedSections.viva && (
                <View style={styles.sectionBody}>
                  {result.vivaQuestions.map((vq, i) => (
                    <View key={i} style={styles.vivaCard}>
                      <Text style={styles.vivaQ}>Q{i + 1}: {vq.question}</Text>
                      <Text style={styles.vivaA}>{vq.answer}</Text>
                    </View>
                  ))}
                </View>
              )}
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
  header: {
    marginBottom: 24,
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
  langScroll: {
    marginBottom: 24,
  },
  langChip: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
  },
  langChipActive: {
    backgroundColor: '#0F172A',
  },
  langChipText: {
    fontWeight: '700',
    fontSize: 12,
    color: '#64748B',
    letterSpacing: 0.5,
  },
  langChipTextActive: {
    color: '#FFFFFF',
  },
  generateBtn: {
    backgroundColor: '#7C3AED',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  generateBtnDisabled: {
    backgroundColor: '#C4B5FD',
  },
  generateBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  resultContainer: {
    gap: 4,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeader: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionBody: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderTopWidth: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    marginTop: -2,
  },
  sectionBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7C3AED',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  chevron: {
    fontSize: 12,
    color: '#94A3B8',
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#1E293B',
  },
  ioLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  codeBlock: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    padding: 16,
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: 13,
    color: '#E2E8F0',
    lineHeight: 20,
  },
  algorithmStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  stepNumBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 1,
    flexShrink: 0,
  },
  stepNum: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    color: '#1E293B',
    lineHeight: 22,
  },
  vivaCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#7C3AED',
  },
  vivaQ: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  vivaA: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 21,
  },
});
