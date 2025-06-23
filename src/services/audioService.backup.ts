import { Audio, AVPlaybackSource, AVPlaybackStatusSuccess } from 'expo-av';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RadioStation } from '../constants/radioStations';
import { webAudioService } from './webAudioService';

export interface PlaybackState {
  isPlaying: boolean;
  isLoading: boolean;
  currentStation: RadioStation | null;
  volume: number;
  error: string | null;
}

class AudioService {
  private sound: Audio.Sound | null = null;
  private currentStation: RadioStation | null = null;
  private listeners: Array<(state: PlaybackState) => void> = [];
  private state: PlaybackState = {
    isPlaying: false,
    isLoading: false,
    currentStation: null,
    volume: 1.0,
    error: null,
  };

  constructor() {
    if (Platform.OS === 'web') {
      console.log('🌐 Using Web Audio Service for browser');
      // Web platformunda webAudioService'i delegate olarak kullan
      return;
    }
    
    this.initializeAudio();
    this.loadVolumeFromStorage();
  }

  // Web platformu için proxy methods
  private isWeb(): boolean {
    return Platform.OS === 'web';
  }

  public subscribe(listener: (state: PlaybackState) => void) {
    if (this.isWeb()) {
      return webAudioService.subscribe(listener);
    }
    
    this.listeners.push(listener);
    listener(this.state);
    
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public async playStation(station: RadioStation) {
    if (this.isWeb()) {
      return webAudioService.playStation(station);
    }
    
    return this.playStationNative(station);
  }

  public async pause() {
    if (this.isWeb()) {
      return webAudioService.pause();
    }
    
    try {
      if (this.sound) {
        await this.sound.pauseAsync();
        this.updateState({ isPlaying: false });
      }
    } catch (error) {
      console.error('Failed to pause:', error);
    }
  }

  public async resume() {
    if (this.isWeb()) {
      return webAudioService.resume();
    }
    
    try {
      if (this.sound) {
        await this.sound.playAsync();
        this.updateState({ isPlaying: true });
      }
    } catch (error) {
      console.error('Failed to resume:', error);
    }
  }

  public async stop() {
    if (this.isWeb()) {
      return webAudioService.stop();
    }
    
    try {
      if (this.sound) {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
        this.sound = null;
      }
      
      this.updateState({
        isPlaying: false,
        isLoading: false,
        currentStation: null,
        error: null,
      });
    } catch (error) {
      console.error('Failed to stop:', error);
    }
  }

  public async setVolume(volume: number) {
    if (this.isWeb()) {
      return webAudioService.setVolume(volume);
    }
    
    try {
      if (this.sound) {
        await this.sound.setVolumeAsync(volume);
      }
      this.updateState({ volume });
      await this.saveVolumeToStorage(volume);
    } catch (error) {
      console.error('Failed to set volume:', error);
    }
  }

  public getState(): PlaybackState {
    if (this.isWeb()) {
      return webAudioService.getState();
    }
    
    return { ...this.state };
  }

  public async getRecentStations(): Promise<RadioStation[]> {
    if (this.isWeb()) {
      return webAudioService.getRecentStations();
    }
    
    try {
      const recentStations = await AsyncStorage.getItem('recent-stations');
      return recentStations ? JSON.parse(recentStations) : [];
    } catch (error) {
      console.error('Failed to get recent stations:', error);
      return [];
    }
  }

  public async cleanup() {
    if (this.isWeb()) {
      return webAudioService.cleanup();
    }
    
    try {
      if (this.sound) {
        await this.sound.unloadAsync();
        this.sound = null;
      }
      this.listeners = [];
    } catch (error) {
      console.error('Failed to cleanup audio service:', error);
    }
  }
  private async initializeAudio() {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        staysActiveInBackground: true,
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      console.log('Audio initialized successfully');
    } catch (error) {
      console.error('Failed to initialize audio:', error);
    }
  }

  private async loadVolumeFromStorage() {
    try {
      const savedVolume = await AsyncStorage.getItem('audio-volume');
      if (savedVolume) {
        this.state.volume = parseFloat(savedVolume);
      }
    } catch (error) {
      console.error('Failed to load volume:', error);
    }
  }

  private async saveVolumeToStorage(volume: number) {
    try {
      await AsyncStorage.setItem('audio-volume', volume.toString());
    } catch (error) {
      console.error('Failed to save volume:', error);
    }
  }

  private updateState(updates: Partial<PlaybackState>) {
    this.state = { ...this.state, ...updates };
    this.listeners.forEach(listener => listener(this.state));
  }

  public subscribe(listener: (state: PlaybackState) => void) {
    this.listeners.push(listener);
    listener(this.state); // Send current state immediately
    
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }  public async playStation(station: RadioStation) {
    try {
      console.log(`🎵 Starting playback for: ${station.name}`);
      console.log(`🌐 Stream URL: ${station.streamUrl}`);
      
      this.updateState({ isLoading: true, error: null });

      // Stop current playback
      if (this.sound) {
        console.log('🛑 Stopping current sound');
        await this.sound.unloadAsync();
        this.sound = null;
      }

      // Test the stream URL first
      console.log('🔍 Testing stream URL...');
      try {
        const response = await fetch(station.streamUrl, { 
          method: 'HEAD',
          headers: {
            'Accept': 'audio/*',
            'User-Agent': 'Mozilla/5.0 (compatible; TurkRadioApp/1.0)',
          }
        });
        console.log(`📡 Stream test response: ${response.status} ${response.statusText}`);
      } catch (fetchError) {
        console.warn('⚠️ Stream test failed, trying anyway:', fetchError);
      }

      // Create new sound instance with better configuration
      console.log('🎧 Creating audio instance...');
      const { sound } = await Audio.Sound.createAsync(
        { uri: station.streamUrl } as AVPlaybackSource,
        {
          shouldPlay: true,
          volume: this.state.volume,
          isLooping: false,
          progressUpdateIntervalMillis: 1000,
          positionMillis: 0,
        },
        this.onPlaybackStatusUpdate.bind(this)
      );

      this.sound = sound;
      this.currentStation = station;
      
      console.log('✅ Audio instance created successfully');
      
      // Update state immediately to show current station
      this.updateState({
        currentStation: station,
        isLoading: true, // Keep loading until playback starts
      });

      // Save to recent stations
      await this.saveToRecentStations(station);

      console.log(`🎉 Successfully started playing: ${station.name}`);
    } catch (error) {
      console.error('❌ Failed to play station:', error);
      let errorMessage = 'Radyo istasyonu çalınamadı';
      
      if (error instanceof Error) {
        console.log('🔍 Error details:', error.message);
        if (error.message.includes('network') || error.message.includes('Network')) {
          errorMessage = 'İnternet bağlantısı kontrol edin';
        } else if (error.message.includes('format') || error.message.includes('codec')) {
          errorMessage = 'Desteklenmeyen ses formatı';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Bağlantı zaman aşımı';
        } else if (error.message.includes('CORS')) {
          errorMessage = 'Bu radyo istasyonu şu anda erişilebilir değil';
        } else if (error.message.includes('permission')) {
          errorMessage = 'Ses izni gerekli';
        }
      }
      
      this.updateState({
        isLoading: false,
        error: errorMessage,
        isPlaying: false,
      });
      
      throw error; // Re-throw to let the UI handle the error
    }
  }

  public async pause() {
    try {
      if (this.sound) {
        await this.sound.pauseAsync();
        this.updateState({ isPlaying: false });
      }
    } catch (error) {
      console.error('Failed to pause:', error);
    }
  }

  public async resume() {
    try {
      if (this.sound) {
        await this.sound.playAsync();
        this.updateState({ isPlaying: true });
      }
    } catch (error) {
      console.error('Failed to resume:', error);
    }
  }

  public async stop() {
    try {
      if (this.sound) {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
        this.sound = null;
      }
      
      this.updateState({
        isPlaying: false,
        isLoading: false,
        currentStation: null,
        error: null,
      });
    } catch (error) {
      console.error('Failed to stop:', error);
    }
  }

  public async setVolume(volume: number) {
    try {
      if (this.sound) {
        await this.sound.setVolumeAsync(volume);
      }
      this.updateState({ volume });
      await this.saveVolumeToStorage(volume);
    } catch (error) {
      console.error('Failed to set volume:', error);
    }
  }  private onPlaybackStatusUpdate(status: any) {
    console.log('🔄 Playback status update:', {
      isLoaded: status.isLoaded,
      isPlaying: status.isPlaying,
      isBuffering: status.isBuffering,
      error: status.error
    });

    if (status.isLoaded) {
      if (status.error) {
        console.error('❌ Playback error:', status.error);
        this.updateState({
          error: 'Oynatma hatası: ' + status.error,
          isPlaying: false,
          isLoading: false,
        });
      } else {
        console.log('✅ Playback status OK:', {
          playing: status.isPlaying,
          buffering: status.isBuffering
        });
        this.updateState({
          isPlaying: status.isPlaying && !status.isBuffering,
          isLoading: status.isBuffering,
          error: null,
        });
      }
    } else if (status.error) {
      console.error('❌ Load error:', status.error);
      this.updateState({
        error: 'Yükleme hatası: ' + status.error,
        isPlaying: false,
        isLoading: false,
      });
    }
  }

  private async saveToRecentStations(station: RadioStation) {
    try {
      const recentStations = await this.getRecentStations();
      const filteredStations = recentStations.filter(s => s.id !== station.id);
      const newRecentStations = [station, ...filteredStations].slice(0, 10);
      
      await AsyncStorage.setItem('recent-stations', JSON.stringify(newRecentStations));
    } catch (error) {
      console.error('Failed to save recent station:', error);
    }
  }

  public async getRecentStations(): Promise<RadioStation[]> {
    try {
      const recentStations = await AsyncStorage.getItem('recent-stations');
      return recentStations ? JSON.parse(recentStations) : [];
    } catch (error) {
      console.error('Failed to get recent stations:', error);
      return [];
    }
  }

  public getState(): PlaybackState {
    return { ...this.state };
  }

  public async cleanup() {
    try {
      if (this.sound) {
        await this.sound.unloadAsync();
        this.sound = null;
      }
      this.listeners = [];
    } catch (error) {
      console.error('Failed to cleanup audio service:', error);
    }
  }
}

export const audioService = new AudioService();
