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
  Image,
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
  // Örnek: Kral Pop ve Süper FM logoları ile yuvarlak radyo avatarları
  const radioLogos = [
    { name: 'Kral Pop', image: require('../../assets/kralpop.png') },
    { name: 'Süper FM', image: require('../../assets/superfm.png') },
    // Diğer radyoları buraya ekleyebilirsiniz
  ];
  const [playbackState, setPlaybackState] = useState<RadioAudioState>(simpleRadioAudioService.getState());
  const [translateY] = useState(new Animated.Value(0));
  const insets = useSafeAreaInsets();
  // Header yüksekliği ile uyumlu footer yüksekliği
  const HEADER_HEIGHT = 70; // App.tsx header'da paddingTop+paddingBottom+fontSize toplamı yaklaşık 70-80px
  // Mini player yüksekliği 65px'e çıkarıldı
  const MINI_PLAYER_HEIGHT = 65;

  useEffect(() => {
    let isMounted = true;
    const safeSetState = (state: RadioAudioState) => {
      if (isMounted) setPlaybackState(state);
    };
    const unsubscribe = simpleRadioAudioService.subscribe(safeSetState);
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // PanResponder for swipe up gesture - improved
  // Tatlı, titremesiz swipe up için panResponder
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      // Sadece yukarı swipe için, çok hassas olmasın
      return gestureState.dy < -10;
    },
    onPanResponderMove: (evt, gestureState) => {
      // Mini player'ı yerinden oynatma, sadece threshold'u geçince büyüt
    },
    onPanResponderRelease: (evt, gestureState) => {
      const { dy, vy } = gestureState;
      // Yeterince yukarı çekildiyse direkt büyüt
      if (dy < -30 || vy < -0.2) {
        onExpand();
      }
      // Hiçbir animasyon yok, titreme yok, yerinde sabit
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
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
        },
      ]}
      pointerEvents="box-none"
      onTouchEnd={onExpand}
      {...panResponder.panHandlers}
    >
      <LinearGradient
        colors={['#FF6B35', '#F59E0B']}
        style={[styles.miniPlayerGradient, { flex: 1, justifyContent: 'center', paddingVertical: 6 }]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 4, paddingLeft: 8 }}>
          {radioLogos.map((radio, idx) => (
            <View key={radio.name} style={{ alignItems: 'center', marginRight: 16 }}>
              <View style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                overflow: 'hidden',
                backgroundColor: '#fff',
                borderWidth: 2,
                borderColor: '#eee',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                <Image source={radio.image} style={{ width: 44, height: 44, borderRadius: 22, resizeMode: 'contain' }} />
              </View>
              <Text style={{ fontSize: 12, color: '#fff', marginTop: 4 }}>{radio.name}</Text>
            </View>
          ))}
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
    let isMounted = true;
    const safeSetState = (state: RadioAudioState) => {
      if (isMounted) setPlaybackState(state);
    };
    const unsubscribe = simpleRadioAudioService.subscribe(safeSetState);
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // PanResponder için gesture handling - improved
  // Titremesiz, soft swipe down için panResponder
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      // Sadece aşağı swipe için, çok hassas olmasın
      return gestureState.dy > 10;
    },
    onPanResponderMove: (evt, gestureState) => {
      // Full player'ı yerinden oynatma, sadece threshold'u geçince küçült
    },
    onPanResponderRelease: (evt, gestureState) => {
      const { dy, vy } = gestureState;
      // Yeterince aşağı çekildiyse direkt küçült
      if (dy > 40 || vy > 0.25) {
        onCollapse();
      }
      // Hiçbir animasyon yok, titreme yok, yerinde sabit
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
