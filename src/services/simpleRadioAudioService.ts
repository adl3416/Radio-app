import { Platform } from 'react-native';
import { Audio } from 'expo-av';

export interface RadioAudioState {
  isPlaying: boolean;
  isLoading: boolean;
  currentStation: any | null;
  error: string | null;
}

class SimpleRadioAudioService {
  // ...existing code...
  async toggleMute() {
    if (Platform.OS === 'web' && this.webAudio) {
      this.webAudio.muted = !this.webAudio.muted;
    } else if (this.mobileSound) {
      const status = await this.mobileSound.getStatusAsync();
      if (status.isLoaded) {
        await this.mobileSound.setIsMutedAsync(!status.isMuted);
      }
    }
  }

  /**
   * Set playback volume (0.0 - 1.0)
   */
  async setVolume(volume: number) {
    try {
      if (Platform.OS === 'web' && this.webAudio) {
        this.webAudio.volume = volume;
      } else if (this.mobileSound) {
        await this.mobileSound.setVolumeAsync(volume);
      }
    } catch (error) {
      console.error('❌ setVolume error:', error);
    }
  }
  private webAudio: HTMLAudioElement | null = null;
  private mobileSound: Audio.Sound | null = null;
  private subscribers: ((state: RadioAudioState) => void)[] = [];
  private isInitialized = false;
  
  private state: RadioAudioState = {
    isPlaying: false,
    isLoading: false,
    currentStation: null,
    error: null,
  };

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      console.log(`🎵 Initializing Simple Radio Audio for ${Platform.OS}`);
      
      if (Platform.OS === 'web') {
        // Web için HTML5 Audio kullan
        console.log('🌐 Using HTML5 Audio for web');
      } else {
        // Mobile için expo-av - arka plan desteği ile
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true, // Arka planda çalmaya devam et
          playsInSilentModeIOS: true, // Sessiz modda da çal
          shouldDuckAndroid: false, // Android'de ses seviyesini düşürme
          playThroughEarpieceAndroid: false, // Hoparlör kullan
        });
        console.log('📱 Using Expo AV for mobile with background support');
      }
      
      this.isInitialized = true;
      console.log('✅ Simple Radio Audio Service initialized');
    } catch (error) {
      console.error('❌ Audio initialization failed:', error);
      this.updateState({ error: `Initialization failed: ${error}` });
    }
  }

  private updateState(newState: Partial<RadioAudioState>) {
    this.state = { ...this.state, ...newState };
    this.notifySubscribers();
  }

  private notifySubscribers() {
    this.subscribers.forEach(callback => {
      try {
        callback(this.state);
      } catch (error) {
        console.error('❌ Subscriber notification error:', error);
      }
    });
  }

  subscribe(callback: (state: RadioAudioState) => void) {
    this.subscribers.push(callback);
    callback(this.state); // Send current state immediately
    
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  async play(station: any) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      console.log(`🎵 Playing radio: ${station.name} - ${station.url}`);
      // Stop current playback first
      await this.stop();
      console.log('🔄 Updating state to loading...');
      this.updateState({ 
        isLoading: true, 
        error: null, 
        currentStation: station 
      });

      if (Platform.OS === 'web') {
        await this.playWeb(station);
      } else {
        await this.playMobile(station);
      }

    } catch (error) {
      // "atop error: seeking interrupted" veya benzeri hataları kullanıcıya gösterme
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (
        errorMessage.toLowerCase().includes('seeking interrupted') ||
        errorMessage.toLowerCase().includes('atop error')
      ) {
        // Sessizce yut, kullanıcıya gösterme
        console.warn('Sessizce yutulan player hatası:', errorMessage);
        this.updateState({ isLoading: false, isPlaying: false });
        return;
      }
      console.error(`❌ Play error for ${station.name}:`, error);
      this.updateState({ 
        isLoading: false, 
        isPlaying: false, 
        error: `Playback failed: ${errorMessage}` 
      });
    }
  }

  private async playWeb(station: any) {
    return new Promise<void>((resolve, reject) => {
      try {
        // Web'de HTML5 Audio kullan - hızlı yapılandırma
        const audio = new (window as any).Audio();
        this.webAudio = audio;
        audio.crossOrigin = 'anonymous';
        audio.preload = 'none'; // Hızlı başlatma için
        
        const timeout = setTimeout(() => {
          reject(new Error('Playback timeout (10s)'));
        }, 10000); // Timeout'u 10s'ye düşürdük

        // Hızlı play işlemi
        audio.onloadstart = () => {
          console.log(`🚀 Web audio load started: ${station.name}`);
        };

        audio.oncanplay = () => {
          console.log(`✅ Web audio can play: ${station.name}`);
          clearTimeout(timeout);
          
          // Hemen çalmaya başla
          audio.play().then(() => {
            console.log(`▶️ Web audio playing: ${station.name}`);
            this.updateState({ isLoading: false, isPlaying: true });
            resolve();
          }).catch((playError: any) => {
            console.error(`❌ Web audio play error:`, playError);
            if (playError.name === 'NotAllowedError') {
              reject(new Error('Tarayici autoplay izin vermiyor. Lutfen tekrar tiklayin.'));
            } else {
              reject(playError);
            }
          });
        };

        audio.onerror = (error: any) => {
          console.error(`❌ Web audio error for ${station.name}:`, error);
          clearTimeout(timeout);
          reject(new Error(`Stream error: ${error.message || 'Network error'}`));
        };

        audio.onended = () => {
          console.log(`⏹️ Web audio ended: ${station.name}`);
          this.updateState({ isPlaying: false });
        };

        audio.onpause = () => {
          console.log(`⏸️ Web audio paused: ${station.name}`);
          this.updateState({ isPlaying: false });
        };

        // Hızlı başlatma
        audio.src = station.url;
        audio.load();
        
      } catch (error) {
        reject(error);
      }
    });
  }

  private async playMobile(station: any) {
    try {
      console.log(`📱 Playing mobile audio: ${station.name} - ${station.url}`);
      
      // Hızlı mobile audio yapılandırması
      const { sound } = await Audio.Sound.createAsync(
        { uri: station.url },
        { 
          shouldPlay: true,
          isLooping: false,
          volume: 1.0,
          rate: 1.0,
          shouldCorrectPitch: true,
          progressUpdateIntervalMillis: 500, // Daha seyrek güncelleme
        },
        (status) => {
          // Minimal status logging için performance
          if (status.isLoaded) {
            if (status.isPlaying && !this.state.isPlaying) {
              console.log('📱 Mobile audio started playing');
              this.updateState({ isLoading: false, isPlaying: true });
            } else if (!status.isPlaying && this.state.isPlaying) {
              console.log('📱 Mobile audio paused/stopped');
              this.updateState({ isPlaying: false });
            }
          } else if (!status.isLoaded && 'error' in status) {
            console.error(`❌ Mobile audio error:`, status.error);
            this.updateState({ 
              isLoading: false, 
              isPlaying: false, 
              error: `Mobile audio error: ${status.error}` 
            });
          }
        }
      );

      this.mobileSound = sound;
      console.log(`✅ Mobile audio created successfully: ${station.name}`);
      
      // Hızlı başlatma için state'i hemen güncelle
      this.updateState({ isLoading: false, isPlaying: true });
      
    } catch (error) {
      console.error(`❌ Mobile audio creation error:`, error);
      throw error;
    }
  }

  async pause() {
    try {
      if (Platform.OS === 'web' && this.webAudio) {
        this.webAudio.pause();
      } else if (this.mobileSound) {
        await this.mobileSound.pauseAsync();
      }
      
      this.updateState({ isPlaying: false });
      console.log('⏸️ Playback paused');
    } catch (error) {
      console.error('❌ Pause error:', error);
    }
  }

  async resume() {
    try {
      if (Platform.OS === 'web' && this.webAudio) {
        await this.webAudio.play();
      } else if (this.mobileSound) {
        await this.mobileSound.playAsync();
      }
      this.updateState({ isPlaying: true });
      console.log('▶️ Playback resumed');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (
        errorMessage.toLowerCase().includes('seeking interrupted') ||
        errorMessage.toLowerCase().includes('atop error')
      ) {
        // Sessizce yut, kullanıcıya gösterme
        console.warn('Sessizce yutulan resume hatası:', errorMessage);
        this.updateState({ isPlaying: false });
        return;
      }
      console.error('❌ Resume error:', error);
      this.updateState({ error: `Resume failed: ${errorMessage}` });
    }
  }

  async stop() {
    try {
      if (Platform.OS === 'web' && this.webAudio) {
        this.webAudio.pause();
        this.webAudio.src = '';
        this.webAudio = null;
      } else if (this.mobileSound) {
        try {
          await this.mobileSound.stopAsync();
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (
            errorMessage.toLowerCase().includes('seeking interrupted') ||
            errorMessage.toLowerCase().includes('atop error')
          ) {
            // Sessizce yut, kullanıcıya gösterme
            console.warn('Sessizce yutulan stop hatası:', errorMessage);
          } else {
            console.error('❌ Stop error:', error);
          }
        }
        try {
          await this.mobileSound.unloadAsync();
        } catch {}
        this.mobileSound = null;
      }

      this.updateState({ 
        isPlaying: false, 
        isLoading: false, 
        currentStation: null 
      });
      
      console.log('⏹️ Playback stopped');
    } catch (error) {
      // Genel try-catch: burada da aynı şekilde bastır
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (
        errorMessage.toLowerCase().includes('seeking interrupted') ||
        errorMessage.toLowerCase().includes('atop error')
      ) {
        console.warn('Sessizce yutulan stop hatası:', errorMessage);
      } else {
        console.error('❌ Stop error:', error);
      }
    }
  }

  getState() {
    return this.state;
  }
}

// Export single instance
export const simpleRadioAudioService = new SimpleRadioAudioService();
