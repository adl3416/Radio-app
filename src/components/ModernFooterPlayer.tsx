import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  PanResponder,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { simpleRadioAudioService, RadioAudioState } from '../services/simpleRadioAudioService';
import { RadioLogo } from './RadioLogo';

const { width } = Dimensions.get('window');
const audioService = simpleRadioAudioService;

interface ModernFooterPlayerProps {
  onPress?: () => void;
  onSwipeUp?: () => void;
}

export const ModernFooterPlayer: React.FC<ModernFooterPlayerProps> = ({ onPress, onSwipeUp }) => {
  const [playbackState, setPlaybackState] = useState<RadioAudioState>(audioService.getState());
  const [lastPlayedStation, setLastPlayedStation] = useState<any>(null);
  const pan = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const unsubscribe = audioService.subscribe(setPlaybackState);
    loadLastPlayedStation();
    return unsubscribe;
  }, []);

  // Son çalınan radyoyu yükle
  const loadLastPlayedStation = async () => {
    try {
      const saved = await AsyncStorage.getItem('lastPlayedStation');
      if (saved) {
        setLastPlayedStation(JSON.parse(saved));
      }
    } catch (error) {
      console.log('Son radyo yüklenemedi:', error);
    }
  };

  // Radyo değiştiğinde kaydet
  useEffect(() => {
    if (playbackState.currentStation) {
      AsyncStorage.setItem('lastPlayedStation', JSON.stringify(playbackState.currentStation));
      setLastPlayedStation(playbackState.currentStation);
    }
  }, [playbackState.currentStation]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false, // Normal dokunmalarda pan başlatma
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Sadece belirgin yukarı hareket olduğunda pan'i aktif et
        return Math.abs(gestureState.dy) > 10 && gestureState.dy < -5; // En az 10px hareket ve yukarı yönde
      },
      onPanResponderGrant: () => {
        // Pan başladığında başlangıç değerini ayarla
        pan.setOffset((pan as any)._value);
        pan.setValue(0);
      },
      onPanResponderMove: (evt, gestureState) => {
        // Sadece yukarı hareketle hareket ettir, aşağı hareketi engelle
        if (gestureState.dy < 0) {
          pan.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        pan.flattenOffset();
        
        // 40px yukarı çekildiğinde büyük player'ı aç
        if (gestureState.dy < -40 && Math.abs(gestureState.dx) < 50) {
          onSwipeUp && onSwipeUp();
        }
        
        // Pan'i sıfırla - smooth animasyon
        Animated.spring(pan, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }).start();
      },
      onPanResponderTerminate: () => {
        // Hareket kesintiye uğrarsa pan'i sıfırla
        pan.flattenOffset();
        Animated.spring(pan, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  const handlePlayPause = async () => {
    // Eğer hiç radyo yoksa birşey yapma
    if (!playbackState.currentStation && !lastPlayedStation) {
      return;
    }

    try {
      if (playbackState.isPlaying) {
        await audioService.pause();
      } else {
        if (playbackState.currentStation) {
          await audioService.resume();
        } else if (lastPlayedStation) {
          // Son çalınan radyoyu tekrar başlat
          await audioService.play(lastPlayedStation);
        }
      }
    } catch (error) {
      console.error('Play/Pause error:', error);
    }
  };

  // Son çalınan radyoyu göster - uygulama açıldığında her zaman göster
  const displayStation = playbackState.currentStation || lastPlayedStation;

  // Mini player'ı her zaman göster (son çalınan radyo yoksa da)
  // if (!displayStation) {
  //   return null; // Bu satır kaldırıldı - her zaman göster
  // }

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          transform: [{ translateY: pan }],
        },
      ]}
      {...panResponder.panHandlers}
    >
      {/* Sol: Logo (Gri Arka Plan - 1/3 alan) */}
      <View style={styles.logoSection}>
        {displayStation ? (
          <RadioLogo station={displayStation} size={40} />
        ) : (
          <View style={styles.defaultLogoContainer}>
            <Ionicons name="radio-outline" size={24} color="#6B7280" />
          </View>
        )}
      </View>

      {/* Sağ: İsim ve Kontroller */}
      <TouchableOpacity
        style={styles.infoSection}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <Text style={styles.stationName} numberOfLines={1}>
          {displayStation?.name || 'Radyo Seçin'}
        </Text>
        <Text style={styles.statusText} numberOfLines={1}>
          {displayStation ? 
            (playbackState.currentStation ? 
              (playbackState.isPlaying ? 'Çalıyor' : 'Durduruldu') : 
              'Son Çalınan'
            ) : 
            'Başlamak için bir radyo seçin'
          }
        </Text>
      </TouchableOpacity>

      {/* Kontroller */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[
            styles.playButton,
            (!playbackState.currentStation && !lastPlayedStation) && styles.disabledButton
          ]}
          onPress={handlePlayPause}
          disabled={!playbackState.currentStation && !lastPlayedStation}
        >
          {playbackState.isLoading ? (
            <ActivityIndicator size="small" color="#FF6B35" />
          ) : (
            <Ionicons
              name={playbackState.isPlaying ? 'pause' : 'play'}
              size={20}
              color={(!playbackState.currentStation && !lastPlayedStation) ? '#9CA3AF' : '#FF6B35'}
            />
          )}
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  logoSection: {
    width: 56, // Daha dar ve kare
    height: 56,
    backgroundColor: '#F3F4F6',
    paddingVertical: 0,
    paddingHorizontal: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  defaultLogoContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoSection: {
    flex: 1,
    marginLeft: 12,
    marginRight: 12,
  },
  stationName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  statusText: {
    fontSize: 12,
    color: '#6B7280',
  },
  controls: {
    marginLeft: 12,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF3F2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  disabledButton: {
    backgroundColor: '#F3F4F6',
    borderColor: '#D1D5DB',
  },
});
