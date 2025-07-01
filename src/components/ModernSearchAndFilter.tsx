import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useApp } from '../contexts/AppContext';

interface Category {
  id: string;
  name: string;
  icon?: any; // For Ionicons
}

interface ModernSearchAndFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categories: Category[];
  stationCount: number;
  isApiMode: boolean;
  onApiModeToggle: () => void;
}

export const ModernSearchAndFilter: React.FC<ModernSearchAndFilterProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
  stationCount,
  isApiMode,
  onApiModeToggle,
}) => {
  const { t } = useTranslation();
  const { colors, isDark } = useApp();
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
  // Animation values
  const searchScale = useRef(new Animated.Value(1)).current;
  const filterSlide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animation
    Animated.timing(filterSlide, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleSearchFocus = () => {
    setIsSearchFocused(true);
    Animated.spring(searchScale, {
      toValue: 1.02,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const handleSearchBlur = () => {
    setIsSearchFocused(false);
    Animated.spring(searchScale, {
      toValue: 1,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const renderCategoryItem = ({ item, index }: { item: Category; index: number }) => {
    const isSelected = selectedCategory === item.name;
    
    return (
      <TouchableOpacity
        onPress={() => onCategoryChange(item.name)}
        activeOpacity={0.8}
        className="mr-3"
      >
        <LinearGradient
          colors={isSelected 
            ? [colors.primary, colors.secondary]
            : isDark
            ? ['#334155', '#475569']
            : ['#F8FAFC', '#E2E8F0']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="px-4 py-3 rounded-2xl flex-row items-center"
          style={{
            minWidth: 80,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isSelected ? 0.3 : 0,
            shadowRadius: 8,
            elevation: isSelected ? 4 : 0,
          }}
        >
          <Text className="text-lg mr-1">
            {item.icon}
          </Text>
          <Text
            className="font-medium text-sm"
            style={{
              color: isSelected ? 'white' : colors.text,
            }}
          >
            {t(`category.${item.id}`, item.name)}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <View
      className="px-6 py-4"
      style={{ backgroundColor: colors.background }}
    >
      {/* Search Bar */}
      <Animated.View
        style={{
          transform: [{ scale: searchScale }],
        }}
        className="mb-4"
      >
        <LinearGradient
          colors={isDark 
            ? ['#1E293B', '#334155']
            : ['#FFFFFF', '#F8FAFC']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="rounded-2xl overflow-hidden"
          style={{
            borderWidth: isSearchFocused ? 2 : 1,
            borderColor: isSearchFocused ? colors.primary : colors.border,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isSearchFocused ? 0.2 : 0.1,
            shadowRadius: 8,
            elevation: isSearchFocused ? 6 : 2,
          }}
        >
          <View className="flex-row items-center px-4 py-4">
            <Ionicons 
              name="search" 
              size={20} 
              color={isSearchFocused ? colors.primary : colors.textSecondary}
            />
            <TextInput
              placeholder={t('searchPlaceholder', 'Radyo istasyonu ara...')}
              value={searchQuery}
              onChangeText={onSearchChange}
              onFocus={handleSearchFocus}
              onBlur={handleSearchBlur}
              className="flex-1 ml-3 text-base"
              style={{ color: colors.text }}
              placeholderTextColor={colors.textSecondary}
              autoCorrect={false}
              autoCapitalize="none"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => onSearchChange('')}
                className="ml-2"
              >
                <Ionicons 
                  name="close-circle" 
                  size={20} 
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Filter Controls */}
      <Animated.View
        style={{
          opacity: filterSlide,
          transform: [{
            translateY: filterSlide.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0],
            }),
          }],
        }}
      >
        {/* API Mode Toggle and Station Count */}
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={onApiModeToggle}
              activeOpacity={0.8}
              className="mr-4"
            >
              <LinearGradient
                colors={isApiMode 
                  ? ['#10B981', '#059669']
                  : [colors.surface, colors.border]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="px-4 py-2 rounded-xl flex-row items-center"
              >
                <Ionicons 
                  name={isApiMode ? 'globe' : 'home'} 
                  size={16} 
                  color={isApiMode ? 'white' : colors.textSecondary}
                />
                <Text
                  className="ml-2 font-medium text-xs"
                  style={{
                    color: isApiMode ? 'white' : colors.textSecondary,
                  }}
                >
                  {isApiMode ? t('apiMode', 'Canlı API') : t('localMode', 'Yerel')}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Station Count */}
            <View className="flex-row items-center">
              <Ionicons 
                name="radio" 
                size={16} 
                color={colors.textSecondary}
              />
              <Text
                className="ml-2 text-sm font-medium"
                style={{ color: colors.textSecondary }}              >
                {stationCount}{' '}{t('stations', 'istasyon')}
              </Text>
              {isApiMode && (
                <View className="ml-2 flex-row items-center">
                  <View
                    className="w-2 h-2 rounded-full mr-1"
                    style={{ backgroundColor: '#10B981' }}
                  />
                  <Text
                    className="text-xs font-medium"
                    style={{ color: '#10B981' }}
                  >
                    {t('live', 'CANLI')}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Category Filter */}
        <View>
          <Text
            className="text-sm font-semibold mb-3"
            style={{ color: colors.text }}
          >
            {t('categories', 'Kategoriler')}
          </Text>
          <FlatList
            data={categories}
            renderItem={renderCategoryItem}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 24 }}
          />
        </View>
      </Animated.View>
    </View>
  );
};
