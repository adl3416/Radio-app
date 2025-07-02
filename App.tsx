import React, { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Alert, AppState, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { simpleRadioAudioService } from './src/services/simpleRadioAudioService';
import { favoritesService } from './src/services/favoritesService';
import { FullPlayer } from './src/components/NewPlayer';
import { ModernFooterPlayer } from './src/components/ModernFooterPlayer';
// Test için import
import TestModernFooterPlayerSwipe from './src/components/__test__ModernFooterPlayerSwipe';
import { FavoritesPage } from './src/screens/FavoritesPage';
import { AppProvider } from './src/contexts/AppContext';
import { RADIO_STATIONS, RadioStation } from './src/constants/radioStations';

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
  stationName: isSmallScreen ? 13 : isSamsungS9Like ? 15 : 16,
  stationDesc: isSmallScreen ? 11 : isSamsungS9Like ? 13 : 14,
  stationVotes: isSmallScreen ? 9 : isSamsungS9Like ? 11 : 12,
};

// Çalışan radyolar - güncellenmiş liste
const TURKISH_RADIOS = RADIO_STATIONS.map((station: RadioStation) => ({
  id: station.id,
  name: station.name,
  url: station.url,
  description: station.description || 'Türk Radyosu',
  favicon: station.favicon || '',
  category: station.category,
  isLive: station.isLive,
  votes: station.votes || 0,
  bitrate: station.bitrate || 128,
  protected: true,
}));

// Basit audio service - tüm platformlar için
const audioService = simpleRadioAudioService;

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}

import { Animated, Easing } from 'react-native';

function MainApp() {
  // 🎉 RADYO SAYISI KONTROLÜ
  console.log(`🎵 TOPLAM ${RADIO_STATIONS.length} RADYO İSTASYONU YÜKLENDİ!`);
  console.log(`📻 İlk 5 Radyo:`, RADIO_STATIONS.slice(0, 5).map(r => r.name));
  
  const insets = useSafeAreaInsets();
  // const [isMiniPlayerOpen, setIsMiniPlayerOpen] = useState(false); // REMOVED - No mini player
  const [isFullPlayerOpen, setIsFullPlayerOpen] = useState(false);
  // Büyük player animasyonu için değer (0: mini, 1: full)
  const playerTransition = useRef(new Animated.Value(0)).current;
  // Pan state
  const [isPanning, setIsPanning] = useState(false);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [currentStation, setCurrentStation] = useState<any>(null);
  const [audioState, setAudioState] = useState(audioService.getState());
  const [favorites, setFavorites] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isTogglngFavorite, setIsTogglingFavorite] = useState<string | null>(null);
  const [failedLogos, setFailedLogos] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Favorileri yükle
    const unsubscribeFavorites = favoritesService.subscribe(setFavorites);

    // App state change listener - arka plan için kritik
    const handleAppStateChange = (nextAppState: string) => {
      console.log('📱 App state changed to:', nextAppState);
      
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        console.log('📱 App going to background - keeping audio alive');
        // Arka plana geçerken audio'yu canlı tut
        // Audio service kendi kendini yönetiyor
      } else if (nextAppState === 'active') {
        console.log('📱 App coming to foreground');
        // Ön plana gelirken state'i kontrol et
        const currentState = audioService.getState();
        if (currentState.currentStation) {
          setCurrentStation(currentState.currentStation);
          setAudioState(currentState);
          
          // Mini player removed - no longer showing mini player
          // if (currentState.isPlaying && !isFullPlayerOpen) {
          //   setIsMiniPlayerOpen(true);
          // }
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    // Audio service'i başlat
    audioService.initialize();
    
    // Subscribe to audio state changes
    const audioUnsubscribe = audioService.subscribe((state) => {
      setAudioState(state);
      if (state.currentStation) {
        setCurrentStation(state.currentStation);
      }
    });
    
    return () => {
      audioUnsubscribe();
      unsubscribeFavorites();
      subscription?.remove();
    };
  }, []);

  // Mini player visibility kontrolü - REMOVED (no mini player)
  // useEffect(() => {
  //   const hasActiveStation = audioState.currentStation || currentStation;
  //   const shouldShowMiniPlayer = hasActiveStation && !isFullPlayerOpen;
  //   
  //   console.log('🎮 Mini player visibility check:', {
  //     currentStation: audioState.currentStation?.name || currentStation?.name,
  //     isPlaying: audioState.isPlaying,
  //     isLoading: audioState.isLoading,
  //     shouldShowMiniPlayer,
  //     isMiniPlayerOpen,
  //     isFullPlayerOpen
  //   });
  //   
  //   if (shouldShowMiniPlayer && !isMiniPlayerOpen) {
  //     console.log('📱 Opening mini player - conditions met');
  //     setIsMiniPlayerOpen(true);
  //   } else if (!shouldShowMiniPlayer && isMiniPlayerOpen) {
  //     console.log('📱 Closing mini player - conditions not met');
  //     setIsMiniPlayerOpen(false);
  //   }
  // }, [audioState.currentStation, currentStation, isFullPlayerOpen, audioState.isPlaying]);

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
      console.log('🎵 Playing radio:', station.name, Platform.OS);
      
      // Eğer farklı bir radyo çalıyorsa önce durdur
      if (audioState.isPlaying && audioState.currentStation?.id !== station.id) {
        await audioService.stop();
      }
      
      setCurrentStation(station);
      await audioService.play(station);
      
      // Hata durumunu kontrol et
      setTimeout(() => {
        const currentState = audioService.getState();
        if (currentState.error) {
          Alert.alert('Uyarı', currentState.error);
        }
      }, 3000);
      
    } catch (error) {
      console.error('❌ Play radio error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Radyo çalınamadı';
      
      if (errorMessage.includes('autoplay') || errorMessage.includes('user interaction')) {
        Alert.alert('Bilgi', 'Tarayıcı güvenlik politikası nedeniyle radyo otomatik başlamadı. Lütfen tekrar tıklayın.');
      } else {
        Alert.alert('Hata', errorMessage);
      }
    }
  };

  const togglePlayPause = async (station: any) => {
    try {
      console.log('🎵 Station card pressed for:', station.name);
      
      // Eğer aynı radyo çalıyorsa pause/resume yap
      if (audioState.currentStation?.id === station.id && audioState.isPlaying) {
        console.log('⏸️ Pausing current station');
        await audioService.pause();
        return;
      } else if (audioState.currentStation?.id === station.id && !audioState.isPlaying) {
        console.log('▶️ Resuming current station');
        await audioService.resume();
        return;
      }
      
      console.log('🔄 Playing new station:', station.name);
      
      // Stop any current audio first
      if (audioState.isPlaying) {
        await audioService.stop();
        // Kısa bekleme ile state'in güncellenmesini sağla
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Set the station immediately (no mini player)
      setCurrentStation(station);
      // setIsMiniPlayerOpen(true); // REMOVED - No mini player
      
      // Start playing
      await audioService.play(station);
      
      console.log('✅ Radio started successfully');
    } catch (error) {
      console.error('❌ Radio play error:', error);
      Alert.alert('Hata', 'Radyo çalınamadı. Lütfen tekrar deneyin.');
    }
  };

  // Player handler functions
  const handleExpandPlayer = () => {
    console.log('🔍 Expand player button pressed');
    console.log('🔍 Current state:', { isFullPlayerOpen });
    setIsFullPlayerOpen(true);
    // Mini player'ı kapatmayacağız, full player açıkken gizli olur
  };

  const handleCollapsePlayer = () => {
    console.log('🔽 Collapse player button pressed');
    setIsFullPlayerOpen(false);
    // Mini player otomatik olarak tekrar görünür olacak
  };

  const handleCloseMiniPlayer = () => {
    console.log('❌ Close mini player button pressed');
    audioService.stop();
    // setIsMiniPlayerOpen(false); // REMOVED - No mini player
    setCurrentStation(null);
    setIsFullPlayerOpen(false);
    console.log('✅ Mini player closed and audio stopped');
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
    const station = allStations.find(s => s.id === stationId);
    console.log(`❌ Logo yüklenemedi: ${station?.name} - ${station?.favicon}`);
    setFailedLogos(prev => new Set([...prev, stationId]));
  };

  // Klavyeyi kapat
  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  // Logo bileşeni - Modern yuvarlak tasarım with enhanced error handling
  const RadioLogo = ({ station, size = 50 }: { station: any, size?: number }) => {
    const shouldShowFallback = !station.favicon || failedLogos.has(station.id);
    
    // Kral FM için özel logo kontrolü
    if (station.name.toLowerCase().includes('kral')) {
      return (
        <Image 
          source={require('./assets/kral.png')}
          style={[styles.modernRadioLogo, { width: size, height: size, borderRadius: size / 2 }]}
          onError={(error) => {
            console.log(`❌ Kral FM logo hatası:`, error.nativeEvent);
            handleLogoError(station.id);
          }}
        />
      );
    }
    
    // Super FM için özel logo kontrolü
    if (station.name.toLowerCase().includes('super')) {
      return (
        <Image 
          source={require('./assets/super.png')}
          style={[styles.modernRadioLogo, { width: size, height: size, borderRadius: size / 2 }]}
          onError={(error) => {
            console.log(`❌ Super FM logo hatası:`, error.nativeEvent);
            handleLogoError(station.id);
          }}
        />
      );
    }
    
    if (shouldShowFallback) {
      return (
        <View style={[styles.modernDefaultLogo, { width: size, height: size, borderRadius: size / 2 }]}>
          <Text style={[styles.modernDefaultLogoText, { fontSize: size * 0.4 }]}>
            {station.name.charAt(0).toUpperCase()}
          </Text>
        </View>
      );
    }
    
    // Logo URL validation and fallback logic
    const logoUrl = station.favicon || 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Radio_icon.svg/32px-Radio_icon.svg.png';
    
    return (
      <Image 
        source={{ uri: logoUrl }}
        style={[styles.modernRadioLogo, { width: size, height: size, borderRadius: size / 2 }]}
        onError={(error) => {
          console.log(`❌ Logo yükleme hatası: ${station.name} - ${logoUrl}`, error.nativeEvent);
          handleLogoError(station.id);
        }}
        onLoadStart={() => {
          console.log(`🖼️ Logo yükleniyor: ${station.name} - ${logoUrl}`);
        }}
        onLoad={() => {
          console.log(`✅ Logo başarıyla yüklendi: ${station.name}`);
        }}
        onLoadEnd={() => {
          console.log(`🏁 Logo yükleme tamamlandı: ${station.name}`);
        }}
        defaultSource={require('./assets/icon.png')}
        resizeMode="cover"
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
    const isCurrentStation = audioState.currentStation?.id === item.id;
    const isLoading = audioState.currentStation?.id === item.id && audioState.isLoading;
    const isFavorite = favorites.some(fav => fav.id === item.id);
    const isFavoriteToggling = isTogglngFavorite === item.id;
    
    // Prevent double-tap by checking if this station is currently loading
    const isDisabled = isLoading || (audioState.isLoading && audioState.currentStation?.id !== item.id);
    
    console.log('🎨 Rendering station card:', {
      stationName: item.name,
      isCurrentStation,
      isCurrentlyPlaying,
      isLoading,
      isDisabled
    });
    
    return (
      <TouchableOpacity
        onPress={() => {
          console.log('🎵 Station card pressed for:', item.name);
          console.log('🎵 Current disabled state:', isDisabled);
          console.log('🎵 Current station ID:', audioState.currentStation?.id, 'vs', item.id);
          if (!isDisabled) {
            togglePlayPause(item);
          } else {
            console.log('❌ Station card press blocked - disabled');
          }
        }}
        style={[
          styles.modernStationCard, 
          isCurrentStation && styles.modernStationCardActive
        ]}
        activeOpacity={0.7}
      >
        {/* Sol tarafta yuvarlak logo */}
        <View style={styles.modernLogoContainer}>
          <RadioLogo station={item} size={50} />
          {isCurrentlyPlaying && (
            <View style={styles.playingIndicator}>
              <Ionicons name="play-circle" size={16} color="#FF6B35" />
            </View>
          )}
        </View>
        
        {/* Orta kısımda radyo bilgileri */}
        <View style={styles.modernStationInfo}>
          <Text 
            style={[
              styles.modernStationName, 
              isCurrentStation && { color: 'white' }
            ]} 
            numberOfLines={1}
          >
            {item.name}
          </Text>
          <Text 
            style={[
              styles.modernStationCategory, 
              isCurrentStation && { color: 'rgba(255, 255, 255, 0.8)' }
            ]} 
            numberOfLines={1}
          >
            {item.category || 'Genel'} {item.codec && `• ${item.codec}`}
          </Text>
        </View>
        
        {/* Sağ tarafta oynatma butonu ve favoriler */}
        <View style={styles.modernButtonContainer}>
          <TouchableOpacity
            style={[styles.modernFavoriteButton, isFavorite && styles.modernFavoriteActive]}
            onPress={(e) => {
              e.stopPropagation();
              !isDisabled && !isFavoriteToggling && toggleFavorite(item);
            }}
          >
            <Ionicons 
              name={isFavorite ? "heart" : "heart-outline"} 
              size={18} 
              color={isFavorite ? "#FF6B35" : "#9CA3AF"} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.modernPlayButton}
            onPress={() => {
              console.log('🎵 Play button pressed for:', item.name);
              !isDisabled && togglePlayPause(item);
            }}
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#FF6B35" />
              </View>
            ) : (
              <Ionicons 
                name={isCurrentlyPlaying ? "pause" : "play"} 
                size={20} 
                color="#FF6B35" 
              />
            )}
          </TouchableOpacity>
        </View>
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
          <View style={styles.headerContent}>
            <Text style={styles.title}>🎧 RADYO ÇINARI</Text>
            <TouchableOpacity 
              style={styles.favoritesHeaderButton}
              onPress={() => setIsFavoritesOpen(true)}
            >
              <Ionicons name="heart" size={18} color="white" />
              <Text style={styles.favoritesHeaderText}>{favorites.length}</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

      {/* Popüler Radyolar - Yuvarlak Logo Çubuğu */}
      <View style={styles.popularRadiosBar}>
        <FlatList
          horizontal
          data={allStations.slice(0, 10)} // İlk 10 radyo
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.popularRadioItem}
              onPress={() => togglePlayPause(item)}
            >
              <View style={styles.popularRadioLogo}>
                <RadioLogo station={item} size={44} />
                {audioState.currentStation?.id === item.id && audioState.isPlaying && (
                  <View style={styles.popularPlayingIndicator}>
                    <Ionicons name="play-circle" size={14} color="#FF6B35" />
                  </View>
                )}
              </View>
              <Text style={styles.popularRadioName} numberOfLines={1}>
                {item.name.length > 10 ? item.name.substring(0, 8) + '...' : item.name}
              </Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.popularRadiosList}
        />
      </View>

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
          <Text style={styles.sectionTitle}>📻 Radyo İstasyonları ({new Date().toLocaleDateString('tr-TR')} güncel)</Text>
        </View>
        <FlatList
          data={sortedRadios}
          renderItem={({ item, index }) => renderStation({ item, index })}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.listContainer,
            { paddingBottom: 210 + insets.bottom + 20 } // Mini player yüksekliği + safe area + extra space
          ]}
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
        />
      </View>

      {/* Mini Player - KALDIRILDI */}
      {/* MiniPlayer component removed to eliminate footer player */}

      {/* Modern Footer Player */}

      {/* TEST: Sadece swipe animasyonunu izlemek için aşağıdaki satırı aktif bırakın */}
      {/* <TestModernFooterPlayerSwipe /> */}

      {/* Gerçek uygulama için aşağıdaki satırı aktif bırakın */}
      <ModernFooterPlayer 
        onPress={() => {
          Animated.timing(playerTransition, {
            toValue: 1,
            duration: 600,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }).start(() => setIsFullPlayerOpen(true));
        }}
        onSwipeUpProgress={(progress: number) => {
          setIsPanning(true);
          // Daha yavaş ve yumuşak geçiş için ilerlemeyi easeOut ile yavaşlat
          const eased = Math.pow(progress, 1.7); // 1.5-2 arası değerler yavaşlatır
          playerTransition.setValue(eased);
        }}
        onSwipeUpEnd={(completed: boolean) => {
          if (completed) {
            Animated.timing(playerTransition, {
              toValue: 1,
              duration: 600, // Daha yavaş ve yumuşak tam açılma
              easing: Easing.out(Easing.cubic),
              useNativeDriver: false,
            }).start(() => {
              setIsFullPlayerOpen(true);
              setIsPanning(false);
            });
          } else {
            Animated.timing(playerTransition, {
              toValue: 0,
              duration: 400,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: false,
            }).start(() => {
              setIsPanning(false);
            });
          }
        }}
        isPanning={isPanning}
        playerTransition={playerTransition}
      />

      {/* Full Player */}

      {/* Full Player Animasyonlu */}
      <Animated.View
        pointerEvents={isFullPlayerOpen || isPanning ? 'auto' : 'none'}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          zIndex: 9999,
          opacity: playerTransition.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 0.5, 1] }),
          transform: [
            {
              translateY: playerTransition.interpolate({
                inputRange: [0, 1],
                outputRange: [600, 0],
              }),
            },
          ],
        }}
      >
        <FullPlayer
          isVisible={isFullPlayerOpen || isPanning}
          onCollapse={() => {
            Animated.timing(playerTransition, {
              toValue: 0,
              duration: 300,
              useNativeDriver: false,
            }).start(() => {
              setIsFullPlayerOpen(false);
              setIsPanning(false);
            });
          }}
          onNext={playNextRadio}
          onPrevious={playPreviousRadio}
          onToggleFavorite={toggleFavorite}
          isFavorite={audioState.currentStation ? favorites.some(fav => fav.id === audioState.currentStation.id) : false}
        />
      </Animated.View>

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
    paddingTop: isSmallScreen ? 25 : isSamsungS9Like ? 28 : 30,
    paddingBottom: isSmallScreen ? 10 : isSamsungS9Like ? 12 : 15,
    paddingHorizontal: isSmallScreen ? 16 : 20,
    alignItems: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: fontSize.title,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
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
  
  // Modern tasarım stilleri
  modernStationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 4,
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  
  modernLogoContainer: {
    position: 'relative',
    marginRight: 12,
  },
  
  playingIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 2,
  },
  
  modernStationInfo: {
    flex: 1,
    marginRight: 8,
  },
  
  modernStationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  
  modernStationCategory: {
    fontSize: 13,
    color: '#6B7280',
  },
  
  modernButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  
  modernFavoriteButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  
  modernFavoriteActive: {
    backgroundColor: '#FEF3F2',
  },
  
  modernPlayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF3F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  modernDefaultLogo: {
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  modernDefaultLogoText: {
    color: 'white',
    fontWeight: 'bold',
  },
  
  modernRadioLogo: {
    backgroundColor: '#F3F4F6',
  },
  
  // Popüler Radyolar Çubuğu
  popularRadiosBar: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  
  popularRadiosList: {
    paddingHorizontal: 16,
    gap: 16,
  },
  
  popularRadioItem: {
    alignItems: 'center',
    width: 60,
  },
  
  popularRadioLogo: {
    position: 'relative',
    marginBottom: 6,
  },
  
  popularPlayingIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FFFFFF',
    borderRadius: 7,
    padding: 1,
  },
  
  popularRadioName: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  
  // Aktif radyo kartı stili
  modernStationCardActive: {
    backgroundColor: '#FF6B35', // Header turuncusu ile aynı renk
    borderColor: '#F59E0B',
    borderWidth: 2,
    shadowColor: '#FF6B35',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 8,
    transform: [{ scale: 1.02 }],
  },
  
  // Modern loading animations
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
