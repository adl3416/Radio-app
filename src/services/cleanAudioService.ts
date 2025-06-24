import { Audio } from 'expo-av';
import { Platform } from 'react-native';

export interface PlaybackState {
  isPlaying: boolean;
  isLoading: boolean;
  currentStation: any | null;
  error: string | null;
}

class AudioService {
  private sound: Audio.Sound | null = null;
  private webAudio: HTMLAudioElement | null = null;
  private subscribers: ((state: PlaybackState) => void)[] = [];
  private state: PlaybackState = {
    isPlaying: false,
    isLoading: false,
    currentStation: null,
    error: null,
  };
  async initialize() {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      // Konsol mesajı kaldırıldı
    } catch (error) {
      // Hata mesajı kaldırıldı
    }
  }

  subscribe(callback: (state: PlaybackState) => void) {
    this.subscribers.push(callback);
    callback(this.state);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  private setState(newState: Partial<PlaybackState>) {
    this.state = { ...this.state, ...newState };
    this.subscribers.forEach(callback => callback(this.state));
  }

  getState() {
    return this.state;
  }  async playStation(station: any) {
    try {
      // Konsol mesajı kaldırıldı
      
      this.setState({
        isLoading: true,
        currentStation: station,
        error: null,
      });

      // Önce mevcut sesi durdur ve temizle
      await this.stop();

      if (Platform.OS === 'web') {
        // Web tarayıcısı için - hata yakalama ile
        const audio = new window.Audio();
        audio.crossOrigin = 'anonymous';
        audio.src = station.url;
        this.webAudio = audio;
        
        // Promise ile timeout ve hata yakalama
        await new Promise((resolve, reject) => {
          let isResolved = false;
          
          const cleanup = () => {
            if (!isResolved) {
              isResolved = true;
              audio.removeEventListener('canplay', onCanPlay);
              audio.removeEventListener('error', onError);
              audio.removeEventListener('loadstart', onLoadStart);
            }
          };
          
          const onCanPlay = () => {
            cleanup();
            audio.play()
              .then(() => {
                // Konsol mesajı kaldırıldı
                resolve(true);
              })
              .catch((playError) => {
                // Konsol mesajı kaldırıldı
                reject(playError);
              });
          };
            const onError = (error: any) => {
            cleanup();
            // Konsol mesajı kaldırıldı
            reject(new Error('Audio load failed'));          };
          
          const onLoadStart = () => {
            // Konsol mesajı kaldırıldı
          };
          
          audio.addEventListener('canplay', onCanPlay);
          audio.addEventListener('error', onError);
          audio.addEventListener('loadstart', onLoadStart);
          
          // Timeout
          setTimeout(() => {
            if (!isResolved) {
              cleanup();
              reject(new Error('Timeout'));
            }
          }, 8000);
        });

        this.setState({
          isPlaying: true,
          isLoading: false,
          currentStation: station,
        });
      } else {
        const { sound } = await Audio.Sound.createAsync(
          { uri: station.url },
          { shouldPlay: true },
          this.onPlaybackStatusUpdate.bind(this)
        );
        
        this.sound = sound;
        this.setState({
          isPlaying: true,
          isLoading: false,
          currentStation: station,
        });
      }    } catch (error: any) {
      // Hataları konsola yazmadan sadece state'i güncelle
      this.setState({
        isPlaying: false,
        isLoading: false,
        error: 'Radyo çalınamadı',
      });
      // Hiçbir konsol mesajı yok
      throw error;
    }
  }  async pause() {
    try {
      if (Platform.OS === 'web' && this.webAudio) {
        this.webAudio.pause();
      } else if (this.sound) {
        await this.sound.pauseAsync();
      }
      this.setState({ isPlaying: false });
    } catch (error) {
      // Hata mesajı kaldırıldı
    }
  }

  async resume() {
    try {
      if (Platform.OS === 'web' && this.webAudio) {
        await this.webAudio.play();
      } else if (this.sound) {
        await this.sound.playAsync();
      }
      this.setState({ isPlaying: true });
    } catch (error) {
      // Hata mesajı kaldırıldı
    }
  }

  async stop() {
    try {
      if (Platform.OS === 'web' && this.webAudio) {
        this.webAudio.pause();
        this.webAudio.src = '';
        this.webAudio = null;
      } else if (this.sound) {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
        this.sound = null;
      }
      this.setState({
        isPlaying: false,
        currentStation: null,
        error: null,
      });
    } catch (error) {
      // Hata mesajı kaldırıldı
    }
  }

  private onPlaybackStatusUpdate(status: any) {
    if (status.isLoaded) {
      this.setState({
        isPlaying: status.isPlaying,
        isLoading: status.isBuffering,
      });
    }
  }
}

export const audioService = new AudioService();
