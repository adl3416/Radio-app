import { Audio, AVPlaybackSource } from 'expo-av';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RadioStation } from '../constants/radioStations';

export interface PlaybackState {
  isPlaying: boolean;
  isLoading: boolean;
  currentStation: RadioStation | null;
  volume: number;
  error: string | null;
}

// Web Audio Service for browser
class WebAudioService {
  private audio: HTMLAudioElement | null = null;
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
    this.loadVolumeFromStorage();
  }

  private async loadVolumeFromStorage() {
    try {
      const savedVolume = localStorage.getItem('audio-volume');
      if (savedVolume) {
        this.state.volume = parseFloat(savedVolume);
      }
    } catch (error) {
      console.error('Failed to load volume:', error);
    }
  }

  private updateState(updates: Partial<PlaybackState>) {
    this.state = { ...this.state, ...updates };
    this.listeners.forEach(listener => listener(this.state));
  }

  public subscribe(listener: (state: PlaybackState) => void) {
    this.listeners.push(listener);
    listener(this.state);
    
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public async playStation(station: RadioStation) {
    try {
      console.log(`🎵 [WEB] Starting playback for: ${station.name}`);
      
      this.updateState({ isLoading: true, error: null });

      if (this.audio) {
        this.audio.pause();
        this.audio.src = '';
        this.audio = null;
      }

      this.audio = new Audio();
      this.audio.crossOrigin = 'anonymous';
      this.audio.preload = 'auto';
      this.audio.volume = this.state.volume;

      this.audio.addEventListener('loadstart', () => {
        this.updateState({ isLoading: true });
      });

      this.audio.addEventListener('canplay', () => {
        this.updateState({ isLoading: false });
      });

      this.audio.addEventListener('playing', () => {
        this.updateState({ isPlaying: true, isLoading: false, error: null });
      });

      this.audio.addEventListener('pause', () => {
        this.updateState({ isPlaying: false });
      });

      this.audio.addEventListener('error', (e) => {
        console.error('❌ [WEB] Audio error:', e);
        this.updateState({
          error: 'Radyo çalınamadı - tarayıcı ses izni gerekebilir',
          isPlaying: false,
          isLoading: false,
        });
      });

      this.audio.addEventListener('waiting', () => {
        this.updateState({ isLoading: true });
      });

      this.audio.src = station.streamUrl;
      this.currentStation = station;
      
      this.updateState({
        currentStation: station,
        isLoading: true,
      });

      await this.audio.play();
      console.log(`🎉 [WEB] Successfully started playing: ${station.name}`);
    } catch (error) {
      console.error('❌ [WEB] Failed to play station:', error);
      let errorMessage = 'Radyo istasyonu çalınamadı';
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Ses izni gerekli - tarayıcıda izin verin';
        } else if (error.name === 'NotSupportedError') {
          errorMessage = 'Desteklenmeyen ses formatı';
        }
      }
      
      this.updateState({
        isLoading: false,
        error: errorMessage,
        isPlaying: false,
      });
      
      throw error;
    }
  }

  public async pause() {
    if (this.audio) {
      this.audio.pause();
      this.updateState({ isPlaying: false });
    }
  }

  public async resume() {
    if (this.audio) {
      await this.audio.play();
      this.updateState({ isPlaying: true });
    }
  }

  public async stop() {
    if (this.audio) {
      this.audio.pause();
      this.audio.src = '';
      this.audio = null;
    }
    
    this.updateState({
      isPlaying: false,
      isLoading: false,
      currentStation: null,
      error: null,
    });
  }

  public async setVolume(volume: number) {
    if (this.audio) {
      this.audio.volume = volume;
    }
    this.updateState({ volume });
    localStorage.setItem('audio-volume', volume.toString());
  }

  public getState(): PlaybackState {
    return { ...this.state };
  }

  public async getRecentStations(): Promise<RadioStation[]> {
    try {
      const recentStations = localStorage.getItem('recent-stations');
      return recentStations ? JSON.parse(recentStations) : [];
    } catch (error) {
      return [];
    }
  }

  public async cleanup() {
    if (this.audio) {
      this.audio.pause();
      this.audio.src = '';
      this.audio = null;
    }
    this.listeners = [];
  }
}

// Native Audio Service for mobile
class NativeAudioService {
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
    this.initializeAudio();
    this.loadVolumeFromStorage();
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

  private updateState(updates: Partial<PlaybackState>) {
    this.state = { ...this.state, ...updates };
    this.listeners.forEach(listener => listener(this.state));
  }

  public subscribe(listener: (state: PlaybackState) => void) {
    this.listeners.push(listener);
    listener(this.state);
    
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public async playStation(station: RadioStation) {
    try {
      console.log(`🎵 [NATIVE] Starting playback for: ${station.name}`);
      
      this.updateState({ isLoading: true, error: null });

      if (this.sound) {
        await this.sound.unloadAsync();
        this.sound = null;
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: station.streamUrl } as AVPlaybackSource,
        {
          shouldPlay: true,
          volume: this.state.volume,
          isLooping: false,
          progressUpdateIntervalMillis: 1000,
        },
        this.onPlaybackStatusUpdate.bind(this)
      );

      this.sound = sound;
      this.currentStation = station;
      
      this.updateState({
        currentStation: station,
        isLoading: true,
      });

      await this.saveToRecentStations(station);
      console.log(`🎉 [NATIVE] Successfully started playing: ${station.name}`);
    } catch (error) {
      console.error('❌ [NATIVE] Failed to play station:', error);
      let errorMessage = 'Radyo istasyonu çalınamadı';
      
      if (error instanceof Error) {
        if (error.message.includes('network')) {
          errorMessage = 'İnternet bağlantısı kontrol edin';
        } else if (error.message.includes('format')) {
          errorMessage = 'Desteklenmeyen ses formatı';
        }
      }
      
      this.updateState({
        isLoading: false,
        error: errorMessage,
        isPlaying: false,
      });
      
      throw error;
    }
  }

  private onPlaybackStatusUpdate(status: any) {
    if (status.isLoaded) {
      if (status.error) {
        this.updateState({
          error: 'Oynatma hatası',
          isPlaying: false,
          isLoading: false,
        });
      } else {
        this.updateState({
          isPlaying: status.isPlaying && !status.isBuffering,
          isLoading: status.isBuffering,
          error: null,
        });
      }
    }
  }

  public async pause() {
    if (this.sound) {
      await this.sound.pauseAsync();
      this.updateState({ isPlaying: false });
    }
  }

  public async resume() {
    if (this.sound) {
      await this.sound.playAsync();
      this.updateState({ isPlaying: true });
    }
  }

  public async stop() {
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
  }

  public async setVolume(volume: number) {
    if (this.sound) {
      await this.sound.setVolumeAsync(volume);
    }
    this.updateState({ volume });
    await AsyncStorage.setItem('audio-volume', volume.toString());
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
      return [];
    }
  }

  public getState(): PlaybackState {
    return { ...this.state };
  }

  public async cleanup() {
    if (this.sound) {
      await this.sound.unloadAsync();
      this.sound = null;
    }
    this.listeners = [];
  }
}

// Create platform-specific service
export const audioService = Platform.OS === 'web' 
  ? new WebAudioService() as any 
  : new NativeAudioService() as any;
