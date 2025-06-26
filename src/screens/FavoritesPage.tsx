import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { audioService } from '../services/cleanAudioService';

interface FavoritesPageProps {
  isVisible: boolean;
  onClose: () => void;
  favorites: string[];
  allStations: any[];
  onToggleFavorite: (stationId: string) => void;
  onPlayRadio: (station: any) => void;
  audioState: any;
}

export const FavoritesPage: React.FC<FavoritesPageProps> = ({
  isVisible,
  onClose,
  favorites,
  allStations,
  onToggleFavorite,
  onPlayRadio,
  audioState
}) => {
  // Favori radyoları filtrele
  const favoriteStations = allStations.filter(station => 
    favorites.includes(station.id)
  );

  const renderFavoriteStation = ({ item }: { item: any }) => {
    const isCurrentStation = audioState.currentStation?.id === item.id;
    const isPlaying = isCurrentStation && audioState.isPlaying;
    const isLoading = isCurrentStation && audioState.isLoading;

    return (
      <View style={styles.stationCard}>
        <LinearGradient
          colors={isCurrentStation ? ['#FF6B35', '#F59E0B'] : ['#F8FAFC', '#E2E8F0']}
          style={styles.stationGradient}
        >
          <View style={styles.stationContent}>
            {/* Sol taraf - İstasyon bilgisi */}
            <View style={styles.stationInfo}>
              <Text style={[
                styles.stationName,
                { color: isCurrentStation ? 'white' : '#1F2937' }
              ]} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={[
                styles.stationDesc,
                { color: isCurrentStation ? 'rgba(255,255,255,0.8)' : '#6B7280' }
              ]} numberOfLines={1}>
                {item.description || 'Favori Radyo'}
              </Text>
              {item.votes && (
                <Text style={[
                  styles.stationVotes,
                  { color: isCurrentStation ? 'rgba(255,255,255,0.7)' : '#9CA3AF' }
                ]}>
                  👍 {item.votes} oy • {item.bitrate || '128'}kbps
                </Text>
              )}
            </View>
            
            {/* Sağ taraf - Kontroller */}
            <View style={styles.buttonContainer}>
              {/* Favori butonu */}
              <TouchableOpacity
                style={styles.favoriteButton}
                onPress={() => onToggleFavorite(item.id)}
              >
                <Ionicons 
                  name="heart" 
                  size={24} 
                  color={isCurrentStation ? "white" : "#FF6B35"} 
                />
              </TouchableOpacity>
              
              {/* Play/Pause butonu */}
              <TouchableOpacity
                style={[
                  styles.playButton,
                  { backgroundColor: isCurrentStation ? 'rgba(255,255,255,0.2)' : '#FF6B35' }
                ]}
                onPress={() => onPlayRadio(item)}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Ionicons 
                    name={isPlaying ? "pause" : "play"} 
                    size={20} 
                    color="white" 
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        <LinearGradient
          colors={['#FF6B35', '#F59E0B']}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            
            <Text style={styles.headerTitle}>Favori Radyolar</Text>
            
            <View style={styles.favoriteCount}>
              <Ionicons name="heart" size={20} color="white" />
              <Text style={styles.countText}>{favorites.length}</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {favoriteStations.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="heart-outline" size={80} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>Henüz favori radyo yok</Text>
              <Text style={styles.emptyDesc}>
                Ana sayfadan beğendiğiniz radyoları favorilere ekleyin
              </Text>
              <TouchableOpacity style={styles.goBackButton} onPress={onClose}>
                <LinearGradient
                  colors={['#FF6B35', '#F59E0B']}
                  style={styles.goBackGradient}
                >
                  <Text style={styles.goBackText}>Radyolara Gözat</Text>
                  <Ionicons name="arrow-forward" size={18} color="white" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.statsContainer}>
                <Text style={styles.statsText}>
                  {favoriteStations.length} favori radyo
                </Text>
              </View>
              
              <FlatList
                data={favoriteStations}
                renderItem={renderFavoriteStation}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContainer}
              />
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  favoriteCount: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  countText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    padding: 20,
    alignItems: 'center',
  },
  statsText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  stationCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  stationGradient: {
    padding: 16,
  },
  stationContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stationInfo: {
    flex: 1,
    marginRight: 12,
  },
  stationName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  stationDesc: {
    fontSize: 14,
    marginBottom: 4,
  },
  stationVotes: {
    fontSize: 12,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  favoriteButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 20,
    marginBottom: 12,
  },
  emptyDesc: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  goBackButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  goBackGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 8,
  },
  goBackText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
