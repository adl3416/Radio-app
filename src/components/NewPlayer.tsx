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

interface MiniPlayerProps {
  isVisible: boolean;
  onExpand: () => void;
  onClose: () => void;
}

interface FullPlayerProps {
  isVisible: boolean;
  onCollapse: () => void;
}

// Mini Footer Player Component
export const MiniPlayer: React.FC<MiniPlayerProps> = ({ isVisible, onExpand, onClose }) => {
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
      // Sessiz hata yönetimi
    }
  };

  if (!isVisible || !playbackState.currentStation) {
    return null;
  }

  return (
    <TouchableOpacity 
      style={styles.miniPlayerContainer} 
      onPress={onExpand}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={['#FF6B35', '#F59E0B']}
        style={styles.miniPlayerGradient}
      >
        <View style={styles.miniPlayerContent}>
          {/* Sol taraf - İstasyon bilgisi */}
          <View style={styles.miniStationInfo}>
            <Text style={styles.miniStationName} numberOfLines={1}>
              {playbackState.currentStation.name}
            </Text>
            <Text style={styles.miniStationStatus} numberOfLines={1}>
              {playbackState.isLoading 
                ? 'Yükleniyor...' 
                : playbackState.error 
                  ? 'Hata oluştu'
                  : 'Şu an çalıyor'
              }
            </Text>
          </View>

          {/* Orta - Loading/Play durumu */}
          <View style={styles.miniPlayerControls}>
            {playbackState.isLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <TouchableOpacity onPress={handlePlayPause} style={styles.miniPlayButton}>
                <Ionicons 
                  name={playbackState.isPlaying ? "pause" : "play"} 
                  size={20} 
                  color="white" 
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Sağ taraf - Kapat butonu */}
          <TouchableOpacity onPress={onClose} style={styles.miniCloseButton}>
            <Ionicons name="close" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

// Full Screen Player Component
export const FullPlayer: React.FC<FullPlayerProps> = ({ isVisible, onCollapse }) => {
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
      // Sessiz hata yönetimi
    }
  };

  const handleStop = async () => {
    try {
      await audioService.stop();
      onCollapse();
    } catch (error) {
      // Sessiz hata yönetimi
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
    >
      <View style={styles.fullPlayerContainer}>
          <LinearGradient
            colors={['#FF6B35', '#F59E0B', '#EF4444']}
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
                <TouchableOpacity style={styles.controlButton}>
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

                <TouchableOpacity style={styles.controlButton}>
                  <Ionicons name="play-skip-forward" size={30} color="white" />
                </TouchableOpacity>
              </View>

              {/* Additional Controls */}
              <View style={styles.additionalControls}>
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="volume-high" size={24} color="white" />
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="heart-outline" size={24} color="white" />
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
        </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  // Mini Player Styles
  miniPlayerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  miniPlayerGradient: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
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
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  miniStationStatus: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
  miniPlayerControls: {
    marginRight: 12,
  },
  miniPlayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
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
    paddingVertical: 16,
    position: 'relative',
  },
  pullIndicator: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 2,
    marginBottom: 8,
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
