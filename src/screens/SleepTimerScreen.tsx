import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Mock sleep timer service and types
interface SleepTimerState {
  isActive: boolean;
  remainingTime: number;
  totalDuration: number;
  duration: number;
}

const SLEEP_TIMER_DURATIONS = [
  { label: '15 min', value: 15 * 60 * 1000 },
  { label: '30 min', value: 30 * 60 * 1000 },
  { label: '45 min', value: 45 * 60 * 1000 },
  { label: '1 saat', value: 60 * 60 * 1000 },
  { label: '2 saat', value: 2 * 60 * 60 * 1000 },
];

const sleepTimerService = {
  getState: (): SleepTimerState => ({
    isActive: false,
    remainingTime: 0,
    totalDuration: 0,
    duration: 0,
  }),
  subscribe: (callback: (state: SleepTimerState) => void) => () => {},
  start: (duration: number) => {},
  stop: () => {},
  pause: () => {},
  resume: () => {},
  setDuration: (duration: number) => {},
  startTimer: (callback: () => void) => {},
  stopTimer: () => {},
  extendTimer: (minutes: number) => {},
  getRemainingTimeFormatted: () => '00:00',
};

interface SleepTimerScreenProps {
  onClose: () => void;
  onTimerComplete?: () => void;
}

export const SleepTimerScreen: React.FC<SleepTimerScreenProps> = ({ 
  onClose, 
  onTimerComplete 
}) => {
  const [timerState, setTimerState] = useState<SleepTimerState>(
    sleepTimerService.getState()
  );

  useEffect(() => {
    const unsubscribe = sleepTimerService.subscribe(setTimerState);
    return unsubscribe;
  }, []);

  const handleStartTimer = async (duration: number) => {
    await sleepTimerService.setDuration(duration);
    await sleepTimerService.startTimer(() => {
      onTimerComplete?.();
      Alert.alert(
        'Uyku Zamanlayıcısı',
        'Belirlenen süre doldu. Radyo durduruluyor.',
        [{ text: 'Tamam' }]
      );
    });
  };

  const handleStopTimer = async () => {
    Alert.alert(
      'Zamanlayıcıyı Durdur',
      'Uyku zamanlayıcısını durdurmak istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Durdur',
          onPress: () => sleepTimerService.stopTimer(),
          style: 'destructive'
        }
      ]
    );
  };

  const handleExtendTimer = (additionalMinutes: number) => {
    sleepTimerService.extendTimer(additionalMinutes);
  };

  const renderDurationButton = (duration: { label: string; value: number }) => (
    <TouchableOpacity
      key={duration.value}
      onPress={() => handleStartTimer(duration.value)}
      style={[
        styles.durationButton,
        timerState.duration === duration.value && !timerState.isActive ? styles.durationButtonSelected : {}
      ]}
      disabled={timerState.isActive}
    >
      <Text
        style={[
          styles.durationButtonText,
          timerState.duration === duration.value && !timerState.isActive ? styles.durationButtonTextSelected : {},
          timerState.isActive ? styles.durationButtonTextDisabled : {}
        ]}
      >
        {duration.label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Uyku Zamanlayıcısı</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current Timer Status */}
        {timerState.isActive && (
          <View style={styles.activeTimerSection}>
            <View style={styles.timerDisplay}>
              <Ionicons name="moon" size={32} color="#3B82F6" />
              <Text style={styles.timerTitle}>Zamanlayıcı Aktif</Text>
              <Text style={styles.remainingTime}>
                {sleepTimerService.getRemainingTimeFormatted()}
              </Text>
              <Text style={styles.timerSubtitle}>
                Radyo otomatik olarak duracak
              </Text>
            </View>

            <View style={styles.timerControls}>
              <TouchableOpacity
                onPress={() => handleExtendTimer(5)}
                style={styles.extendButton}
              >
                <Ionicons name="add-circle" size={20} color="#10B981" />
                <Text style={styles.extendButtonText}>+5 dk</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleExtendTimer(10)}
                style={styles.extendButton}
              >
                <Ionicons name="add-circle" size={20} color="#10B981" />
                <Text style={styles.extendButtonText}>+10 dk</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleStopTimer}
                style={styles.stopButton}
              >
                <Ionicons name="stop-circle" size={20} color="#EF4444" />
                <Text style={styles.stopButtonText}>Durdur</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Duration Selection */}
        {!timerState.isActive && (
          <View style={styles.durationSection}>
            <Text style={styles.sectionTitle}>Süre Seçin</Text>
            <Text style={styles.sectionSubtitle}>
              Belirlenen süre sonunda radyo otomatik olarak duracak
            </Text>

            <View style={styles.durationGrid}>
              {SLEEP_TIMER_DURATIONS.map(renderDurationButton)}
            </View>
          </View>
        )}

        {/* Info */}
        <View style={styles.infoSection}>
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color="#3B82F6" />
            <Text style={styles.infoText}>
              Uyku zamanlayıcısı, belirlenen süre sonunda radyo yayınını otomatik olarak durdurur. 
              Zamanlayıcı aktifken uygulamayı kapatırsanız, zamanlayıcı iptal olur.
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Hızlı İpuçları</Text>
          
          <View style={styles.tipContainer}>
            <Ionicons name="bulb" size={16} color="#F59E0B" />
            <Text style={styles.tipText}>
              Zamanlayıcı aktifken ekranı kapatabilirsiniz, radyo arka planda çalmaya devam eder.
            </Text>
          </View>

          <View style={styles.tipContainer}>
            <Ionicons name="volume-medium" size={16} color="#F59E0B" />
            <Text style={styles.tipText}>
              Zamanlayıcı bitmeden önce ses seviyesini düşürmek için volume kontrollerini kullanın.
            </Text>
          </View>

          <View style={styles.tipContainer}>
            <Ionicons name="add" size={16} color="#F59E0B" />
            <Text style={styles.tipText}>
              Zamanlayıcı aktifken +5dk veya +10dk butonları ile süreyi uzatabilirsiniz.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    padding: 8,
  },
  placeholder: {
    width: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  content: {
    flex: 1,
  },
  activeTimerSection: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timerDisplay: {
    alignItems: 'center',
    marginBottom: 24,
  },
  timerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 8,
    marginBottom: 16,
  },
  remainingTime: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#3B82F6',
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  timerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  timerControls: {
    flexDirection: 'row',
    gap: 12,
  },
  extendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  extendButtonText: {
    color: '#10B981',
    fontWeight: '500',
    marginLeft: 4,
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  stopButtonText: {
    color: '#EF4444',
    fontWeight: '500',
    marginLeft: 4,
  },
  durationSection: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 16,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  durationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  durationButton: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  durationButtonSelected: {
    backgroundColor: '#EBF8FF',
    borderColor: '#3B82F6',
  },
  durationButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  durationButtonTextSelected: {
    color: '#1E40AF',
  },
  durationButtonTextDisabled: {
    color: '#9CA3AF',
  },
  infoSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#EBF8FF',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1E40AF',
    marginLeft: 12,
    lineHeight: 20,
  },
  quickActionsSection: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 16,
    padding: 20,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    marginLeft: 12,
    lineHeight: 20,
  },
});
