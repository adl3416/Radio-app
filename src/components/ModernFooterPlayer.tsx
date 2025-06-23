import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { audioService, PlaybackState } from '../services/audioService';
import { useAppContext } from '../contexts/AppContext';
import { RadioStation } from '../constants/radioStations';

const { width } = Dimensions.get('window');

interface ModernFooterPlayerProps {
  onPress?: () => void;
}

export const ModernFooterPlayer: React.FC<ModernFooterPlayerProps> = ({ onPress }) => {
  const { isDark } = useAppContext();
  const [playbackState, setPlaybackState] = useState<PlaybackState>(audioService.getState());
  
  // Animation refs
  const slideAnim = useRef(new Animated.Value(100)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const unsubscribe = audioService.subscribe(setPlaybackState);
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (playbackState.currentStation) {
      // Slide up animation
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    } else {
      // Slide down animation
      Animated.timing(slideAnim, {
        toValue: 100,
        duration: 300,
        useNativeDriver: true,
      }).start();
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
        duration: 8000,
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
          toValue: 1.1,
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

  const getStatusText = () => {
    if (playbackState.error) return playbackState.error;
    if (playbackState.isLoading) return 'Yükleniyor...';
    if (playbackState.isPlaying) return 'Çalıyor';
    return 'Durduruldu';
  };

  const getStatusColor = () => {
    if (playbackState.error) return '#EF4444';
    if (playbackState.isLoading) return '#F59E0B';
    if (playbackState.isPlaying) return '#10B981';
    return '#6B7280';
  };

  if (!playbackState.currentStation) {
    return null;
  }

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={isDark ? ['#1F2937', '#111827'] : ['#FFFFFF', '#F9FAFB']}
        style={styles.gradient}
      >
        <TouchableOpacity
          style={styles.content}
          onPress={onPress}
          activeOpacity={0.8}
        >
          {/* Station Logo */}
          <Animated.View
            style={[
              styles.logoContainer,
              {
                transform: [
                  { scale: pulseAnim },
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
            <View style={[styles.logo, isDark && styles.logoDark]}>
              <Text style={styles.logoText}>
                {getStationLogo(playbackState.currentStation.name)}
              </Text>
            </View>
          </Animated.View>

          {/* Station Info */}
          <View style={styles.info}>
            <Text style={[styles.stationName, isDark && styles.stationNameDark]} numberOfLines={1}>
              {playbackState.currentStation.name}
            </Text>
            <View style={styles.statusContainer}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
              <Text style={[styles.statusText, isDark && styles.statusTextDark]} numberOfLines={1}>
                {getStatusText()}
              </Text>
            </View>
          </View>

          {/* Controls */}
          <View style={styles.controls}>
            <TouchableOpacity
              style={[styles.controlButton, styles.playButton]}
              onPress={handlePlayPause}
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
              style={[styles.controlButton, styles.stopButton]}
              onPress={handleStop}
            >
              <Ionicons
                name="stop"
                size={16}
                color={isDark ? '#F9FAFB' : '#374151'}
              />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {/* Progress Bar */}
        {playbackState.isPlaying && (
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, isDark && styles.progressBarDark]}>
              <Animated.View style={styles.progressFill} />
            </View>
          </View>
        )}
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  gradient: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoContainer: {
    width: 50,
    height: 50,
  },
  logo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  logoDark: {
    backgroundColor: '#4F46E5',
    shadowColor: '#4F46E5',
  },
  logoText: {
    fontSize: 22,
    color: 'white',
  },
  info: {
    flex: 1,
    marginRight: 8,
  },
  stationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  stationNameDark: {
    color: '#F9FAFB',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  statusTextDark: {
    color: '#9CA3AF',
  },
  controls: {
    flexDirection: 'row',
    gap: 8,
  },
  controlButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    backgroundColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  stopButton: {
    backgroundColor: 'rgba(107, 114, 128, 0.2)',
  },
  progressContainer: {
    marginTop: 12,
    height: 3,
  },
  progressBar: {
    height: 3,
    backgroundColor: '#E5E7EB',
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  progressBarDark: {
    backgroundColor: '#374151',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    width: '100%',
    borderRadius: 1.5,
  },
});
