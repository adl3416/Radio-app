import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useApp } from '../contexts/AppContext';
import { ModernHeader } from '../components/ModernHeader';
import { ModernSearchAndFilter } from '../components/ModernSearchAndFilter';
import { ModernRadioCard } from '../components/ModernRadioCard';
import { RADIO_STATIONS, CATEGORIES, RadioStation, GUARANTEED_STATIONS } from '../constants/radioStations';
import { radioBrowserService, ProcessedRadioStation } from '../services/radioBrowserService';

const { width } = Dimensions.get('window');

interface ModernHomeScreenProps {
  onStationPress: (station: RadioStation) => void;
  onOpenPlayer: () => void;
}

export const ModernHomeScreen: React.FC<ModernHomeScreenProps> = ({
  onStationPress,
  onOpenPlayer,
}) => {
  const { t } = useTranslation();
  const { colors, isDark, isLoading, setIsLoading } = useApp();
  
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tümü');
  const [filteredStations, setFilteredStations] = useState<RadioStation[]>(GUARANTEED_STATIONS);
  const [refreshing, setRefreshing] = useState(false);
  const [useApiStations, setUseApiStations] = useState(false);
  const [apiStations, setApiStations] = useState<ProcessedRadioStation[]>([]);
  
  // Animation
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);

  useEffect(() => {
    // Load guaranteed stations first
    filterStations();
    
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    filterStations();
  }, [searchQuery, selectedCategory, apiStations, useApiStations]);

  const loadRadioStations = async () => {
    setIsLoading(true);
    try {
      console.log('Loading Turkish radio stations from Radio Browser API...');
      const turkishStations = await radioBrowserService.getTurkishStations();
      setApiStations(turkishStations);
      console.log(`Loaded ${turkishStations.length} stations from API`);
    } catch (error) {
      console.error('Failed to load API stations:', error);
      Alert.alert(
        t('apiError', 'API Hatası'),
        t('apiErrorMessage', 'Canlı radyo verileri yüklenemedi. Garantili istasyonlar kullanılacak.'),
        [
          { text: t('ok', 'Tamam') },
          { 
            text: t('retry', 'Tekrar Dene'), 
            onPress: () => loadRadioStations() 
          },
          {
            text: t('useGuaranteed', 'Garantili İstasyonlar'),
            onPress: () => {
              setUseApiStations(false);
              setSelectedCategory('Tümü');
            }
          }
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const filterStations = () => {
    const stationsToFilter = useApiStations && apiStations.length > 0 
      ? apiStations 
      : GUARANTEED_STATIONS;

    let filtered = stationsToFilter;

    if (selectedCategory !== 'Tümü') {
      filtered = filtered.filter(station => station.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(station =>
        station.name.toLowerCase().includes(query) ||
        (station.description && station.description.toLowerCase().includes(query)) ||
        (station.genre && station.genre.toLowerCase().includes(query)) ||
        (station.city && station.city.toLowerCase().includes(query))
      );
    }

    setFilteredStations(filtered as RadioStation[]);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (useApiStations) {
        await loadRadioStations();
      } else {
        // Refresh guaranteed stations
        setFilteredStations(GUARANTEED_STATIONS);
      }
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleStationPress = (station: RadioStation) => {
    // Show warning for API stations
    if (useApiStations && !station.isGuaranteed && apiStations.length > 0) {
      Alert.alert(
        t('formatWarning', 'Format Uyarısı'),
        t('formatWarningMessage', 'Bu istasyon API\'den geliyor ve format uyumluluğu garanti edilemez. Sorun yaşarsanız "Yerel" seçeneğine geçin.'),
        [
          { text: t('cancel', 'İptal') },
          { 
            text: t('continue', 'Devam Et'), 
            onPress: () => {
              onStationPress(station);
              onOpenPlayer();
            }
          },
          {
            text: t('useGuaranteed', 'Garantili İstasyonlar'),
            onPress: () => {
              setUseApiStations(false);
              setSelectedCategory('Tümü');
            }
          }
        ]
      );
    } else {
      onStationPress(station);
      onOpenPlayer();
    }
  };

  const toggleStationSource = () => {
    setUseApiStations(!useApiStations);
    if (!useApiStations && apiStations.length === 0) {
      loadRadioStations();
    }
  };

  const renderStationItem = ({ item, index }: { item: RadioStation; index: number }) => (
    <ModernRadioCard
      station={item}
      onPress={handleStationPress}
      index={index}
    />
  );

  const renderGuaranteedSection = () => {
    if (useApiStations || searchQuery || selectedCategory !== 'Tümü') {
      return null;
    }

    return (
      <View className="px-6 mb-6">
        <LinearGradient
          colors={isDark 
            ? ['#065F46', '#047857', '#059669']
            : ['#ECFDF5', '#D1FAE5', '#A7F3D0']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="rounded-3xl p-4"
          style={{
            shadowColor: '#10B981',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 12,
            elevation: 6,
          }}
        >
          <View className="flex-row items-center mb-3">
            <Text className="text-2xl mr-2">🛡️</Text>
            <Text
              className="text-lg font-bold"
              style={{ color: isDark ? 'white' : '#065F46' }}
            >
              {t('guaranteedStations', 'Garantili İstasyonlar')}
            </Text>
          </View>
          <Text
            className="text-sm mb-3"
            style={{ color: isDark ? '#A7F3D0' : '#047857' }}
          >
            {t('guaranteedDescription', '%100 MP3 format garantisi • Test edilmiş URL\'ler • Sorunsuz çalma')}
          </Text>
          <View className="flex-row flex-wrap">
            {GUARANTEED_STATIONS.slice(0, 5).map((station, index) => (
              <View
                key={station.id}
                className="bg-white bg-opacity-20 rounded-2xl px-3 py-2 mr-2 mb-2"
              >
                <Text
                  className="text-xs font-medium"
                  style={{ color: isDark ? 'white' : '#065F46' }}
                >
                  {station.name}
                </Text>
              </View>
            ))}
          </View>
        </LinearGradient>
      </View>
    );
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <LinearGradient
        colors={isDark 
          ? ['#0F172A', '#1E293B']
          : ['#F8FAFC', '#FFFFFF']
        }
        className="flex-1"
      >
        {/* Modern Header */}
        <ModernHeader />

        {/* Search and Filter */}
        <ModernSearchAndFilter
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          categories={CATEGORIES}
          stationCount={filteredStations.length}
          isApiMode={useApiStations}
          onApiModeToggle={toggleStationSource}
        />

        {/* Content */}
        <Animated.View
          style={{
            flex: 1,
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          <ScrollView
            className="flex-1"
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={handleRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
            showsVerticalScrollIndicator={false}
          >
            {/* Guaranteed Stations Section */}
            {renderGuaranteedSection()}

            {/* Loading State */}
            {isLoading && (
              <View className="items-center py-8">
                <ActivityIndicator 
                  size="large" 
                  color={colors.primary}
                />
                <Text
                  className="mt-3 text-sm"
                  style={{ color: colors.textSecondary }}
                >
                  {t('loading', 'Yükleniyor...')}
                </Text>
              </View>
            )}

            {/* Stations Grid */}
            {!isLoading && (
              <View className="px-6 pb-6">
                {searchQuery || selectedCategory !== 'Tümü' ? (
                  <Text
                    className="text-lg font-bold mb-4"
                    style={{ color: colors.text }}
                  >
                    {t('searchResults', 'Arama Sonuçları')} ({filteredStations.length})
                  </Text>
                ) : (
                  <Text
                    className="text-lg font-bold mb-4"
                    style={{ color: colors.text }}
                  >
                    {useApiStations 
                      ? t('liveStations', 'Canlı İstasyonlar')
                      : t('allStations', 'Tüm İstasyonlar')
                    }
                  </Text>
                )}

                {filteredStations.length === 0 ? (
                  <View className="items-center py-12">
                    <Text className="text-6xl mb-4">📻</Text>
                    <Text
                      className="text-xl font-bold mb-2"
                      style={{ color: colors.text }}
                    >
                      {t('noResults', 'Sonuç bulunamadı')}
                    </Text>
                    <Text
                      className="text-sm text-center"
                      style={{ color: colors.textSecondary }}
                    >
                      {t('noResultsDescription', 'Arama kriterlerinizi değiştirip tekrar deneyin')}
                    </Text>
                  </View>
                ) : (
                  <FlatList
                    data={filteredStations}
                    renderItem={renderStationItem}
                    keyExtractor={(item) => item.id}
                    numColumns={2}
                    columnWrapperStyle={{ justifyContent: 'space-between' }}
                    scrollEnabled={false}
                    showsVerticalScrollIndicator={false}
                  />
                )}
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </LinearGradient>
    </View>
  );
};
