import React from 'react';
import { ScrollView, StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { fetchSubjectAnalytics } from '../../../../lib/api';

export default function SubjectWorkspaceScreen() {
  const { id } = useLocalSearchParams();
  
  const { data, isLoading } = useQuery({
    queryKey: ['subject-analytics', id],
    queryFn: () => fetchSubjectAnalytics(id as string),
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  const completionPercent = data?.subjectCompletionPercent || 0;
  const weakTopics = data?.weakTopics || [];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Data Structures</Text>
        <Text style={styles.subtitle}>Exam in 14 days</Text>
      </View>

      <View style={styles.metricsCard}>
        <Text style={styles.cardTitle}>Syllabus Completion</Text>
        <Text style={styles.completionValue}>{completionPercent}%</Text>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${completionPercent}%` }]} />
        </View>
      </View>

      <TouchableOpacity style={styles.studyNowButton}>
        <Text style={styles.studyNowText}>Study Now</Text>
      </TouchableOpacity>

      <View style={styles.tabsGrid}>
        {['Notes', 'PYQs', 'Flashcards', 'Revision', 'Analytics', 'Resources'].map((tab) => (
          <TouchableOpacity key={tab} style={styles.tabCard}>
            <Text style={styles.tabText}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Top Weaknesses</Text>
      {weakTopics.length > 0 ? (
        weakTopics.map((topic: any, idx: number) => (
          <View key={idx} style={styles.weakTopicCard}>
            <Text style={styles.weakTopicText}>{topic}</Text>
          </View>
        ))
      ) : (
        <Text style={styles.emptyText}>No weak topics identified yet.</Text>
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: 32,
    marginTop: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 16,
    color: '#6366F1',
    fontWeight: '600',
    marginTop: 4,
  },
  metricsCard: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 24,
    marginBottom: 24,
    shadowColor: '#64748B',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  cardTitle: {
    fontSize: 16,
    color: '#475569',
    fontWeight: '600',
  },
  completionValue: {
    fontSize: 36,
    fontWeight: '800',
    color: '#0F172A',
    marginVertical: 12,
  },
  progressBarBg: {
    height: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4F46E5',
    borderRadius: 5,
  },
  studyNowButton: {
    backgroundColor: '#0F172A',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 32,
  },
  studyNowText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  tabsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  tabCard: {
    width: '31%',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#64748B',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 16,
  },
  weakTopicCard: {
    backgroundColor: '#FEF2F2',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  weakTopicText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#B91C1C',
  },
  emptyText: {
    color: '#94A3B8',
    fontStyle: 'italic',
  }
});
