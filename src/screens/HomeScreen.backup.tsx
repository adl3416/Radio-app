import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { RadioStationCard } from '../components/RadioStationCard';
import { RADIO_STATIONS, CATEGORIES, RadioStation } from '../constants/radioStations';
import { radioBrowserService, ProcessedRadioStation } from '../services/radioBrowserService';
import { audioService } from '../services/audioService';

interface HomeScreenProps {
  onStationPress: (station: RadioStation) => void;
  onOpenPlayer: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onStationPress,
  onOpenPlayer,
}) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tümü');
  const [filteredStations, setFilteredStations] = useState<RadioStation[]>(RADIO_STATIONS);
  const [refreshing, setRefreshing] = useState(false);
  const [useAPI, setUseAPI] = useState(true); // API kullanımı varsayılan açık
  const [apiStations, setApiStations] = useState<ProcessedRadioStation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (useAPI) {
      fetchRadioStations();
    } else {
      filterStations();
    }
  }, [searchQuery, selectedCategory, useAPI]);

  const fetchRadioStations = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching Turkish radio stations from API...');
      
      let stations: ProcessedRadioStation[] = [];
      
      if (searchQuery.trim()) {
        stations = await radioBrowserService.searchStations(searchQuery, 'TR');
      } else {
        stations = await radioBrowserService.getTurkishStations();
      }
      
      console.log(`📻 Found ${stations.length} stations from API`);
      setApiStations(stations);
    } catch (error) {
      console.error('Failed to fetch radio stations:', error);
      // Fallback to local stations on error
      setUseAPI(false);
      filterStations();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    filterStations();
  }, [searchQuery, selectedCategory]);
  const filterStations = () => {
    let filtered = RADIO_STATIONS;

    // Filter by category
    if (selectedCategory !== 'Tümü') {
      filtered = filtered.filter(station => station.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(station =>
        station.name.toLowerCase().includes(query) ||
        station.description.toLowerCase().includes(query) ||
        station.genre.toLowerCase().includes(query) ||
        station.city?.toLowerCase().includes(query)
      );
    }

    setFilteredStations(filtered);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    if (useAPI) {
      await fetchRadioStations();
    } else {
      filterStations();
    }
    setRefreshing(false);
  };

  const handleToggleAPI = (value: boolean) => {
    setUseAPI(value);
    setSearchQuery(''); // Clear search when switching
  };

  // Convert API station to local station format
  const convertToRadioStation = (apiStation: ProcessedRadioStation): RadioStation => ({
    id: apiStation.id,
    name: apiStation.name,
    description: apiStation.description,
    streamUrl: apiStation.streamUrl,
    imageUrl: apiStation.imageUrl,
    category: apiStation.category,
    isLive: apiStation.isLive,
    genre: apiStation.genre,
    city: apiStation.city,
    website: apiStation.website,
  });

  const getCurrentStations = (): RadioStation[] => {
    if (useAPI) {
      return apiStations.map(convertToRadioStation);
    }
    return filteredStations;
  };
        station.genre.toLowerCase().includes(query) ||
        station.city?.toLowerCase().includes(query)
      );
    }

    setFilteredStations(filtered);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh delay
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleStationPlay = (station: RadioStation) => {
    onOpenPlayer();
  };

  const renderCategoryItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      onPress={() => setSelectedCategory(item)}
      className={`px-4 py-2 rounded-full mr-3 ${
        selectedCategory === item
          ? 'bg-blue-500'
          : 'bg-gray-100'
      }`}
    >
      <Text
        className={`font-medium ${
          selectedCategory === item
            ? 'text-white'
            : 'text-gray-700'
        }`}
      >
        {item}
      </Text>
    </TouchableOpacity>
  );

  const renderStationItem = ({ item }: { item: RadioStation }) => (
    <RadioStationCard
      station={item}
      onPress={onStationPress}
      onPlay={handleStationPlay}
    />
  );

  const popularStations = RADIO_STATIONS.slice(0, 4);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-4 border-b border-gray-100">
        <Text className="text-2xl font-bold text-gray-900 mb-4">
          {t('screens.home.title')}
        </Text>
        
        {/* Search Bar */}
        <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
          <Ionicons name="search" size={20} color="#6B7280" />
          <TextInput
            placeholder={t('screens.home.searchPlaceholder')}
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 ml-3 text-gray-900"
            placeholderTextColor="#6B7280"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Categories */}
        <View className="py-4">
          <Text className="text-lg font-semibold text-gray-900 px-4 mb-3">
            {t('common.categories')}
          </Text>
          <FlatList
            data={CATEGORIES}
            renderItem={renderCategoryItem}
            keyExtractor={(item) => item}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16 }}
          />
        </View>

        {/* Popular Stations (when no search) */}
        {!searchQuery && selectedCategory === 'Tümü' && (
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-900 px-4 mb-3">
              {t('screens.home.popularStations')}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16 }}
            >
              {popularStations.map((station) => (
                <View key={station.id} className="w-40 mr-3">
                  <RadioStationCard
                    station={station}
                    onPress={onStationPress}
                    onPlay={handleStationPlay}
                  />
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* All Stations */}
        <View className="flex-1 px-4">
          <Text className="text-lg font-semibold text-gray-900 mb-3">
            {searchQuery || selectedCategory !== 'Tümü'
              ? `Sonuçlar (${filteredStations.length})`
              : t('screens.home.allStations')
            }
          </Text>
          
          {filteredStations.length === 0 ? (
            <View className="flex-1 justify-center items-center py-12">
              <Ionicons name="search" size={48} color="#9CA3AF" />
              <Text className="text-gray-500 text-lg mt-4">Sonuç bulunamadı</Text>
              <Text className="text-gray-400 text-sm mt-2 text-center">
                Arama kriterlerinizi değiştirip tekrar deneyin
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredStations}
              renderItem={renderStationItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
