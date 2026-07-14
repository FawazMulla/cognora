import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

const mockQuiz = [
  {
    id: '1',
    type: 'mcq',
    question: 'Which of the following sorting algorithms has the best average-case time complexity?',
    options: ['Bubble Sort', 'Insertion Sort', 'Merge Sort', 'Selection Sort'],
    correctAnswer: 2
  },
  {
    id: '2',
    type: 'mcq',
    question: 'In the OSI model, which layer is responsible for routing?',
    options: ['Data Link Layer', 'Network Layer', 'Transport Layer', 'Application Layer'],
    correctAnswer: 1
  }
];

export default function QuizScreen() {
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);

  const currentQ = mockQuiz[currentQuestionIdx];

  const handleSelect = (idx: number) => {
    if (isAnswered) return;
    setSelectedOption(idx);
  };

  const handleSubmit = () => {
    if (selectedOption === null) return;
    setIsAnswered(true);
    if (selectedOption === currentQ.correctAnswer) {
      setScore(score + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIdx < mockQuiz.length - 1) {
      setCurrentQuestionIdx(currentQuestionIdx + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      alert(`Quiz Complete! Score: ${score + (selectedOption === currentQ.correctAnswer && !isAnswered ? 1 : 0)}/${mockQuiz.length}`);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressText}>Question {currentQuestionIdx + 1} of {mockQuiz.length}</Text>
          <Text style={styles.scoreText}>Score: {score}</Text>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${((currentQuestionIdx + 1) / mockQuiz.length) * 100}%` }]} />
        </View>
      </View>

      <View style={styles.questionCard}>
        <View style={styles.questionBadge}>
          <Text style={styles.questionBadgeText}>Multiple Choice</Text>
        </View>
        <Text style={styles.questionText}>{currentQ.question}</Text>
      </View>

      <View style={styles.optionsContainer}>
        {currentQ.options.map((opt, idx) => {
          let style = [styles.optionCard];
          let textStyle = [styles.optionText];
          
          if (isAnswered) {
            if (idx === currentQ.correctAnswer) {
              style.push(styles.optionCorrect);
              textStyle.push(styles.optionTextCorrect);
            } else if (idx === selectedOption) {
              style.push(styles.optionIncorrect);
              textStyle.push(styles.optionTextIncorrect);
            }
          } else if (idx === selectedOption) {
            style.push(styles.optionSelected);
          }

          return (
            <TouchableOpacity 
              key={idx} 
              style={style} 
              onPress={() => handleSelect(idx)}
              activeOpacity={0.7}
            >
              <Text style={textStyle}>{opt}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.footer}>
        {!isAnswered ? (
          <TouchableOpacity 
            style={[styles.actionBtn, selectedOption === null && styles.actionBtnDisabled]} 
            onPress={handleSubmit}
            disabled={selectedOption === null}
          >
            <Text style={styles.actionBtnText}>Check Answer</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.actionBtn} onPress={handleNext}>
            <Text style={styles.actionBtnText}>{currentQuestionIdx < mockQuiz.length - 1 ? 'Next Question' : 'Finish Quiz'}</Text>
          </TouchableOpacity>
        )}
      </View>
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
    marginBottom: 32,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 3,
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 20,
    marginBottom: 24,
    shadowColor: '#64748B',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  questionBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 16,
  },
  questionBadgeText: {
    color: '#4F46E5',
    fontWeight: '700',
    fontSize: 12,
  },
  questionText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    lineHeight: 30,
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 32,
  },
  optionCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#64748B',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  optionSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  optionCorrect: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  optionIncorrect: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#334155',
  },
  optionTextCorrect: {
    color: '#047857',
    fontWeight: '700',
  },
  optionTextIncorrect: {
    color: '#B91C1C',
  },
  footer: {
    marginTop: 'auto',
  },
  actionBtn: {
    backgroundColor: '#0F172A',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  actionBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  }
});
