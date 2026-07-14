import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';

const screenWidth = Dimensions.get('window').width;

export default function AnalyticsScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Subject Analytics</Text>
        <Text style={styles.subtitle}>Data Structures & Algorithms</Text>
      </View>

      <View style={styles.summaryGrid}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>82%</Text>
          <Text style={styles.summaryLabel}>Readiness Score</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>14h</Text>
          <Text style={styles.summaryLabel}>Total Study Time</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Knowledge Coverage</Text>
      <View style={styles.chartCard}>
        <View style={styles.barChartContainer}>
          {/* Mock Bar Chart using views */}
          <View style={styles.barItem}>
            <View style={[styles.barFill, { height: '80%' }]} />
            <Text style={styles.barLabel}>Unit 1</Text>
          </View>
          <View style={styles.barItem}>
            <View style={[styles.barFill, { height: '65%' }]} />
            <Text style={styles.barLabel}>Unit 2</Text>
          </View>
          <View style={styles.barItem}>
            <View style={[styles.barFill, { height: '30%', backgroundColor: '#EF4444' }]} />
            <Text style={styles.barLabel}>Unit 3</Text>
          </View>
          <View style={styles.barItem}>
            <View style={[styles.barFill, { height: '90%' }]} />
            <Text style={styles.barLabel}>Unit 4</Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Strengths & Weaknesses</Text>
      <View style={styles.swCard}>
        <View style={styles.swRow}>
          <View style={styles.swIconContainerGreen}>
            <Text style={styles.swIcon}>📈</Text>
          </View>
          <View style={styles.swTextCol}>
            <Text style={styles.swTitle}>Strong Topics</Text>
            <Text style={styles.swDesc}>Sorting Algorithms, Hash Tables</Text>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.swRow}>
          <View style={styles.swIconContainerRed}>
            <Text style={styles.swIcon}>📉</Text>
          </View>
          <View style={styles.swTextCol}>
            <Text style={styles.swTitle}>Needs Work</Text>
            <Text style={styles.swDesc}>Graph Traversals (DFS/BFS)</Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Quiz Accuracy Trend</Text>
      <View style={styles.trendCard}>
        <View style={styles.trendLineContainer}>
          <Text style={styles.trendMockText}>[ 7-Day Line Chart Visualization ]</Text>
          <Text style={styles.trendSubText}>+15% improvement this week</Text>
        </View>
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
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '600',
    marginTop: 4,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  summaryCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#64748B',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 16,
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 20,
    marginBottom: 32,
    shadowColor: '#64748B',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  barChartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 150,
    paddingTop: 20,
  },
  barItem: {
    alignItems: 'center',
    width: 40,
    height: '100%',
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    backgroundColor: '#3B82F6',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  barLabel: {
    marginTop: 8,
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  swCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 32,
    shadowColor: '#64748B',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  swRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  swIconContainerGreen: {
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 12,
    marginRight: 16,
  },
  swIconContainerRed: {
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 12,
    marginRight: 16,
  },
  swIcon: {
    fontSize: 20,
  },
  swTextCol: {
    flex: 1,
  },
  swTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  swDesc: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 16,
  },
  trendCard: {
    backgroundColor: '#FFFFFF',
    padding: 32,
    borderRadius: 20,
    marginBottom: 32,
    shadowColor: '#64748B',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    alignItems: 'center',
    justifyContent: 'center',
    height: 160,
  },
  trendLineContainer: {
    alignItems: 'center',
  },
  trendMockText: {
    color: '#94A3B8',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  trendSubText: {
    color: '#10B981',
    fontWeight: '700',
  }
});
