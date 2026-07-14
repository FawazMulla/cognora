import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';

export default function ResourceUploadScreen() {
  const [files, setFiles] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        multiple: true,
      });

      if (!result.canceled && result.assets) {
        const newFiles = result.assets.map(a => ({
          name: a.name,
          size: a.size,
          uri: a.uri,
          status: 'pending' // pending, processing, complete
        }));
        setFiles([...files, ...newFiles]);
      }
    } catch (err) {
      console.error('Error picking document', err);
    }
  };

  const handleUpload = () => {
    if (files.length === 0) return;
    setIsUploading(true);
    setUploadProgress(0);

    // Simulate file upload and background intelligence worker processing
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          setFiles(files.map(f => ({ ...f, status: 'complete' })));
          return 100;
        }
        return prev + 20;
      });
    }, 500);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Upload Resources</Text>
      <Text style={styles.subtitle}>Add syllabus PDFs, class notes, or past papers.</Text>
      
      <TouchableOpacity style={styles.uploadArea} onPress={handlePickDocument}>
        <View style={styles.uploadIconContainer}>
          <Text style={styles.uploadIcon}>📄</Text>
        </View>
        <Text style={styles.uploadTextTitle}>Tap to browse files</Text>
        <Text style={styles.uploadTextSubtitle}>Supports PDF, PNG, JPEG</Text>
      </TouchableOpacity>

      {files.length > 0 && (
        <View style={styles.fileListContainer}>
          <Text style={styles.sectionTitle}>Selected Files</Text>
          {files.map((file, index) => (
            <View key={index} style={styles.fileCard}>
              <View style={styles.fileInfo}>
                <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
                <Text style={styles.fileSize}>{(file.size / 1024 / 1024).toFixed(2)} MB</Text>
              </View>
              <View style={styles.statusBadge}>
                {file.status === 'complete' ? (
                  <Text style={styles.statusTextComplete}>Processed</Text>
                ) : (
                  <Text style={styles.statusTextPending}>Pending</Text>
                )}
              </View>
            </View>
          ))}

          {isUploading && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${uploadProgress}%` }]} />
              </View>
              <Text style={styles.progressText}>Processing with AI... {uploadProgress}%</Text>
            </View>
          )}

          {!isUploading && files.some(f => f.status === 'pending') && (
            <TouchableOpacity style={styles.submitButton} onPress={handleUpload}>
              <Text style={styles.submitButtonText}>Upload & Extract Data</Text>
            </TouchableOpacity>
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
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 24,
  },
  uploadArea: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    marginBottom: 24,
  },
  uploadIconContainer: {
    backgroundColor: '#EFF6FF',
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  uploadIcon: {
    fontSize: 28,
  },
  uploadTextTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  uploadTextSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
  },
  fileListContainer: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 16,
  },
  fileCard: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#64748B',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  fileInfo: {
    flex: 1,
    paddingRight: 16,
  },
  fileName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 4,
  },
  fileSize: {
    fontSize: 13,
    color: '#94A3B8',
  },
  statusBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusTextPending: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  statusTextComplete: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  progressContainer: {
    marginTop: 24,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
  },
  progressText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: '#0F172A',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  }
});
