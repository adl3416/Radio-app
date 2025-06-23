import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useApp } from '../contexts/AppContext';
import { ModernRadioCard } from '../components/ModernRadioCard';
import { RadioStation } from '../constants/radioStations';
import { favoritesService } from '../services/favoritesService';

interface ModernFavoritesScreenProps {
  onStationPress: (station: RadioStation) => void;
  onOpenPlayer: () => void;
}

const { width } = Dimensions.get('window');

export const ModernFavoritesScreen: React.FC<ModernFavoritesScreenProps> = ({
  onStationPress,
  onOpenPlayer,
}) => {
  const { t } = useTranslation();
  const { colors, isDark } = useApp();
  const [favorites, setFavorites] = useState<RadioStation[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  
  // Animation
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);

  useEffect(() => {
    loadFavorites();
    
    const unsubscribe = favoritesService.subscribe(setFavorites);
    
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

  const handleStationPress = (station: RadioStation) => {
    onStationPress(station);
    onOpenPlayer();
  };

  const renderHeader = () => (
    <LinearGradient
      colors={isDark 
        ? ['#1E293B', '#334155']
        : ['#EF4444', '#DC2626']
      }
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="px-6 py-8"
      style={{
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
      }}
    >
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
        className="flex-row items-center justify-between"
      >
        <View className="flex-1">
          <Text className="text-3xl font-bold text-white mb-2">
            ❤️ {t('screens.favorites.title', 'Favorilerim')}
          </Text>
          <Text className="text-white opacity-90">
            {favorites.length > 0 
              ? t('favoritesCount', '{{count}} favori istasyon', { count: favorites.length })
              : t('noFavorites', 'Henüz favori istasyon yok')
            }
          </Text>
        </View>
        
        <View className="items-center">
          <View
            className="w-16 h-16 rounded-full items-center justify-center"
            style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
          >
            <Text className="text-2xl font-bold text-white">
              {favorites.length}
            </Text>
          </View>
        </View>
      </Animated.View>
    </LinearGradient>
  );

  const renderStationItem = ({ item, index }: { item: RadioStation; index: number }) => (
    <ModernRadioCard
      station={item}
      onPress={handleStationPress}
      index={index}
    />
  );

  const renderEmptyState = () => (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
      className="flex-1 items-center justify-center px-8 py-16"
    >
      <LinearGradient
        colors={isDark 
          ? ['#374151', '#4B5563']
          : ['#F8FAFC', '#E2E8F0']
        }
        className="w-32 h-32 rounded-full items-center justify-center mb-6"
        style={{
          shadowColor: '#6B7280',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4,
        }}
      >
        <Ionicons 
          name="heart-outline" 
          size={64} 
          color={colors.textSecondary}
        />
      </LinearGradient>
      
      <Text 
        className="text-2xl font-bold mb-3 text-center"
        style={{ color: colors.text }}
      >
        {t('screens.favorites.empty', 'Henüz favori yok')}
      </Text>
      
      <Text 
        className="text-base text-center mb-8 leading-6"
        style={{ color: colors.textSecondary }}
      >
        {t('screens.favorites.emptyDescription', 'Beğendiğiniz radyo istasyonlarını favorilere ekleyerek buradan kolayca erişebilirsiniz.')}
      </Text>
      
      <TouchableOpacity
        className="px-6 py-3 rounded-2xl"
        style={{ backgroundColor: colors.primary }}
        onPress={() => {}} // Navigate to home screen
      >
        <Text className="text-white font-semibold">
          {t('screens.favorites.browseStations', 'İstasyonları Keşfet')}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      {renderHeader()}
      
      <Animated.View
        style={{
          flex: 1,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        {favorites.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={favorites}
            renderItem={renderStationItem}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={{
              padding: 24,
              paddingBottom: 100,
            }}
            columnWrapperStyle={{
              justifyContent: 'space-between',
            }}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={handleRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View className="h-4" />}
          />
        )}
      </Animated.View>
    </View>
  );
};
