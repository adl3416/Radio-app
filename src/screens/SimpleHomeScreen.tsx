import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { RADIO_STATIONS, CATEGORIES, RadioStation, Category } from '../constants/radioStations';

interface SimpleHomeScreenProps {
  onStationPress: (station: RadioStation) => void;
  onOpenPlayer: () => void;
}

export const SimpleHomeScreen: React.FC<SimpleHomeScreenProps> = ({
  onStationPress,
  onOpenPlayer,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tümü');
  const [filteredStations, setFilteredStations] = useState<RadioStation[]>(RADIO_STATIONS);

  useEffect(() => {
    filterStations();
  }, [searchQuery, selectedCategory]);

  const filterStations = () => {
    let filtered = RADIO_STATIONS;

    // Category filter
    if (selectedCategory !== 'Tümü') {
      // Find category by name and use its ID for filtering
      const category = CATEGORIES.find(cat => cat.name === selectedCategory);
      if (category) {
        filtered = filtered.filter(station => station.category === category.id);
      }
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(station =>
        station.name.toLowerCase().includes(query) ||
        (station.description && station.description.toLowerCase().includes(query)) ||
        (station.genre && station.genre.toLowerCase().includes(query))
      );
    }

    setFilteredStations(filtered);
  };

  const handleStationPress = (station: RadioStation) => {
    onStationPress(station);
  };

  const renderCategoryItem = ({ item }: { item: Category }) => (
    <TouchableOpacity
      onPress={() => setSelectedCategory(item.name)}
      style={[
        styles.categoryButton,
        selectedCategory === item.name ? styles.categoryButtonActive : styles.categoryButtonInactive
      ]}
    >
      <Text
        style={[
          styles.categoryText,
          selectedCategory === item.name ? styles.categoryTextActive : styles.categoryTextInactive
        ]}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderStationItem = ({ item }: { item: RadioStation }) => (
    <TouchableOpacity
      onPress={() => handleStationPress(item)}
      style={styles.stationCard}
    >
      <View style={styles.stationInfo}>
        <Text style={styles.stationName}>{item.name}</Text>
        {item.description && (
          <Text style={styles.stationDescription}>{item.description}</Text>
        )}
        <View style={styles.stationMeta}>
          {item.genre && (
            <View style={styles.genreTag}>
              <Text style={styles.genreText}>{item.genre}</Text>
            </View>
          )}
          {item.city && (
            <Text style={styles.cityText}>{item.city}</Text>
          )}
        </View>
      </View>
      <TouchableOpacity
        onPress={() => handleStationPress(item)}
        style={styles.playButton}
      >
        <Ionicons name="play" size={20} color="white" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Türk Radyosu</Text>
        
        {/* Station Count */}
        <Text style={styles.stationCount}>
          {filteredStations.length} / {RADIO_STATIONS.length} istasyon
        </Text>

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

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Categories */}
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>Kategoriler</Text>
          <FlatList
            data={CATEGORIES}
            renderItem={renderCategoryItem}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
          />
        </View>

        {/* Stations List */}
        <View style={styles.stationsSection}>
          <Text style={styles.sectionTitle}>Radyo İstasyonları</Text>
          
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  stationCount: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
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
    paddingBottom: 16,
  },
  stationCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
