import { router } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, TextInput, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { getAccessToken } from '../../lib/secure-storage';

const TOTAL_STEPS = 4;

const STEP_LABELS = [
  'University',
  'Branch / Programme',
  'Semester',
  'Subjects',
] as const;

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Form state
  const [university, setUniversity] = useState('');
  const [branch, setBranch] = useState('');
  const [semester, setSemester] = useState('');
  
  const [subjects, setSubjects] = useState<{name: string, examDate?: string}[]>([]);
  const [currentSubjectName, setCurrentSubjectName] = useState('');

  const addSubject = () => {
    if (currentSubjectName.trim()) {
      setSubjects([...subjects, { name: currentSubjectName.trim() }]);
      setCurrentSubjectName('');
    }
  };

  const removeSubject = (index: number) => {
    setSubjects(subjects.filter((_, i) => i !== index));
  };

  const submitProfile = async () => {
    setLoading(true);
    try {
      const token = await getAccessToken();
      const response = await fetch('http://localhost:3001/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          university,
          branch,
          semester: parseInt(semester, 10),
          subjects
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to complete onboarding');
      }

      router.replace('/(app)/');
    } catch (error: any) {
      Alert.alert('Onboarding Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (step === 0 && !university.trim()) {
      Alert.alert('Required', 'Please enter your university');
      return;
    }
    if (step === 1 && !branch.trim()) {
      Alert.alert('Required', 'Please enter your branch');
      return;
    }
    if (step === 2 && (!semester || isNaN(Number(semester)))) {
      Alert.alert('Required', 'Please enter a valid semester number');
      return;
    }

    if (step < TOTAL_STEPS - 1) {
      setStep((s) => s + 1);
    } else {
      submitProfile();
    }
  };

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="e.g. MIT, Stanford, IIT"
              value={university}
              onChangeText={setUniversity}
              autoFocus
            />
          </View>
        );
      case 1:
        return (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="e.g. Computer Science"
              value={branch}
              onChangeText={setBranch}
              autoFocus
            />
          </View>
        );
      case 2:
        return (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="e.g. 1, 2, 3..."
              value={semester}
              onChangeText={setSemester}
              keyboardType="number-pad"
              autoFocus
            />
          </View>
        );
      case 3:
        return (
          <View style={styles.inputContainer}>
            <View style={styles.subjectInputRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                placeholder="Subject name"
                value={currentSubjectName}
                onChangeText={setCurrentSubjectName}
                onSubmitEditing={addSubject}
              />
              <TouchableOpacity style={styles.addButton} onPress={addSubject}>
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.subjectList} keyboardShouldPersistTaps="handled">
              {subjects.map((sub, idx) => (
                <View key={idx} style={styles.subjectItem}>
                  <Text style={styles.subjectItemText}>{sub.name}</Text>
                  <TouchableOpacity onPress={() => removeSubject(idx)}>
                    <Text style={styles.removeText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              ))}
              {subjects.length === 0 && (
                <Text style={styles.emptyText}>No subjects added yet.</Text>
              )}
            </ScrollView>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Progress indicator */}
      <View style={styles.progressRow}>
        {STEP_LABELS.map((_, i) => (
          <View
            key={i}
            style={[styles.progressDot, i <= step && styles.progressDotActive]}
          />
        ))}
      </View>

      <Text style={styles.stepLabel}>Step {step + 1} of {TOTAL_STEPS}</Text>
      <Text style={styles.title}>{STEP_LABELS[step]}</Text>

      {renderStepContent()}

      <View style={styles.buttonRow}>
        {step > 0 && (
          <TouchableOpacity style={styles.backButton} onPress={handleBack} disabled={loading}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.nextButton} onPress={handleNext} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.nextButtonText}>
              {step === TOTAL_STEPS - 1 ? 'Finish' : 'Next'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 8,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#e5e7eb',
  },
  progressDotActive: {
    backgroundColor: '#6366f1',
  },
  stepLabel: {
    textAlign: 'center',
    color: '#6366f1',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 32,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 32,
    minHeight: 120,
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 16,
  },
  subjectInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#4338ca',
    fontWeight: '600',
  },
  subjectList: {
    maxHeight: 200,
  },
  subjectItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: 8,
  },
  subjectItemText: {
    fontSize: 16,
  },
  removeText: {
    color: '#ef4444',
  },
  emptyText: {
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  backButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    flex: 2,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#6366f1',
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
