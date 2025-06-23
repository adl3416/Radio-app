import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  StyleSheet,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EqualizerScreen } from './EqualizerScreen';
import { SleepTimerScreen } from './SleepTimerScreen';

export const SettingsScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [notifications, setNotifications] = useState(true);
  const [autoPlay, setAutoPlay] = useState(false);
  const [showEqualizer, setShowEqualizer] = useState(false);
  const [showSleepTimer, setShowSleepTimer] = useState(false);

  const handleLanguageChange = (language: string) => {
    Alert.alert(
      'Dil Değişikliği',
      `Dili ${language === 'tr' ? 'Türkçe' : 'İngilizce'} olarak değiştirmek istediğinizden emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Değiştir',
          onPress: () => {
            i18n.changeLanguage(language);
          },
        },
      ]
    );
  };
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
      style={styles.settingItem}
      disabled={!onPress}
    >
      <View style={styles.iconContainer}>
        <Ionicons name={icon as any} size={20} color="#3B82F6" />
      </View>
      
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && (
          <Text style={styles.settingSubtitle}>{subtitle}</Text>
        )}
      </View>
      
      {rightElement || (showChevron && onPress && (
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      ))}
    </TouchableOpacity>
  );
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          {t('screens.settings.title')}
        </Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Language Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('screens.settings.language')}
          </Text>
          
          <SettingItem
            icon="language"
            title="Türkçe"
            subtitle={i18n.language === 'tr' ? 'Mevcut dil' : 'Türkçe\'ye geç'}
            onPress={() => handleLanguageChange('tr')}
            rightElement={
              i18n.language === 'tr' ? (
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              ) : null
            }
            showChevron={i18n.language !== 'tr'}
          />
          
          <SettingItem
            icon="language"
            title="English"
            subtitle={i18n.language === 'en' ? 'Current language' : 'Switch to English'}
            onPress={() => handleLanguageChange('en')}
            rightElement={
              i18n.language === 'en' ? (
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              ) : null
            }
            showChevron={i18n.language !== 'en'}
          />
        </View>        {/* Audio Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Ses Ayarları
          </Text>
            <SettingItem
            icon="musical-notes"
            title="Equalizer"
            subtitle="Ses kalitesini özelleştirin"
            onPress={() => setShowEqualizer(true)}
          />

          <SettingItem
            icon="moon"
            title={t('screens.settings.sleepTimer')}
            subtitle="Belirli süre sonra radyoyu durdur"
            onPress={() => setShowSleepTimer(true)}
          />
          
          <SettingItem
            icon="notifications"
            title={t('screens.settings.notifications')}
            subtitle="Çalma bildirimleri"
            rightElement={
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
                thumbColor={notifications ? '#ffffff' : '#ffffff'}
              />
            }
            showChevron={false}
          />
          
          <SettingItem
            icon="play-circle"
            title={t('screens.settings.autoPlay')}
            subtitle="Uygulama açıldığında son istasyonu çal"
            rightElement={
              <Switch
                value={autoPlay}
                onValueChange={setAutoPlay}
                trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
                thumbColor={autoPlay ? '#ffffff' : '#ffffff'}
              />
            }
            showChevron={false}
          />
        </View>{/* App Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Uygulama
          </Text>
          
          <SettingItem
            icon="information-circle"
            title={t('screens.settings.about')}
            subtitle="Türk Radyosu v1.0.0"
            onPress={() => {
              Alert.alert(
                'Türk Radyosu',
                'Türkiye\'nin en popüler radyo istasyonlarını dinleyin.\n\nVersiyon: 1.0.0\nGeliştirici: Radyo App Team',
                [{ text: 'Tamam' }]
              );
            }}
          />
          
          <SettingItem
            icon="star"
            title="Uygulamayı Oyla"
            subtitle="App Store'da bizi destekleyin"
            onPress={() => {
              Alert.alert(
                'Teşekkürler!',
                'Uygulamayı beğendiğinize sevindik. Gerçek bir uygulamada buradan App Store\'a yönlendirilirsiniz.',
                [{ text: 'Tamam' }]
              );
            }}
          />
          
          <SettingItem
            icon="share"
            title="Uygulamayı Paylaş"
            subtitle="Arkadaşlarınızla paylaşın"
            onPress={() => {
              Alert.alert(
                'Paylaş',
                'Türk Radyosu uygulamasını arkadaşlarınızla paylaşın!',
                [{ text: 'Tamam' }]
              );
            }}
          />
        </View>        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Türk Radyosu v1.0.0
          </Text>
          <Text style={styles.footerSubtext}>
            Made with ❤️ in Turkey          </Text>
        </View>
      </ScrollView>      {/* Equalizer Modal */}
      <Modal
        visible={showEqualizer}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <EqualizerScreen onClose={() => setShowEqualizer(false)} />
      </Modal>

      {/* Sleep Timer Modal */}
      <Modal
        visible={showSleepTimer}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <SleepTimerScreen onClose={() => setShowSleepTimer(false)} />
      </Modal>
    </SafeAreaView>
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
  content: {
    flex: 1,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    paddingHorizontal: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingItem: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  iconContainer: {
    width: 40,
    height: 40,
    backgroundColor: '#DBEAFE',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    color: '#111827',
    fontWeight: '500',
    fontSize: 16,
  },
  settingSubtitle: {
    color: '#6B7280',
    fontSize: 14,
    marginTop: 4,
  },
  footer: {
    marginTop: 32,
    marginBottom: 24,
  },
  footerText: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 14,
  },
  footerSubtext: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 4,
  },
});
