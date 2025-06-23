import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RadioStation } from '../constants/radioStations';
import { audioService, PlaybackState } from '../services/audioService';
import { favoritesService } from '../services/favoritesService';

interface RadioStationCardProps {
  station: RadioStation;
  onPress: (station: RadioStation) => void;
  onPlay?: (station: RadioStation) => void;
}

export const RadioStationCard: React.FC<RadioStationCardProps> = ({
  station,
  onPress,
  onPlay,
}) => {
  const [playbackState, setPlaybackState] = useState<PlaybackState>(audioService.getState());
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const unsubscribe = audioService.subscribe(setPlaybackState);
    return unsubscribe;
  }, []);

  useEffect(() => {
    setIsFavorite(favoritesService.isFavorite(station.id));
    
    const unsubscribeFavorites = favoritesService.subscribe(() => {
      setIsFavorite(favoritesService.isFavorite(station.id));
    });
    
    return unsubscribeFavorites;
  }, [station.id]);

  const isCurrentStation = playbackState.currentStation?.id === station.id;
  const isPlaying = isCurrentStation && playbackState.isPlaying;
  const isLoading = isCurrentStation && playbackState.isLoading;

  const handlePlayPress = async (e: any) => {
    e.stopPropagation();
    
    if (isCurrentStation) {
      if (playbackState.isPlaying) {
        await audioService.pause();
      } else {
        await audioService.resume();
      }
    } else {
      await audioService.playStation(station);
    }
    
    onPlay?.(station);
  };

  const handleFavoritePress = async (e: any) => {
    e.stopPropagation();
    await favoritesService.toggleFavorite(station);
  };
  return (
    <TouchableOpacity
      onPress={() => onPress(station)}
      style={[
        styles.card,
        isCurrentStation ? styles.cardActive : styles.cardInactive
      ]}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        {/* Station Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: station.imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
          {isCurrentStation && (
            <View style={styles.imageOverlay}>
              {isLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : isPlaying ? (
                <View style={styles.playingIndicator} />
              ) : null}
            </View>
          )}
        </View>

        {/* Station Info */}
        <View style={styles.stationInfo}>
          <Text style={styles.stationName} numberOfLines={1}>
            {station.name}
          </Text>
          <Text style={styles.stationDescription} numberOfLines={1}>
            {station.description}
          </Text>
          <View style={styles.metaContainer}>
            <View style={styles.genreTag}>
              <Text style={styles.genreText}>
                {station.genre}
              </Text>
            </View>
            {station.city && (
              <Text style={styles.cityText}>
                {station.city}
              </Text>
            )}
            {station.isLive && (
              <View style={styles.liveContainer}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>CANLI</Text>
              </View>
            )}
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            onPress={handleFavoritePress}
            style={styles.favoriteButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={20}
              color={isFavorite ? '#ef4444' : '#6B7280'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handlePlayPress}
            style={[
              styles.playButton,
              isCurrentStation ? styles.playButtonActive : styles.playButtonInactive
            ]}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator 
                size="small" 
                color={isCurrentStation ? 'white' : '#6B7280'} 
              />
            ) : (
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={20}
                color={isCurrentStation ? 'white' : '#6B7280'}
              />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
  },
  cardActive: {
    backgroundColor: '#EBF8FF',
    borderColor: '#3B82F6',
  },
  cardInactive: {
    backgroundColor: 'white',
    borderColor: '#E5E7EB',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playingIndicator: {
    width: 12,
    height: 12,
    backgroundColor: '#10B981',
    borderRadius: 6,
  },
  stationInfo: {
    flex: 1,
    marginLeft: 16,
  },
  stationName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  stationDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  genreTag: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    marginRight: 8,
  },
  genreText: {
    fontSize: 12,
    color: '#1E40AF',
    fontWeight: '500',
  },
  cityText: {
    fontSize: 12,
    color: '#6B7280',
  },
  liveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    backgroundColor: '#EF4444',
    borderRadius: 4,
    marginRight: 4,
  },
  liveText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  favoriteButton: {
    padding: 8,
    marginRight: 8,
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonActive: {
    backgroundColor: '#3B82F6',
  },
  playButtonInactive: {
    backgroundColor: '#F3F4F6',
  },
});
