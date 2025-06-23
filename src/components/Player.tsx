import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Animated,
  Easing,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { audioService, PlaybackState } from '../services/audioService';
import { favoritesService } from '../services/favoritesService';
import { GUARANTEED_STATIONS } from '../constants/radioStations';

interface PlayerProps {
  onClose?: () => void;
  isMinimized?: boolean;
}

const { width, height } = Dimensions.get('window');

export const Player: React.FC<PlayerProps> = ({ onClose, isMinimized = false }) => {
  const { t } = useTranslation();
  const [playbackState, setPlaybackState] = useState<PlaybackState>(audioService.getState());
  const [isFavorite, setIsFavorite] = useState(false);
  const [volume, setVolume] = useState(1.0);
  
  // Animation refs
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnim1 = useRef(new Animated.Value(0)).current;
  const waveAnim2 = useRef(new Animated.Value(0)).current;
  const waveAnim3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const unsubscribe = audioService.subscribe(setPlaybackState);
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (playbackState.currentStation) {
      setIsFavorite(favoritesService.isFavorite(playbackState.currentStation.id));
    }
  }, [playbackState.currentStation]);

  // Start animations when playing
  useEffect(() => {
    if (playbackState.isPlaying) {
      startRotationAnimation();
      startPulseAnimation();
      startWaveAnimations();
    } else {
      stopAnimations();
    }
  }, [playbackState.isPlaying]);

  const startRotationAnimation = () => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 10000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const startWaveAnimations = () => {
    const createWaveAnimation = (animValue: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animValue, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
    };

    createWaveAnimation(waveAnim1, 0).start();
    createWaveAnimation(waveAnim2, 500).start();
    createWaveAnimation(waveAnim3, 1000).start();
  };

  const stopAnimations = () => {
    rotateAnim.stopAnimation();
    pulseAnim.stopAnimation();
    waveAnim1.stopAnimation();
    waveAnim2.stopAnimation();
    waveAnim3.stopAnimation();
    
    rotateAnim.setValue(0);
    pulseAnim.setValue(1);
    waveAnim1.setValue(0);
    waveAnim2.setValue(0);
    waveAnim3.setValue(0);
  };  const handlePlayPause = async () => {
    if (!playbackState.currentStation) return;
    
    try {
      if (playbackState.isPlaying) {
        await audioService.pause();
      } else {
        await audioService.playStation(playbackState.currentStation);
      }
    } catch (error) {
      console.error('Play/pause failed:', error);
      
      // Show detailed error message based on the error type
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isPermissionError = errorMessage.includes('izin') || errorMessage.includes('permission');
      const isFormatError = errorMessage.includes('format') || errorMessage.includes('desteklenmeyen');
      
      if (isPermissionError) {
        Alert.alert(
          'Ses İzni Gerekli', 
          'Radyo çalmak için tarayıcıda ses iznine izin verin. Sayfayı yenileyip tekrar deneyin.',
          [
            { text: 'Tamam' },
            { text: 'Sayfayı Yenile', onPress: () => window.location.reload() }
          ]
        );      } else if (isFormatError) {
        Alert.alert(
          'Desteklenmeyen Format', 
          'Bu radyo istasyonunun ses formatı web tarayıcıda desteklenmiyor. Garantili bir istasyona geçmek ister misiniz?',
          [
            { text: 'Tamam' },
            { text: 'Başka İstasyon', onPress: onClose },
            { 
              text: 'Garantili İstasyon', 
              onPress: async () => {
                const guaranteedStation = GUARANTEED_STATIONS[0];
                if (guaranteedStation) {
                  try {
                    await audioService.playStation(guaranteedStation);
                  } catch (err) {
                    console.error('Failed to play guaranteed station:', err);
                  }
                }
              }
            }
          ]
        );
      } else {
        Alert.alert(
          'Bağlantı Hatası',
          'Radyo istasyonuna bağlanılamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.',
          [
            { text: 'Tamam' },
            { text: 'Tekrar Dene', onPress: handlePlayPause }
          ]
        );
      }
    }
  };

  const handleEnableAudio = async () => {
    try {
      // Create a silent audio context to request permission
      if (typeof window !== 'undefined' && window.AudioContext) {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        await audioContext.resume();
        
        // Try playing current station again
        if (playbackState.currentStation) {
          await audioService.playStation(playbackState.currentStation);
        }
      }
    } catch (error) {
      console.error('Failed to enable audio:', error);
      Alert.alert('Ses Hatası', 'Tarayıcınız ses çalmayı desteklemiyor veya izin vermiyor.');
    }
  };

  const handleStop = async () => {
    try {
      await audioService.stop();
    } catch (error) {
      console.error('Stop failed:', error);
    }
  };

  const handleReplay = async () => {
    if (playbackState.currentStation) {
      try {
        await audioService.playStation(playbackState.currentStation);
      } catch (error) {
        console.error('Replay failed:', error);
        Alert.alert('Hata', 'Radyo başlatılamıyor. Lütfen tekrar deneyin.');
      }
    }
  };

  const handleFavoriteToggle = async () => {
    if (playbackState.currentStation) {
      const newFavoriteState = await favoritesService.toggleFavorite(playbackState.currentStation);
      setIsFavorite(newFavoriteState);
    }
  };

  const handleVolumeChange = async (newVolume: number) => {
    setVolume(newVolume);
    await audioService.setVolume(newVolume);
  };

  // No station state
  if (!playbackState.currentStation && !isMinimized) {
    return (
      <View style={styles.noStationContainer}>
        <Ionicons name="radio" size={64} color="#6B7280" />
        <Text style={styles.noStationTitle}>{t('player.nowPlaying')}</Text>
        <Text style={styles.noStationSubtitle}>Bir radyo istasyonu seçin</Text>
      </View>
    );
  }
  // Mini player
  if (isMinimized && playbackState.currentStation) {
    return (
      <TouchableOpacity 
        style={styles.miniPlayerContainer}
        onPress={onClose} // This will open full player
        activeOpacity={0.8}
      >
        <Image
          source={{ uri: playbackState.currentStation.imageUrl }}
          style={styles.miniPlayerImage}
        />
        <View style={styles.miniPlayerInfo}>
          <Text style={styles.miniPlayerName} numberOfLines={1}>
            {playbackState.currentStation.name}
          </Text>
          <Text style={styles.miniPlayerStatus} numberOfLines={1}>
            {playbackState.isLoading ? t('player.buffering') : 
             playbackState.isPlaying ? t('player.nowPlaying') : 'Duraklatıldı'}
          </Text>
        </View>
        
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            handlePlayPause();
          }}
          style={styles.miniPlayerPlayButton}
          disabled={playbackState.isLoading}
        >
          {playbackState.isLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Ionicons
              name={playbackState.isPlaying ? 'pause' : 'play'}
              size={20}
              color="white"
            />
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={(e) => {
            e.stopPropagation();
            handleStop();
          }} 
          style={styles.miniPlayerStopButton}
        >
          <Ionicons name="stop" size={20} color="#6B7280" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }
  // Full player
  return (
    <LinearGradient
      colors={['#0F0C29', '#24243e', '#313b5e']}
      style={styles.fullPlayerContainer}
    >
      {/* Animated Background Waves */}
      <View style={styles.wavesContainer}>
        <Animated.View 
          style={[
            styles.wave,
            styles.wave1,
            {
              opacity: waveAnim1,
              transform: [{
                scale: waveAnim1.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1.2]
                })
              }]
            }
          ]} 
        />
        <Animated.View 
          style={[
            styles.wave,
            styles.wave2,
            {
              opacity: waveAnim2,
              transform: [{
                scale: waveAnim2.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.7, 1.3]
                })
              }]
            }
          ]} 
        />
        <Animated.View 
          style={[
            styles.wave,
            styles.wave3,
            {
              opacity: waveAnim3,
              transform: [{
                scale: waveAnim3.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.6, 1.4]
                })
              }]
            }
          ]} 
        />
      </View>

      <View style={styles.fullPlayerContent}>        {/* Header with close button */}
        <View style={styles.fullPlayerHeader}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="chevron-down" size={32} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            Şimdi Çalıyor
          </Text>
          <TouchableOpacity onPress={handleFavoriteToggle} style={styles.favoriteButton}>
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={28}
              color={isFavorite ? '#FF6B6B' : 'white'}
            />
          </TouchableOpacity>
        </View>

        {/* Station Image and Info */}
        <View style={styles.stationInfoSection}>
          {/* Rotating vinyl effect */}
          <View style={styles.vinylContainer}>
            <Animated.View 
              style={[
                styles.vinylOuter,
                {
                  transform: [{
                    rotate: rotateAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg']
                    })
                  }]
                }
              ]}
            >
              <View style={styles.vinylGrooves}>
                <View style={styles.groove1} />
                <View style={styles.groove2} />
                <View style={styles.groove3} />
              </View>
              
              <Animated.View 
                style={[
                  styles.stationImageContainer,
                  {
                    transform: [{ scale: pulseAnim }]
                  }
                ]}
              >
                <Image
                  source={{ uri: playbackState.currentStation?.imageUrl }}
                  style={styles.stationImage}
                  resizeMode="cover"
                />
              </Animated.View>
              
              <View style={styles.vinylCenter} />
            </Animated.View>
          </View>

          <Text style={styles.stationName}>
            {playbackState.currentStation?.name}
          </Text>
          <Text style={styles.stationDescription}>
            {playbackState.currentStation?.description}
          </Text>
          <Text style={styles.stationMeta}>
            {playbackState.currentStation?.city} • {playbackState.currentStation?.genre}
          </Text>

          {/* Status with animated indicators */}
          <View style={styles.statusContainer}>
            {playbackState.isLoading && (
              <View style={styles.loadingStatus}>
                <ActivityIndicator size="small" color="#4ECDC4" style={styles.loadingIcon} />
                <Text style={styles.statusText}>Bağlanıyor...</Text>
              </View>
            )}            {playbackState.error && (
              <View style={styles.errorStatus}>
                <Ionicons name="warning" size={16} color="#FF6B6B" />
                <Text style={styles.errorText}>{playbackState.error}</Text>
                {playbackState.error.includes('izni') && (
                  <TouchableOpacity onPress={handleEnableAudio} style={styles.enableAudioButton}>
                    <Ionicons name="volume-high" size={16} color="white" />
                    <Text style={styles.enableAudioText}>Ses İzni Ver</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
            {!playbackState.isLoading && !playbackState.error && playbackState.isPlaying && (
              <View style={styles.playingStatus}>
                <Animated.View 
                  style={[
                    styles.liveDot,
                    {
                      transform: [{ scale: pulseAnim }]
                    }
                  ]} 
                />
                <Text style={styles.statusText}>Canlı Yayın</Text>
                
                {/* Audio bars animation */}
                <View style={styles.audioBars}>
                  <Animated.View style={[styles.audioBar, { height: waveAnim1.interpolate({ inputRange: [0, 1], outputRange: [4, 12] }) }]} />
                  <Animated.View style={[styles.audioBar, { height: waveAnim2.interpolate({ inputRange: [0, 1], outputRange: [6, 16] }) }]} />
                  <Animated.View style={[styles.audioBar, { height: waveAnim3.interpolate({ inputRange: [0, 1], outputRange: [8, 10] }) }]} />
                  <Animated.View style={[styles.audioBar, { height: waveAnim1.interpolate({ inputRange: [0, 1], outputRange: [5, 14] }) }]} />
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controlsSection}>
          {/* Volume Control */}
          <View style={styles.volumeContainer}>
            <Ionicons name="volume-low" size={20} color="white" />
            <View style={styles.volumeSliderContainer}>
              <View style={styles.volumeTrack}>
                <View 
                  style={[styles.volumeProgress, { width: `${volume * 100}%` }]}
                />
              </View>
            </View>
            <Ionicons name="volume-high" size={20} color="white" />
          </View>          {/* Playback Controls */}
          <View style={styles.playbackControls}>
            <TouchableOpacity onPress={handleReplay} style={styles.controlButton}>
              <Ionicons name="refresh" size={24} color="white" />
            </TouchableOpacity>

            <TouchableOpacity onPress={handleStop} style={styles.controlButton}>
              <Ionicons name="stop" size={24} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handlePlayPause}
              style={[
                styles.mainPlayButton,
                playbackState.isPlaying && styles.mainPlayButtonActive
              ]}
              disabled={playbackState.isLoading}
            >
              {playbackState.isLoading ? (
                <ActivityIndicator size="large" color="white" />
              ) : (
                <Ionicons
                  name={playbackState.isPlaying ? 'pause' : 'play'}
                  size={40}
                  color="white"
                />
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={handleFavoriteToggle} style={styles.controlButton}>
              <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={24}
                color={isFavorite ? '#FF6B6B' : 'white'}
              />
            </TouchableOpacity>

            <TouchableOpacity onPress={onClose} style={[styles.controlButton, styles.backButton]}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  noStationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 32,
  },
  noStationTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  noStationSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  miniPlayerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  miniPlayerImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  miniPlayerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  miniPlayerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  miniPlayerStatus: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  miniPlayerPlayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  miniPlayerStopButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullPlayerContainer: {
    flex: 1,
  },
  fullPlayerContent: {
    flex: 1,
    justifyContent: 'space-between',
    zIndex: 10,
  },
  // Animated Waves Background
  wavesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wave: {
    position: 'absolute',
    borderRadius: 200,
    borderWidth: 2,
  },
  wave1: {
    width: 300,
    height: 300,
    borderColor: 'rgba(76, 236, 196, 0.3)',
  },
  wave2: {
    width: 400,
    height: 400,
    borderColor: 'rgba(255, 107, 107, 0.2)',
  },
  wave3: {
    width: 500,
    height: 500,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  fullPlayerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 16,
  },  closeButton: {
    padding: 16,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  favoriteButton: {
    padding: 16,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  stationInfoSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  // Vinyl Record Styles
  vinylContainer: {
    marginBottom: 40,
  },
  vinylOuter: {
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
  },
  vinylGrooves: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groove1: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  groove2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  groove3: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  stationImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  stationImage: {
    width: '100%',
    height: '100%',
  },
  vinylCenter: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4ECDC4',
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 5,
  },
  stationName: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  stationDescription: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 4,
  },
  stationMeta: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    textAlign: 'center',
  },
  statusContainer: {
    marginTop: 24,
    minHeight: 40,
    justifyContent: 'center',
  },
  loadingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingIcon: {
    marginRight: 8,
  },
  statusText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '500',
  },  errorStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  errorText: {
    color: '#FF6B6B',
    textAlign: 'center',
    fontSize: 14,
    marginLeft: 8,
    marginBottom: 4,
  },
  enableAudioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginTop: 8,
    marginLeft: 8,
  },
  enableAudioText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  playingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ECDC4',
    marginRight: 8,
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 3,
  },
  audioBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginLeft: 12,
    gap: 2,
  },
  audioBar: {
    width: 3,
    backgroundColor: '#4ECDC4',
    borderRadius: 1.5,
    minHeight: 4,
  },
  controlsSection: {
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  volumeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 20,
  },
  volumeSliderContainer: {
    flex: 1,
    marginHorizontal: 16,
  },
  volumeTrack: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
  },
  volumeProgress: {
    height: 4,
    backgroundColor: '#4ECDC4',
    borderRadius: 2,
  },
  playbackControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },  controlButton: {
    padding: 16,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  mainPlayButton: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(76, 236, 196, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  mainPlayButtonActive: {
    backgroundColor: 'rgba(255, 107, 107, 0.8)',
    shadowColor: '#FF6B6B',
  },
});
