import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

const mockPYQs = [
  { id: '1', question: 'Explain the Time Complexity of Quick Sort in best, average, and worst cases.', frequency: 5, year: '2023' },
  { id: '2', question: 'Compare and contrast BFS and DFS algorithms with suitable examples.', frequency: 4, year: '2022' },
  { id: '3', question: 'What is a Binary Search Tree? Write an algorithm to insert a node.', frequency: 3, year: '2021' },
];

export default function PYQEngineScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Past Year Questions</Text>
        <Text style={styles.subtitle}>Clustered by frequency and topic</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>45</Text>
          <Text style={styles.statLabel}>Total PYQs</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>12</Text>
          <Text style={styles.statLabel}>High Frequency</Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Trending Questions</Text>
        <TouchableOpacity>
          <Text style={styles.filterText}>Filter</Text>
        </TouchableOpacity>
      </View>

      {mockPYQs.map(pyq => (
        <View key={pyq.id} style={styles.pyqCard}>
          <View style={styles.pyqMeta}>
            <View style={styles.frequencyBadge}>
              <Text style={styles.frequencyText}>Repeated {pyq.frequency}x</Text>
            </View>
            <Text style={styles.yearText}>Last seen: {pyq.year}</Text>
          </View>
          
          <Text style={styles.questionText}>{pyq.question}</Text>
          
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionButtonSecondary}>
              <Text style={styles.actionButtonSecondaryText}>View Answer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButtonPrimary}>
              <Text style={styles.actionButtonPrimaryText}>Practice Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
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
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#64748B',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#3B82F6',
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  filterText: {
    color: '#3B82F6',
    fontWeight: '600',
    fontSize: 14,
  },
  pyqCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#64748B',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  pyqMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  frequencyBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  frequencyText: {
    color: '#D97706',
    fontWeight: '700',
    fontSize: 12,
  },
  yearText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    lineHeight: 24,
    marginBottom: 20,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  actionButtonSecondary: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  actionButtonSecondaryText: {
    color: '#475569',
    fontWeight: '600',
    fontSize: 14,
  },
  actionButtonPrimary: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#0F172A',
  },
  actionButtonPrimaryText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  }
});
