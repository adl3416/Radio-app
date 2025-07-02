import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useApp } from '../contexts/AppContext';
import { RadioStation } from '../constants/radioStations';
import { simpleRadioAudioService, RadioAudioState } from '../services/simpleRadioAudioService';

interface ModernRadioCardProps {
  station: RadioStation;
  onPress: (station: RadioStation) => void;
  index?: number;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2; // 2 columns with margins

export const ModernRadioCard: React.FC<ModernRadioCardProps> = ({
  station,
  onPress,
  index = 0,
}) => {
  const { t } = useTranslation();
  const { colors, isDark } = useApp();
  const [playbackState, setPlaybackState] = useState<RadioAudioState>(simpleRadioAudioService.getState());
  const [isLoading, setIsLoading] = useState(false);
  
  // Animation values
  const scaleAnim = new Animated.Value(1);
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);

  useEffect(() => {
    const unsubscribe = simpleRadioAudioService.subscribe(setPlaybackState);
    return unsubscribe;
  }, []);

  useEffect(() => {
    // Staggered animation entrance
    const delay = index * 100;
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const isCurrentStation = playbackState.currentStation?.id === station.id;
  const isPlaying = isCurrentStation && playbackState.isPlaying;

  const handlePress = async () => {
    // Press animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    setIsLoading(true);
    try {
      onPress(station);
    } catch (error) {
      console.error('Error playing station:', error);
    } finally {
      setTimeout(() => setIsLoading(false), 1000);
    }
  };

  const getStatusColor = () => {
    if (isCurrentStation) {
      return isPlaying ? '#10B981' : '#F59E0B';
    }
    return station.isLive ? '#10B981' : '#6B7280';
  };

  const getGradientColors = () => {
    if (isDark) {
      return isCurrentStation 
        ? ['#1E293B', '#334155', '#475569']
        : ['#0F172A', '#1E293B'];
    }
    return isCurrentStation 
      ? ['#EBF4FF', '#DBEAFE', '#BFDBFE']
      : ['#FFFFFF', '#F8FAFC'];
  };

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [
          { translateY: slideAnim },
          { scale: scaleAnim },
        ],
      }}
    >
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.9}
        className="mb-4"
        style={{ width: CARD_WIDTH }}
      >        <LinearGradient
          colors={getGradientColors() as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="rounded-3xl overflow-hidden shadow-lg"
          style={{
            elevation: isDark ? 8 : 4,
            shadowColor: isDark ? '#000' : '#64748B',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isDark ? 0.3 : 0.15,
            shadowRadius: 8,
          }}
        >
          {/* Header with status indicator */}
          <View className="flex-row items-center justify-between p-3">
            <View className="flex-row items-center">
              <View
                className="w-2 h-2 rounded-full mr-2"
                style={{ backgroundColor: getStatusColor() }}
              />
              <Text
                className="text-xs font-medium"
                style={{ color: colors.textSecondary }}
              >
                {station.isLive ? (t('live') || 'Live') : (t('offline') || 'Offline')}
              </Text>
            </View>
            
            {/* Favorite Icon */}
            <TouchableOpacity className="p-1">
              <Ionicons 
                name="heart-outline" 
                size={16} 
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {/* Station Image */}
          <View className="items-center py-4">
            <View className="relative">
              <View
                className="w-20 h-20 rounded-full overflow-hidden"
                style={{
                  backgroundColor: colors.surface,
                  borderWidth: 3,
                  borderColor: isCurrentStation ? colors.primary : colors.border,
                }}
              >
                <Image
                  source={{ 
                    uri: station.favicon || 'https://via.placeholder.com/80x80?text=📻'
                  }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              </View>
              
              {/* Playing Animation */}
              {isCurrentStation && (
                <View className="absolute -bottom-1 -right-1">
                  <View
                    className="w-6 h-6 rounded-full items-center justify-center"
                    style={{ backgroundColor: isPlaying ? '#10B981' : '#F59E0B' }}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Ionicons 
                        name={isPlaying ? 'pause' : 'play'} 
                        size={12} 
                        color="white"
                      />
                    )}
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Station Info */}
          <View className="px-3 pb-4">
            <Text
              className="text-center font-bold text-sm mb-1"
              style={{ color: colors.text }}
              numberOfLines={1}
            >
              {station.name}
            </Text>
            
            <Text
              className="text-center text-xs mb-2"
              style={{ color: colors.textSecondary }}
              numberOfLines={1}
            >
              {station.country} • {station.category || 'Music'}
            </Text>

            {/* Genre Tag */}
            <View className="items-center">
              <View
                className="px-3 py-1 rounded-full"
                style={{ 
                  backgroundColor: isDark 
                    ? 'rgba(59, 130, 246, 0.2)' 
                    : 'rgba(59, 130, 246, 0.1)',
                }}
              >
                <Text
                  className="text-xs font-medium"
                  style={{ color: colors.primary }}
                >
                  {(station.category || 'Music').toUpperCase()}
                </Text>
              </View>
            </View>

            {/* Bitrate Info */}
            {station.bitrate && (
              <Text
                className="text-center text-xs mt-2"
                style={{ color: colors.textSecondary }}
              >
                {station.bitrate}kbps • {station.codec}
              </Text>
            )}
          </View>

          {/* Play Button Overlay */}
          <TouchableOpacity
            onPress={handlePress}
            className="absolute inset-0 items-center justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}
            activeOpacity={0.8}
          >
            <View
              className="w-12 h-12 rounded-full items-center justify-center"
              style={{ 
                backgroundColor: isCurrentStation 
                  ? (isPlaying ? '#EF4444' : '#10B981')
                  : 'rgba(255,255,255,0.9)',
              }}
            >
              {isLoading ? (
                <ActivityIndicator 
                  size="small" 
                  color={isCurrentStation ? 'white' : colors.primary}
                />
              ) : (
                <Ionicons
                  name={isCurrentStation && isPlaying ? 'pause' : 'play'}
                  size={20}
                  color={isCurrentStation ? 'white' : colors.primary}
                />
              )}
            </View>
          </TouchableOpacity>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};
