import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Alert, AppState } from 'react-native';
import { simpleBackgroundAudioService } from './src/services/simpleBackgroundAudioService';
import { favoritesService } from './src/services/favoritesService';
import { MiniPlayer, FullPlayer } from './src/components/NewPlayer';
import { FavoritesPage } from './src/screens/FavoritesPage';
import { RADIO_STATIONS_SORTED, RADIO_STATS } from './src/constants/radioStations';

// Basit ana sayfa komponenti
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TextInput,
  Dimensions,
  Image,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

// Ekran boyutları
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isSmallScreen = screenWidth < 375; // iPhone SE ve benzeri küçük ekranlar
const isMediumScreen = screenWidth >= 375 && screenWidth < 414; // iPhone 12, Samsung S9
const isLargeScreen = screenWidth >= 414; // iPhone 12 Pro Max ve benzeri

// Samsung S9 ve benzeri cihazlar için özel ayarlar
const isSamsungS9Like = screenWidth >= 360 && screenWidth <= 380 && screenHeight >= 740 && screenHeight <= 760;
const cardPadding = isSmallScreen ? 10 : isSamsungS9Like ? 12 : 16;
const logoSize = isSmallScreen ? 36 : isSamsungS9Like ? 42 : 48;
const fontSize = {
  title: isSmallScreen ? 22 : isSamsungS9Like ? 26 : 28,
  subtitle: isSmallScreen ? 13 : isSamsungS9Like ? 15 : 16,
  stationName: isSmallScreen ? 13 : isSamsungS9Like ? 15 : 16,
  stationDesc: isSmallScreen ? 11 : isSamsungS9Like ? 13 : 14,
  stationVotes: isSmallScreen ? 9 : isSamsungS9Like ? 11 : 12,
};

// Power FM Group radyoları - güncellenmiş liste
const TURKISH_RADIOS = RADIO_STATIONS_SORTED.map(station => ({
  id: station.id,
  name: station.name,
  url: station.url,
  description: station.description || 'Türk Radyosu',
  favicon: station.favicon || '',
  votes: station.votes || 0,
  bitrate: station.bitrate || 128,
  protected: true,
}));

export default function App() {
  const [isMiniPlayerOpen, setIsMiniPlayerOpen] = useState(false);
  const [isFullPlayerOpen, setIsFullPlayerOpen] = useState(false);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [currentStation, setCurrentStation] = useState<any>(null);
  const [audioState, setAudioState] = useState(simpleBackgroundAudioService.getState());
  const [favorites, setFavorites] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isTogglngFavorite, setIsTogglingFavorite] = useState<string | null>(null);
  const [failedLogos, setFailedLogos] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    simpleBackgroundAudioService.initialize();
    
    // Background Audio service state'ini dinle
    const unsubscribe = simpleBackgroundAudioService.subscribe(setAudioState);
    
    // Favorileri yükle
    const unsubscribeFavorites = favoritesService.subscribe(setFavorites);

    // App state change listener - Background audio için
    const handleAppStateChange = (nextAppState: string) => {
      // Simple service kendi app state change'ini handle eder
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    // Next/Previous callbacks'leri set et
    simpleBackgroundAudioService.onNextStation = playNextRadio;
    simpleBackgroundAudioService.onPreviousStation = playPreviousRadio;
    
    return () => {
      unsubscribe();
      unsubscribeFavorites();
      subscription?.remove();
    };
  }, []);

  // Mini player visibility kontrolü - audio state değiştiğinde
  useEffect(() => {
    if (audioState.currentStation && (audioState.isPlaying || audioState.isLoading)) {
      // Radyo çalıyor veya yükleniyor -> mini player'ı göster
      if (!isMiniPlayerOpen && !isFullPlayerOpen) {
        setIsMiniPlayerOpen(true);
      }
    } else if (!audioState.currentStation) {
      // Hiç radyo yok -> mini player'ı gizle
      setIsMiniPlayerOpen(false);
    }
  }, [audioState.currentStation, audioState.isPlaying, audioState.isLoading, isFullPlayerOpen]);

  // Toplam radyo listesi (sadece statik radyolar)
  const allStations = TURKISH_RADIOS;

  // Refresh fonksiyonu - arama sorgusunu temizle
  const handleRefresh = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      // Arama sorgusunu temizle
      setSearchQuery('');
      
      // Kısa bir gecikme ekle (kullanıcı deneyimi için)
      await new Promise(resolve => setTimeout(resolve, 800));
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

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
        await simpleBackgroundAudioService.stop();
      }
      
      setCurrentStation(station);
      await simpleBackgroundAudioService.play(station);
      // Mini player açma logic'ini useEffect'e bıraktık
    } catch (error) {
      // Hiçbir konsol çıktısı yok, tamamen sessiz
    }
  };

  const togglePlayPause = async (station: any) => {
    try {
      if (audioState.currentStation?.id === station.id) {
        if (audioState.isPlaying) {
          // Aynı radyo çalıyor, durdur
          await simpleBackgroundAudioService.pause();
        } else {
          // Aynı radyo duruyor, devam ettir
          await simpleBackgroundAudioService.resume();
        }
      } else {
        // Farklı radyo - önce mevcut radyoyu durdur, sonra yeni radyoyu çal
        if (audioState.isPlaying) {
          await simpleBackgroundAudioService.stop();
        }
        setCurrentStation(station);
        await simpleBackgroundAudioService.play(station);
        // Mini player açma logic'ini useEffect'e bıraktık
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
    simpleBackgroundAudioService.stop();
    setIsMiniPlayerOpen(false);
    setCurrentStation(null);
    // useEffect mini player'ı otomatik olarak gizleyecek
  };

  const toggleFavorite = async (station: any) => {
    if (isTogglngFavorite === station.id) {
      return;
    }

    try {
      setIsTogglingFavorite(station.id);
      await favoritesService.toggleFavorite(station);
    } catch (error) {
      console.error('Favori toggle hatası:', error);
    } finally {
      setIsTogglingFavorite(null);
    }
  };

  // Logo yükleme hatası durumunda fallback'e geç
  const handleLogoError = (stationId: string) => {
    setFailedLogos(prev => new Set([...prev, stationId]));
  };

  // Klavyeyi kapat
  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  // Logo bileşeni
  const RadioLogo = ({ station }: { station: any }) => {
    const shouldShowFallback = !station.favicon || failedLogos.has(station.id);
    
    if (shouldShowFallback) {
      return (
        <View style={styles.defaultLogo}>
          <Text style={styles.defaultLogoText}>
            {station.name.charAt(0).toUpperCase()}
          </Text>
        </View>
      );
    }
    
    return (
      <Image 
        source={{ uri: station.favicon }}
        style={styles.radioLogo}
        onError={() => handleLogoError(station.id)}
        defaultSource={require('./assets/icon.png')}
      />
    );
  };
  // Radyoları favori durumuna göre sırala ve arama filtresini uygula
  const filteredRadios = allStations.filter(station => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    const searchableText = [
      station.name,
      station.description
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
    const aIsFavorite = favorites.some(fav => fav.id === a.id);
    const bIsFavorite = favorites.some(fav => fav.id === b.id);
    
    if (aIsFavorite && !bIsFavorite) return -1;
    if (!aIsFavorite && bIsFavorite) return 1;
    return 0;
  });
  const renderStation = ({ item, index }: { item: any; index: number }) => {
    const isCurrentlyPlaying = audioState.currentStation?.id === item.id && audioState.isPlaying;
    const isLoading = audioState.currentStation?.id === item.id && audioState.isLoading;
    const isFavorite = favorites.some(fav => fav.id === item.id);
    const isFavoriteToggling = isTogglngFavorite === item.id;
    
    // Prevent double-tap by checking if this station is currently loading
    const isDisabled = isLoading || (audioState.isLoading && audioState.currentStation?.id !== item.id);
    
    // Alternatif arka plan rengi (zebra deseni)
    const isEvenIndex = index % 2 === 0;
    const alternateBackgroundColor = isEvenIndex ? '#FFFFFF' : '#F8F9FA';
    
    const CardContent = () => (
      <>
        <View style={styles.stationInfo}>
          <View style={styles.stationHeader}>
            {/* Radyo Logosu */}
            <View style={styles.logoContainer}>
              <RadioLogo station={item} />
            </View>
            
            <View style={styles.stationTextContainer}>
              <Text style={[
                styles.stationName,
                isFavorite && styles.favoriteStationName,
                isCurrentlyPlaying && { color: 'white' }
              ]}>
                {item.name}
              </Text>
              <Text style={[
                styles.stationDesc,
                isCurrentlyPlaying && { color: 'rgba(255, 255, 255, 0.8)' }
              ]}>
                {item.description}
              </Text>
              {item.votes && (
                <Text style={[
                  styles.stationVotes,
                  isCurrentlyPlaying && { color: 'rgba(255, 255, 255, 0.7)' }
                ]}>
                  👍 {item.votes} oy • {item.bitrate}kbps
                </Text>
              )}
            </View>
          </View>
        </View>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.favoriteButton, 
              (isDisabled || isFavoriteToggling) && { opacity: 0.5 }
            ]}
            onPress={() => !isDisabled && !isFavoriteToggling && toggleFavorite(item)}
            disabled={isDisabled || isFavoriteToggling}
          >
            {isFavoriteToggling ? (
              <ActivityIndicator size="small" color="#FF6B35" />
            ) : (
              <Ionicons 
                name={isFavorite ? "heart" : "heart-outline"} 
                size={isSamsungS9Like ? 22 : isSmallScreen ? 20 : 24} 
                color={isFavorite ? "#FF6B35" : (isCurrentlyPlaying ? "white" : "#9CA3AF")} 
              />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.playButton}
            onPress={() => !isDisabled && togglePlayPause(item)}
            disabled={isDisabled}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={isCurrentlyPlaying ? "white" : "#FF6B35"} />
            ) : (
              <Ionicons 
                name={isCurrentlyPlaying ? "pause-circle" : "play-circle"} 
                size={isSamsungS9Like ? 36 : isSmallScreen ? 32 : 40} 
                color={isDisabled ? "#9CA3AF" : (isCurrentlyPlaying ? "white" : "#FF6B35")} 
              />
            )}
          </TouchableOpacity>
        </View>
      </>
    );
    
    if (isCurrentlyPlaying) {
      return (
        <TouchableOpacity
          onPress={() => !isDisabled && playRadio(item)}
          disabled={isDisabled}
          style={[styles.stationCardContainer, isDisabled && styles.disabledCard]}
        >
          <LinearGradient
            colors={['#FF6B35', '#F59E0B']}
            style={styles.playingStationCard}
          >
            <CardContent />
          </LinearGradient>
        </TouchableOpacity>
      );
    }
    
    return (
      <TouchableOpacity
        style={[
          styles.stationCard,
          { backgroundColor: alternateBackgroundColor }, // Alternatif arka plan rengi
          isDisabled && styles.disabledCard
        ]}
        onPress={() => !isDisabled && playRadio(item)}
        disabled={isDisabled}
      >
        <CardContent />
      </TouchableOpacity>
    );
  };

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <View style={styles.container}>
        <StatusBar style="light" />
          <LinearGradient
          colors={['#FF6B35', '#F59E0B']}
          style={styles.header}
        >
          <Text style={styles.title}>🎧 RADYO ÇINARI</Text>
          <Text style={styles.subtitle}>🇹🇷 {RADIO_STATS.totalStations} Popüler Türk Radyosu • Test Edildi ✅</Text>
          <View style={styles.headerStats}>
            <Text style={styles.stationCount}>
              {searchQuery 
                ? `${filteredRadios.length}/${allStations.length} İstasyon` 
                : `${allStations.length} İstasyon`
              } • 🎵 {RADIO_STATS.categories.Müzik} Müzik • 📰 {RADIO_STATS.categories.Haber} Haber • 🕌 {RADIO_STATS.categories.Dini} Dini
            </Text>
            <TouchableOpacity 
              style={styles.favoritesHeaderButton}
              onPress={() => setIsFavoritesOpen(true)}
            >
              <Ionicons name="heart" size={18} color="white" />
              <Text style={styles.favoritesHeaderText}>{favorites.length} Favori</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

      {/* Arama Çubuğu */}
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.95)', 'rgba(248, 250, 252, 0.9)']}
        style={styles.searchContainer}
      >
        <TouchableWithoutFeedback>
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
        </TouchableWithoutFeedback>
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
          <Text style={styles.sectionTitle}>📻 Radyo İstasyonları ({new Date(RADIO_STATS.lastUpdated).toLocaleDateString('tr-TR')} güncel)</Text>
        </View>
        <FlatList
          data={sortedRadios}
          renderItem={({ item, index }) => renderStation({ item, index })}
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
        onToggleFavorite={toggleFavorite}
        isFavorite={audioState.currentStation ? favorites.some(fav => fav.id === audioState.currentStation.id) : false}
      />

      {/* Favoriler Sayfası */}
      <FavoritesPage
        isVisible={isFavoritesOpen}
        onClose={() => setIsFavoritesOpen(false)}
        favorites={favorites.map(fav => fav.id)}
        allStations={allStations}
        onToggleFavorite={(stationId) => {
          const station = allStations.find(s => s.id === stationId);
          if (station) toggleFavorite(station);
        }}
        onPlayRadio={playRadio}
        audioState={audioState}
      />
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingTop: isSmallScreen ? 50 : isSamsungS9Like ? 55 : 60,
    paddingBottom: isSmallScreen ? 20 : isSamsungS9Like ? 25 : 30,
    paddingHorizontal: isSmallScreen ? 16 : 20,
    alignItems: 'center',
  },
  title: {
    fontSize: fontSize.title,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontSize.subtitle,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
    textAlign: 'center',
    paddingHorizontal: isSmallScreen ? 10 : 0,
  },
  headerStats: {
    flexDirection: isSmallScreen ? 'column' : 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    gap: isSmallScreen ? 8 : 0,
  },
  stationCount: {
    fontSize: isSmallScreen ? 12 : 14,
    color: 'rgba(255, 255, 255, 0.9)',
    flex: isSmallScreen ? 0 : 1,
    textAlign: isSmallScreen ? 'center' : 'left',
  },
  favoritesHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingHorizontal: isSmallScreen ? 10 : 12,
    paddingVertical: isSmallScreen ? 4 : 6,
    gap: 6,
  },
  favoritesHeaderText: {
    color: 'white',
    fontSize: isSmallScreen ? 12 : 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingBottom: 90, // Sadece mini player için yer bırak
  },
  searchContainer: {
    paddingHorizontal: 0, // Sağa sola sıfır
    paddingVertical: 15,
    backgroundColor: '#F3F4F6', // Koyu gri arka plan
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(229, 231, 235, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF', // Beyaz input alanı
    borderRadius: 0, // Köşe yuvarlaklığını kaldır
    borderWidth: 0, // Border'ı kaldır
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 0, // Yan margin sıfır
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
    padding: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  searchResultContainer: {
    marginTop: 12,
    marginHorizontal: 16, // Sadece yan margin
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 53, 0.08)', // Daha hafif turuncu
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.15)',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
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
    fontSize: isSmallScreen ? 16 : isSamsungS9Like ? 18 : 20,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
  },
  sectionHeader: {
    flexDirection: isSmallScreen ? 'column' : 'row',
    justifyContent: 'space-between',
    alignItems: isSmallScreen ? 'flex-start' : 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
    gap: isSmallScreen ? 10 : 0,
  },
  listContainer: {
    paddingBottom: 20, // Sadece alt boşluk (scroll için)
  },
  stationCard: {
    // backgroundColor dinamik olarak ayarlanıyor
    padding: cardPadding,
    borderRadius: 0,
    marginBottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: logoSize + (cardPadding * 2),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stationCardContainer: {
    marginBottom: 0, // Alt boşluk sıfırlandı
    borderRadius: 0, // Köşe yuvarlaklığı kaldırıldı
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  playingStationCard: {
    padding: cardPadding,
    borderRadius: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: logoSize + (cardPadding * 2),
  },
  stationInfo: {
    flex: 1,
  },
  stationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  logoContainer: {
    width: logoSize,
    height: logoSize,
    marginRight: 12,
    borderRadius: logoSize / 2,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  radioLogo: {
    width: '100%',
    height: '100%',
    borderRadius: logoSize / 2,
  },
  defaultLogo: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: logoSize / 2,
  },
  defaultLogoText: {
    color: 'white',
    fontSize: logoSize * 0.4,
    fontWeight: 'bold',
  },
  stationTextContainer: {
    flex: 1,
  },
  stationName: {
    fontSize: fontSize.stationName,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  favoriteStationName: {
    color: '#FF6B35',
    fontWeight: 'bold',
  },
  stationDesc: {
    fontSize: fontSize.stationDesc,
    color: '#6B7280',
    marginBottom: 2,
  },
  stationVotes: {
    fontSize: fontSize.stationVotes,
    color: '#9CA3AF',
    marginTop: 2,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: isSmallScreen ? 4 : isSamsungS9Like ? 6 : 8,
  },
  favoriteButton: {
    padding: isSmallScreen ? 6 : 8,
  },
  playButton: {
    padding: isSmallScreen ? 3 : 5,
  },
  favoriteCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#FF6B35',
    backgroundColor: '#FFFFFF', // Normal beyaz arka plan
  },
  currentlyPlayingCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
    backgroundColor: '#FFF7ED', // Hafif turuncu ton (header ile uyumlu)
  },
  disabledCard: {
    opacity: 0.6,
  },
});
