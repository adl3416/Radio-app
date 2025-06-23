import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Animated,
  Modal,
  Share,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { audioService, PlaybackState } from '../services/audioService';
import { favoritesService } from '../services/favoritesService';
import { useAppContext } from '../contexts/AppContext';
import { RadioStation, RADIO_STATIONS } from '../constants/radioStations';

const { width, height } = Dimensions.get('window');

interface VinylPlayerProps {
  isVisible: boolean;
  onClose: () => void;
}

export const VinylPlayer: React.FC<VinylPlayerProps> = ({ isVisible, onClose }) => {
  const { isDark } = useAppContext();
  const [playbackState, setPlaybackState] = useState<PlaybackState>(audioService.getState());
  const [isFavorite, setIsFavorite] = useState(false);
  const [volume, setVolume] = useState(1.0);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  
  // Animation refs
  const vinylRotation = useRef(new Animated.Value(0)).current;
  const tonearmAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;

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
    if (isVisible) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }).start();
    } else {
      scaleAnim.setValue(0);
    }
  }, [isVisible]);

  useEffect(() => {
    if (playbackState.isPlaying) {
      startVinylRotation();
      moveTonearmIn();
    } else {
      stopVinylRotation();
      moveTonearmOut();
    }
  }, [playbackState.isPlaying]);

  const startVinylRotation = () => {
    vinylRotation.setValue(0);
    Animated.loop(
      Animated.timing(vinylRotation, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();
  };

  const stopVinylRotation = () => {
    vinylRotation.stopAnimation();
  };

  const moveTonearmIn = () => {
    Animated.timing(tonearmAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  };

  const moveTonearmOut = () => {
    Animated.timing(tonearmAnim, {
      toValue: 0,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  };

  const handlePlayPause = async () => {
    try {
      console.log('🎵 VinylPlayer - Play/Pause clicked');
      if (playbackState.isPlaying) {
        await audioService.pause();
      } else {
        await audioService.resume();
      }
    } catch (error) {
      console.error('❌ VinylPlayer - Play/Pause error:', error);
    }
  };

  const handleStop = async () => {
    try {
      console.log('🛑 VinylPlayer - Stop clicked');
      await audioService.stop();
    } catch (error) {
      console.error('❌ VinylPlayer - Stop error:', error);
    }
  };

  const handleFavorite = async () => {
    if (playbackState.currentStation) {
      try {
        console.log('❤️ VinylPlayer - Favorite clicked');
        if (isFavorite) {
          await favoritesService.removeFromFavorites(playbackState.currentStation.id);
        } else {
          await favoritesService.addToFavorites(playbackState.currentStation);
        }
        setIsFavorite(!isFavorite);
      } catch (error) {
        console.error('❌ VinylPlayer - Favorite error:', error);
      }
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    console.log('🔊 VinylPlayer - Volume changed:', newVolume);
    setVolume(newVolume);
    audioService.setVolume(newVolume);
  };

  const handlePrevious = async () => {
    try {
      console.log('⏮️ VinylPlayer - Previous clicked');
      if (playbackState.currentStation) {
        const currentIndex = RADIO_STATIONS.findIndex(s => s.id === playbackState.currentStation?.id);
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : RADIO_STATIONS.length - 1;
        const prevStation = RADIO_STATIONS[prevIndex];
        console.log('⏮️ Switching to previous station:', prevStation.name);
        await audioService.playStation(prevStation);
      }
    } catch (error) {
      console.error('❌ VinylPlayer - Previous station error:', error);
    }
  };

  const handleNext = async () => {
    try {
      console.log('⏭️ VinylPlayer - Next clicked');
      if (playbackState.currentStation) {
        const currentIndex = RADIO_STATIONS.findIndex(s => s.id === playbackState.currentStation?.id);
        const nextIndex = currentIndex < RADIO_STATIONS.length - 1 ? currentIndex + 1 : 0;
        const nextStation = RADIO_STATIONS[nextIndex];
        console.log('⏭️ Switching to next station:', nextStation.name);
        await audioService.playStation(nextStation);
      }
    } catch (error) {
      console.error('❌ VinylPlayer - Next station error:', error);
    }
  };

  const handleShare = async () => {
    try {
      console.log('📤 VinylPlayer - Share clicked');
      if (playbackState.currentStation) {
        await Share.share({
          message: `🎵 ${playbackState.currentStation.name} radyosunu RADYO ÇINARI uygulamasında dinliyorum!`,
          title: 'RADYO ÇINARI - Radyo Paylaş',
        });
      }
    } catch (error) {
      console.error('❌ VinylPlayer - Share error:', error);
    }
  };

  const getStationLogo = (stationName: string) => {
    if (stationName.toLowerCase().includes('cassette')) return '📼';
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
    if (stationName.toLowerCase().includes('polis')) return '🚔';
    if (stationName.toLowerCase().includes('kar')) return '❄️';
    return '📻';
  };

  if (!playbackState.currentStation) {
    return null;
  }

  return (
    <Modal visible={isVisible} animationType="fade" transparent>
      <BlurView intensity={50} style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={isDark ? ['#1A0B2E', '#16213E', '#0F3460'] : ['#8B4513', '#654321', '#5D4E37']}
            style={styles.playerBox}
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="chevron-down" size={24} color="#FFD700" />
              </TouchableOpacity>
              <View style={styles.titleContainer}>
                <Text style={styles.playerTitle}>🎶 RADYO ÇINARI</Text>
                <Text style={styles.playerSubtitle}>Stereo Player</Text>
              </View>
              <TouchableOpacity onPress={handleFavorite} style={styles.favoriteButton}>
                <Ionicons 
                  name={isFavorite ? "heart" : "heart-outline"} 
                  size={24} 
                  color={isFavorite ? "#FF6B6B" : "#FFD700"} 
                />
              </TouchableOpacity>
            </View>

            {/* Vinyl Disc */}
            <View style={styles.vinylContainer}>
              {/* Tonearm */}
              <Animated.View
                style={[
                  styles.tonearm,
                  {
                    transform: [
                      { translateX: -20 },
                      { translateY: -40 },
                      {
                        rotate: tonearmAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['-25deg', '5deg'],
                        }),
                      },
                      { translateX: 20 },
                      { translateY: 40 },
                    ],
                  },
                ]}
              >
                <View style={styles.tonearmBase} />
                <View style={styles.tonearmArm} />
                <View style={styles.needle} />
              </Animated.View>

              {/* Vinyl Record */}
              <Animated.View
                style={[
                  styles.vinyl,
                  {
                    transform: [
                      {
                        rotate: vinylRotation.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '360deg'],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <View style={styles.vinylOuterRim} />
                <View style={styles.vinylRing1} />
                <View style={styles.vinylRing2} />
                <View style={styles.vinylRing3} />
                <View style={styles.vinylRing4} />
                
                {/* Center Label */}
                <View style={styles.centerLabel}>
                  <View style={styles.labelRing} />
                  <Text style={styles.centerLabelText}>
                    {getStationLogo(playbackState.currentStation.name)}
                  </Text>
                  <Text style={styles.centerLabelStation} numberOfLines={2}>
                    {playbackState.currentStation.name}
                  </Text>
                  <Text style={styles.centerLabelSubtext}>STEREO • 33⅓ RPM</Text>
                </View>
                
                <View style={styles.centerHole} />
              </Animated.View>
            </View>

            {/* Status */}
            <View style={styles.statusContainer}>
              <View style={styles.statusRow}>
                <View style={[
                  styles.statusDot, 
                  { backgroundColor: playbackState.isPlaying ? '#10B981' : '#EF4444' }
                ]} />
                <Text style={styles.statusText}>
                  {playbackState.error ? 'Hata' : 
                   playbackState.isLoading ? 'Yükleniyor...' :
                   playbackState.isPlaying ? 'Çalıyor' : 'Duraklatıldı'}
                </Text>
              </View>
              {playbackState.error && (
                <Text style={styles.errorText} numberOfLines={2}>
                  {playbackState.error}
                </Text>
              )}
            </View>

            {/* Controls */}
            <View style={styles.controls}>
              <TouchableOpacity style={styles.controlButton} onPress={handlePrevious}>
                <Ionicons name="play-skip-back" size={24} color="#FFD700" />
              </TouchableOpacity>

              <TouchableOpacity style={[styles.controlButton, styles.playButton]} onPress={handlePlayPause}>
                {playbackState.isLoading ? (
                  <ActivityIndicator size="large" color="#8B4513" />
                ) : (
                  <Ionicons
                    name={playbackState.isPlaying ? "pause" : "play"}
                    size={36}
                    color="#8B4513"
                  />
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.controlButton} onPress={handleNext}>
                <Ionicons name="play-skip-forward" size={24} color="#FFD700" />
              </TouchableOpacity>
            </View>

            {/* Volume Control */}
            <View style={styles.volumeContainer}>
              <TouchableOpacity 
                style={styles.volumeButton}
                onPress={() => setShowVolumeSlider(!showVolumeSlider)}
              >
                <Ionicons 
                  name={volume === 0 ? "volume-mute" : volume < 0.5 ? "volume-low" : "volume-high"} 
                  size={20} 
                  color="#FFD700" 
                />
              </TouchableOpacity>
              
              {showVolumeSlider && (
                <View style={styles.volumeSlider}>
                  <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={1}
                    value={volume}
                    onValueChange={handleVolumeChange}
                    minimumTrackTintColor="#3B82F6"
                    maximumTrackTintColor="rgba(255,255,255,0.3)"
                  />
                </View>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.actionButton} onPress={handleStop}>
                <Ionicons name="stop" size={20} color="#FFD700" />
                <Text style={styles.actionButtonText}>Durdur</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                <Ionicons name="share" size={20} color="#FFD700" />
                <Text style={styles.actionButtonText}>Paylaş</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  container: {
    width: width * 0.9,
    maxWidth: 400,
  },
  playerBox: {
    borderRadius: 25,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.4,
    shadowRadius: 25,
    elevation: 25,
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 25,
    marginTop: 15,
  },
  titleContainer: {
    alignItems: 'center',
  },
  playerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
    letterSpacing: 2,
  },
  playerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 215, 0, 0.7)',
    marginTop: 2,
    letterSpacing: 1,
  },
  closeButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 20,
  },
  favoriteButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 20,
  },
  vinylContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 25,
    position: 'relative',
  },
  vinyl: {
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#0A0A0A',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  vinylOuterRim: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 3,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  vinylRing1: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  vinylRing2: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  vinylRing3: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
  },
  vinylRing4: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  centerLabel: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  labelRing: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: '#B8860B',
  },
  centerLabelText: {
    fontSize: 18,
    marginBottom: 2,
  },
  centerLabelStation: {
    fontSize: 8,
    color: '#8B4513',
    textAlign: 'center',
    fontWeight: 'bold',
    lineHeight: 9,
  },
  centerLabelSubtext: {
    fontSize: 6,
    color: '#8B4513',
    marginTop: 2,
    opacity: 0.8,
  },
  centerHole: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  tonearm: {
    position: 'absolute',
    top: 20,
    right: 40,
    zIndex: 10,
  },
  tonearmBase: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#C0C0C0',
    borderWidth: 1,
    borderColor: '#A0A0A0',
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  tonearmArm: {
    width: 3,
    height: 80,
    backgroundColor: '#C0C0C0',
    marginLeft: 6.5,
    marginTop: -8,
    borderRadius: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 1,
    elevation: 2,
  },
  needle: {
    width: 2,
    height: 12,
    backgroundColor: '#FFD700',
    marginLeft: 7,
    marginTop: -3,
    borderRadius: 1,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 1,
    elevation: 2,
  },
  statusContainer: {
    alignItems: 'center',
    marginVertical: 15,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    marginTop: 5,
    textAlign: 'center',
    fontWeight: '500',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 25,
    marginVertical: 25,
  },
  controlButton: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFD700',
    borderWidth: 3,
    borderColor: '#B8860B',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  volumeContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  volumeButton: {
    padding: 12,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  volumeSlider: {
    width: '80%',
    marginTop: 15,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 25,
    padding: 10,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  actionButton: {
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
    minWidth: 80,
  },
  actionButtonText: {
    color: '#FFD700',
    fontSize: 12,
    marginTop: 5,
    fontWeight: '500',
  },
});
