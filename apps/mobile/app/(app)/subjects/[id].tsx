import { useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, FlatList, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { getAccessToken } from '../../../lib/secure-storage';

type Resource = {
  id: string;
  filename: string;
  status: string;
};

export default function SubjectDetailScreen() {
  const { id: subjectId } = useLocalSearchParams();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');

  useEffect(() => {
    fetchResources();
  }, [subjectId]);

  const fetchResources = async () => {
    try {
      const token = await getAccessToken();
      const res = await fetch(`http://localhost:3001/api/resources?subject_id=${subjectId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.resources) {
        setResources(data.resources);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToSSE = async (resourceId: string) => {
    const token = await getAccessToken();
    const source = new EventSource(`http://localhost:3001/api/resources/${resourceId}/status?token=${token}`);
    
    source.addEventListener('message', (event) => {
      const data = JSON.parse(event.data);
      setUploadStatus(data.status);
      
      setResources(prev => 
        prev.map(r => r.id === resourceId ? { ...r, status: data.status } : r)
      );

      if (data.status === 'ready' || data.status === 'failed') {
        source.close();
      }
    });

    source.addEventListener('error', () => {
      source.close();
    });
  };

  const handleFileUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/vnd.ms-powerpoint', 'image/jpeg', 'image/png'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets[0]) return;

      const file = result.assets[0];
      setUploading(true);
      setUploadProgress(0);
      setUploadStatus('Initializing');

      const token = await getAccessToken();
      
      // 1. Initialize upload (Get presigned URL)
      // Mocking SHA-256 for now since expo-crypto is not installed for files
      const dummyHash = 'hash_' + Date.now().toString();
      
      const initRes = await fetch('http://localhost:3001/api/resources/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          filename: file.name,
          fileType: file.mimeType || 'application/pdf',
          sizeBytes: file.size,
          sha256Hash: dummyHash.padEnd(64, '0'), // Fake 64 char hash
          subjectId: subjectId
        })
      });

      const initData = await initRes.json();
      if (!initRes.ok) throw new Error(initData.error || 'Upload initialization failed');

      if (initData.status === 'existing') {
        Alert.alert('Info', 'This resource already exists');
        setUploading(false);
        return;
      }

      // 2. Upload file directly to Supabase storage using the presigned URL
      setUploadStatus('Uploading');
      
      // Since fetch doesn't support progress events easily, we just await it. 
      // In production, use XMLHttpRequest or expo-file-system for progress.
      const uploadRes = await fetch(initData.presignedUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.mimeType || 'application/pdf',
        },
        body: file as any // usually requires FormData or blob in React Native
      });

      if (!uploadRes.ok) throw new Error('Failed to upload file to storage');

      setUploadProgress(100);
      setUploadStatus('Confirming');

      // 3. Confirm upload and enqueue job
      const confirmRes = await fetch(`http://localhost:3001/api/resources/${initData.resourceId}/confirm`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!confirmRes.ok) throw new Error('Failed to confirm upload');

      // Refresh list
      fetchResources();
      
      // 4. Subscribe to status SSE
      // (Requires react-native-sse or a polyfill, using a mock approach here)
      // subscribeToSSE(initData.resourceId);
      setUploadStatus('Processing');

    } catch (err: any) {
      Alert.alert('Upload Error', err.message);
    } finally {
      setUploading(false);
    }
  };

  const renderResource = ({ item }: { item: Resource }) => (
    <View style={styles.resourceItem}>
      <Text style={styles.resourceName}>{item.filename}</Text>
      <Text style={styles.resourceStatus}>{item.status}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Subject Resources</Text>
      
      <TouchableOpacity style={styles.uploadButton} onPress={handleFileUpload} disabled={uploading}>
        <Text style={styles.uploadButtonText}>
          {uploading ? 'Uploading...' : 'Upload Resource (PDF, PPT, Image)'}
        </Text>
      </TouchableOpacity>

      {uploading && (
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>{uploadStatus} - {uploadProgress}%</Text>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#6366f1" style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={resources}
          keyExtractor={(item) => item.id}
          renderItem={renderResource}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.emptyText}>No resources uploaded yet.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 24,
  },
  uploadButton: {
    backgroundColor: '#6366f1',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  uploadButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  progressContainer: {
    padding: 12,
    backgroundColor: '#e0e7ff',
    borderRadius: 8,
    marginBottom: 16,
  },
  progressText: {
    color: '#4338ca',
    textAlign: 'center',
  },
  list: {
    paddingBottom: 24,
  },
  resourceItem: {
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resourceName: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  resourceStatus: {
    fontSize: 14,
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  emptyText: {
    textAlign: 'center',
    color: '#9ca3af',
    marginTop: 32,
  },
});
