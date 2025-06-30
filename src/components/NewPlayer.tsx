import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
  ActivityIndicator,
  PanResponder,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { simpleRadioAudioService, RadioAudioState } from '../services/simpleRadioAudioService';

const { width, height } = Dimensions.get('window');

interface MiniPlayerProps {
  isVisible: boolean;
  onExpand: () => void;
  onClose: () => void;
  onNext?: () => Promise<void>;
  onPrevious?: () => Promise<void>;
}

interface FullPlayerProps {
  isVisible: boolean;
  onCollapse: () => void;
  onNext?: () => Promise<void>;
  onPrevious?: () => Promise<void>;
  onToggleFavorite?: (station: any) => void;
  isFavorite?: boolean;
}

// Mini Footer Player Component
export const MiniPlayer: React.FC<MiniPlayerProps> = ({ isVisible, onExpand, onClose, onNext, onPrevious }) => {
  const [playbackState, setPlaybackState] = useState<RadioAudioState>(simpleRadioAudioService.getState());
  const [translateY] = useState(new Animated.Value(0));
  const insets = useSafeAreaInsets();
  // Header yüksekliği ile uyumlu footer yüksekliği
  const HEADER_HEIGHT = 70; // App.tsx header'da paddingTop+paddingBottom+fontSize toplamı yaklaşık 70-80px
  // Mini player yüksekliği 65px'e çıkarıldı
  const MINI_PLAYER_HEIGHT = 65;

  useEffect(() => {
    const unsubscribe = simpleRadioAudioService.subscribe(setPlaybackState);
    return unsubscribe;
  }, []);

  // PanResponder for swipe up gesture - improved
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      const isSwipeUp = gestureState.dy < -3;
      const isSignificantMove = Math.abs(gestureState.dy) > 3;
      return isSwipeUp && isSignificantMove;
    },
    onPanResponderMove: (evt, gestureState) => {
      const { dy } = gestureState;
      // Sadece yukarı doğru hareket için smooth animasyon
      if (dy <= 0) {
        const clampedValue = Math.max(dy, -100); // Max 100px yukarı
        translateY.setValue(clampedValue);
      }
    },
    onPanResponderRelease: (evt, gestureState) => {
      const { dy, vy } = gestureState;
      
      const shouldExpand = dy < -20 || vy < -0.2; // Düşük threshold
      
      if (shouldExpand) {
        console.log('📱 Mini player swiped up - expanding to full');
        // Smooth expand animation
        Animated.timing(translateY, {
          toValue: -50,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          translateY.setValue(0);
          onExpand();
        });
      } else {
        // Bounce back animation
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 150,
          friction: 8,
        }).start();
      }
    },
  });

  const handlePlayPause = async () => {
    try {
      if (playbackState.isPlaying) {
        await simpleRadioAudioService.pause();
      } else {
        await simpleRadioAudioService.resume();
      }
    } catch (error) {
      // Sessiz hata yönetimi
    }
  };

  const handleNext = async () => {
    if (onNext) {
      await onNext();
    }
  };

  if (!isVisible || !playbackState.currentStation) {
    // Mini player görünmez veya aktif radyo yoksa hiç render etme
    return null;
  }

  console.log('📱 Mini player rendering:', {
    stationName: playbackState.currentStation?.name,
    isPlaying: playbackState.isPlaying,
    isLoading: playbackState.isLoading
  });
  // Mini player'ı ekranın en altına, tam genişlikte ve footer gibi sabit konumda göster
  return (
    <Animated.View
      style={[
        styles.miniPlayerContainer,
        {
          transform: [{ translateY }],
          height: MINI_PLAYER_HEIGHT + insets.bottom,
          // SafeArea için paddingBottom yerine doğrudan height'a ekle, paddingBottom'u kaldır
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
        },
      ]}
      pointerEvents="box-none"
      {...panResponder.panHandlers}
    >
      <LinearGradient
        colors={['#FF6B35', '#F59E0B']}
        style={[styles.miniPlayerGradient, { flex: 1, justifyContent: 'center', paddingVertical: 6 }]}
      >
        <View style={[styles.miniPlayerContent, { minHeight: MINI_PLAYER_HEIGHT - 16, alignItems: 'center' }]}> 
          {/* Sol taraf - İstasyon bilgisi */}
          <View style={styles.miniStationInfo}>
            <Text style={[styles.miniStationName, { fontSize: 14, marginBottom: 2 }]} numberOfLines={1}>
              {playbackState.currentStation.name}
            </Text>
            <Text style={[styles.miniStationStatus, { fontSize: 11 }]} numberOfLines={1}>
              {playbackState.isLoading
                ? 'Yükleniyor...'
                : playbackState.error
                ? 'Hata oluştu'
                : 'Şu an çalıyor'}
            </Text>
          </View>
          {/* Orta - Kontroller */}
          <View style={styles.miniPlayerControls}>
            {playbackState.isLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <View style={styles.miniControlsRow}>
                <TouchableOpacity onPress={handlePlayPause} style={[styles.miniPlayButton, { width: 32, height: 32, borderRadius: 16 }] }>
                  <Ionicons
                    name={playbackState.isPlaying ? 'pause' : 'play'}
                    size={16}
                    color="white"
                  />
                </TouchableOpacity>
                {onNext && (
                  <TouchableOpacity onPress={handleNext} style={[styles.miniNextButton, { width: 20, height: 20, borderRadius: 10 }] }>
                    <Ionicons name="play-skip-forward" size={14} color="white" />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
          {/* Sağ taraf - Kapat butonu */}
          <TouchableOpacity onPress={onClose} style={[styles.miniCloseButton, { width: 24, height: 24, borderRadius: 12 }] }>
            <Ionicons name="close" size={16} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Animated.View>
  );

};

// Full Screen Player Component
export const FullPlayer: React.FC<FullPlayerProps> = ({ isVisible, onCollapse, onNext, onPrevious, onToggleFavorite, isFavorite }) => {
  const [playbackState, setPlaybackState] = useState<RadioAudioState>(simpleRadioAudioService.getState());
  const [translateY] = useState(new Animated.Value(0));
  const [opacity] = useState(new Animated.Value(1));

  useEffect(() => {
    const unsubscribe = simpleRadioAudioService.subscribe(setPlaybackState);
    return unsubscribe;
  }, []);

  // PanResponder için gesture handling - improved
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      const isDraggingDown = gestureState.dy > 3;
      const isSignificantMove = Math.abs(gestureState.dy) > 3;
      return isDraggingDown && isSignificantMove;
    },
    onPanResponderGrant: () => {
      // Gesture başladığında
    },
    onPanResponderMove: (evt, gestureState) => {
      const { dy } = gestureState;
      
      // Sadece aşağı doğru hareket için smooth animasyon
      if (dy >= 0) {
        const dampedY = dy * 0.8; // Hafif damping effect
        translateY.setValue(dampedY);
        // Opacity'yi mesafeye göre smooth ayarla
        const newOpacity = Math.max(0.4, 1 - (dampedY / (height * 0.5)));
        opacity.setValue(newOpacity);
      }
    },
    onPanResponderRelease: (evt, gestureState) => {
      const { dy, vy } = gestureState;
      
      const shouldClose = dy > height * 0.1 || vy > 0.25; // Düşük threshold
      
      if (shouldClose) {
        // Hızlı kapatma animasyonu
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: height,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          translateY.setValue(0);
          opacity.setValue(1);
          onCollapse();
        });
      } else {
        // Smooth geri dönme animasyonu
        Animated.parallel([
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 120,
            friction: 8,
          }),
          Animated.spring(opacity, {
            toValue: 1,
            useNativeDriver: true,
            tension: 120,
            friction: 8,
          }),
        ]).start();
      }
    },
    onPanResponderTerminationRequest: () => false,
    onShouldBlockNativeResponder: () => false,
  });

  const handlePlayPause = async () => {
    try {
      if (playbackState.isPlaying) {
        await simpleRadioAudioService.pause();
      } else {
        await simpleRadioAudioService.resume();
      }
    } catch (error) {
      // Sessiz hata yönetimi
    }
  };

  const handleStop = async () => {
    try {
      await simpleRadioAudioService.stop();
      onCollapse();
    } catch (error) {
      // Sessiz hata yönetimi
    }
  };

  const handleNext = async () => {
    if (onNext) {
      await onNext();
    }
  };

  const handlePrevious = async () => {
    if (onPrevious) {
      await onPrevious();
    }
  };

  if (!isVisible || !playbackState.currentStation) {
    return null;
  }

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="fullScreen"
      transparent={false}
    >
      <Animated.View 
        style={[
          styles.fullPlayerContainer,
          {
            transform: [{ translateY }],
            opacity,
          }
        ]}
        {...panResponder.panHandlers}
      >
          <LinearGradient
            colors={['#FF6B35', '#F59E0B']}
            style={styles.fullPlayerGradient}
          >
            {/* Header with pull indicator */}
            <View style={styles.fullPlayerHeader}>
              <View style={styles.pullIndicator} />
              <TouchableOpacity onPress={onCollapse} style={styles.collapseButton}>
                <Ionicons name="chevron-down" size={24} color="white" />
              </TouchableOpacity>
            </View>

            {/* Station Info */}
            <View style={styles.fullStationInfo}>
              <View style={styles.stationLogo}>
                <Ionicons name="radio" size={80} color="white" />
              </View>
              
              <Text style={styles.fullStationName}>
                {playbackState.currentStation.name}
              </Text>
              
              <Text style={styles.fullStationDescription}>
                {playbackState.currentStation.description || 'Radyo İstasyonu'}
              </Text>

              <View style={styles.statusContainer}>
                <Text style={styles.statusText}>
                  {playbackState.isLoading 
                    ? 'Yükleniyor...' 
                    : playbackState.error 
                      ? 'Bağlantı Hatası'
                      : 'Canlı Yayın'
                  }
                </Text>
                {playbackState.isPlaying && !playbackState.isLoading && (
                  <View style={styles.liveIndicator}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveText}>CANLI</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Player Controls */}
            <View style={styles.fullPlayerControls}>
              <View style={styles.mainControls}>
                <TouchableOpacity style={styles.controlButton} onPress={handlePrevious}>
                  <Ionicons name="play-skip-back" size={30} color="white" />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.playPauseButton} 
                  onPress={handlePlayPause}
                  disabled={playbackState.isLoading}
                >
                  {playbackState.isLoading ? (
                    <ActivityIndicator size="large" color="white" />
                  ) : (
                    <Ionicons 
                      name={playbackState.isPlaying ? "pause" : "play"} 
                      size={40} 
                      color="white" 
                    />
                  )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.controlButton} onPress={handleNext}>
                  <Ionicons name="play-skip-forward" size={30} color="white" />
                </TouchableOpacity>
              </View>

              {/* Additional Controls */}
              <View style={styles.additionalControls}>
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="volume-high" size={24} color="white" />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => onToggleFavorite && playbackState.currentStation && onToggleFavorite(playbackState.currentStation)}
                >
                  <Ionicons 
                    name={isFavorite ? "heart" : "heart-outline"} 
                    size={24} 
                    color={isFavorite ? "#FF6B35" : "white"} 
                  />
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.actionButton} onPress={handleStop}>
                  <Ionicons name="stop" size={24} color="white" />
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="share-outline" size={24} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  // Mini Player Styles
  miniPlayerContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    backgroundColor: 'transparent',
    zIndex: 9999,
    // height dinamik olarak yukarıda ayarlanıyor
    // Alt tarafa sıfır sabit footer gibi
    marginBottom: 0,
    borderBottomWidth: 0,
    paddingBottom: 0, // Alt boşluk olmasın
  },
  miniPlayerGradient: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  miniPlayerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniStationInfo: {
    flex: 1,
    marginRight: 12,
  },
  miniStationName: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  miniStationStatus: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  miniPlayerControls: {
    marginRight: 12,
  },
  miniControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  miniPlayButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniNextButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Full Player Styles
  fullPlayerContainer: {
    flex: 1,
  },
  fullPlayerGradient: {
    flex: 1,
    paddingTop: 50,
  },
  fullPlayerHeader: {
    alignItems: 'center',
    paddingVertical: 20, // Daha büyük dokunma alanı
    position: 'relative',
  },
  pullIndicator: {
    width: 60,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 3,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  collapseButton: {
    position: 'absolute',
    right: 20,
    top: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullStationInfo: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  stationLogo: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  fullStationName: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  fullStationDescription: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  statusContainer: {
    alignItems: 'center',
  },
  statusText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    marginBottom: 8,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
    marginRight: 6,
  },
  liveText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  fullPlayerControls: {
    paddingBottom: 50,
    paddingHorizontal: 40,
  },
  mainControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
  },
  playPauseButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
  },
  additionalControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  actionButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
