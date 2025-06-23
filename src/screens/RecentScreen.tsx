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
import { RadioStationCard } from '../components/RadioStationCard';
import { RadioStation } from '../constants/radioStations';
import { audioService } from '../services/audioService';

interface RecentScreenProps {
  onStationPress: (station: RadioStation) => void;
  onOpenPlayer: () => void;
}

export const RecentScreen: React.FC<RecentScreenProps> = ({
  onStationPress,
  onOpenPlayer,
}) => {
  const { t } = useTranslation();
  const [recentStations, setRecentStations] = useState<RadioStation[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadRecentStations();
  }, []);

  const loadRecentStations = async () => {
    const recent = await audioService.getRecentStations();
    setRecentStations(recent);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRecentStations();
    setRefreshing(false);
  };

  const handleStationPlay = (station: RadioStation) => {
    onOpenPlayer();
    // Refresh recent stations after playing
    setTimeout(loadRecentStations, 1000);
  };
  const renderStationItem = ({ item, index }: { item: RadioStation; index: number }) => (
    <View style={styles.stationItemContainer}>
      <View style={styles.indexContainer}>
        <Text style={styles.indexText}>
          #{index + 1}
        </Text>
      </View>
      <RadioStationCard
        station={item}
        onPress={onStationPress}
        onPlay={handleStationPlay}
      />
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="time-outline" size={64} color="#9CA3AF" />
      <Text style={styles.emptyTitle}>
        {t('screens.recent.empty')}
      </Text>
      <Text style={styles.emptySubtitle}>
        {t('screens.recent.startListening')}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          {t('screens.recent.title')}
        </Text>
        {recentStations.length > 0 && (
          <Text style={styles.subtitle}>
            Son {recentStations.length} istasyon
          </Text>
        )}
      </View>

      {/* Content */}
      {recentStations.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={recentStations}
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
  stationItemContainer: {
    marginBottom: 12,
  },
  indexContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  indexText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
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
