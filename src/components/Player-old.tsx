import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { audioService, PlaybackState } from '../services/audioService';
import { favoritesService } from '../services/favoritesService';

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

  useEffect(() => {
    const unsubscribe = audioService.subscribe(setPlaybackState);
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (playbackState.currentStation) {
      setIsFavorite(favoritesService.isFavorite(playbackState.currentStation.id));
    }
  }, [playbackState.currentStation]);
  const handlePlayPause = async () => {
    if (!playbackState.currentStation) return;
    
    try {
      if (playbackState.isPlaying) {
        await audioService.pause();
      } else {
        // If paused, resume. If stopped, play from beginning
        if (playbackState.currentStation) {
          await audioService.playStation(playbackState.currentStation);
        }
      }
    } catch (error) {
      console.error('Play/pause failed:', error);
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
  if (!playbackState.currentStation && !isMinimized) {
    return (
      <View style={styles.noStationContainer}>
        <Ionicons name="radio" size={64} color="#6B7280" />
        <Text style={styles.noStationTitle}>{t('player.nowPlaying')}</Text>
        <Text style={styles.noStationSubtitle}>Bir radyo istasyonu seçin</Text>
      </View>
    );
  }

  if (isMinimized && playbackState.currentStation) {
    return (
      <View style={styles.miniPlayerContainer}>
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
          onPress={handlePlayPause}
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

        <TouchableOpacity onPress={handleStop} style={styles.miniPlayerStopButton}>
          <Ionicons name="stop" size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>
    );
  }
  return (
    <LinearGradient
      colors={['#1e3a8a', '#3b82f6', '#60a5fa']}
      style={styles.fullPlayerContainer}
    >
      <View style={styles.fullPlayerContent}>
        {/* Header */}
        <View style={styles.fullPlayerHeader}>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <Ionicons name="chevron-down" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {t('player.nowPlaying')}
          </Text>
          <TouchableOpacity onPress={handleFavoriteToggle} style={styles.headerButton}>
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={24}
              color={isFavorite ? '#ef4444' : 'white'}
            />
          </TouchableOpacity>
        </View>

        {/* Station Image and Info */}
        <View style={styles.stationInfoSection}>
          <View style={styles.stationImageContainer}>
            <Image
              source={{ uri: playbackState.currentStation?.imageUrl }}
              style={styles.stationImage}
              resizeMode="cover"
            />
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

          {/* Status */}
          <View style={styles.statusContainer}>
            {playbackState.isLoading && (
              <View style={styles.loadingStatus}>
                <ActivityIndicator size="small" color="white" style={styles.loadingIcon} />
                <Text style={styles.statusText}>{t('player.buffering')}</Text>
              </View>
            )}
            {playbackState.error && (
              <Text style={styles.errorText}>{playbackState.error}</Text>
            )}
            {!playbackState.isLoading && !playbackState.error && playbackState.isPlaying && (
              <View style={styles.playingStatus}>
                <View style={styles.liveDot} />
                <Text style={styles.statusText}>Canlı Yayın</Text>
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
          </View>

          {/* Playback Controls */}
          <View style={styles.playbackControls}>
            <TouchableOpacity onPress={handleStop} style={styles.controlButton}>
              <Ionicons name="stop" size={28} color="white" />
            </TouchableOpacity>

            <TouchableOpacity onPress={handleReplay} style={styles.controlButton}>
              <Ionicons name="refresh" size={28} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handlePlayPause}
              style={styles.mainPlayButton}
              disabled={playbackState.isLoading}
            >
              {playbackState.isLoading ? (
                <ActivityIndicator size="large" color="white" />
              ) : (
                <Ionicons
                  name={playbackState.isPlaying ? 'pause' : 'play'}
                  size={36}
                  color="white"
                />
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={handleStop} style={styles.controlButton}>
              <Ionicons name="square" size={28} color="white" />
            </TouchableOpacity>

            <TouchableOpacity onPress={handleFavoriteToggle} style={styles.controlButton}>
              <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={28}
                color={isFavorite ? '#ef4444' : 'white'}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
                <Ionicons
                  name={playbackState.isPlaying ? 'pause' : 'play'}
                  size={36}
                  color="white"
                />
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={handleFavoriteToggle} className="p-4">
              <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={28}
                color={isFavorite ? '#ef4444' : 'white'}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
};
