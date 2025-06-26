import { Audio } from 'expo-av';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';

// Background task name
const BACKGROUND_AUDIO_TASK = 'background-audio-task';

// Background task definition
TaskManager.defineTask(BACKGROUND_AUDIO_TASK, () => {
  console.log('🎵 Background audio task running');
  // Keep the task alive
  return Promise.resolve();
});

// Notification handler - Modern Spotify-like controls
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false, // Background'da alert gösterme
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: false,
    shouldShowList: false,
  }),
});

export interface BackgroundAudioState {
  isPlaying: boolean;
  isLoading: boolean;
  currentStation: any | null;
  error: string | null;
  duration: number;
  position: number;
}

class BackgroundAudioService {
  private sound: Audio.Sound | null = null;
  private webAudio: HTMLAudioElement | null = null;
  private subscribers: ((state: BackgroundAudioState) => void)[] = [];
  private notificationId: string | null = null;
  private state: BackgroundAudioState = {
    isPlaying: false,
    isLoading: false,
    currentStation: null,
    error: null,
    duration: 0,
    position: 0,
  };

  async initialize() {
    try {
      // Audio session setup - Modern background audio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true, // Background playing
        playsInSilentModeIOS: true, // Silent mode'da da çal
        shouldDuckAndroid: false, // Diğer seslerle karışma
        playThroughEarpieceAndroid: false,
      });

      // Notification permissions request
      if (Platform.OS !== 'web') {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
          console.warn('Notification permissions not granted');
        }

        // Setup notification categories with media controls
        await this.setupNotificationCategories();
        
        // Notification action handlers - Spotify-like controls
        this.setupNotificationActionHandlers();
      }

      console.log('🎵 Background Audio Service initialized');
    } catch (error) {
      console.error('Background Audio initialization error:', error);
    }
  }

  private async setupNotificationCategories() {
    try {
      // Define media control actions
      const mediaActions = [
        {
          identifier: 'previous',
          buttonTitle: '⏮️ Önceki',
        },
        {
          identifier: 'play_pause',
          buttonTitle: '⏸️/▶️',
        },
        {
          identifier: 'next',
          buttonTitle: '⏭️ Sonraki',
        },
        {
          identifier: 'stop',
          buttonTitle: '⏹️ Durdur',
        },
      ];

      await Notifications.setNotificationCategoryAsync('radio_controls', mediaActions);
      console.log('🔔 Notification categories set up');
    } catch (error) {
      console.error('Notification category setup error:', error);
    }
  }

  private setupNotificationActionHandlers() {
    // Play/Pause action handler
    Notifications.addNotificationResponseReceivedListener((response) => {
      const actionId = response.actionIdentifier;
      
      switch (actionId) {
        case 'play_pause':
          if (this.state.isPlaying) {
            this.pause();
          } else {
            this.resume();
          }
          break;
        case 'stop':
          this.stop();
          break;
        case 'next':
          // Handle next station
          this.onNextStation?.();
          break;
        case 'previous':
          // Handle previous station
          this.onPreviousStation?.();
          break;
      }
    });
  }

  // Callback functions for external control
  public onNextStation?: () => void;
  public onPreviousStation?: () => void;

  subscribe(callback: (state: BackgroundAudioState) => void) {
    this.subscribers.push(callback);
    callback(this.state);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  private setState(newState: Partial<BackgroundAudioState>) {
    this.state = { ...this.state, ...newState };
    this.subscribers.forEach(callback => callback(this.state));
    
    // Update notification when state changes (but not too frequently)
    if (Platform.OS !== 'web' && this.state.currentStation && (newState.currentStation || newState.isPlaying !== undefined)) {
      // Throttle notification updates to prevent spam
      if (this.notificationUpdateTimeout) {
        clearTimeout(this.notificationUpdateTimeout);
      }
      this.notificationUpdateTimeout = setTimeout(() => {
        this.updateNotification();
      }, 1000); // Update notification after 1 second delay
    }
  }

  private notificationUpdateTimeout: ReturnType<typeof setTimeout> | null = null;

  getState() {
    return this.state;
  }

  private async updateNotification() {
    if (Platform.OS === 'web' || !this.state.currentStation) return;

    try {
      // Cancel previous notification
      if (this.notificationId) {
        await Notifications.dismissNotificationAsync(this.notificationId);
        this.notificationId = null;
      }

      // Create Spotify-like notification with media controls
      const notificationContent = {
        title: this.state.currentStation.name || 'Radyo',
        subtitle: 'Türk Radyo Çınarı',
        body: this.state.isPlaying ? 'Şu an çalıyor...' : 'Duraklatıldı',
        data: { stationId: this.state.currentStation.id },
        sticky: true, // Persistent notification
        categoryIdentifier: 'radio_controls',
      };

      // Schedule notification with custom actions
      const request = await Notifications.scheduleNotificationAsync({
        content: notificationContent,
        trigger: null, // Show immediately
      });

      this.notificationId = request;
      console.log('📱 Notification updated:', this.state.currentStation.name);
    } catch (error) {
      console.error('Notification update error:', error);
    }
  }

  async play(station: any): Promise<void> {
    if (this.state.isLoading) return;

    this.setState({ isLoading: true, error: null });

    try {
      // Stop current audio
      await this.stop();

      if (Platform.OS === 'web') {
        // Web implementation - HTMLAudioElement
        this.webAudio = new (window as any).Audio(station.url);
        this.webAudio!.crossOrigin = 'anonymous';
        this.webAudio!.preload = 'none';
        
        this.webAudio!.addEventListener('loadstart', () => {
          console.log('🎵 Web audio loading started');
        });

        this.webAudio!.addEventListener('canplay', () => {
          console.log('🎵 Web audio can play');
          this.setState({ 
            isLoading: false, 
            isPlaying: true, 
            currentStation: station 
          });
        });

        this.webAudio!.addEventListener('error', (e) => {
          console.error('🎵 Web audio error:', e);
          this.setState({ 
            isLoading: false, 
            error: 'Ses yüklenemedi', 
            isPlaying: false 
          });
        });

        await this.webAudio!.play();
      } else {
        // Mobile implementation with background support
        const { sound } = await Audio.Sound.createAsync(
          { uri: station.url },
          { 
            shouldPlay: true,
            isLooping: false,
            volume: 1.0,
            rate: 1.0,
            shouldCorrectPitch: false,
            // Critical for background playing
            progressUpdateIntervalMillis: 1000,
            positionMillis: 0,
          },
          (status) => {
            if (status.isLoaded) {
              this.setState({
                isPlaying: status.isPlaying || false,
                duration: status.durationMillis || 0,
                position: status.positionMillis || 0,
              });
            }
          }
        );

        this.sound = sound;
        
        // Set up for background playing
        await this.sound.setIsLoopingAsync(false);
        await this.sound.setVolumeAsync(1.0);
        
        this.setState({ 
          isLoading: false, 
          isPlaying: true, 
          currentStation: station 
        });

        // Setup background task and notification
        this.setupBackgroundTask();
        console.log('🎵 Mobile audio started:', station.name);
      }

    } catch (error) {
      console.error('Background audio play error:', error);
      this.setState({ 
        isLoading: false, 
        error: 'Radyo çalınamadı', 
        isPlaying: false 
      });
    }
  }

  private async setupBackgroundTask() {
    // Keep audio playing in background with notification
    if (Platform.OS !== 'web' && this.sound && this.state.currentStation) {
      try {
        // Register background task only once
        if (!TaskManager.isTaskRegisteredAsync(BACKGROUND_AUDIO_TASK)) {
          await TaskManager.unregisterAllTasksAsync();
        }
        
        // Update notification only once when starting
        if (!this.notificationId) {
          await this.updateNotification();
        }
        console.log('🎵 Background task setup complete');
      } catch (error) {
        console.error('Background task setup error:', error);
      }
    }
  }

  async pause(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (this.webAudio && !this.webAudio.paused) {
          this.webAudio.pause();
          this.setState({ isPlaying: false });
        }
      } else {
        if (this.sound) {
          await this.sound.pauseAsync();
          this.setState({ isPlaying: false });
        }
      }
      console.log('⏸️ Audio paused');
    } catch (error) {
      console.error('Pause error:', error);
      this.setState({ error: 'Duraklama hatası' });
    }
  }

  async resume(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (this.webAudio && this.webAudio.paused) {
          await this.webAudio.play();
          this.setState({ isPlaying: true, error: null });
        }
      } else {
        if (this.sound) {
          await this.sound.playAsync();
          this.setState({ isPlaying: true, error: null });
        }
      }
      console.log('▶️ Audio resumed');
    } catch (error) {
      console.error('Resume error:', error);
      this.setState({ error: 'Devam etme hatası' });
    }
  }

  async stop(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (this.webAudio) {
          this.webAudio.pause();
          this.webAudio.currentTime = 0;
          this.webAudio = null;
        }
      } else {
        if (this.sound) {
          await this.sound.unloadAsync();
          this.sound = null;
        }
      }

      // Clear notification
      if (this.notificationId) {
        await Notifications.dismissNotificationAsync(this.notificationId);
        this.notificationId = null;
      }

      this.setState({ 
        isPlaying: false, 
        isLoading: false, 
        currentStation: null, 
        error: null,
        position: 0,
        duration: 0,
      });
      
      console.log('⏹️ Audio stopped');
    } catch (error) {
      console.error('Stop error:', error);
    }
  }

  async setVolume(volume: number): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (this.webAudio) {
          this.webAudio.volume = Math.max(0, Math.min(1, volume));
        }
      } else {
        if (this.sound) {
          await this.sound.setVolumeAsync(Math.max(0, Math.min(1, volume)));
        }
      }
    } catch (error) {
      console.error('Volume error:', error);
    }
  }

  // Modern method to handle app state changes
  handleAppStateChange = (nextAppState: string) => {
    if (nextAppState === 'background' && this.state.isPlaying) {
      console.log('📱 App moved to background, keeping audio playing');
      // Audio continues playing in background automatically
    } else if (nextAppState === 'active') {
      console.log('📱 App became active');
    }
  };

  // Cleanup method
  async cleanup(): Promise<void> {
    await this.stop();
    this.subscribers = [];
    console.log('🧹 Background audio service cleaned up');
  }
}

// Export singleton instance
export const backgroundAudioService = new BackgroundAudioService();
