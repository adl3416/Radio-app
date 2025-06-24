import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import {
  equalizerService,
  EqualizerState,
  EQUALIZER_BANDS,
  EqualizerPreset
} from '../services/equalizerService';

interface EqualizerScreenProps {
  onClose: () => void;
}

export const EqualizerScreen: React.FC<EqualizerScreenProps> = ({ onClose }) => {
  const [equalizerState, setEqualizerState] = useState<EqualizerState>(
    equalizerService.getState()
  );

  useEffect(() => {
    const unsubscribe = equalizerService.subscribe(setEqualizerState);
    return unsubscribe;
  }, []);

  const handleToggleEqualizer = (enabled: boolean) => {
    equalizerService.setEnabled(enabled);
  };

  const handlePresetSelect = (preset: EqualizerPreset) => {
    equalizerService.setPreset(preset.id);
  };

  const handleBandIncrease = (bandIndex: number) => {
    const currentGain = equalizerState.customBands[bandIndex] || 0;
    equalizerService.setBandGain(bandIndex, Math.min(12, currentGain + 1));
  };

  const handleBandDecrease = (bandIndex: number) => {
    const currentGain = equalizerState.customBands[bandIndex] || 0;
    equalizerService.setBandGain(bandIndex, Math.max(-12, currentGain - 1));
  };

  const handleReset = () => {
    Alert.alert(
      'Sıfırla',
      'Tüm ayarları varsayılan değerlere döndürmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sıfırla',
          onPress: () => equalizerService.resetToFlat(),
          style: 'destructive'
        }
      ]
    );
  };

  const renderPresetButton = (preset: EqualizerPreset) => (
    <TouchableOpacity
      key={preset.id}
      onPress={() => handlePresetSelect(preset)}
      style={[
        styles.presetButton,
        equalizerState.currentPreset === preset.id ? styles.presetButtonActive : styles.presetButtonInactive
      ]}
    >
      <Text
        style={[
          styles.presetButtonText,
          equalizerState.currentPreset === preset.id ? styles.presetButtonTextActive : styles.presetButtonTextInactive
        ]}
      >
        {preset.name}
      </Text>
    </TouchableOpacity>
  );

  const renderBandControl = (bandIndex: number) => {
    const band = EQUALIZER_BANDS[bandIndex];
    const gain = equalizerState.customBands[bandIndex] || 0;

    return (
      <View key={bandIndex} style={styles.bandContainer}>
        <Text style={styles.bandLabel}>{band.label}</Text>
        
        <View style={styles.controlContainer}>
          <TouchableOpacity
            onPress={() => handleBandIncrease(bandIndex)}
            style={[styles.controlButton, !equalizerState.isEnabled && styles.controlButtonDisabled]}
            disabled={!equalizerState.isEnabled || gain >= 12}
          >
            <Ionicons name="add" size={20} color={gain >= 12 ? '#D1D5DB' : '#3B82F6'} />
          </TouchableOpacity>

          <View style={styles.gainDisplay}>            <Text style={styles.gainText}>
              {gain > 0 ? '+' : ''}{gain}{'dB'}
            </Text>
            <View style={styles.gainBar}>
              <View 
                style={[
                  styles.gainBarFill,
                  { 
                    height: `${((gain + 12) / 24) * 100}%`,
                    backgroundColor: gain > 0 ? '#10B981' : gain < 0 ? '#EF4444' : '#6B7280'
                  }
                ]}
              />
            </View>
          </View>

          <TouchableOpacity
            onPress={() => handleBandDecrease(bandIndex)}
            style={[styles.controlButton, !equalizerState.isEnabled && styles.controlButtonDisabled]}
            disabled={!equalizerState.isEnabled || gain <= -12}
          >
            <Ionicons name="remove" size={20} color={gain <= -12 ? '#D1D5DB' : '#3B82F6'} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Equalizer</Text>
        <TouchableOpacity onPress={handleReset} style={styles.resetButton}>
          <Ionicons name="refresh" size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Enable/Disable Toggle */}
        <View style={styles.toggleSection}>
          <Text style={styles.sectionTitle}>Equalizer</Text>
          <Switch
            value={equalizerState.isEnabled}
            onValueChange={handleToggleEqualizer}
            trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
            thumbColor={equalizerState.isEnabled ? '#ffffff' : '#ffffff'}
          />
        </View>

        {/* Presets */}
        <View style={styles.presetsSection}>
          <Text style={styles.sectionTitle}>Ön Ayarlar</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.presetsContainer}
          >
            {equalizerState.presets.map(renderPresetButton)}
          </ScrollView>
        </View>

        {/* Frequency Bands */}
        <View style={styles.bandsSection}>
          <Text style={styles.sectionTitle}>Frekans Bantları</Text>
          <Text style={styles.sectionSubtitle}>
            Her frekans bandının seviyesini artır/azalt butonları ile ayarlayın
          </Text>
          
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.bandsContainer}
          >
            {EQUALIZER_BANDS.map((_, index) => renderBandControl(index))}
          </ScrollView>
        </View>

        {/* Info */}
        <View style={styles.infoSection}>
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color="#3B82F6" />
            <Text style={styles.infoText}>
              Equalizer ayarları tüm radyo istasyonları için geçerlidir. 
              Değişiklikler anında uygulanır.
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
  resetButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  content: {
    flex: 1,
  },
  toggleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: 'white',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  presetsSection: {
    backgroundColor: 'white',
    paddingVertical: 20,
    marginBottom: 12,
  },
  presetsContainer: {
    paddingHorizontal: 16,
  },
  presetButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
  },
  presetButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  presetButtonInactive: {
    backgroundColor: 'transparent',
    borderColor: '#D1D5DB',
  },
  presetButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  presetButtonTextActive: {
    color: 'white',
  },
  presetButtonTextInactive: {
    color: '#6B7280',
  },
  bandsSection: {
    backgroundColor: 'white',
    paddingVertical: 20,
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    paddingHorizontal: 16,
    marginTop: 4,
    marginBottom: 20,
  },
  bandsContainer: {
    paddingHorizontal: 16,
  },
  bandContainer: {
    alignItems: 'center',
    marginRight: 20,
    width: 70,
  },
  bandLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 12,
  },
  controlContainer: {
    alignItems: 'center',
    height: 200,
  },
  controlButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 8,
  },
  controlButtonDisabled: {
    opacity: 0.5,
  },
  gainDisplay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  gainText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  gainBar: {
    width: 8,
    height: 80,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  gainBarFill: {
    width: '100%',
    borderRadius: 4,
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
});
