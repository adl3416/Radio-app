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
  private isAudioContextEnabled = false;
  private state: PlaybackState = {
    isPlaying: false,
    isLoading: false,
    currentStation: null,
    volume: 1.0,
    error: null,
  };

  constructor() {
    this.loadVolumeFromStorage();
    this.enableAudioContext();
  }

  private async enableAudioContext() {
    // Enable audio context on first user interaction
    const enableAudio = () => {
      if (!this.isAudioContextEnabled) {
        this.isAudioContextEnabled = true;
        console.log('🔊 [WEB] Audio context enabled by user interaction');
        document.removeEventListener('click', enableAudio);
        document.removeEventListener('touchstart', enableAudio);
      }
    };

    document.addEventListener('click', enableAudio);
    document.addEventListener('touchstart', enableAudio);
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
  }  public async playStation(station: RadioStation) {
    try {
      console.log(`🎵 [WEB] Starting playback for: ${station.name}`);
      console.log(`🔗 [WEB] Stream URL: ${station.streamUrl || station.url}`);
      console.log(`🎧 [WEB] Station codec: ${station.codec || 'Unknown'}`);
      console.log(`🔊 [WEB] Audio context enabled: ${this.isAudioContextEnabled}`);
      console.log(`🌐 [WEB] User Agent:`, navigator.userAgent);
      console.log(`🔊 [WEB] Audio support:`, {
        canPlayMP3: (window as any).HTMLAudioElement ? new (window as any).HTMLAudioElement().canPlayType('audio/mpeg') : 'unknown',
        canPlayAAC: (window as any).HTMLAudioElement ? new (window as any).HTMLAudioElement().canPlayType('audio/aac') : 'unknown',
        canPlayMP4: (window as any).HTMLAudioElement ? new (window as any).HTMLAudioElement().canPlayType('audio/mp4') : 'unknown'
      });
      
      // Use streamUrl if available, otherwise fall back to url
      const finalUrl = station.streamUrl || station.url;
      if (!finalUrl) {
        throw new Error('No URL available for station');
      }
      
      // Check if URL looks problematic
      const urlLower = finalUrl.toLowerCase();
      if (urlLower.includes('.m3u8') || urlLower.includes('.pls') || urlLower.includes('.m3u')) {
        throw new Error('Desteklenmeyen playlist formatı: Bu istasyon HLS/M3U8 formatı kullanıyor ve web tarayıcıda desteklenmiyor.');
      }
      
      this.updateState({ isLoading: true, error: null });

      if (this.audio) {
        console.log('🧹 [WEB] Cleaning up previous audio instance');
        this.audio.pause();
        this.audio.src = '';
        this.audio = null;
      }

      console.log('🆕 [WEB] Creating new audio element');
      this.audio = new HTMLAudioElement();
      
      if (this.audio) {
        // Set CORS to null for better compatibility with radio streams
        this.audio.crossOrigin = null; // Change to null for better compatibility
        this.audio.preload = 'metadata'; // Changed to metadata for better loading
        this.audio.volume = this.state.volume;

        this.audio.addEventListener('loadstart', () => {
          console.log(`📥 [WEB] Started loading: ${station.name}`);
          this.updateState({ isLoading: true });
        });

        this.audio.addEventListener('canplay', () => {
          console.log(`✅ [WEB] Can play: ${station.name}`);
          this.updateState({ isLoading: false });
        });

        this.audio.addEventListener('playing', () => {
          console.log(`🎶 [WEB] Now playing: ${station.name}`);
          this.updateState({ isPlaying: true, isLoading: false, error: null });
        });        this.audio.addEventListener('pause', () => {
          console.log(`⏸️ [WEB] Paused: ${station.name}`);
          this.updateState({ isPlaying: false });
        });        this.audio.addEventListener('error', (e) => {
          console.error('❌ [WEB] Audio error:', e);
          console.error('❌ [WEB] Audio error details:', this.audio?.error);
          console.error('❌ [WEB] Stream URL:', station.streamUrl);
          
          let errorMessage = 'Radyo çalınamadı';
          let suggestion = '';
          
          if (this.audio?.error) {
            switch (this.audio.error.code) {
              case 1: // MEDIA_ERR_ABORTED
                errorMessage = 'Ses yükleme iptal edildi';
                suggestion = 'Tekrar deneyin veya başka istasyon seçin';
                break;
              case 2: // MEDIA_ERR_NETWORK
                errorMessage = 'Ağ hatası veya CORS problemi';
                suggestion = 'İnternet bağlantınızı kontrol edin veya farklı istasyon deneyin';
                break;
              case 3: // MEDIA_ERR_DECODE
                errorMessage = 'Desteklenmeyen ses formatı';
                suggestion = 'Bu istasyon formatı web tarayıcıda desteklenmiyor. Başka istasyon deneyin.';
                break;
              case 4: // MEDIA_ERR_SRC_NOT_SUPPORTED
                errorMessage = 'Bu ses formatı desteklenmiyor';
                suggestion = 'Farklı bir radyo istasyonu seçin. MP3/AAC formatları önerilir.';
                break;
              default:
                errorMessage = 'Bilinmeyen ses oynatma hatası';
                suggestion = 'Tarayıcıda ses izni gerekebilir. Ayarlardan izin verin ve tekrar deneyin.';
            }
          } else {
            // Browser compatibility issues
            errorMessage = 'Tarayıcı uyumluluk hatası';
            suggestion = 'Modern bir tarayıcı kullanın (Chrome, Firefox, Safari)';
          }
          
          const fullMessage = suggestion ? `${errorMessage}. ${suggestion}` : errorMessage;
          
          this.updateState({
            error: fullMessage,
            isPlaying: false,
            isLoading: false,
          });
        });        this.audio.addEventListener('waiting', () => {
          this.updateState({ isLoading: true });
        });

        this.audio.addEventListener('stalled', () => {
          console.warn('⚠️ [WEB] Stream stalled:', station.name);
          this.updateState({ isLoading: true });
        });

        this.audio.addEventListener('suspend', () => {
          console.warn('⚠️ [WEB] Stream suspended:', station.name);
        });        // Set the source and start loading
        console.log('🔗 [WEB] Setting audio source:', finalUrl);
        this.audio.src = finalUrl;
        this.currentStation = station;
        
        this.updateState({
          currentStation: station,
          isLoading: true,
        });

        // Use load() method to properly initialize the stream
        console.log('📥 [WEB] Loading audio...');
        this.audio.load();
        
        // Add a small delay before attempting to play
        await new Promise(resolve => setTimeout(resolve, 100));
          // Attempt to play with better error handling
        try {
          // Check if user interaction is enabled
          if (!this.isAudioContextEnabled) {
            throw new Error('UserInteractionRequired');
          }

          const playPromise = this.audio.play();
          
          if (playPromise !== undefined) {
            await playPromise;
            console.log(`🎉 [WEB] Successfully started playing: ${station.name}`);
          }
        } catch (playError) {
          console.error('❌ [WEB] Play promise rejected:', playError);
          
          let playErrorMessage = 'Oynatma başlatılamadı';
          
          if (playError instanceof Error) {
            if (playError.message === 'UserInteractionRequired') {
              playErrorMessage = '🔊 Ses çalmak için sayfada herhangi bir yere tıklayın ve tekrar deneyin';
            } else if (playError.name === 'NotAllowedError') {
              playErrorMessage = 'Tarayıcıda ses izni gerekli - lütfen sayfada herhangi bir yere tıklayın ve tekrar deneyin';
            } else if (playError.name === 'NotSupportedError') {
              playErrorMessage = 'Bu ses formatı tarayıcınızda desteklenmiyor';
            } else if (playError.name === 'AbortError') {
              playErrorMessage = 'Oynatma iptal edildi - tekrar deneyin';
            }
          }
          
          this.updateState({
            error: playErrorMessage,
            isPlaying: false,
            isLoading: false,
          });
          
          throw playError;
        }
      }    } catch (error) {
      console.error('❌ [WEB] Failed to play station:', error);
      let errorMessage = 'Radyo istasyonu çalınamadı';
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Tarayıcıda ses izni gerekli - sayfa ile etkileşim kurun (tıklayın) ve tekrar deneyin';
        } else if (error.name === 'NotSupportedError') {
          errorMessage = 'Bu ses formatı tarayıcınızda desteklenmiyor - farklı istasyon deneyin';
        } else if (error.name === 'AbortError') {
          errorMessage = 'Bağlantı iptal edildi - internet bağlantınızı kontrol edin';
        } else if (error.message.includes('Stream URL is missing')) {
          errorMessage = 'İstasyon adres bilgisi eksik - farklı istasyon seçin';
        } else if (error.message.includes('CORS')) {
          errorMessage = 'Güvenlik kısıtlaması - bu istasyon web tarayıcıda çalışmıyor';
        } else {
          errorMessage = `Bağlantı hatası: ${error.message}`;
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
    if (this.audio && this.currentStation) {
      try {
        const playPromise = this.audio.play();
        if (playPromise !== undefined) {
          await playPromise;
          this.updateState({ isPlaying: true });
        }
      } catch (error) {
        console.error('❌ [WEB] Resume failed:', error);
        // If resume fails, try to restart the stream
        await this.playStation(this.currentStation);
      }
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
