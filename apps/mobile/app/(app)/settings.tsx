import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';

export default function SettingsScreen() {
  const [examReminders, setExamReminders] = useState(true);
  const [dailyDigest, setDailyDigest] = useState(true);
  const [inactivityAlerts, setInactivityAlerts] = useState(false);
  const [university, setUniversity] = useState('Stanford University');
  const [branch, setBranch] = useState('Computer Science');

  const handleSave = () => {
    Alert.alert('Settings saved successfully!');
  };

  const handleLogout = () => {
    Alert.alert('Logging out...');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <Text style={styles.sectionTitle}>Academic Profile</Text>
      <View style={styles.card}>
        <Text style={styles.label}>University</Text>
        <TextInput 
          style={styles.textInput}
          value={university}
          onChangeText={setUniversity}
        />

        <Text style={styles.label}>Branch / Major</Text>
        <TextInput 
          style={styles.textInput}
          value={branch}
          onChangeText={setBranch}
        />
        
        <TouchableOpacity style={styles.primaryBtn} onPress={handleSave}>
          <Text style={styles.primaryBtnText}>Update Profile</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Notifications</Text>
      <View style={styles.card}>
        <View style={styles.toggleRow}>
          <View style={styles.toggleTextCol}>
            <Text style={styles.toggleTitle}>Exam Reminders</Text>
            <Text style={styles.toggleSub}>7d, 3d, and 1d before exam</Text>
          </View>
          <Switch 
            value={examReminders} 
            onValueChange={setExamReminders} 
            trackColor={{ false: "#E2E8F0", true: "#3B82F6" }}
          />
        </View>
        <View style={styles.divider} />
        
        <View style={styles.toggleRow}>
          <View style={styles.toggleTextCol}>
            <Text style={styles.toggleTitle}>Daily Study Plan</Text>
            <Text style={styles.toggleSub}>Receive your AI daily plan at 8 AM</Text>
          </View>
          <Switch 
            value={dailyDigest} 
            onValueChange={setDailyDigest} 
            trackColor={{ false: "#E2E8F0", true: "#3B82F6" }}
          />
        </View>
        <View style={styles.divider} />

        <View style={styles.toggleRow}>
          <View style={styles.toggleTextCol}>
            <Text style={styles.toggleTitle}>Inactivity Alerts</Text>
            <Text style={styles.toggleSub}>Remind me if I haven't studied in 48h</Text>
          </View>
          <Switch 
            value={inactivityAlerts} 
            onValueChange={setInactivityAlerts} 
            trackColor={{ false: "#E2E8F0", true: "#3B82F6" }}
          />
        </View>
      </View>

      <Text style={styles.sectionTitle}>Account</Text>
      <View style={styles.card}>
        <TouchableOpacity style={styles.dangerBtn} onPress={handleLogout}>
          <Text style={styles.dangerBtnText}>Log Out</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.footerText}>AI Academic Workspace v1.0.0</Text>
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 20,
    marginBottom: 32,
    shadowColor: '#64748B',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    marginBottom: 20,
  },
  primaryBtn: {
    backgroundColor: '#0F172A',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleTextCol: {
    flex: 1,
    paddingRight: 16,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  toggleSub: {
    fontSize: 13,
    color: '#64748B',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 16,
  },
  dangerBtn: {
    backgroundColor: '#FEF2F2',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  dangerBtnText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 15,
  },
  footerText: {
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 13,
    marginBottom: 40,
  }
});
