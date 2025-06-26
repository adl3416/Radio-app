import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Alert } from 'react-native';
import { audioService } from './src/services/cleanAudioService';
import { radioBrowserService } from './src/services/radioBrowserService';
import { MiniPlayer, FullPlayer } from './src/components/NewPlayer';
import { ExtendedRadioList } from './src/screens/ExtendedRadioList';
import { RADIO_STATIONS } from './src/constants/radioStations';

// Basit ana sayfa komponenti
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TextInput,
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
  const [isMiniPlayerOpen, setIsMiniPlayerOpen] = useState(false);
  const [isFullPlayerOpen, setIsFullPlayerOpen] = useState(false);
  const [isExtendedListOpen, setIsExtendedListOpen] = useState(false);
  const [currentStation, setCurrentStation] = useState<any>(null);
  const [audioState, setAudioState] = useState(audioService.getState());
  const [favorites, setFavorites] = useState<string[]>([]);
  const [apiStations, setApiStations] = useState<any[]>([]);
  const [loadingApiStations, setLoadingApiStations] = useState(false);
  const [showApiStations, setShowApiStations] = useState(false);
  const [categorizedLoading, setCategorizedLoading] = useState(false);
  const [categorizedError, setCategorizedError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  useEffect(() => {
    audioService.initialize();
    
    // Audio service state'ini dinle
    const unsubscribe = audioService.subscribe(setAudioState);
    return unsubscribe;
  }, []);
  // API'den radyo yükleme fonksiyonu
  const loadApiStations = async () => {
    if (loadingApiStations || apiStations.length > 0) return;
    
    setLoadingApiStations(true);
    try {
      const stations = await radioBrowserService.getTurkishStations();
      setApiStations(stations.slice(0, 500)); // İlk 500 istasyonu al (200'den 500'e çıkardık)
      setShowApiStations(true);
    } catch (error) {
      Alert.alert('Hata', 'API radyoları yüklenemedi');
    } finally {
      setLoadingApiStations(false);
    }
  };

  const loadCategorizedStations = async () => {
    if (categorizedLoading) return;
    
    setCategorizedLoading(true);
    try {
      const categorized = await radioBrowserService.getCategorizedStations();
      
      // Combine with existing API stations (avoid duplicates)
      const newStations = [...categorized.religious, ...categorized.news, ...categorized.sports];
      const filteredNewStations = newStations.filter(newStation => 
        !apiStations.some(existingStation => existingStation.id === newStation.id)
      );
      
      setApiStations(prev => [...prev, ...filteredNewStations]);
      setCategorizedError(null);
    } catch (error) {
      setCategorizedError(error instanceof Error ? error.message : 'Kategorili istasyonlar yüklenemedi');
    } finally {
      setCategorizedLoading(false);
    }
  };

  // Refresh fonksiyonu - hem FlatList hem de API istasyonlarını yeniler
  const handleRefresh = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      // Arama sorgusunu temizle
      setSearchQuery('');
      
      // Eğer API istasyonları görünürse onları yenile
      if (showApiStations) {
        setApiStations([]);
        setShowApiStations(false);
        // API istasyonlarını yeniden yükle
        const stations = await radioBrowserService.getTurkishStations();
        setApiStations(stations.slice(0, 500));
        setShowApiStations(true);
      }
      
      // Favorileri koru, sadece listeyi yenile
      setCategorizedError(null);
    } catch (error) {
      Alert.alert('Hata', 'Radyo listesi yenilenemedi');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Toplam radyo listesi (statik + API)
  const allStations = showApiStations ? [...TURKISH_RADIOS, ...apiStations] : TURKISH_RADIOS;

  // Next/Previous radyo fonksiyonları
  const playNextRadio = async () => {
    if (!currentStation || allStations.length === 0) return;
    
    const currentIndex = allStations.findIndex(station => station.id === currentStation.id);
    const nextIndex = (currentIndex + 1) % allStations.length; // Sona gelince başa dön
    const nextStation = allStations[nextIndex];
    
    if (nextStation) {
      await playRadio(nextStation);
    }
  };

  const playPreviousRadio = async () => {
    if (!currentStation || allStations.length === 0) return;
    
    const currentIndex = allStations.findIndex(station => station.id === currentStation.id);
    const previousIndex = currentIndex === 0 ? allStations.length - 1 : currentIndex - 1; // Başta ise sona git
    const previousStation = allStations[previousIndex];
    
    if (previousStation) {
      await playRadio(previousStation);
    }
  };

  const playRadio = async (station: any) => {
    try {
      // Eğer farklı bir radyo çalıyorsa önce durdur
      if (audioState.isPlaying && audioState.currentStation?.id !== station.id) {
        await audioService.stop();
      }
      
      setCurrentStation(station);
      await audioService.playStation(station);
      setIsMiniPlayerOpen(true); // Mini player'ı aç
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
        setIsMiniPlayerOpen(true); // Mini player'ı aç
      }
    } catch (error) {
      // Hiçbir konsol çıktısı yok, tamamen sessiz
    }
  };

  // Player handler functions
  const handleExpandPlayer = () => {
    setIsFullPlayerOpen(true);
  };

  const handleCollapsePlayer = () => {
    setIsFullPlayerOpen(false);
  };

  const handleCloseMiniPlayer = () => {
    audioService.stop();
    setIsMiniPlayerOpen(false);
    setCurrentStation(null);
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
  // Radyoları favori durumuna göre sırala ve arama filtresini uygula
  const filteredRadios = allStations.filter(station => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    const searchableText = [
      station.name,
      station.description,
      station.category,
      station.city,
      station.genre
    ].filter(Boolean).join(' ').toLowerCase();
    
    // Türkçe arama terimleri için özel eşleştirmeler
    const searchMappings = {
      'haber': ['news', 'gündem', 'aktüel'],
      'müzik': ['music', 'song', 'şarkı'],
      'pop': ['pop', 'popular'],
      'rock': ['rock', 'metal'],
      'klasik': ['classical', 'classic', 'sanat'],
      'türk': ['turkish', 'türkiye'],
      'fm': ['fm', 'radyo'],
      'spor': ['sport', 'sports', 'futbol']
    };
    
    // Doğrudan eşleştirme
    if (searchableText.includes(query)) {
      return true;
    }
    
    // Eşleştirme tablosunu kontrol et
    for (const [key, synonyms] of Object.entries(searchMappings)) {
      if (query.includes(key) && synonyms.some(synonym => searchableText.includes(synonym))) {
        return true;
      }
    }
    
    return false;
  });

  const sortedRadios = [...filteredRadios].sort((a, b) => {
    const aIsFavorite = favorites.includes(a.id);
    const bIsFavorite = favorites.includes(b.id);
    
    if (aIsFavorite && !bIsFavorite) return -1;
    if (!aIsFavorite && bIsFavorite) return 1;
    return 0;
  });
  const renderStation = ({ item }: { item: any }) => {
    const isCurrentlyPlaying = audioState.currentStation?.id === item.id && audioState.isPlaying;
    const isLoading = audioState.currentStation?.id === item.id && audioState.isLoading;
    const isFavorite = favorites.includes(item.id);
    
    // Prevent double-tap by checking if this station is currently loading
    const isDisabled = isLoading || (audioState.isLoading && audioState.currentStation?.id !== item.id);
    
    return (
      <TouchableOpacity
        style={[
          styles.stationCard, 
          isFavorite && styles.favoriteCard,
          isDisabled && styles.disabledCard
        ]}
        onPress={() => !isDisabled && playRadio(item)}
        disabled={isDisabled}
      >
        <View style={styles.stationInfo}>
          <View style={styles.stationHeader}>
            <Text style={styles.stationName}>{item.name}</Text>
            {isFavorite && <Text style={styles.favoriteIndicator}>⭐</Text>}
          </View>
          <Text style={styles.stationDesc}>{item.description}</Text>
          {item.votes && (
            <Text style={styles.stationVotes}>👍 {item.votes} oy • {item.bitrate}kbps</Text>
          )}
        </View>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={() => toggleFavorite(item.id)}
            disabled={isDisabled}
          >
            <Ionicons 
              name={isFavorite ? "heart" : "heart-outline"} 
              size={24} 
              color={isFavorite ? "#FF6B35" : "#9CA3AF"} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.playButton}
            onPress={() => !isDisabled && togglePlayPause(item)}
            disabled={isDisabled}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FF6B35" />
            ) : (
              <Ionicons 
                name={isCurrentlyPlaying ? "pause-circle" : "play-circle"} 
                size={40} 
                color={isDisabled ? "#9CA3AF" : (isCurrentlyPlaying ? "#10B981" : "#FF6B35")} 
              />
            )}
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
          {searchQuery 
            ? `${filteredRadios.length}/${allStations.length} İstasyon` 
            : `${allStations.length} İstasyon`
          } ({TURKISH_RADIOS.length} Statik + {apiStations.length} API) • {favorites.length} Favori
        </Text>
      </LinearGradient>

      {/* Arama Çubuğu */}
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.95)', 'rgba(248, 250, 252, 0.9)']}
        style={styles.searchContainer}
      >
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="🔍 Radyo ara..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={20} color="#EF4444" />
            </TouchableOpacity>
          )}
        </View>
        {searchQuery.length > 0 && (
          <View style={styles.searchResultContainer}>
            <Text style={styles.searchResultText}>
              {filteredRadios.length > 0 
                ? `📻 ${filteredRadios.length} radyo bulundu`
                : '❌ Hiç radyo bulunamadı'
              }
            </Text>
            {filteredRadios.length === 0 && (
              <Text style={styles.searchHelpText}>
                Farklı terimler deneyin: haber, müzik, pop, trt, power...
              </Text>
            )}
          </View>
        )}
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📻 Radyo İstasyonları</Text>
          <View style={styles.buttonGroup}>
            <TouchableOpacity 
              style={[styles.exploreButton, isRefreshing && styles.disabledButton]}
              onPress={handleRefresh}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <ActivityIndicator size="small" color="#FF6B35" />
              ) : (
                <>
                  <Text style={styles.exploreText}>🔄 Yenile</Text>
                  <Ionicons name="refresh" size={16} color="#FF6B35" />
                </>
              )}
            </TouchableOpacity>
            {!showApiStations && (
              <TouchableOpacity 
                style={[styles.exploreButton, loadingApiStations && styles.disabledButton]}
                onPress={loadApiStations}
                disabled={loadingApiStations}
              >
                {loadingApiStations ? (
                  <ActivityIndicator size="small" color="#FF6B35" />
                ) : (
                  <>
                    <Text style={styles.exploreText}>🚀 +500 Radyo</Text>
                    <Ionicons name="add-circle" size={16} color="#FF6B35" />
                  </>
                )}
              </TouchableOpacity>
            )}
            {!categorizedLoading && (
              <TouchableOpacity 
                style={[styles.exploreButton, categorizedLoading && styles.disabledButton]}
                onPress={loadCategorizedStations}
                disabled={categorizedLoading}
              >
                {categorizedLoading ? (
                  <ActivityIndicator size="small" color="#FF6B35" />
                ) : (
                  <>
                    <Text style={styles.exploreText}>🎯 Dini/Haber/Spor</Text>
                    <Ionicons name="filter" size={16} color="#FF6B35" />
                  </>
                )}
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={styles.exploreButton}
              onPress={() => setIsExtendedListOpen(true)}
            >
              <Text style={styles.exploreText}>🌍 Tümünü Gör</Text>
              <Ionicons name="chevron-forward" size={16} color="#FF6B35" />
            </TouchableOpacity>
          </View>
        </View>
        
        {categorizedError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>⚠️ {categorizedError}</Text>
          </View>
        )}
        
        <FlatList
          data={sortedRadios}
          renderItem={renderStation}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
        />
      </View>

      {/* Mini Player */}
      <MiniPlayer
        isVisible={isMiniPlayerOpen}
        onExpand={handleExpandPlayer}
        onClose={handleCloseMiniPlayer}
        onNext={playNextRadio}
        onPrevious={playPreviousRadio}
      />

      {/* Full Player */}
      <FullPlayer
        isVisible={isFullPlayerOpen}
        onCollapse={handleCollapsePlayer}
        onNext={playNextRadio}
        onPrevious={playPreviousRadio}
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
    paddingBottom: 90, // Mini player için yer bırak
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(229, 231, 235, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(248, 250, 252, 0.8)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    paddingVertical: 6,
    fontWeight: '500',
  },
  clearButton: {
    marginLeft: 8,
    padding: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  searchResultContainer: {
    marginTop: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 53, 0.05)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.2)',
  },
  searchResultText: {
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: '700',
  },
  searchHelpText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  sectionTitle: {
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
  },  exploreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B35',
    marginRight: 4,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  disabledButton: {
    opacity: 0.6,
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
  },  stationDesc: {
    fontSize: 14,
    color: '#6B7280',
  },
  stationVotes: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
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
  disabledCard: {
    opacity: 0.6,
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
  },
  errorText: {
    color: '#D32F2F',
    fontWeight: '500',
  },
});
