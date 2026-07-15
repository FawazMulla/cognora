import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Alert } from 'react-native';
import * as Network from 'expo-network';
import { offlineQueue } from '../../../lib/offline-queue';
import { fetchApi } from '../../../lib/api';

const mockFlashcards = [
  { id: '1', front: 'What is the time complexity of binary search?', back: 'O(log n)' },
  { id: '2', front: 'Define Polymorphism in OOP.', back: 'The ability of different objects to respond to the same method call in their own way.' },
  { id: '3', front: 'What does ACID stand for in databases?', back: 'Atomicity, Consistency, Isolation, Durability' },
];

export default function FlashcardReviewScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Check network status on mount and subscribe to changes
    const checkNetwork = async () => {
      const netInfo = await Network.getNetworkStateAsync();
      setIsOffline(!netInfo.isConnected);
      
      if (netInfo.isConnected) {
        offlineQueue.sync(fetchApi);
      }
    };
    
    checkNetwork();
    // In a real app we'd add an event listener here for network changes
  }, []);

  const flipAnim = useState(new Animated.Value(0))[0];

  const handleFlip = () => {
    Animated.timing(flipAnim, {
      toValue: isFlipped ? 0 : 180,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setIsFlipped(!isFlipped));
  };

  const nextCard = (rating: 'again' | 'hard' | 'good' | 'easy') => {
    const currentCard = mockFlashcards[currentIndex];
    
    // Save the rating based on network status
    if (isOffline) {
      offlineQueue.enqueue(currentCard.id, rating);
    } else {
      // API call (wrapped in try-catch in case it fails, where we would fall back to queue)
      fetchApi(`/flashcards/${currentCard.id}/review`, { method: 'POST', body: JSON.stringify({ rating }) })
        .catch(() => offlineQueue.enqueue(currentCard.id, rating));
    }

    if (currentIndex < mockFlashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
      flipAnim.setValue(0);
    } else {
      Alert.alert("Deck finished!");
    }
  };

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  });

  const frontAnimatedStyle = { transform: [{ rotateY: frontInterpolate }] };
  const backAnimatedStyle = { transform: [{ rotateY: backInterpolate }] };

  const currentCard = mockFlashcards[currentIndex];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Active Recall</Text>
        <Text style={styles.subtitle}>{currentIndex + 1} of {mockFlashcards.length}</Text>
        {isOffline && (
          <View style={styles.offlineBadge}>
            <Text style={styles.offlineText}>Offline Mode - Progress saved locally</Text>
          </View>
        )}
      </View>

      <View style={styles.cardContainer}>
        <TouchableOpacity activeOpacity={1} onPress={handleFlip} style={styles.flipWrapper}>
          <Animated.View style={[styles.card, frontAnimatedStyle, isFlipped ? styles.hidden : {}]}>
            <Text style={styles.cardType}>Question</Text>
            <Text style={styles.cardContent}>{currentCard.front}</Text>
            <Text style={styles.tapToFlip}>Tap to flip</Text>
          </Animated.View>

          <Animated.View style={[styles.card, styles.cardBack, backAnimatedStyle, !isFlipped ? styles.hidden : {}]}>
            <Text style={styles.cardType}>Answer</Text>
            <Text style={styles.cardContent}>{currentCard.back}</Text>
          </Animated.View>
        </TouchableOpacity>
      </View>

      {isFlipped && (
        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.scoreBtn, styles.scoreBtnHard]} onPress={() => nextCard('hard')}>
            <Text style={styles.scoreBtnText}>Hard</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.scoreBtn, styles.scoreBtnGood]} onPress={() => nextCard('good')}>
            <Text style={styles.scoreBtnText}>Good</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.scoreBtn, styles.scoreBtnEasy]} onPress={() => nextCard('easy')}>
            <Text style={styles.scoreBtnText}>Easy</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 4,
  },
  offlineBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 12,
  },
  offlineText: {
    color: '#D97706',
    fontWeight: '600',
    fontSize: 12,
  },
  cardContainer: {
    height: 400,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flipWrapper: {
    width: '100%',
    height: '100%',
  },
  card: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#64748B',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
    backfaceVisibility: 'hidden',
    position: 'absolute',
  },
  cardBack: {
    backgroundColor: '#0F172A',
  },
  hidden: {
    opacity: 0,
  },
  cardType: {
    position: 'absolute',
    top: 24,
    left: 24,
    fontSize: 14,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardContent: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 34,
    color: '#1E293B',
  },
  cardBackContent: {
    color: '#FFFFFF',
  },
  tapToFlip: {
    position: 'absolute',
    bottom: 24,
    fontSize: 14,
    color: '#94A3B8',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 48,
    paddingHorizontal: 16,
  },
  scoreBtn: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    width: '30%',
    alignItems: 'center',
  },
  scoreBtnHard: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  scoreBtnGood: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  scoreBtnEasy: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#93C5FD',
  },
  scoreBtnText: {
    fontWeight: '700',
    fontSize: 16,
    color: '#0F172A',
  }
});
