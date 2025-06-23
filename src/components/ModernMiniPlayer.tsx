import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useApp } from '../contexts/AppContext';
import { RadioStation } from '../constants/radioStations';
import { audioService, PlaybackState } from '../services/audioService';

interface ModernMiniPlayerProps {
  station: RadioStation;
  onPress: () => void;
  onClose: () => void;
}

export const ModernMiniPlayer: React.FC<ModernMiniPlayerProps> = ({
  station,
  onPress,
  onClose,
}) => {
  const { t } = useTranslation();
  const { colors, isDark } = useApp();
  const [playbackState, setPlaybackState] = useState<PlaybackState>(audioService.getState());
  
  // Animations
  const slideAnim = new Animated.Value(100);
  const scaleAnim = new Animated.Value(1);
  const progressAnim = new Animated.Value(0);

  useEffect(() => {
    const unsubscribe = audioService.subscribe(setPlaybackState);
    
    // Entrance animation
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();

    return unsubscribe;
  }, []);

  useEffect(() => {
    // Progress animation for playing state
    if (playbackState.isPlaying) {
      Animated.loop(
        Animated.timing(progressAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: false,
        })
      ).start();
    } else {
      progressAnim.setValue(0);
    }
  }, [playbackState.isPlaying]);

  const handlePlayPause = async () => {
    // Scale animation on press
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

    try {
      if (playbackState.isPlaying) {
        await audioService.pause();
      } else {
        await audioService.resume();
      }
    } catch (error) {
      console.error('Playback control error:', error);
    }
  };

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: 100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  const getStatusText = () => {
    if (playbackState.isLoading) return t('loading', 'Yükleniyor...');
    if (playbackState.error) return t('error', 'Hata');
    if (playbackState.isPlaying) return t('playing', 'Çalıyor');
    return t('paused', 'Duraklatıldı');
  };

  const getStatusColor = () => {
    if (playbackState.isLoading) return '#F59E0B';
    if (playbackState.error) return '#EF4444';
    if (playbackState.isPlaying) return '#10B981';
    return '#6B7280';
  };

  return (
    <Animated.View
      style={{
        transform: [
          { translateY: slideAnim },
          { scale: scaleAnim },
        ],
      }}
      className="absolute bottom-20 left-4 right-4"
    >
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={isDark 
            ? ['#1E293B', '#334155', '#475569']
            : ['#FFFFFF', '#F8FAFC']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="rounded-3xl overflow-hidden"
          style={{
            shadowColor: isDark ? '#000' : '#64748B',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: isDark ? 0.4 : 0.15,
            shadowRadius: 16,
            elevation: 12,
            borderWidth: isDark ? 0 : 1,
            borderColor: isDark ? 'transparent' : 'rgba(0,0,0,0.05)',
          }}
        >
          {/* Progress Bar */}
          <View className="h-1 bg-gray-200">
            <Animated.View
              style={{
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
                backgroundColor: getStatusColor(),
              }}
              className="h-full"
            />
          </View>

          <View className="flex-row items-center p-4">
            {/* Station Image */}
            <View className="relative">
              <View
                className="w-14 h-14 rounded-2xl overflow-hidden"
                style={{
                  backgroundColor: colors.surface,
                  borderWidth: 2,
                  borderColor: getStatusColor(),
                }}
              >
                <Image
                  source={{ 
                    uri: station.imageUrl || station.favicon || 'https://via.placeholder.com/56x56?text=📻'
                  }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              </View>
              
              {/* Status Indicator */}
              <View
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full items-center justify-center"
                style={{ backgroundColor: getStatusColor() }}
              >
                {playbackState.isLoading ? (
                  <ActivityIndicator size={12} color="white" />
                ) : (
                  <View
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: 'white' }}
                  />
                )}
              </View>
            </View>

            {/* Station Info */}
            <View className="flex-1 ml-4 mr-2">
              <Text
                className="text-base font-bold mb-1"
                style={{ color: colors.text }}
                numberOfLines={1}
              >
                {station.name}
              </Text>
              
              <View className="flex-row items-center">
                <View
                  className="w-2 h-2 rounded-full mr-2"
                  style={{ backgroundColor: getStatusColor() }}
                />
                <Text
                  className="text-sm font-medium"
                  style={{ color: getStatusColor() }}
                  numberOfLines={1}
                >
                  {getStatusText()}
                </Text>
              </View>
              
              <Text
                className="text-xs mt-1"
                style={{ color: colors.textSecondary }}
                numberOfLines={1}
              >
                {station.genre} • {station.country}
              </Text>
            </View>

            {/* Controls */}
            <View className="flex-row items-center space-x-2">
              {/* Play/Pause Button */}
              <TouchableOpacity
                onPress={handlePlayPause}
                className="w-12 h-12 rounded-2xl items-center justify-center"
                style={{
                  backgroundColor: playbackState.isPlaying 
                    ? colors.primary
                    : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                }}
                disabled={playbackState.isLoading}
              >
                {playbackState.isLoading ? (
                  <ActivityIndicator 
                    size="small" 
                    color={playbackState.isPlaying ? 'white' : colors.primary}
                  />
                ) : (
                  <Ionicons
                    name={playbackState.isPlaying ? 'pause' : 'play'}
                    size={20}
                    color={playbackState.isPlaying ? 'white' : colors.primary}
                  />
                )}
              </TouchableOpacity>

              {/* Close Button */}
              <TouchableOpacity
                onPress={handleClose}
                className="w-10 h-10 rounded-xl items-center justify-center"
                style={{
                  backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                }}
              >
                <Ionicons
                  name="close"
                  size={16}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Waveform Animation */}
          {playbackState.isPlaying && (
            <View className="flex-row items-end justify-center pb-2 px-4">
              {[...Array(20)].map((_, index) => (
                <Animated.View
                  key={index}
                  style={{
                    width: 2,
                    marginHorizontal: 1,
                    backgroundColor: colors.primary,
                    opacity: 0.3 + (index % 3) * 0.2,
                    height: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [2, 4 + (index % 5) * 2],
                    }),
                  }}
                />
              ))}
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};
