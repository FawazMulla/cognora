import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image, Alert } from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';

export default function CameraNotesScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrConfidence, setOcrConfidence] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handlePickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled) {
      setCapturedImage(result.assets[0].uri);
      processImage();
    }
  };

  const processImage = () => {
    setIsProcessing(true);
    setOcrConfidence(null);
    
    // Simulate OCR processing and pipeline trigger
    setTimeout(() => {
      setIsProcessing(false);
      setOcrConfidence(85); // Simulated OCR confidence
    }, 2000);
  };

  if (hasPermission === null) {
    return <View style={styles.center}><ActivityIndicator /></View>;
  }
  if (hasPermission === false) {
    return <View style={styles.center}><Text>No access to camera</Text></View>;
  }

  return (
    <View style={styles.container}>
      {capturedImage ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: capturedImage }} style={styles.previewImage} />
          
          <View style={styles.overlayPanel}>
            {isProcessing ? (
              <View style={styles.processingBlock}>
                <ActivityIndicator size="large" color="#4F46E5" />
                <Text style={styles.processingText}>Extracting text & concepts...</Text>
              </View>
            ) : (
              <View style={styles.resultBlock}>
                <Text style={styles.resultTitle}>Upload Complete</Text>
                {ocrConfidence && (
                  <View style={styles.confidenceRow}>
                    <Text style={styles.confidenceLabel}>Scan Quality:</Text>
                    <Text style={[styles.confidenceValue, ocrConfidence > 70 ? styles.goodColor : styles.warnColor]}>
                      {ocrConfidence}%
                    </Text>
                  </View>
                )}
                {ocrConfidence && ocrConfidence < 50 && (
                  <Text style={styles.warnText}>Low confidence. Lighting may be poor. Consider retaking.</Text>
                )}
                
                <View style={styles.actionRow}>
                  <TouchableOpacity style={styles.secondaryBtn} onPress={() => setCapturedImage(null)}>
                    <Text style={styles.secondaryBtnText}>Retake</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.primaryBtn} onPress={() => Alert.alert('Saved to resources!')}>
                    <Text style={styles.primaryBtnText}>Save Note</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      ) : (
        <View style={styles.cameraContainer}>
          <CameraView style={styles.camera} facing="back">
            <View style={styles.cameraOverlay}>
              <View style={styles.headerBar}>
                <Text style={styles.headerText}>Scan Class Notes</Text>
                <Text style={styles.headerSub}>Ensure good lighting for best OCR</Text>
              </View>
              
              <View style={styles.captureControls}>
                <TouchableOpacity style={styles.galleryBtn} onPress={handlePickImage}>
                  <Text style={styles.galleryIcon}>🖼️</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.captureBtn} onPress={() => {
                  // MOCK: in reality we call cameraRef.current.takePictureAsync()
                  setCapturedImage('https://via.placeholder.com/400x800.png?text=Mock+Camera+Capture');
                  processImage();
                }}>
                  <View style={styles.captureBtnInner} />
                </TouchableOpacity>
                
                <View style={styles.galleryBtnSpacer} />
              </View>
            </View>
          </CameraView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 24,
  },
  headerBar: {
    marginTop: 40,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 12,
    borderRadius: 16,
  },
  headerText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  headerSub: {
    color: '#D1D5DB',
    fontSize: 13,
    marginTop: 4,
  },
  captureControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
  },
  galleryBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryIcon: {
    fontSize: 24,
  },
  galleryBtnSpacer: {
    width: 56,
  },
  captureBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureBtnInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF',
  },
  previewContainer: {
    flex: 1,
  },
  previewImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlayPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 32,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 20,
  },
  processingBlock: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  processingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
  },
  resultBlock: {
    
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 16,
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  confidenceLabel: {
    fontSize: 16,
    color: '#64748B',
    marginRight: 8,
  },
  confidenceValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  goodColor: {
    color: '#10B981',
  },
  warnColor: {
    color: '#F59E0B',
  },
  warnText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 8,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 32,
    gap: 12,
  },
  secondaryBtn: {
    flex: 1,
    padding: 18,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: '#475569',
    fontWeight: '700',
    fontSize: 16,
  },
  primaryBtn: {
    flex: 1,
    padding: 18,
    borderRadius: 16,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 16,
  }
});
