import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Animated,
  Share,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useApp } from '../contexts/AppContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const ModernSettingsScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { colors, isDark, theme, toggleTheme, language, setLanguage } = useApp();
  const [notifications, setNotifications] = useState(true);
  const [autoPlay, setAutoPlay] = useState(false);
  const [highQuality, setHighQuality] = useState(true);
  
  // Animation
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);

  useEffect(() => {
    loadSettings();
    
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

  const loadSettings = async () => {
    try {
      const savedNotifications = await AsyncStorage.getItem('notifications');
      const savedAutoPlay = await AsyncStorage.getItem('autoPlay');
      const savedHighQuality = await AsyncStorage.getItem('highQuality');
      
      if (savedNotifications !== null) setNotifications(JSON.parse(savedNotifications));
      if (savedAutoPlay !== null) setAutoPlay(JSON.parse(savedAutoPlay));
      if (savedHighQuality !== null) setHighQuality(JSON.parse(savedHighQuality));
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const saveSettings = async (key: string, value: boolean) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const handleLanguageChange = (newLanguage: 'tr' | 'en') => {
    Alert.alert(
      t('changeLanguage', 'Dil Değişikliği'),
      t('changeLanguageConfirm', `Dili ${newLanguage === 'tr' ? 'Türkçe' : 'İngilizce'} olarak değiştirmek istediğinizden emin misiniz?`),
      [
        { text: t('cancel', 'İptal'), style: 'cancel' },
        {
          text: t('change', 'Değiştir'),
          onPress: () => {
            setLanguage(newLanguage);
            i18n.changeLanguage(newLanguage);
          },
        },
      ]
    );
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: t('shareMessage', 'Türkiye Radyoları uygulamasını deneyin! En iyi Türk radyo istasyonlarını dinleyin. 📻'),
        title: t('shareTitle', 'Türkiye Radyoları'),
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const handleRateApp = () => {
    Alert.alert(
      t('rateApp', 'Uygulamayı Değerlendir'),
      t('rateAppMessage', 'Uygulamamızı beğendiyseniz lütfen değerlendirin!'),
      [
        { text: t('cancel', 'İptal'), style: 'cancel' },
        { text: t('rate', 'Değerlendir'), onPress: () => {} },
      ]
    );
  };

  const handleContactUs = async () => {
    const email = 'mailto:support@turkradio.com?subject=Türkiye Radyoları - Geri Bildirim';
    try {
      await Linking.openURL(email);
    } catch (error) {
      Alert.alert(t('error', 'Hata'), t('emailError', 'E-posta uygulaması açılamadı'));
    }
  };

  const renderHeader = () => (
    <LinearGradient
      colors={isDark 
        ? ['#1E293B', '#334155']
        : ['#6366F1', '#4F46E5']
      }
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="px-6 py-8"
      style={{
        shadowColor: '#6366F1',
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
        className="flex-row items-center"
      >
        <View className="flex-1">
          <Text className="text-3xl font-bold text-white mb-2">
            ⚙️ {t('screens.settings.title', 'Ayarlar')}
          </Text>
          <Text className="text-white opacity-90">
            {t('customizeExperience', 'Deneyiminizi özelleştirin')}
          </Text>
        </View>
        
        <View
          className="w-16 h-16 rounded-full items-center justify-center"
          style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
        >
          <Ionicons name="settings" size={32} color="white" />
        </View>
      </Animated.View>
    </LinearGradient>
  );

  const SettingItem: React.FC<{
    icon: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
    showChevron?: boolean;
  }> = ({ icon, title, subtitle, onPress, rightElement, showChevron = true }) => (
    <TouchableOpacity
      onPress={onPress}
      className="mx-6 mb-4 p-4 rounded-2xl flex-row items-center"
      style={{ 
        backgroundColor: colors.surface,
        shadowColor: isDark ? '#000' : '#64748B',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.3 : 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}
      disabled={!onPress}
      activeOpacity={0.7}
    >
      <View
        className="w-12 h-12 rounded-full items-center justify-center mr-4"
        style={{ backgroundColor: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)' }}
      >
        <Ionicons name={icon as any} size={20} color={colors.primary} />
      </View>
      
      <View className="flex-1">
        <Text className="text-base font-semibold mb-1" style={{ color: colors.text }}>
          {title}
        </Text>
        {subtitle && (
          <Text className="text-sm" style={{ color: colors.textSecondary }}>
            {subtitle}
          </Text>
        )}
      </View>
      
      {rightElement || (showChevron && onPress && (
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      ))}
    </TouchableOpacity>
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
        <ScrollView 
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* Theme & Language Section */}
          <View className="mt-6">
            <Text 
              className="text-lg font-bold mb-4 mx-6"
              style={{ color: colors.text }}
            >
              🎨 {t('appearance', 'Görünüm')}
            </Text>
            
            <SettingItem
              icon="moon"
              title={t('darkMode', 'Karanlık Mod')}
              subtitle={t('darkModeDesc', 'Gece kullanımı için ideal')}
              rightElement={
                <Switch
                  value={isDark}
                  onValueChange={toggleTheme}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={isDark ? 'white' : '#f4f3f4'}
                />
              }
              showChevron={false}
            />
            
            <SettingItem
              icon="language"
              title="Türkçe"
              subtitle={language === 'tr' ? t('currentLanguage', 'Mevcut dil') : t('switchToTurkish', 'Türkçe\'ye geç')}
              onPress={() => handleLanguageChange('tr')}
              rightElement={
                language === 'tr' ? (
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                ) : null
              }
              showChevron={language !== 'tr'}
            />
            
            <SettingItem
              icon="language"
              title="English"
              subtitle={language === 'en' ? 'Current language' : 'Switch to English'}
              onPress={() => handleLanguageChange('en')}
              rightElement={
                language === 'en' ? (
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                ) : null
              }
              showChevron={language !== 'en'}
            />
          </View>

          {/* Audio Settings */}
          <View className="mt-6">
            <Text 
              className="text-lg font-bold mb-4 mx-6"
              style={{ color: colors.text }}
            >
              🔊 {t('audioSettings', 'Ses Ayarları')}
            </Text>
            
            <SettingItem
              icon="volume-high"
              title={t('highQuality', 'Yüksek Kalite')}
              subtitle={t('highQualityDesc', 'Daha iyi ses kalitesi (daha fazla veri)')}
              rightElement={
                <Switch
                  value={highQuality}
                  onValueChange={(value) => {
                    setHighQuality(value);
                    saveSettings('highQuality', value);
                  }}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={highQuality ? 'white' : '#f4f3f4'}
                />
              }
              showChevron={false}
            />
            
            <SettingItem
              icon="play-circle"
              title={t('autoPlay', 'Otomatik Oynat')}
              subtitle={t('autoPlayDesc', 'Uygulama açılırken son istasyonu oynat')}
              rightElement={
                <Switch
                  value={autoPlay}
                  onValueChange={(value) => {
                    setAutoPlay(value);
                    saveSettings('autoPlay', value);
                  }}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={autoPlay ? 'white' : '#f4f3f4'}
                />
              }
              showChevron={false}
            />
          </View>

          {/* Notifications */}
          <View className="mt-6">
            <Text 
              className="text-lg font-bold mb-4 mx-6"
              style={{ color: colors.text }}
            >
              🔔 {t('notifications', 'Bildirimler')}
            </Text>
            
            <SettingItem
              icon="notifications"
              title={t('pushNotifications', 'Bildirimler')}
              subtitle={t('notificationsDesc', 'Yeni istasyonlar ve güncellemeler')}
              rightElement={
                <Switch
                  value={notifications}
                  onValueChange={(value) => {
                    setNotifications(value);
                    saveSettings('notifications', value);
                  }}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={notifications ? 'white' : '#f4f3f4'}
                />
              }
              showChevron={false}
            />
          </View>

          {/* About & Support */}
          <View className="mt-6">
            <Text 
              className="text-lg font-bold mb-4 mx-6"
              style={{ color: colors.text }}
            >
              ℹ️ {t('aboutSupport', 'Hakkında & Destek')}
            </Text>
            
            <SettingItem
              icon="share-social"
              title={t('shareApp', 'Uygulamayı Paylaş')}
              subtitle={t('shareAppDesc', 'Arkadaşlarınızla paylaşın')}
              onPress={handleShare}
            />
            
            <SettingItem
              icon="star"
              title={t('rateApp', 'Uygulamayı Değerlendir')}
              subtitle={t('rateAppDesc', 'App Store\'da değerlendirin')}
              onPress={handleRateApp}
            />
            
            <SettingItem
              icon="mail"
              title={t('contactUs', 'İletişim')}
              subtitle={t('contactUsDesc', 'Geri bildirim ve destek')}
              onPress={handleContactUs}
            />
            
            <SettingItem
              icon="information-circle"
              title={t('version', 'Versiyon')}
              subtitle="1.0.0 • Türkiye Radyoları"
              rightElement={
                <Text className="text-sm font-medium" style={{ color: colors.primary }}>
                  v1.0.0
                </Text>
              }
              showChevron={false}
            />
          </View>

          {/* Legal */}
          <View className="mt-6 mb-8">
            <Text 
              className="text-lg font-bold mb-4 mx-6"
              style={{ color: colors.text }}
            >
              📄 {t('legal', 'Yasal')}
            </Text>
            
            <SettingItem
              icon="document-text"
              title={t('privacyPolicy', 'Gizlilik Politikası')}
              subtitle={t('privacyPolicyDesc', 'Verilerinizi nasıl kullandığımız')}
              onPress={() => {}}
            />
            
            <SettingItem
              icon="document-text"
              title={t('termsOfService', 'Kullanım Şartları')}
              subtitle={t('termsDesc', 'Hizmet kullanım koşulları')}
              onPress={() => {}}
            />
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
};
