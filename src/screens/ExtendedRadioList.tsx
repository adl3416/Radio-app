import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RadioStation } from '../constants/radioStations';
import { simpleRadioAudioService as audioService } from '../services/simpleRadioAudioService';

// For now, use RadioStation as ProcessedRadioStation
type ProcessedRadioStation = RadioStation;

// Mock radioBrowserService
const radioBrowserService = {
  getTurkishStationsPaginated: async (page: number, limit: number) => {
    return { 
      stations: [], 
      total: 0, 
      hasMore: false, 
      page: page, 
      totalPages: 1 
    };
  },
  clearCache: () => {},
};

interface ExtendedRadioListProps {
  isVisible: boolean;
  onClose: () => void;
  currentAudioState: any;
  onStationPlay: (station: any) => void;
  favorites: string[];
  onToggleFavorite: (stationId: string) => void;
}

export const ExtendedRadioList: React.FC<ExtendedRadioListProps> = ({
  isVisible,
  onClose,
  currentAudioState,
  onStationPlay,
  favorites,
  onToggleFavorite,
}) => {
  const [stations, setStations] = useState<ProcessedRadioStation[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStations, setTotalStations] = useState(0);

  useEffect(() => {
    if (isVisible) {
      loadAllStations();
    }
  }, [isVisible]);

  const loadAllStations = async () => {
    setLoading(true);
    try {
      const result = await radioBrowserService.getTurkishStationsPaginated(1, 100);
      setStations(result.stations);
      setCurrentPage(result.page);
      setTotalPages(result.totalPages);
      setTotalStations(result.total);
    } catch (error) {
      Alert.alert('Hata', 'Radyo istasyonları yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const loadMoreStations = async () => {
    if (currentPage >= totalPages || loading) return;

    setLoading(true);
    try {
      const result = await radioBrowserService.getTurkishStationsPaginated(currentPage + 1, 100);
      setStations(prev => [...prev, ...result.stations]);
      setCurrentPage(result.page);
    } catch (error) {
      Alert.alert('Hata', 'Daha fazla radyo yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Clear cache and reload
      radioBrowserService.clearCache();
      const result = await radioBrowserService.getTurkishStationsPaginated(1, 100);
      setStations(result.stations);
      setCurrentPage(result.page);
      setTotalPages(result.totalPages);
      setTotalStations(result.total);
    } catch (error) {
      Alert.alert('Hata', 'Radyo listesi yenilenemedi');
    } finally {
      setRefreshing(false);
    }
  };

  const togglePlayPause = async (station: ProcessedRadioStation) => {
    try {
      if (currentAudioState.currentStation?.id === station.id) {
        if (currentAudioState.isPlaying) {
          await audioService.pause();
        } else {
          await audioService.resume();
        }
      } else {
        onStationPlay(station);
      }
    } catch (error) {
      Alert.alert('Hata', 'Radyo çalınamadı');
    }
  };

  const renderStation = ({ item }: { item: ProcessedRadioStation }) => {
    const isCurrentlyPlaying = currentAudioState.currentStation?.id === item.id && currentAudioState.isPlaying;
    const isFavorite = favorites.includes(item.id);
    
    return (
      <TouchableOpacity
        style={[styles.stationCard, isFavorite && styles.favoriteCard]}
        onPress={() => onStationPlay(item)}
      >
        <View style={styles.stationInfo}>
          <View style={styles.stationHeader}>
            <Text style={styles.stationName} numberOfLines={1}>{item.name}</Text>
            {isFavorite && <Text style={styles.favoriteIndicator}>⭐</Text>}
          </View>
          <Text style={styles.stationDesc} numberOfLines={1}>{item.description}</Text>
          {item.votes && (
            <Text style={styles.stationVotes}>👍 {item.votes} oy • {item.bitrate}kbps</Text>
          )}
        </View>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={() => onToggleFavorite(item.id)}
          >
            <Ionicons 
              name={isFavorite ? "heart" : "heart-outline"} 
              size={24} 
              color={isFavorite ? "#FF6B35" : "#9CA3AF"} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.playButton}
            onPress={() => togglePlayPause(item)}
          >
            <Ionicons 
              name={isCurrentlyPlaying ? "pause-circle" : "play-circle"} 
              size={40} 
              color={isCurrentlyPlaying ? "#10B981" : "#FF6B35"} 
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Daha fazla radyo yükleniyor...</Text>
      </View>
    );
  };

  if (!isVisible) return null;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FF6B35', '#F59E0B']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.title}>🌍 Tüm Türk Radyoları</Text>
          <View style={styles.placeholder} />
        </View>
        <Text style={styles.subtitle}>
          {totalStations} istasyon • Sayfa {currentPage}/{totalPages}
        </Text>
      </LinearGradient>

      <View style={styles.content}>
        {loading && stations.length === 0 ? (
          <View style={styles.centerLoader}>
            <ActivityIndicator size="large" color="#FF6B35" />
            <Text style={styles.loadingText}>Radyo istasyonları yükleniyor...</Text>
          </View>
        ) : (
          <FlatList
            data={stations}
            renderItem={renderStation}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#FF6B35']}
              />
            }
            onEndReached={loadMoreStations}
            onEndReachedThreshold={0.1}
            ListFooterComponent={renderFooter}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#F9FAFB',
    zIndex: 1000,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  placeholder: {
    width: 40,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  centerLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  listContainer: {
    paddingBottom: 20,
  },
  stationCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stationInfo: {
    flex: 1,
    marginRight: 10,
  },
  stationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  stationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
  },
  favoriteIndicator: {
    fontSize: 14,
    marginLeft: 8,
  },
  stationDesc: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  stationVotes: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  favoriteButton: {
    padding: 8,
  },
  playButton: {
    padding: 5,
  },
  favoriteCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B35',
    backgroundColor: '#FFF7ED',
  },
  footerLoader: {
    padding: 20,
    alignItems: 'center',
  },
});
