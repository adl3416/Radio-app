import { Platform } from 'react-native';
import { RadioStation } from '../constants/radioStations';

export interface PlaybackState {
  isPlaying: boolean;
  isLoading: boolean;
  currentStation: RadioStation | null;
  volume: number;
  error: string | null;
}

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

  private async saveVolumeToStorage(volume: number) {
    try {
      localStorage.setItem('audio-volume', volume.toString());
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
  }

  public async playStation(station: RadioStation) {
    try {
      console.log(`🎵 [WEB] Starting playback for: ${station.name}`);
      console.log(`🌐 [WEB] Stream URL: ${station.streamUrl}`);
      
      this.updateState({ isLoading: true, error: null });

      // Stop current playback
      if (this.audio) {
        console.log('🛑 [WEB] Stopping current audio');
        this.audio.pause();
        this.audio.src = '';
        this.audio = null;
      }

      // Create new HTML5 Audio element
      console.log('🎧 [WEB] Creating HTML5 Audio element...');
      this.audio = new Audio();
      this.audio.crossOrigin = 'anonymous';
      this.audio.preload = 'auto';
      this.audio.volume = this.state.volume;

      // Set up event listeners
      this.audio.addEventListener('loadstart', () => {
        console.log('🔄 [WEB] Audio loading started');
        this.updateState({ isLoading: true });
      });

      this.audio.addEventListener('canplay', () => {
        console.log('✅ [WEB] Audio can start playing');
        this.updateState({ isLoading: false });
      });

      this.audio.addEventListener('playing', () => {
        console.log('▶️ [WEB] Audio is playing');
        this.updateState({ isPlaying: true, isLoading: false, error: null });
      });

      this.audio.addEventListener('pause', () => {
        console.log('⏸️ [WEB] Audio paused');
        this.updateState({ isPlaying: false });
      });

      this.audio.addEventListener('ended', () => {
        console.log('⏹️ [WEB] Audio ended');
        this.updateState({ isPlaying: false });
      });      this.audio.addEventListener('error', (e) => {
        console.error('❌ [WEB] Audio error:', e);
        const errorMessage = this.getErrorMessage(this.audio?.error || null);
        this.updateState({
          error: errorMessage,
          isPlaying: false,
          isLoading: false,
        });
      });

      this.audio.addEventListener('waiting', () => {
        console.log('⏳ [WEB] Audio buffering');
        this.updateState({ isLoading: true });
      });

      this.audio.addEventListener('progress', () => {
        console.log('📡 [WEB] Audio loading progress');
      });

      // Set source and play
      this.audio.src = station.streamUrl;
      this.currentStation = station;
      
      this.updateState({
        currentStation: station,
        isLoading: true,
      });

      // Start playing
      const playPromise = this.audio.play();
      if (playPromise !== undefined) {
        await playPromise;
      }

      // Save to recent stations
      await this.saveToRecentStations(station);

      console.log(`🎉 [WEB] Successfully started playing: ${station.name}`);
    } catch (error) {
      console.error('❌ [WEB] Failed to play station:', error);
      let errorMessage = 'Radyo istasyonu çalınamadı';
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Ses izni gerekli - tarayıcıda izin verin';
        } else if (error.name === 'NotSupportedError') {
          errorMessage = 'Desteklenmeyen ses formatı';
        } else if (error.message.includes('network')) {
          errorMessage = 'İnternet bağlantısı kontrol edin';
        } else if (error.message.includes('CORS')) {
          errorMessage = 'Bu radyo istasyonu web\'de erişilebilir değil';
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

  private getErrorMessage(error: MediaError | null): string {
    if (!error) return 'Bilinmeyen ses hatası';
    
    switch (error.code) {
      case MediaError.MEDIA_ERR_ABORTED:
        return 'Ses yükleme iptal edildi';
      case MediaError.MEDIA_ERR_NETWORK:
        return 'Ağ hatası - bağlantıyı kontrol edin';
      case MediaError.MEDIA_ERR_DECODE:
        return 'Ses dosyası bozuk veya desteklenmiyor';
      case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
        return 'Bu ses formatı desteklenmiyor';
      default:
        return 'Ses oynatma hatası';
    }
  }

  public async pause() {
    try {
      if (this.audio) {
        this.audio.pause();
        this.updateState({ isPlaying: false });
      }
    } catch (error) {
      console.error('Failed to pause:', error);
    }
  }

  public async resume() {
    try {
      if (this.audio) {
        await this.audio.play();
        this.updateState({ isPlaying: true });
      }
    } catch (error) {
      console.error('Failed to resume:', error);
    }
  }

  public async stop() {
    try {
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
    } catch (error) {
      console.error('Failed to stop:', error);
    }
  }

  public async setVolume(volume: number) {
    try {
      if (this.audio) {
        this.audio.volume = volume;
      }
      this.updateState({ volume });
      await this.saveVolumeToStorage(volume);
    } catch (error) {
      console.error('Failed to set volume:', error);
    }
  }

  private async saveToRecentStations(station: RadioStation) {
    try {
      const recentStations = await this.getRecentStations();
      const filteredStations = recentStations.filter(s => s.id !== station.id);
      const newRecentStations = [station, ...filteredStations].slice(0, 10);
      
      localStorage.setItem('recent-stations', JSON.stringify(newRecentStations));
    } catch (error) {
      console.error('Failed to save recent station:', error);
    }
  }

  public async getRecentStations(): Promise<RadioStation[]> {
    try {
      const recentStations = localStorage.getItem('recent-stations');
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
      if (this.audio) {
        this.audio.pause();
        this.audio.src = '';
        this.audio = null;
      }
      this.listeners = [];
    } catch (error) {
      console.error('Failed to cleanup web audio service:', error);
    }
  }
}

export const webAudioService = new WebAudioService();
