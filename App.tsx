import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Alert } from 'react-native';
import { audioService } from './src/services/cleanAudioService';
import { SimplePlayer } from './src/components/SimplePlayer';
import { ExtendedRadioList } from './src/screens/ExtendedRadioList';
import { RADIO_STATIONS } from './src/constants/radioStations';

// Basit ana sayfa komponenti
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

// Power FM Group radyoları - güncellenmiş liste
const TURKISH_RADIOS = RADIO_STATIONS.map(station => ({
  id: station.id,
  name: station.name,
  url: station.url,
  description: station.description || 'Power Group Radio',
  protected: true,
}));

export default function App() {
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [isExtendedListOpen, setIsExtendedListOpen] = useState(false);
  const [currentStation, setCurrentStation] = useState<any>(null);
  const [audioState, setAudioState] = useState(audioService.getState());
  const [favorites, setFavorites] = useState<string[]>([]);
  useEffect(() => {
    audioService.initialize();
    
    // Audio service state'ini dinle
    const unsubscribe = audioService.subscribe(setAudioState);
    return unsubscribe;
  }, []);

  const playRadio = async (station: any) => {
    try {
      // Hiç log yazmayalım
      
      // Eğer farklı bir radyo çalıyorsa önce durdur
      if (audioState.isPlaying && audioState.currentStation?.id !== station.id) {
        await audioService.stop();
      }
      
      setCurrentStation(station);
      await audioService.playStation(station);
      setIsPlayerOpen(true);
    } catch (error) {
      // Hiçbir konsol çıktısı yok, tamamen sessiz
    }
  };

  const togglePlayPause = async (station: any) => {
    try {
      if (audioState.currentStation?.id === station.id) {
        if (audioState.isPlaying) {
          // Aynı radyo çalıyor, durdur
          await audioService.pause();
        } else {
          // Aynı radyo duruyor, devam ettir
          await audioService.resume();
        }
      } else {
        // Farklı radyo - önce mevcut radyoyu durdur, sonra yeni radyoyu çal
        if (audioState.isPlaying) {
          await audioService.stop();
        }
        setCurrentStation(station);
        await audioService.playStation(station);
        setIsPlayerOpen(true);
      }
    } catch (error) {
      // Hiçbir konsol çıktısı yok, tamamen sessiz
    }
  };

  const toggleFavorite = (stationId: string) => {
    setFavorites(prev => {
      if (prev.includes(stationId)) {
        return prev.filter(id => id !== stationId);
      } else {
        return [...prev, stationId];
      }
    });
  };

  // Radyoları favori durumuna göre sırala
  const sortedRadios = [...TURKISH_RADIOS].sort((a, b) => {
    const aIsFavorite = favorites.includes(a.id);
    const bIsFavorite = favorites.includes(b.id);
    
    if (aIsFavorite && !bIsFavorite) return -1;
    if (!aIsFavorite && bIsFavorite) return 1;
    return 0;
  });

  const renderStation = ({ item }: { item: any }) => {
    const isCurrentlyPlaying = audioState.currentStation?.id === item.id && audioState.isPlaying;
    const isFavorite = favorites.includes(item.id);
    
    return (
      <TouchableOpacity
        style={[styles.stationCard, isFavorite && styles.favoriteCard]}
        onPress={() => playRadio(item)}
      >
        <View style={styles.stationInfo}>
          <View style={styles.stationHeader}>
            <Text style={styles.stationName}>{item.name}</Text>
            {isFavorite && <Text style={styles.favoriteIndicator}>⭐</Text>}
          </View>
          <Text style={styles.stationDesc}>{item.description}</Text>
        </View>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={() => toggleFavorite(item.id)}
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

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
        <LinearGradient
        colors={['#FF6B35', '#F59E0B']}
        style={styles.header}
      >
        <Text style={styles.title}>🎧 RADYO ÇINARI</Text>
        <Text style={styles.subtitle}>Modern Radyo Uygulaması</Text>
        <Text style={styles.stationCount}>
          {TURKISH_RADIOS.length} İstasyon • {favorites.length} Favori
        </Text>
      </LinearGradient>      <View style={styles.content}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📻 Radyo İstasyonları</Text>
          <TouchableOpacity 
            style={styles.exploreButton}
            onPress={() => setIsExtendedListOpen(true)}
          >
            <Text style={styles.exploreText}>🌍 Tümünü Gör</Text>
            <Ionicons name="chevron-forward" size={16} color="#FF6B35" />
          </TouchableOpacity>
        </View>
        
        <FlatList
          data={sortedRadios}
          renderItem={renderStation}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
      </View>

      {currentStation && (
        <View style={styles.nowPlaying}>
          <Text style={styles.nowPlayingText}>
            Şu an çalıyor: {currentStation.name}
          </Text>
        </View>
      )}      <SimplePlayer
        isVisible={isPlayerOpen}
        onClose={() => setIsPlayerOpen(false)}
      />
      
      <ExtendedRadioList
        isVisible={isExtendedListOpen}
        onClose={() => setIsExtendedListOpen(false)}
        currentAudioState={audioState}
        onStationPlay={playRadio}
        favorites={favorites}
        onToggleFavorite={toggleFavorite}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 5,
  },
  stationCount: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 20,
  },  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  exploreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  exploreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B35',
    marginRight: 4,
  },
  listContainer: {
    paddingBottom: 20,
  },
  stationCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
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
  },
  stationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
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
  nowPlaying: {
    backgroundColor: '#FF6B35',
    padding: 15,
    alignItems: 'center',
  },
  nowPlayingText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
