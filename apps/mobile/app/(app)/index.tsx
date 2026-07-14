import React from 'react';
import { ScrollView, StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { fetchStudentModel } from '../../lib/api';

export default function SemesterWorkspaceScreen() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['student-model'],
    queryFn: fetchStudentModel,
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  const healthScore = data?.studentModel?.academicHealthScore || 0;
  const weakTopics = data?.weakTopics || [];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome back 👋</Text>
        <Text style={styles.subtitle}>Let's smash your goals today.</Text>
      </View>

      <View style={styles.healthCard}>
        <View style={styles.healthHeader}>
          <Text style={styles.cardTitle}>Academic Health</Text>
          <View style={styles.healthBadge}>
            <Text style={styles.healthBadgeText}>{healthScore >= 80 ? 'Excellent' : 'On Track'}</Text>
          </View>
        </View>
        <Text style={styles.healthScoreValue}>{healthScore.toFixed(0)}<Text style={styles.healthScoreMax}>/100</Text></Text>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${healthScore}%` }]} />
        </View>
      </View>

      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionGrid}>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonIcon}>📚</Text>
          <Text style={styles.actionButtonText}>Study</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonIcon}>⚡</Text>
          <Text style={styles.actionButtonText}>Revise</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonIcon}>📝</Text>
          <Text style={styles.actionButtonText}>PYQs</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonIcon}>🤖</Text>
          <Text style={styles.actionButtonText}>Homework AI</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Focus Areas</Text>
      {weakTopics.length > 0 ? (
        weakTopics.map((topic: any, idx: number) => (
          <View key={idx} style={styles.topicCard}>
            <Text style={styles.topicName}>{topic.topic}</Text>
            <Text style={styles.topicStatus}>Needs attention</Text>
          </View>
        ))
      ) : (
        <Text style={styles.emptyText}>You're all caught up!</Text>
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
    backgroundColor: '#F8FAFC',
  },
  header: {
    marginBottom: 32,
    marginTop: 20,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 6,
    fontWeight: '500',
  },
  healthCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#64748B',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
    marginBottom: 32,
  },
  healthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
  },
  healthBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  healthBadgeText: {
    color: '#10B981',
    fontWeight: '600',
    fontSize: 12,
  },
  healthScoreValue: {
    fontSize: 48,
    fontWeight: '800',
    color: '#0F172A',
  },
  healthScoreMax: {
    fontSize: 24,
    color: '#94A3B8',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    marginTop: 16,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 16,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  actionButton: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#64748B',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  actionButtonIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  topicCard: {
    backgroundColor: '#FFF1F2',
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  topicName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#BE123C',
  },
  topicStatus: {
    fontSize: 13,
    color: '#E11D48',
    fontWeight: '500',
  },
  emptyText: {
    color: '#94A3B8',
    fontStyle: 'italic',
  }
});
