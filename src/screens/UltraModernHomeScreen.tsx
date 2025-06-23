import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
  StatusBar,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { RADIO_STATIONS, CATEGORIES, RadioStation, Category } from '../constants/radioStations';
import { useAppContext } from '../contexts/AppContext';
import { ModernDrawerMenu } from '../components/ModernDrawerMenu';
import { ModernFooterPlayer } from '../components/ModernFooterPlayer';

const { width } = Dimensions.get('window');

interface UltraModernHomeScreenProps {
  onStationPress: (station: RadioStation) => void;
  onOpenPlayer: () => void;
}

export const UltraModernHomeScreen: React.FC<UltraModernHomeScreenProps> = ({
  onStationPress,
  onOpenPlayer,
}) => {  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tümü');
  const [filteredStations, setFilteredStations] = useState<RadioStation[]>(RADIO_STATIONS);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [showAudioTip, setShowAudioTip] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { theme, toggleTheme, isDark } = useAppContext();

  useEffect(() => {
    filterStations();
  }, [searchQuery, selectedCategory]);

  const filterStations = () => {
    let filtered = RADIO_STATIONS;

    // Category filter
    if (selectedCategory !== 'Tümü') {
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

  const handleMenuNavigation = (screen: string) => {
    // Handle navigation to different screens
    switch (screen) {
      case 'favorites':
        // Navigate to favorites
        break;
      case 'categories':
        // Navigate to categories
        break;
      case 'recent':
        // Navigate to recent/regions
        break;
      case 'settings':
        // Navigate to settings
        break;
      default:
        break;
    }
  };

  const getStationLogo = (station: RadioStation) => {
    // Default station logos based on name
    if (station.name.toLowerCase().includes('x radio')) return '❌';
    if (station.name.toLowerCase().includes('power')) return '⚡';
    if (station.name.toLowerCase().includes('metro')) return '🚇';
    if (station.name.toLowerCase().includes('munzur')) return '🏔️';
    if (station.name.toLowerCase().includes('amed')) return '🌿';
    if (station.name.toLowerCase().includes('45lik')) return '💿';
    if (station.name.toLowerCase().includes('haber')) return '📰';
    if (station.name.toLowerCase().includes('para')) return '💰';
    if (station.name.toLowerCase().includes('spor')) return '⚽';
    if (station.name.toLowerCase().includes('adana')) return '🌆';
    if (station.name.toLowerCase().includes('afşin')) return '🎵';
    return '📻';
  };

  const getCountryFlag = (station: RadioStation) => {
    if (station.country === 'Turkey' || station.country === 'TR') return '🇹🇷';
    if (station.country === 'USA') return '🇺🇸';
    return '🌍';
  };

  const renderTopStations = () => {
    const topStations = RADIO_STATIONS.slice(0, 5);
    return (
      <FlatList
        data={topStations}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.topStationsList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.topStationCard}
            onPress={() => handleStationPress(item)}
          >
            <View style={styles.topStationLogo}>
              <Text style={styles.topStationLogoText}>{getStationLogo(item)}</Text>
            </View>
            <Text style={styles.topStationName} numberOfLines={2}>
              {item.name.replace(/\s*\(.*?\)\s*/g, '')}
            </Text>
          </TouchableOpacity>
        )}
      />
    );
  };

  const renderStationItem = ({ item }: { item: RadioStation }) => (
    <TouchableOpacity
      style={[styles.stationCard, isDark && styles.stationCardDark]}
      onPress={() => handleStationPress(item)}
    >
      <View style={styles.stationCardContent}>
        <View style={styles.stationLogo}>
          <Text style={styles.stationLogoText}>{getStationLogo(item)}</Text>
        </View>
        
        <View style={styles.stationInfo}>
          <Text style={[styles.stationName, isDark && styles.textDark]}>
            {item.name}
          </Text>
          <View style={styles.stationMeta}>
            <Text style={styles.stationGenre}>{item.genre || 'MÜZIK'}</Text>
            {item.city && (
              <>
                <Text style={styles.metaDivider}>•</Text>
                <Text style={styles.stationLocation}>
                  {getCountryFlag(item)} {item.city}
                </Text>
              </>
            )}
          </View>
        </View>

        <TouchableOpacity style={styles.favoriteButton}>
          <Ionicons name="heart-outline" size={24} color="#E5E7EB" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderCategoryFilter = () => (
    <View style={styles.filterSection}>
      <TouchableOpacity style={styles.filterButton}>
        <MaterialIcons name="sort" size={20} color="#6B7280" />
        <Text style={[styles.filterText, isDark && styles.textDark]}>Alfabetik</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.filterButton}>
        <MaterialIcons name="filter-list" size={20} color="#6B7280" />
        <Text style={[styles.filterText, isDark && styles.textDark]}>Filtrele</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.filterButton}>
        <MaterialIcons name="casino" size={20} color="#6B7280" />
        <Text style={[styles.filterText, isDark && styles.textDark]}>Tarayıcı</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <LinearGradient
        colors={isDark ? ['#1F2937', '#111827'] : ['#FF6B35', '#F59E0B']}
        style={styles.header}
      >
        <SafeAreaView edges={['top']}>          <View style={styles.headerContent}>
            <TouchableOpacity 
              style={styles.menuButton}
              onPress={() => setIsMenuOpen(true)}
            >
              <Ionicons name="menu" size={24} color="white" />
            </TouchableOpacity>
            
            <Text style={styles.headerTitle}>🎧📻 RADYO ÇINARI</Text>
              <View style={styles.headerActions}>
              <TouchableOpacity 
                style={styles.infoButton}
                onPress={() => setShowAudioTip(!showAudioTip)}
              >
                <Ionicons name="information-circle" size={24} color="white" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.searchButton}
                onPress={() => setIsSearchVisible(!isSearchVisible)}
              >
                <Ionicons name="search" size={24} color="white" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.themeButton}
                onPress={toggleTheme}
              >
                <Ionicons 
                  name={isDark ? 'sunny' : 'moon'} 
                  size={24} 
                  color="white" 
                />
              </TouchableOpacity>
            </View>
          </View>
          
          {isSearchVisible && (
            <View style={styles.searchContainer}>
              <View style={styles.searchInputContainer}>
                <Ionicons name="search" size={20} color="#9CA3AF" />
                <TextInput
                  placeholder="Radyo istasyonu ara..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  style={styles.searchInput}
                  placeholderTextColor="#9CA3AF"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                )}              </View>
            </View>
          )}
          
          {showAudioTip && (
            <View style={styles.audioTipContainer}>
              <View style={styles.audioTipContent}>
                <Ionicons name="volume-high" size={20} color="#F59E0B" />
                <Text style={styles.audioTipText}>
                  🔊 Web tarayıcısında ses çalmak için sayfa ile etkileşim gereklidir. 
                  Eğer radyo çalmıyorsa, sayfada herhangi bir yere tıklayın ve tekrar deneyin.
                </Text>
                <TouchableOpacity onPress={() => setShowAudioTip(false)}>
                  <Ionicons name="close" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </SafeAreaView>
      </LinearGradient>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Stations */}
        <View style={styles.topStationsSection}>
          {renderTopStations()}
        </View>

        {/* Filter Section */}
        {renderCategoryFilter()}

        {/* Featured Station */}
        {filteredStations.length > 0 && (
          <TouchableOpacity 
            style={styles.featuredStation}
            onPress={() => handleStationPress(filteredStations[0])}
          >
            <LinearGradient
              colors={['#60A5FA', '#3B82F6']}
              style={styles.featuredGradient}
            >
              <View style={styles.featuredContent}>
                <View style={styles.featuredLogo}>
                  <Text style={styles.featuredLogoText}>
                    {getStationLogo(filteredStations[0])}
                  </Text>
                </View>
                <View style={styles.featuredInfo}>
                  <Text style={styles.featuredName}>
                    {filteredStations[0].name}
                  </Text>
                  <Text style={styles.featuredGenre}>
                    {filteredStations[0].genre} {getCountryFlag(filteredStations[0])} {filteredStations[0].city}
                  </Text>
                </View>
                <TouchableOpacity style={styles.featuredFavorite}>
                  <Ionicons name="heart-outline" size={24} color="white" />
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Stations List */}
        <View style={styles.stationsSection}>
          <FlatList
            data={filteredStations}
            renderItem={renderStationItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        </View>      </ScrollView>

      {/* ModernDrawerMenu */}
      <ModernDrawerMenu
        isVisible={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onNavigate={handleMenuNavigation}
      />

      {/* ModernFooterPlayer */}
      <ModernFooterPlayer onPress={onOpenPlayer} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  containerDark: {
    backgroundColor: '#111827',
  },
  header: {
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  menuButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    flex: 1,
  },  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  infoButton: {
    padding: 8,
  },
  searchButton: {
    padding: 8,
  },
  themeButton: {
    padding: 8,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    color: 'white',
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  topStationsSection: {
    paddingVertical: 20,
  },
  topStationsList: {
    paddingHorizontal: 16,
  },
  topStationCard: {
    alignItems: 'center',
    marginRight: 16,
    width: 80,
  },
  topStationLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  topStationLogoText: {
    fontSize: 24,
  },
  topStationName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 16,
  },
  filterSection: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#F3F4F6',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  filterText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
    fontWeight: '500',
  },
  textDark: {
    color: '#E5E7EB',
  },
  featuredStation: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  featuredGradient: {
    padding: 20,
  },
  featuredContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featuredLogo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredLogoText: {
    fontSize: 20,
  },
  featuredInfo: {
    flex: 1,
    marginLeft: 16,
  },
  featuredName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  featuredGenre: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  featuredFavorite: {
    padding: 8,
  },
  stationsSection: {
    flex: 1,
    paddingHorizontal: 16,
  },
  stationCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  stationCardDark: {
    backgroundColor: '#1F2937',
  },
  stationCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  stationLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stationLogoText: {
    fontSize: 20,
  },
  stationInfo: {
    flex: 1,
    marginLeft: 16,
  },
  stationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  stationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stationGenre: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  metaDivider: {
    fontSize: 12,
    color: '#9CA3AF',
    marginHorizontal: 8,
  },
  stationLocation: {
    fontSize: 12,
    color: '#6B7280',
  },
  favoriteButton: {
    padding: 8,
  },  miniPlayerPlaceholder: {
    height: 80,
  },
  audioTipContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  audioTipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  audioTipText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
});
