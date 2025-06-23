import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { RadioStationCard } from '../components/RadioStationCard';
import { RADIO_STATIONS, CATEGORIES, RadioStation } from '../constants/radioStations';
import { radioBrowserService, ProcessedRadioStation } from '../services/radioBrowserService';

interface HomeScreenProps {
  onStationPress: (station: RadioStation) => void;
  onOpenPlayer: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onStationPress,
  onOpenPlayer,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tümü');
  const [filteredStations, setFilteredStations] = useState<RadioStation[]>(RADIO_STATIONS);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [useApiStations, setUseApiStations] = useState(true);
  const [apiStations, setApiStations] = useState<ProcessedRadioStation[]>([]);

  useEffect(() => {
    loadRadioStations();
  }, []);

  useEffect(() => {
    filterStations();
  }, [searchQuery, selectedCategory, apiStations, useApiStations]);

  const loadRadioStations = async () => {
    setLoading(true);
    try {
      console.log('Loading Turkish radio stations from Radio Browser API...');
      const turkishStations = await radioBrowserService.getTurkishStations();
      setApiStations(turkishStations);
      console.log(`Loaded ${turkishStations.length} stations from API`);
    } catch (error) {
      console.error('Failed to load API stations:', error);
      Alert.alert(
        'API Hatası',
        'Canlı radyo verileri yüklenemedi. Yerel liste kullanılacak.',
        [
          { text: 'Tamam' },
          { 
            text: 'Tekrar Dene', 
            onPress: () => loadRadioStations() 
          }
        ]
      );
      setUseApiStations(false);
    } finally {
      setLoading(false);
    }
  };

  const filterStations = () => {
    const stationsToFilter = useApiStations && apiStations.length > 0 
      ? apiStations 
      : RADIO_STATIONS;

    let filtered = stationsToFilter;

    if (selectedCategory !== 'Tümü') {
      filtered = filtered.filter(station => station.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(station =>
        station.name.toLowerCase().includes(query) ||
        station.description.toLowerCase().includes(query) ||
        station.genre.toLowerCase().includes(query) ||
        station.city?.toLowerCase().includes(query)
      );
    }

    setFilteredStations(filtered as RadioStation[]);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (useApiStations) {
        await loadRadioStations();
      }
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleStationPlay = (station: RadioStation) => {
    console.log('Playing station:', station.name, station.streamUrl);
    onStationPress(station);
    onOpenPlayer();
  };

  const toggleStationSource = () => {
    setUseApiStations(!useApiStations);
    if (!useApiStations && apiStations.length === 0) {
      loadRadioStations();
    }
  };

  const renderCategoryItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      onPress={() => setSelectedCategory(item)}
      style={[
        styles.categoryButton,
        selectedCategory === item ? styles.categoryButtonActive : styles.categoryButtonInactive
      ]}
    >
      <Text
        style={[
          styles.categoryText,
          selectedCategory === item ? styles.categoryTextActive : styles.categoryTextInactive
        ]}
      >
        {item}
      </Text>
    </TouchableOpacity>
  );

  const renderStationItem = ({ item }: { item: RadioStation }) => (
    <View style={styles.stationItemContainer}>
      <TouchableOpacity
        onPress={() => onStationPress(item)}
        style={styles.stationCard}
      >
        <View style={styles.stationInfo}>
          <Text style={styles.stationName}>{item.name}</Text>
          <Text style={styles.stationDescription}>{item.description}</Text>
          <View style={styles.stationMeta}>
            <View style={styles.genreTag}>
              <Text style={styles.genreText}>{item.genre}</Text>
            </View>
            {item.city && (
              <Text style={styles.cityText}>{item.city}</Text>
            )}
            {item.isLive && (
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>CANLI</Text>
              </View>
            )}
          </View>
        </View>
        <TouchableOpacity
          onPress={() => handleStationPlay(item)}
          style={styles.playButton}
        >
          <Ionicons name="play" size={20} color="white" />
        </TouchableOpacity>
      </TouchableOpacity>
    </View>
  );
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Türk Radyosu</Text>
          <TouchableOpacity
            onPress={toggleStationSource}
            style={[
              styles.apiToggleButton,
              useApiStations ? styles.apiToggleActive : styles.apiToggleInactive
            ]}
          >
            <Ionicons 
              name={useApiStations ? "globe" : "home"} 
              size={16} 
              color={useApiStations ? "white" : "#3B82F6"} 
            />
            <Text style={[
              styles.apiToggleText,
              useApiStations ? styles.apiToggleTextActive : styles.apiToggleTextInactive
            ]}>
              {useApiStations ? "Canlı API" : "Yerel"}
            </Text>
          </TouchableOpacity>
        </View>
        
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#3B82F6" />
            <Text style={styles.loadingText}>Canlı radyolar yükleniyor...</Text>
          </View>
        )}
        
        {/* Station Count Info */}
        <View style={styles.infoRow}>
          <Text style={styles.infoText}>
            {useApiStations && apiStations.length > 0 
              ? `${apiStations.length} canlı istasyon` 
              : `${RADIO_STATIONS.length} yerel istasyon`
            }
          </Text>
          {useApiStations && apiStations.length > 0 && (
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>CANLI VERİ</Text>
            </View>
          )}
        </View>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#6B7280" />
          <TextInput
            placeholder="Radyo istasyonu ara..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
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
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Categories */}
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>Kategoriler</Text>
          <FlatList
            data={CATEGORIES}
            renderItem={renderCategoryItem}
            keyExtractor={(item) => item}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
          />
        </View>

        {/* Stations List */}
        <View style={styles.stationsSection}>
          <Text style={styles.sectionTitle}>
            {searchQuery || selectedCategory !== 'Tümü'
              ? `Sonuçlar (${filteredStations.length})`
              : 'Tüm İstasyonlar'
            }
          </Text>
          
          {filteredStations.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="search" size={48} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>Sonuç bulunamadı</Text>
              <Text style={styles.emptySubtitle}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  apiToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  apiToggleActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  apiToggleInactive: {
    backgroundColor: 'white',
    borderColor: '#3B82F6',
  },
  apiToggleText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  apiToggleTextActive: {
    color: 'white',
  },
  apiToggleTextInactive: {
    color: '#3B82F6',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    color: '#111827',
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  categoriesSection: {
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  categoriesList: {
    paddingHorizontal: 16,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
  },
  categoryButtonActive: {
    backgroundColor: '#3B82F6',
  },
  categoryButtonInactive: {
    backgroundColor: '#F3F4F6',
  },
  categoryText: {
    fontWeight: '500',
  },
  categoryTextActive: {
    color: 'white',
  },
  categoryTextInactive: {
    color: '#374151',
  },
  stationsSection: {
    flex: 1,
    paddingHorizontal: 16,
  },
  stationItemContainer: {
    marginBottom: 12,
  },
  stationCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stationInfo: {
    flex: 1,
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
    marginBottom: 8,
  },
  stationMeta: {
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
    marginRight: 8,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
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
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    color: '#6B7280',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});
