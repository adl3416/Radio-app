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
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { simpleRadioAudioService, RadioAudioState } from '../services/simpleRadioAudioService';
import { RadioLogo } from './RadioLogo';

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
  // Örnek: Kral Pop logosu ve varsayılan icon ile yuvarlak radyo avatarları
  const radioLogos = [
    { name: 'Kral Pop', image: require('../../assets/kral.png') },
    { name: 'Süper FM', image: require('../../assets/super.png') },
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

// --- Animasyonlu CD Görseli ---
const AnimatedCD = ({ station, isPlaying, size = 200 }: { station: any, isPlaying: boolean, size?: number }) => {
  const spinAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    let looping: Animated.CompositeAnimation | null = null;
    if (isPlaying) {
      looping = Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
          easing: Easing.linear,
        })
      );
      looping.start();
    } else {
      spinAnim.stopAnimation();
      spinAnim.setValue(0);
    }
    return () => {
      looping?.stop();
      spinAnim.setValue(0);
    };
  }, [isPlaying]);

  const rotate = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: 'rgba(255,255,255,0.12)',
      borderWidth: 6,
      borderColor: 'rgba(255,255,255,0.25)',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.18,
      shadowRadius: 12,
      elevation: 8,
      transform: [{ rotate }],
    }}>
      {/* CD'nin ortasında logo */}
      <RadioLogo station={station} size={size * 0.55} />
      {/* CD ortası efekti */}
      <View style={{
        position: 'absolute',
        width: size * 0.18,
        height: size * 0.18,
        borderRadius: 18,
        backgroundColor: '#fff',
        opacity: 0.7,
        borderWidth: 2,
        borderColor: '#eee',
        top: 82,
        left: 82,
        zIndex: 2,
      }} />
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
      animationType="fade"
      presentationStyle="overFullScreen"
      transparent={false}
    >
      <View style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', backgroundColor: '#FF6B35', zIndex: 9999}}>
        <Animated.View 
          style={[
            styles.fullPlayerContainer,
            {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100%',
              height: '100%',
              minHeight: '100%',
              maxHeight: '100%',
              zIndex: 10000,
              transform: [{ translateY }],
              opacity,
            }
          ]}
          {...panResponder.panHandlers}
        >
            <LinearGradient
              colors={['#FF6B35', '#F59E0B']}
              style={[styles.fullPlayerGradient, {width: '100%', height: '100%', minHeight: '100%', maxHeight: '100%'}]}
            >
              {/* Header with pull indicator */}
              {/* Radyo İsmi En Üste */}
              {/* Radyo İsmi Tam En Üste */}
              <View style={{width: '100%', paddingTop: 0, paddingBottom: 0, marginBottom: 0}}>
                <Text style={[styles.fullStationName, {marginTop: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0, textAlign: 'center'}]}>
                  {playbackState.currentStation.name}
                </Text>
              </View>
              <View style={[styles.fullPlayerHeader, {paddingTop: 0, paddingBottom: 0}]}> 
                <View style={styles.pullIndicator} />
                <TouchableOpacity onPress={onCollapse} style={styles.collapseButton}>
                  <Ionicons name="chevron-down" size={24} color="white" />
                </TouchableOpacity>
              </View>

              {/* Logo ve CD'yi aşağıya indir, ayrı div */}
              <View style={{width: '100%', alignItems: 'center', marginTop: 32, marginBottom: 0}}>
                <View style={[styles.stationLogo, {width: 160, height: 160, borderRadius: 80}]}> {/* Logo daha küçük */}
                  {/* Modern dönen CD animasyonu ve logo */}
                  {playbackState.currentStation ? (
                    <AnimatedCD station={playbackState.currentStation} isPlaying={playbackState.isPlaying} size={220} />
                  ) : (
                    <View>
                      <Ionicons name="radio" size={120} color="white" />
                    </View>
                  )}
                </View>
              </View>

              {/* LOGO ve PLAY ARASI BOŞLUK */}
              <View style={{height: 70}} />

              {/* Player Controls */}
              <View style={styles.fullPlayerControls}>
                <View style={styles.mainControls}>
                  <TouchableOpacity style={styles.controlButton} onPress={handlePrevious}>
                    <Ionicons name="play-skip-back" size={30} color="white" />
                  </TouchableOpacity>

                  <View style={{alignItems: 'center', justifyContent: 'center', width: 100, height: 100}}>
                    <TouchableOpacity 
                      style={styles.bigPlayPauseButton}
                      onPress={handlePlayPause}
                      disabled={playbackState.isLoading}
                    >
                      {playbackState.isLoading ? (
                        <ActivityIndicator size="large" color="#FF6B35" />
                      ) : (
                        <Ionicons 
                          name={playbackState.isPlaying ? "pause" : "play"} 
                          size={54} 
                          color="white" 
                        />
                      )}
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity style={styles.controlButton} onPress={handleNext}>
                    <Ionicons name="play-skip-forward" size={30} color="white" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Footer Controls - moved to very bottom, light gray background */}
              <View style={styles.footerControlsBar}>
                <TouchableOpacity style={styles.actionButtonFooter}>
                  <Ionicons name="volume-high" size={24} color="#374151" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.actionButtonFooter}
                  onPress={() => onToggleFavorite && playbackState.currentStation && onToggleFavorite(playbackState.currentStation)}
                >
                  <Ionicons 
                    name={isFavorite ? "heart" : "heart-outline"} 
                    size={24} 
                    color={isFavorite ? "#FF6B35" : "#374151"} 
                  />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButtonFooter} onPress={handleStop}>
                  <Ionicons name="stop" size={24} color="#374151" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButtonFooter}>
                  <Ionicons name="share-outline" size={24} color="#374151" />
                </TouchableOpacity>
              </View>
            </LinearGradient>
        </Animated.View>
      </View>
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
    width: '100%',
    height: height,
    minHeight: height,
    backgroundColor: 'transparent',
  },
  fullPlayerGradient: {
    flex: 1,
    width: '100%',
    height: height,
    minHeight: height,
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
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  stationLogo: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
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
    marginBottom: 12, // Daha az boşluk
    minHeight: 32,
  },
  statusText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 15,
    marginBottom: 8,
    textAlign: 'center',
    width: '100%',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.8)',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 14,
    marginBottom: 8, // "CANLI" göstergesini de butondan uzaklaştır
    minHeight: 28,
    minWidth: 60,
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
    paddingBottom: 8,
    paddingHorizontal: 8,
  },
  mainControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  playPauseButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  footerControlsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#F3F4F6', // Açık gri arka fon
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    minHeight: 66,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 8,
  },
  actionButtonFooter: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E5E7EB', // Hafif gri buton
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  bigPlayPauseButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FF6B35', // Parlak turuncu (kullanıcı isteği)
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
    marginHorizontal: 2,
  },
});
