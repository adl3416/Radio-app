import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  PanResponder,
  Animated,
  Dimensions,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { simpleRadioAudioService, RadioAudioState } from '../services/simpleRadioAudioService';
import { RadioLogo } from './RadioLogo';

const { width } = Dimensions.get('window');
const audioService = simpleRadioAudioService;

import type { Animated as RNAnimated } from 'react-native';

interface ModernFooterPlayerProps {
  onPress?: () => void;
  onSwipeUp?: () => void;
  onSwipeUpProgress?: (progress: number) => void;
  onSwipeUpEnd?: (completed: boolean) => void;
  isPanning?: boolean;
  playerTransition?: RNAnimated.Value;
}

export const ModernFooterPlayer: React.FC<ModernFooterPlayerProps> = ({ 
  onPress, 
  onSwipeUp, 
  onSwipeUpProgress, 
  onSwipeUpEnd, 
  isPanning, 
  playerTransition 
}) => {
  const [playbackState, setPlaybackState] = useState<RadioAudioState>(audioService.getState());
  const [lastPlayedStation, setLastPlayedStation] = useState<any>(null);
  
  // Swipe mesafesi için maksimum değer
  const SWIPE_MAX = 200;

  useEffect(() => {
    const unsubscribe = audioService.subscribe(setPlaybackState);
    loadLastPlayedStation();
    return unsubscribe;
  }, []);

  // Son çalınan radyoyu yükle
  const loadLastPlayedStation = async () => {
    try {
      const saved = await AsyncStorage.getItem('lastPlayedStation');
      if (saved) {
        setLastPlayedStation(JSON.parse(saved));
      }
    } catch (error) {
      console.log('Son radyo yüklenemedi:', error);
    }
  };

  // Radyo değiştiğinde kaydet
  useEffect(() => {
    if (playbackState.currentStation) {
      AsyncStorage.setItem('lastPlayedStation', JSON.stringify(playbackState.currentStation));
      setLastPlayedStation(playbackState.currentStation);
    }
  }, [playbackState.currentStation]);

  // KONTROLLÜ SWIPE SİSTEMİ - Çok daha katı kurallar
  const panStartValue = useRef(0);
  const isGestureActive = useRef(false);
  const gestureTimeout = useRef<NodeJS.Timeout | null>(null);
  
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // ULTRA HASSAS VE ERKEN ALGILA - Parmak hareketi başlar başlamaz
        const verticalMove = Math.abs(gestureState.dy);
        const horizontalMove = Math.abs(gestureState.dx);
        
        // Çok erken algılama - 8px bile yeterli
        const isVerticalGesture = verticalMove > 8 && verticalMove > horizontalMove * 1.2;
        const isUpwardGesture = gestureState.dy < -5; // Çok erken tepki
        const notAlreadyActive = !isGestureActive.current;
        
        console.log('Gesture check:', { verticalMove, horizontalMove, isVerticalGesture, isUpwardGesture, notAlreadyActive });
        
        return isVerticalGesture && isUpwardGesture && notAlreadyActive;
      },
      onPanResponderGrant: () => {
        console.log('Gesture granted');
        isGestureActive.current = true;
        
        // Timeout ekle - 3 saniye sonra otomatik kapan
        gestureTimeout.current = setTimeout(() => {
          isGestureActive.current = false;
          console.log('Gesture timeout');
        }, 3000);
        
        if (playerTransition) {
          // @ts-ignore
          panStartValue.current = playerTransition._value || 0;
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        if (!playerTransition || !isGestureActive.current) return;
        
        // SÜPER RESPONSIVE PARMAK TAKİBİ - 1:1 oranında takip
        const swipeDistance = Math.max(0, -gestureState.dy); // Sadece pozitif
        const perfectProgress = swipeDistance / SWIPE_MAX; // %100 doğrudan takip
        let newProgress = panStartValue.current + perfectProgress;
        
        // Tam sınırsız - %100'e kadar
        newProgress = Math.min(1, Math.max(0, newProgress));
        
        console.log('Gesture move:', { swipeDistance, perfectProgress, newProgress });
        
        playerTransition.setValue(newProgress);
        onSwipeUpProgress && onSwipeUpProgress(newProgress);
      },
      onPanResponderRelease: (evt, gestureState) => {
        console.log('Gesture released');
        
        // Timeout temizle
        if (gestureTimeout.current) {
          clearTimeout(gestureTimeout.current);
          gestureTimeout.current = null;
        }
        
        isGestureActive.current = false;
        
        if (!playerTransition) return;
        
        // @ts-ignore
        const currentValue = playerTransition._value || 0;
        const velocity = Math.abs(gestureState.vy); // Hız kontrolü ekle
        
        // AKILLI THRESHOLD - Hız ve mesafeye göre
        let threshold = 0.25; // Çok düşük başlangıç threshold
        
        // Hızlı hareket varsa threshold'u düşür
        if (velocity > 500) {
          threshold = 0.15; // Hızlı hareket = daha kolay açılır
        } else if (velocity > 1000) {
          threshold = 0.1; // Çok hızlı hareket = çok kolay açılır
        }
        
        const shouldComplete = currentValue > threshold;
        
        console.log('Gesture release decision:', { currentValue, threshold, velocity, shouldComplete });
        
        onSwipeUpEnd && onSwipeUpEnd(shouldComplete);
        
        // SÜPER YUMUŞAK VE DOĞAL ANİMASYON
        if (shouldComplete) {
          // Açılma animasyonu - yumuşak ve hızlı
          Animated.spring(playerTransition, {
            toValue: 1,
            tension: 80, // Daha yüksek tension = daha hızlı
            friction: 7,  // Düşük friction = daha az sallantı
            useNativeDriver: false,
          }).start();
        } else {
          // Kapanma animasyonu - çok yumuşak
          Animated.spring(playerTransition, {
            toValue: 0,
            tension: 100, // Hızlı kapanma
            friction: 8,   // Yumuşak landing
            useNativeDriver: false,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        console.log('Gesture terminated');
        
        // Timeout temizle
        if (gestureTimeout.current) {
          clearTimeout(gestureTimeout.current);
          gestureTimeout.current = null;
        }
        
        isGestureActive.current = false;
        
        if (!playerTransition) return;
        onSwipeUpEnd && onSwipeUpEnd(false);
        
        // Hızlı ve yumuşak geri dönüş
        Animated.spring(playerTransition, {
          toValue: 0,
          tension: 120, // Çok hızlı
          friction: 8,
          useNativeDriver: false,
        }).start();
      },
    })
  ).current;

  const handlePlayPause = async () => {
    if (!playbackState.currentStation && !lastPlayedStation) {
      return;
    }

    try {
      if (playbackState.isPlaying) {
        await audioService.pause();
      } else {
        if (playbackState.currentStation) {
          await audioService.resume();
        } else if (lastPlayedStation) {
          await audioService.play(lastPlayedStation);
        }
      }
    } catch (error) {
      console.error('Play/Pause error:', error);
    }
  };

  const displayStation = playbackState.currentStation || lastPlayedStation;

  // ULTRA YUMUŞAK ANİMASYON İNTERPOLASYONLARI
  const translateY = playerTransition
    ? playerTransition.interpolate({ 
        inputRange: [0, 0.1, 0.3, 0.6, 1], 
        outputRange: [0, -20, -60, -120, -SWIPE_MAX],
        extrapolate: 'clamp'
      })
    : 0;
  
  const scale = playerTransition
    ? playerTransition.interpolate({ 
        inputRange: [0, 0.1, 0.3, 0.6, 1], 
        outputRange: [1, 1.005, 1.015, 1.03, 1.06],
        extrapolate: 'clamp'
      })
    : 1;
  
  const miniPlayerOpacity = playerTransition
    ? playerTransition.interpolate({ 
        inputRange: [0, 0.2, 0.5, 0.8, 1], 
        outputRange: [1, 0.95, 0.8, 0.4, 0],
        extrapolate: 'clamp'
      })
    : 1;

  return (
    <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 1000 }}>
      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ translateY }, { scale }],
            opacity: miniPlayerOpacity,
          },
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          activeOpacity={0.7}
          style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
          onPress={onPress}
          hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
        >
          <View style={styles.logoSection}>
            {displayStation ? (
              <RadioLogo station={displayStation} size={72} />
            ) : (
              <View style={styles.defaultLogoContainer}>
                <View style={{alignItems: 'center', justifyContent: 'center'}}>
                  <Ionicons name="radio-outline" size={24} color="#6B7280" />
                </View>
              </View>
            )}
          </View>

          <View style={styles.rightSection}>
            {/* Play tuşu radyo isminin hemen sağında, arada 8px boşluk ile */}
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, height: '100%' }}>
              <View style={{ flex: 1, justifyContent: 'flex-start', flexDirection: 'row', alignItems: 'center', position: 'relative' }}>
                {/* Logo ile radyo ismi arasında 4px boşluk */}
                <View style={{ width: 4 }} />
                {displayStation && (
                  <Text style={[styles.stationName, { marginLeft: 0, marginRight: 0 }]} numberOfLines={1} ellipsizeMode="tail">
                    {displayStation.name}
                  </Text>
                )}
                {/* Play tuşu sağ kenara sabit, arada boşluk yok */}
                <View style={[styles.controls, { position: 'absolute', right: 0, marginRight: 20 }]}> {/* Sağ kenara sabit, 20px boşluk */}
                  <TouchableOpacity
                    style={[
                      styles.playButton,
                      (!playbackState.currentStation && !lastPlayedStation) && styles.disabledButton
                    ]}
                    onPress={e => {
                      e.stopPropagation && e.stopPropagation();
                      handlePlayPause();
                    }}
                    disabled={!playbackState.currentStation && !lastPlayedStation}
                    hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
                    activeOpacity={0.6}
                  >
                    {playbackState.isLoading ? (
                      <ActivityIndicator size="small" color="#FF6B35" />
                    ) : (
                      <View style={{alignItems: 'center', justifyContent: 'center'}}>
                        <Ionicons
                          name={playbackState.isPlaying ? 'pause' : 'play'}
                          size={30}
                          color={(!playbackState.currentStation && !lastPlayedStation) ? '#9CA3AF' : '#FF6B35'}
                        />
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
      <View style={{ height: 8, backgroundColor: '#E5E7EB', width: '100%' }} />
    </View>
  );
};

const styles = StyleSheet.create({
  liveBadgeMini: {
    position: 'absolute',
    top: -18,
    left: '50%',
    transform: [{ translateX: -22 }],
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 2,
    zIndex: 10,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  liveBadgeTextMini: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
    letterSpacing: 1,
  },
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF', // orijinal beyaz mini player arka fonu
    paddingHorizontal: 0,
    paddingVertical: 0,
    minHeight: 92,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  logoSection: {
    width: 112,
    height: 92,
    backgroundColor: '#FFFFFF',
    paddingVertical: 0,
    paddingHorizontal: 0,
    alignItems: 'center',
    justifyContent: 'flex-start',
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    paddingTop: 4,
  },
  rightSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
    height: 92,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  defaultLogoContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoSection: {
    flex: 1,
    marginLeft: 2,
    marginRight: 4,
  },
  stationName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 2,
  },
  statusText: {
    fontSize: 12,
    color: '#6B7280',
  },
  controls: {
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB', // Gri arka fon
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  disabledButton: {
    backgroundColor: '#F3F4F6',
    borderColor: '#D1D5DB',
  },
  disabledButtonLarge: {
    backgroundColor: '#F3F4F6',
    opacity: 0.6,
  },
});
