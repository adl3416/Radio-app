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
      // Önce loading state'i ayarla
      this.setState({
        isLoading: true,
        currentStation: station,
        error: null,
      });

      // Mevcut ses dosyasını durdur ve temizle
      await this.stop();

      // URL'yi temizle ve doğrula
      const cleanUrl = this.cleanStreamUrl(station.url || station.streamUrl);
      if (!cleanUrl) {
        throw new Error('Geçersiz radyo URL\'si');
      }

      // URL'yi test et
      const isValidUrl = await this.testStreamUrl(cleanUrl);
      if (!isValidUrl) {
        throw new Error('Radyo sunucusuna erişilemiyor');
      }

      // Temizlenmiş URL ile çalmaya çalış
      const stationWithCleanUrl = { ...station, url: cleanUrl, streamUrl: cleanUrl };

      if (Platform.OS === 'web') {
        // Web tarayıcısı için geliştirilmiş audio handling
        await this.playWebAudio(stationWithCleanUrl);
      } else {
        // Mobile cihazlar için
        await this.playMobileAudio(stationWithCleanUrl);
      }
    } catch (error: any) {
      this.setState({
        isPlaying: false,
        isLoading: false,
        error: error.message || 'Radyo çalınamadı. Farklı bir istasyon deneyin.',
      });
      throw error;
    }
  }

  /**
   * Stream URL'sini temizle ve normalize et
   */
  private cleanStreamUrl(url: string): string | null {
    if (!url) return null;

    try {
      // URL'yi trim et
      url = url.trim();

      // HLS (.m3u8) formatlarını web uyumlu alternatiflere çevir
      if (url.includes('.m3u8')) {
        url = this.convertHLStoHTTP(url);
      }

      // HTTP olmayan URL'leri düzelt
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }

      // Geçersiz karakterleri temizle
      url = url.replace(/[<>"{}|\\^`\[\]]/g, '');

      // URL'nin geçerli olup olmadığını kontrol et
      new URL(url);
      
      return url;
    } catch (error) {
      console.warn('Invalid URL format:', url);
      return null;
    }
  }

  /**
   * HLS (.m3u8) formatını HTTP stream'e çevir
   */
  private convertHLStoHTTP(hlsUrl: string): string {
    // TRT FM için özel çözüm
    if (hlsUrl.includes('radio-trtfm.live.trt.com.tr')) {
      return 'https://radyotvonline.net/embed2/trtfm.php';
    }
    
    // TRT 3 için özel çözüm
    if (hlsUrl.includes('radio-trt3.live.trt.com.tr')) {
      return 'https://radyotvonline.net/embed2/trt3.php';
    }
    
    // Genel HLS -> HTTP dönüşümü
    // m3u8 uzantısını stream ile değiştir
    if (hlsUrl.includes('master_720.m3u8')) {
      return hlsUrl.replace('master_720.m3u8', 'stream');
    }
    
    if (hlsUrl.includes('master.m3u8')) {
      return hlsUrl.replace('master.m3u8', 'stream');
    }
    
    if (hlsUrl.includes('playlist.m3u8')) {
      return hlsUrl.replace('playlist.m3u8', 'stream');
    }

    // Eğer hiçbiri uymazsa orijinalini döndür
    return hlsUrl;
  }

  /**
   * Stream URL'sinin çalışıp çalışmadığını test et
   */
  private async testStreamUrl(url: string): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 saniye timeout

      const response = await fetch(url, {
        method: 'HEAD', // Sadece header'ları al
        signal: controller.signal,
        mode: 'no-cors' // CORS hatalarını önle
      });

      clearTimeout(timeoutId);
      return true; // Eğer fetch başarılıysa URL çalışıyor demektir
      
    } catch (error) {
      // no-cors modunda her zaman fetch başarısız olabilir, bu normal
      // Bu yüzden basit bir ping testi yapalım
      return this.pingTest(url);
    }
  }

  /**
   * Basit ping testi
   */
  private async pingTest(url: string): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-cache'
      });

      clearTimeout(timeoutId);
      return true;
    } catch (error) {
      // Fetch başarısız olsa bile URL geçerli olabilir
      // Çünkü bazı radyo sunucuları CORS engelleyebilir
      return true; // Optimistic approach - audio player kendi kontrol edecek
    }
  }

  private async playWebAudio(station: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const audio = new window.Audio();
      
      // Codec'e göre özel ayarlar
      this.configureAudioForCodec(audio, station);
      
      audio.preload = 'none';
      
      // Daha uzun timeout (20 saniye - özellikle problematik radyolar için)
      const timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error('Yükleme zaman aşımı (20s)'));
      }, 20000);

      let isResolved = false;
      let retryCount = 0;
      const maxRetries = 3; // Retry sayısını artır
      
      const cleanup = () => {
        if (!isResolved) {
          isResolved = true;
          clearTimeout(timeoutId);
          audio.removeEventListener('canplay', onCanPlay);
          audio.removeEventListener('canplaythrough', onCanPlayThrough);
          audio.removeEventListener('error', onError);
          audio.removeEventListener('loadstart', onLoadStart);
          audio.removeEventListener('progress', onProgress);
          audio.removeEventListener('stalled', onStalled);
          audio.removeEventListener('waiting', onWaiting);
          audio.removeEventListener('loadeddata', onLoadedData);
        }
      };
      
      const onCanPlay = () => {
        if (isResolved) return;
        cleanup();
        
        // Volume ayarla
        audio.volume = 0.8;
        
        audio.play()
          .then(() => {
            this.webAudio = audio;
            this.setState({
              isPlaying: true,
              isLoading: false,
              currentStation: station,
              error: null
            });
            resolve();
          })
          .catch((playError) => {
            console.warn('Play error:', playError);
            reject(new Error('Çalma hatası: ' + playError.message));
          });
      };

      const onCanPlayThrough = () => {
        // Tam yüklendiğinde de çalmaya çalış
        if (!isResolved) {
          onCanPlay();
        }
      };

      const onLoadedData = () => {
        // Data yüklendiğinde çalmaya çalış
        if (!isResolved) {
          onCanPlay();
        }
      };

      const onError = async (event: any) => {
        if (isResolved) return;
        
        retryCount++;
        console.warn(`Audio error attempt ${retryCount}/${maxRetries}:`, event);
        
        if (retryCount < maxRetries) {
          // Retry with alternative URL or different approach
          const alternativeUrl = this.getAlternativeUrl(station.url, retryCount);
          if (alternativeUrl) {
            console.log(`Retrying with alternative URL: ${alternativeUrl}`);
            audio.src = alternativeUrl;
            audio.load();
            return;
          }
        }
        
        cleanup();
        
        // Daha user-friendly error mesajları
        let errorMessage = 'Radyo çalınamadı';
        
        if (station.codec === 'AAC' || station.url.includes('.aac')) {
          errorMessage = 'AAC formatı desteklenmiyor. MP3 alternatifi deneniyor...';
        } else if (station.url.includes('.m3u8')) {
          errorMessage = 'HLS formatı desteklenmiyor. Alternatif stream deneniyor...';
        } else if (event.target?.error?.code === 4) {
          errorMessage = 'Radyo formatı desteklenmiyor';
        } else if (event.target?.error?.code === 3) {
          errorMessage = 'Radyo dosyası bozuk';
        } else if (event.target?.error?.code === 2) {
          errorMessage = 'Ağ hatası - internet bağlantınızı kontrol edin';
        } else {
          errorMessage = 'Radyo sunucusuna erişilemiyor';
        }
        
        reject(new Error(errorMessage));
      };
      
      const onLoadStart = () => {
        console.log('Loading started for:', station.name);
      };

      const onProgress = () => {
        // Buffer progress
      };

      const onStalled = () => {
        console.warn('Audio stalled for:', station.name);
        // Stall durumunda yeniden yüklemeyi dene
        if (!isResolved && retryCount < maxRetries) {
          setTimeout(() => {
            audio.load();
          }, 2000);
        }
      };

      const onWaiting = () => {
        console.log('Audio waiting for:', station.name);
      };
      
      // Event listener'ları ekle
      audio.addEventListener('canplay', onCanPlay);
      audio.addEventListener('canplaythrough', onCanPlayThrough);
      audio.addEventListener('loadeddata', onLoadedData);
      audio.addEventListener('error', onError);
      audio.addEventListener('loadstart', onLoadStart);
      audio.addEventListener('progress', onProgress);
      audio.addEventListener('stalled', onStalled);
      audio.addEventListener('waiting', onWaiting);
      
      // URL'yi ayarla ve yüklemeyi başlat
      audio.src = station.url || station.streamUrl;
      audio.load();
    });
  }

  /**
   * Codec'e göre audio ayarlarını yapılandır
   */
  private configureAudioForCodec(audio: HTMLAudioElement, station: any): void {
    const codec = station.codec?.toLowerCase() || 'mp3';
    const url = station.url || station.streamUrl || '';

    // TRT radyoları için özel ayarlar
    if (url.includes('trt')) {
      audio.crossOrigin = 'use-credentials';
      audio.preload = 'metadata';
    }
    // Merih FM için özel ayarlar
    else if (url.includes('merih.fm')) {
      audio.crossOrigin = null; // CORS'u devre dışı bırak
      audio.preload = 'none';
    }
    // AAC codec'i için özel ayarlar
    else if (codec === 'aac' || codec === 'aac+' || url.includes('.aac')) {
      audio.crossOrigin = 'anonymous';
      audio.preload = 'metadata';
    }
    // MP3 için standart ayarlar
    else if (codec === 'mp3' || url.includes('.mp3')) {
      audio.crossOrigin = 'anonymous';
      audio.preload = 'none';
    }
    // M3U8/HLS için özel ayarlar
    else if (url.includes('.m3u8') || url.includes('playlist')) {
      audio.crossOrigin = 'anonymous';
      audio.preload = 'metadata';
    }
    // Varsayılan ayarlar
    else {
      audio.crossOrigin = 'anonymous';
      audio.preload = 'none';
    }

    // Volume her zaman 0.8
    audio.volume = 0.8;
    
    // Autoplay'i etkinleştir (bazı tarayıcılar için)
    audio.autoplay = false; // Manuel başlatma
  }

  private async playMobileAudio(station: any): Promise<void> {
    try {
      const audioUri = station.url || station.streamUrl;
      
      // Audio ayarlarını optimize et
      const initialStatus = {
        shouldPlay: true,
        rate: 1.0,
        shouldCorrectPitch: true,
        volume: 0.8,
        isMuted: false,
        isLooping: false,
      };

      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        initialStatus,
        this.onPlaybackStatusUpdate.bind(this)
      );
      
      this.sound = sound;
      
      // Başarılı yükleme durumunda state'i güncelle
      this.setState({
        isPlaying: true,
        isLoading: false,
        currentStation: station,
        error: null
      });

    } catch (error: any) {
      console.warn('Mobile audio error:', error);
      
      // Farklı bir format/URL ile tekrar dene
      try {
        const alternativeUri = station.streamUrl || station.url;
        if (alternativeUri && alternativeUri !== (station.url || station.streamUrl)) {
          const { sound } = await Audio.Sound.createAsync(
            { uri: alternativeUri },
            { shouldPlay: true, volume: 0.8 },
            this.onPlaybackStatusUpdate.bind(this)
          );
          
          this.sound = sound;
          this.setState({
            isPlaying: true,
            isLoading: false,
            currentStation: station,
            error: null
          });
          return;
        }
      } catch (retryError) {
        console.warn('Mobile audio retry failed:', retryError);
      }
      
      throw new Error('Mobil cihazda çalma hatası: ' + error.message);
    }
  }async pause() {
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
      // Normal durum - ses yüklendi
      this.setState({
        isPlaying: status.isPlaying,
        isLoading: status.isBuffering || false,
        error: null
      });
      
      // Eğer ses durduysa ve error varsa
      if (!status.isPlaying && status.error) {
        this.setState({
          isPlaying: false,
          isLoading: false,
          error: 'Çalma hatası: ' + status.error
        });
      }
    } else if (status.error) {
      // Yükleme hatası
      console.warn('Playback error:', status.error);
      this.setState({
        isPlaying: false,
        isLoading: false,
        error: 'Yükleme hatası: ' + status.error
      });
    }
  }

  /**
   * Başarısız olan URL için alternatif URL öner
   */
  private getAlternativeUrl(originalUrl: string, retryCount: number): string | null {
    // AAC formatını MP3'e çevir
    if (originalUrl.includes('.aac') || originalUrl.includes('/aac/')) {
      return originalUrl.replace('/aac/', '/mp3/').replace('.aac', '.mp3');
    }
    
    // HLS (.m3u8) formatını HTTP stream'e çevir
    if (originalUrl.includes('.m3u8')) {
      if (retryCount === 1) {
        return originalUrl.replace('master_720.m3u8', 'stream');
      } else if (retryCount === 2) {
        return originalUrl.replace('master.m3u8', 'stream');
      }
    }
    
    // HTTPS'yi HTTP'ye çevir (son çare)
    if (originalUrl.startsWith('https://') && retryCount === 3) {
      return originalUrl.replace('https://', 'http://');
    }
    
    return null;
  }
}

export const audioService = new AudioService();
