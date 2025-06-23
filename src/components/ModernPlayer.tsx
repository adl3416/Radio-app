import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Animated,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { audioService, PlaybackState } from '../services/audioService';
import { favoritesService } from '../services/favoritesService';
import { useAppContext } from '../contexts/AppContext';

interface PlayerProps {
  onClose?: () => void;
  isMinimized?: boolean;
}

const { width, height } = Dimensions.get('window');

export const ModernPlayer: React.FC<PlayerProps> = ({ onClose, isMinimized = false }) => {
  const { isDark } = useAppContext();
  const [playbackState, setPlaybackState] = useState<PlaybackState>(audioService.getState());
  const [isFavorite, setIsFavorite] = useState(false);
  const [volume, setVolume] = useState(1.0);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  
  // Animation refs
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const volumeSliderAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const unsubscribe = audioService.subscribe(setPlaybackState);
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (playbackState.currentStation) {
      setIsFavorite(favoritesService.isFavorite(playbackState.currentStation.id));
    }
  }, [playbackState.currentStation]);

  useEffect(() => {
    if (playbackState.isPlaying) {
      startRotation();
      startPulse();
    } else {
      stopRotation();
      stopPulse();
    }
  }, [playbackState.isPlaying]);

  const startRotation = () => {
    rotateAnim.setValue(0);
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 10000,
        useNativeDriver: true,
      })
    ).start();
  };

  const stopRotation = () => {
    rotateAnim.stopAnimation();
  };

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopPulse = () => {
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
  };

  const handlePlayPause = async () => {
    try {
      if (playbackState.isPlaying) {
        await audioService.pause();
      } else {
        await audioService.resume();
      }
    } catch (error) {
      console.error('Play/Pause error:', error);
    }
  };

  const handleStop = async () => {
    try {
      await audioService.stop();
    } catch (error) {
      console.error('Stop error:', error);
    }
  };

  const handleFavorite = () => {
    if (playbackState.currentStation) {
      if (isFavorite) {
        favoritesService.removeFavorite(playbackState.currentStation.id);
      } else {
        favoritesService.addFavorite(playbackState.currentStation);
      }
      setIsFavorite(!isFavorite);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    audioService.setVolume(newVolume);
  };

  const toggleVolumeSlider = () => {
    setShowVolumeSlider(!showVolumeSlider);
    Animated.timing(volumeSliderAnim, {
      toValue: showVolumeSlider ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const getStationLogo = (stationName: string) => {
    if (stationName.toLowerCase().includes('x radio')) return '❌';
    if (stationName.toLowerCase().includes('power')) return '⚡';
    if (stationName.toLowerCase().includes('metro')) return '🚇';
    if (stationName.toLowerCase().includes('munzur')) return '🏔️';
    if (stationName.toLowerCase().includes('amed')) return '🌿';
    if (stationName.toLowerCase().includes('45lik')) return '💿';
    if (stationName.toLowerCase().includes('haber')) return '📰';
    if (stationName.toLowerCase().includes('para')) return '💰';
    if (stationName.toLowerCase().includes('spor')) return '⚽';
    if (stationName.toLowerCase().includes('adana')) return '🌆';
    if (stationName.toLowerCase().includes('afşin')) return '🎵';
    return '📻';
  };

  if (isMinimized) {
    return (
      <TouchableOpacity
        style={[styles.miniPlayer, isDark && styles.miniPlayerDark]}
        onPress={onClose}
      >
        <LinearGradient
          colors={isDark ? ['#374151', '#1F2937'] : ['#3B82F6', '#1E40AF']}
          style={styles.miniPlayerGradient}
        >
          <View style={styles.miniPlayerContent}>
            <Animated.View
              style={[
                styles.miniPlayerLogo,
                {
                  transform: [
                    {
                      rotate: rotateAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg'],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Text style={styles.miniPlayerLogoText}>
                {playbackState.currentStation ? getStationLogo(playbackState.currentStation.name) : '📻'}
              </Text>
            </Animated.View>
            
            <View style={styles.miniPlayerInfo}>
              <Text style={styles.miniPlayerName} numberOfLines={1}>
                {playbackState.currentStation?.name || 'No Station'}
              </Text>
              <Text style={styles.miniPlayerStatus}>
                {playbackState.isLoading ? 'Yükleniyor...' : playbackState.isPlaying ? 'Çalıyor' : 'Duraklatıldı'}
              </Text>
            </View>

            <TouchableOpacity onPress={handlePlayPause} style={styles.miniPlayerButton}>
              {playbackState.isLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons
                  name={playbackState.isPlaying ? 'pause' : 'play'}
                  size={24}
                  color="white"
                />
              )}
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  if (!playbackState.currentStation) {
    return (
      <View style={[styles.container, isDark && styles.containerDark]}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.backButton}>
              <Ionicons name="chevron-down" size={28} color={isDark ? 'white' : '#111827'} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, isDark && styles.textDark]}>Çalar</Text>
            <View style={styles.placeholder} />
          </View>
          
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Hiçbir radyo seçilmedi</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={isDark ? ['#111827', '#1F2937', '#374151'] : ['#3B82F6', '#1E40AF', '#1E3A8A']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="chevron-down" size={28} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Şimdi Çalıyor</Text>
          <TouchableOpacity onPress={handleFavorite} style={styles.favoriteButton}>
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={28}
              color={isFavorite ? '#EF4444' : 'white'}
            />
          </TouchableOpacity>
        </View>

        {/* Station Logo */}
        <View style={styles.logoContainer}>
          <Animated.View
            style={[
              styles.logoBackground,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <Animated.View
              style={[
                styles.logo,
                {
                  transform: [
                    {
                      rotate: rotateAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg'],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Text style={styles.logoText}>
                {getStationLogo(playbackState.currentStation.name)}
              </Text>
            </Animated.View>
          </Animated.View>
        </View>

        {/* Station Info */}
        <View style={styles.stationInfo}>
          <Text style={styles.stationName} numberOfLines={2}>
            {playbackState.currentStation.name}
          </Text>
          <Text style={styles.stationDetails}>
            {playbackState.currentStation.genre} • {playbackState.currentStation.city}
          </Text>
          <Text style={styles.playingStatus}>
            {playbackState.isLoading ? 'Bağlanıyor...' : playbackState.isPlaying ? '🔴 CANLI YAYIN' : 'Duraklatıldı'}
          </Text>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity onPress={handleStop} style={styles.controlButton}>
            <Ionicons name="stop" size={32} color="white" />
          </TouchableOpacity>

          <TouchableOpacity onPress={handlePlayPause} style={styles.playButton}>
            {playbackState.isLoading ? (
              <ActivityIndicator size="large" color="white" />
            ) : (
              <Ionicons
                name={playbackState.isPlaying ? 'pause' : 'play'}
                size={48}
                color="white"
              />
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={toggleVolumeSlider} style={styles.controlButton}>
            <Ionicons name="volume-high" size={32} color="white" />
          </TouchableOpacity>
        </View>

        {/* Volume Slider */}
        {showVolumeSlider && (
          <Animated.View
            style={[
              styles.volumeContainer,
              {
                opacity: volumeSliderAnim,
                transform: [
                  {
                    translateY: volumeSliderAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [50, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.volumeSlider}>
              <Ionicons name="volume-low" size={20} color="white" />
              <View style={styles.sliderContainer}>
                <View style={styles.sliderTrack}>
                  <View 
                    style={[
                      styles.sliderFill,
                      { width: `${volume * 100}%` }
                    ]} 
                  />
                </View>
              </View>
              <Ionicons name="volume-high" size={20} color="white" />
            </View>
          </Animated.View>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#3B82F6',
  },
  containerDark: {
    backgroundColor: '#111827',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  favoriteButton: {
    padding: 8,
  },
  placeholder: {
    width: 44,
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  logoBackground: {
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 80,
  },
  stationInfo: {
    paddingHorizontal: 40,
    alignItems: 'center',
    marginBottom: 40,
  },
  stationName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  stationDetails: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 8,
  },
  playingStatus: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    marginBottom: 40,
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
  },
  volumeContainer: {
    paddingHorizontal: 40,
    marginBottom: 20,
  },
  volumeSlider: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sliderContainer: {
    flex: 1,
    marginHorizontal: 16,
  },
  sliderTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
  },
  sliderFill: {
    height: 4,
    backgroundColor: 'white',
    borderRadius: 2,
  },
  miniPlayer: {
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  miniPlayerDark: {
    shadowColor: '#000',
  },
  miniPlayerGradient: {
    padding: 16,
  },
  miniPlayerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniPlayerLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniPlayerLogoText: {
    fontSize: 20,
  },
  miniPlayerInfo: {
    flex: 1,
    marginLeft: 16,
  },
  miniPlayerName: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 2,
  },
  miniPlayerStatus: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  miniPlayerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#6B7280',
  },
  textDark: {
    color: 'white',
  },
});

// Export both as Player and ModernPlayer for compatibility
export const Player = ModernPlayer;
export default ModernPlayer;
