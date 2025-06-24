import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { audioService, PlaybackState } from '../services/cleanAudioService';

const { width, height } = Dimensions.get('window');

interface SimplePlayerProps {
  isVisible: boolean;
  onClose: () => void;
}

export const SimplePlayer: React.FC<SimplePlayerProps> = ({ isVisible, onClose }) => {
  const [playbackState, setPlaybackState] = useState<PlaybackState>(audioService.getState());

  useEffect(() => {
    const unsubscribe = audioService.subscribe(setPlaybackState);
    return unsubscribe;
  }, []);

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
      onClose();
    } catch (error) {
      console.error('Stop error:', error);
    }
  };

  if (!isVisible || !playbackState.currentStation) {
    return null;
  }

  return (
    <Modal visible={isVisible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <LinearGradient
            colors={['#FF6B35', '#F59E0B']}
            style={styles.playerBackground}
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="chevron-down" size={24} color="white" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Radyo Çalar</Text>
              <View style={styles.placeholder} />
            </View>

            {/* Station Info */}
            <View style={styles.stationInfo}>
              <View style={styles.stationIcon}>
                <Text style={styles.stationIconText}>📻</Text>
              </View>
              <Text style={styles.stationName}>
                {playbackState.currentStation.name}
              </Text>
              <Text style={styles.stationDesc}>
                {playbackState.currentStation.description || 'Müzik Yayını'}
              </Text>
            </View>

            {/* Status */}
            <View style={styles.statusContainer}>
              <View style={styles.statusIndicator}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: playbackState.isPlaying ? '#10B981' : '#EF4444' }
                  ]}
                />
                <Text style={styles.statusText}>
                  {playbackState.isLoading
                    ? 'Yükleniyor...'
                    : playbackState.isPlaying
                    ? 'Çalıyor'
                    : 'Duraklatıldı'
                  }
                </Text>
              </View>
              {playbackState.error && (
                <Text style={styles.errorText}>{playbackState.error}</Text>
              )}
            </View>

            {/* Controls */}
            <View style={styles.controls}>
              <TouchableOpacity
                style={styles.controlButton}
                onPress={handleStop}
              >
                <Ionicons name="stop" size={32} color="white" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.controlButton, styles.playButton]}
                onPress={handlePlayPause}
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

              <TouchableOpacity
                style={styles.controlButton}
                onPress={onClose}
              >
                <Ionicons name="remove" size={32} color="white" />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    height: height * 0.6,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    overflow: 'hidden',
  },
  playerBackground: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  placeholder: {
    width: 40,
  },
  stationInfo: {
    alignItems: 'center',
    marginBottom: 40,
  },
  stationIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  stationIconText: {
    fontSize: 48,
  },
  stationName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  stationDesc: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  errorText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 30,
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
});
