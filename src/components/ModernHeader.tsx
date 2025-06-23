import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useApp } from '../contexts/AppContext';

interface ModernHeaderProps {
  onThemeToggle?: () => void;
  onLanguageToggle?: () => void;
  onSettingsPress?: () => void;
}

export const ModernHeader: React.FC<ModernHeaderProps> = ({
  onThemeToggle,
  onLanguageToggle,
  onSettingsPress,
}) => {
  const { t } = useTranslation();
  const { colors, isDark, language, toggleTheme, setLanguage } = useApp();
  
  // Animation values
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  const titleSlide = useRef(new Animated.Value(-50)).current;
  const buttonsSlide = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Header entrance animation
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(logoRotate, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(titleSlide, {
        toValue: 0,
        duration: 600,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.timing(buttonsSlide, {
        toValue: 0,
        duration: 600,
        delay: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous logo animation
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(logoRotate, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(logoRotate, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    
    pulseAnimation.start();

    return () => {
      pulseAnimation.stop();
    };
  }, []);

  const handleThemeToggle = () => {
    toggleTheme();
    onThemeToggle?.();
  };

  const handleLanguageToggle = () => {
    const newLang = language === 'tr' ? 'en' : 'tr';
    setLanguage(newLang);
    onLanguageToggle?.();
  };

  const logoRotateInterpolate = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <>
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'} 
        backgroundColor="transparent"
        translucent
      />
      
      <LinearGradient
        colors={isDark 
          ? ['#0F172A', '#1E293B', '#334155']
          : ['#667eea', '#764ba2', '#667eea']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="pt-12 pb-6 px-6"
      >
        {/* Header Content */}
        <View className="flex-row items-center justify-between">
          {/* Logo and Title */}
          <View className="flex-row items-center flex-1">
            <Animated.View
              style={{
                transform: [
                  { scale: logoScale },
                  { rotate: logoRotateInterpolate },
                ],
              }}
              className="mr-3"
            >
              <View
                className="w-12 h-12 rounded-full items-center justify-center"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  borderWidth: 2,
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                }}
              >
                <Text className="text-2xl">🎧</Text>
              </View>
            </Animated.View>
            
            <Animated.View
              style={{
                transform: [{ translateX: titleSlide }],
              }}
              className="flex-1"
            >
              <Text
                className="text-2xl font-bold"
                style={{ color: 'white' }}
              >
                {t('appName', 'Türkiye Radyoları')}
              </Text>
              <Text
                className="text-sm opacity-80"
                style={{ color: 'white' }}
              >
                {t('appSubtitle', 'Canlı Radyo Yayınları')} 📻
              </Text>
            </Animated.View>
          </View>

          {/* Action Buttons */}
          <Animated.View
            style={{
              transform: [{ translateX: buttonsSlide }],
            }}
            className="flex-row items-center space-x-2"
          >
            {/* Language Toggle */}
            <TouchableOpacity
              onPress={handleLanguageToggle}
              className="w-10 h-10 rounded-full items-center justify-center mr-2"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
              }}
              activeOpacity={0.7}
            >
              <Text className="text-white font-bold text-xs">
                {language.toUpperCase()}
              </Text>
            </TouchableOpacity>

            {/* Theme Toggle */}
            <TouchableOpacity
              onPress={handleThemeToggle}
              className="w-10 h-10 rounded-full items-center justify-center mr-2"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
              }}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isDark ? 'sunny' : 'moon'}
                size={18}
                color="white"
              />
            </TouchableOpacity>

            {/* Settings */}
            <TouchableOpacity
              onPress={onSettingsPress}
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
              }}
              activeOpacity={0.7}
            >
              <Ionicons
                name="settings-outline"
                size={18}
                color="white"
              />
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Animated Decoration */}
        <View className="absolute bottom-0 left-0 right-0 h-1">
          <LinearGradient
            colors={['transparent', 'rgba(255,255,255,0.3)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="h-full"
          />
        </View>
      </LinearGradient>
    </>
  );
};
