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
import { audioService } from '../services/cleanAudioService';

interface ModernRecentScreenProps {
  onStationPress: (station: RadioStation) => void;
  onOpenPlayer: () => void;
}

const { width } = Dimensions.get('window');

export const ModernRecentScreen: React.FC<ModernRecentScreenProps> = ({
  onStationPress,
  onOpenPlayer,
}) => {
  const { t } = useTranslation();
  const { colors, isDark } = useApp();
  const [recentStations, setRecentStations] = useState<RadioStation[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  
  // Animation
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);

  useEffect(() => {
    loadRecentStations();
    
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

  const loadRecentStations = async () => {    // const recent = await audioService.getRecentStations(); // Method not available
    setRecentStations([]);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRecentStations();
    setRefreshing(false);
  };

  const handleStationPress = (station: RadioStation) => {
    onStationPress(station);
    onOpenPlayer();
    // Refresh recent stations after playing
    setTimeout(loadRecentStations, 1000);
  };

  const clearRecentStations = async () => {
    // await audioService.clearRecentStations(); // Method not available
    setRecentStations([]);
  };

  const renderHeader = () => (
    <LinearGradient
      colors={isDark 
        ? ['#1E293B', '#334155']
        : ['#8B5CF6', '#7C3AED']
      }
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="px-6 py-8"
      style={{
        shadowColor: '#8B5CF6',
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
            🕒 {t('screens.recent.title', 'Son Dinlenenler')}
          </Text>
          <Text className="text-white opacity-90">
            {recentStations.length > 0 
              ? t('recentCount', 'Son {{count}} istasyon', { count: recentStations.length })
              : t('noRecent', 'Henüz dinlenmiş istasyon yok')
            }
          </Text>
        </View>
        
        <View className="flex-row items-center space-x-3">
          {recentStations.length > 0 && (
            <TouchableOpacity
              onPress={clearRecentStations}
              className="w-12 h-12 rounded-full items-center justify-center"
              style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
            >
              <Ionicons name="trash-outline" size={20} color="white" />
            </TouchableOpacity>
          )}
          
          <View
            className="w-16 h-16 rounded-full items-center justify-center"
            style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
          >
            <Text className="text-2xl font-bold text-white">
              {recentStations.length}
            </Text>
          </View>
        </View>
      </Animated.View>
    </LinearGradient>
  );

  const renderStationItem = ({ item, index }: { item: RadioStation; index: number }) => (
    <View className="mb-4">
      {/* Recently Played Badge */}
      <View className="flex-row items-center mb-2 px-4">
        <View
          className="px-3 py-1 rounded-full flex-row items-center"
          style={{ backgroundColor: isDark ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.1)' }}
        >
          <Ionicons name="time" size={12} color={colors.primary} />
          <Text 
            className="text-xs font-medium ml-1"
            style={{ color: colors.primary }}
          >
            #{index + 1} • {t('recentlyPlayed', 'Son dinlenen')}
          </Text>
        </View>
      </View>
      
      <ModernRadioCard
        station={item}
        onPress={handleStationPress}
        index={index}
      />
    </View>
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
          name="time-outline" 
          size={64} 
          color={colors.textSecondary}
        />
      </LinearGradient>
      
      <Text 
        className="text-2xl font-bold mb-3 text-center"
        style={{ color: colors.text }}
      >
        {t('screens.recent.empty', 'Henüz dinlenmiş istasyon yok')}
      </Text>
      
      <Text 
        className="text-base text-center mb-8 leading-6"
        style={{ color: colors.textSecondary }}
      >
        {t('screens.recent.emptyDescription', 'Dinlediğiniz radyo istasyonları burada görünecek ve kolayca tekrar erişebilirsiniz.')}
      </Text>
      
      <TouchableOpacity
        className="px-6 py-3 rounded-2xl"
        style={{ backgroundColor: colors.primary }}
        onPress={() => {}} // Navigate to home screen
      >
        <Text className="text-white font-semibold">
          {t('screens.recent.startListening', 'Dinlemeye Başla')}
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
        {recentStations.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={recentStations}
            renderItem={renderStationItem}
            keyExtractor={(item, index) => `${item.id}-${index}`}
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
          />
        )}
      </Animated.View>
    </View>
  );
};
