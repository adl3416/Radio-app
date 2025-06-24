import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ModernRadioCard } from '../components/ModernRadioCard';
import { RadioStation } from '../constants/radioStations';
import { favoritesService } from '../services/favoritesService';

interface FavoritesScreenProps {
  onStationPress: (station: RadioStation) => void;
  onOpenPlayer: () => void;
}

export const FavoritesScreen: React.FC<FavoritesScreenProps> = ({
  onStationPress,
  onOpenPlayer,
}) => {
  const { t } = useTranslation();
  const [favorites, setFavorites] = useState<RadioStation[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadFavorites();
    
    const unsubscribe = favoritesService.subscribe(setFavorites);
    return unsubscribe;
  }, []);

  const loadFavorites = async () => {
    const favoriteStations = await favoritesService.loadFavorites();
    setFavorites(favoriteStations);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadFavorites();
    setRefreshing(false);
  };

  const handleStationPlay = (station: RadioStation) => {
    onOpenPlayer();
  };
  const renderStationItem = ({ item, index }: { item: RadioStation; index: number }) => (
    <ModernRadioCard
      station={item}
      onPress={onStationPress}
      index={index}
    />
  );
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="heart-outline" size={64} color="#9CA3AF" />
      <Text style={styles.emptyTitle}>
        {t('screens.favorites.empty')}
      </Text>
      <Text style={styles.emptySubtitle}>
        {t('screens.favorites.addFirst')}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          {t('screens.favorites.title')}
        </Text>
        {favorites.length > 0 && (
          <Text style={styles.subtitle}>
            {favorites.length} favori istasyon
          </Text>
        )}
      </View>

      {/* Content */}
      {favorites.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={favorites}
          renderItem={renderStationItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
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
  },
  subtitle: {
    color: '#6B7280',
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    color: '#6B7280',
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: '#9CA3AF',
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
  },
});
