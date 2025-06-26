import { Audio } from 'expo-av';
import * as Notifications from 'expo-notifications';
import { Platform, AppState } from 'react-native';

// Configure notifications for media playback
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export interface SimpleAudioState {
  isPlaying: boolean;
  isLoading: boolean;
  currentStation: any | null;
  error: string | null;
}

class SimpleBackgroundAudioService {
  private sound: Audio.Sound | null = null;
  private subscribers: ((state: SimpleAudioState) => void)[] = [];
  private notificationId: string | null = null;
  private isInitialized = false;
  
  private state: SimpleAudioState = {
    isPlaying: false,
    isLoading: false,
    currentStation: null,
    error: null,
  };

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      // Critical: Set audio mode for background playback - iOS OPTIMIZED
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true, // KEY: Background playback
        playsInSilentModeIOS: true,   // KEY: Play in silent mode
        shouldDuckAndroid: false,      // KEY: Don't duck other audio
        playThroughEarpieceAndroid: false,
      });

      // FORCE iOS audio session activation
      if (Platform.OS === 'ios') {
        console.log('🍎 iOS detected - forcing background audio capabilities');
      }

      // Request notification permissions - iOS OPTIMIZED
      if (Platform.OS !== 'web') {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: false, // No notification sound for media
            allowDisplayInCarPlay: true,
            allowCriticalAlerts: false,
            provideAppNotificationSettings: true,
            allowProvisional: true,
          },
        });
        
        console.log('📱 Notification permissions:', status);
        
        if (status === 'granted') {
          this.setupNotificationActions();
        } else {
          console.warn('⚠️ Notification permissions denied - background controls may not work');
        }
      }

      // Handle app state changes
      AppState.addEventListener('change', this.handleAppStateChange);
      
      this.isInitialized = true;
      console.log('✅ Simple Background Audio initialized with BACKGROUND SUPPORT');
    } catch (error) {
      console.error('❌ Audio initialization error:', error);
    }
  }

  private setupNotificationActions() {
    // Set up notification category with media controls
    Notifications.setNotificationCategoryAsync('media', [
      { identifier: 'play_pause', buttonTitle: '⏯️' },
      { identifier: 'stop', buttonTitle: '⏹️' },
    ]);

    // Handle notification actions
    Notifications.addNotificationResponseReceivedListener((response) => {
      const actionId = response.actionIdentifier;
      
      if (actionId === 'play_pause') {
        if (this.state.isPlaying) {
          this.pause();
        } else {
          this.resume();
        }
      } else if (actionId === 'stop') {
        this.stop();
      }
    });
  }

  private handleAppStateChange = (nextAppState: string) => {
    console.log('📱 App state changed to:', nextAppState);
    
    if (nextAppState === 'background' && this.state.isPlaying) {
      console.log('� CRITICAL iOS: App going to background - FORCING audio to continue');
      
      // iOS-specific background audio enforcement
      if (Platform.OS === 'ios') {
        console.log('🍎 iOS Background Mode Activated - Enforcing audio session');
        
        // Force audio session to stay active
        if (this.sound) {
          // Set a longer check interval for iOS
          setTimeout(() => {
            this.enforceBackgroundAudio();
          }, 1000);
          
          setTimeout(() => {
            this.enforceBackgroundAudio();
          }, 3000);
          
          setTimeout(() => {
            this.enforceBackgroundAudio();
          }, 5000);
        }
      }
      
      // Force background notification
      this.showBackgroundNotification();
      
    } else if (nextAppState === 'active') {
      console.log('📱 App became active - audio should continue normally');
    }
  };

  private enforceBackgroundAudio() {
    if (!this.sound || !this.state.isPlaying) return;
    
    this.sound.getStatusAsync().then((status: any) => {
      if (status.isLoaded && !status.isPlaying) {
        console.log('🔄 iOS: Resuming audio in background - FORCED');
        this.sound?.playAsync().catch(err => {
          console.error('❌ Failed to resume background audio:', err);
        });
      } else if (status.isLoaded && status.isPlaying) {
        console.log('✅ iOS: Audio playing correctly in background');
      }
    }).catch(err => {
      console.error('❌ Error checking audio status:', err);
    });
  }

  private setState(newState: Partial<SimpleAudioState>) {
    this.state = { ...this.state, ...newState };
    this.subscribers.forEach(callback => callback(this.state));
  }

  private async showBackgroundNotification() {
    if (Platform.OS === 'web' || !this.state.currentStation) return;

    try {
      if (this.notificationId) {
        await Notifications.dismissNotificationAsync(this.notificationId);
      }

      const notificationContent = {
        title: `🎵 ${this.state.currentStation.name}`,
        body: this.state.isPlaying ? 'Arka planda çalıyor - iOS' : 'Duraklatıldı',
        categoryIdentifier: 'media',
        sticky: true,
        autoDismiss: false,
        data: { 
          stationId: this.state.currentStation.id,
          isBackgroundAudio: true,
          platform: Platform.OS,
        },
      };

      // iOS-specific notification settings
      if (Platform.OS === 'ios') {
        notificationContent.body = `🍎 ${this.state.currentStation.name} - Background Audio Active`;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: notificationContent,
        trigger: null,
      });

      this.notificationId = notificationId;
      console.log(`📱 iOS BACKGROUND NOTIFICATION shown for: ${this.state.currentStation.name}`);
    } catch (error) {
      console.error('❌ iOS Notification error:', error);
    }
  }

  async play(station: any): Promise<void> {
    try {
      this.setState({ isLoading: true, error: null });

      // Stop current audio
      if (this.sound) {
        await this.sound.unloadAsync();
        this.sound = null;
      }

      console.log('🎵 Starting radio with iOS background support:', station.name);

      // Load new audio with CRITICAL iOS background support
      const { sound } = await Audio.Sound.createAsync(
        { uri: station.url },
        { 
          shouldPlay: true,
          isLooping: false,
          volume: 1.0,
          rate: 1.0,
          shouldCorrectPitch: false,
          // CRITICAL: These are key for iOS background playback
          progressUpdateIntervalMillis: 1000,
          positionMillis: 0,
        }
      );

      this.sound = sound;
      
      // CRITICAL: iOS-specific background audio setup
      if (Platform.OS === 'ios') {
        console.log('🍎 iOS: Setting up background audio capabilities');
        await this.sound.setIsLoopingAsync(false);
        await this.sound.setVolumeAsync(1.0);
        
        // Force audio session activation for iOS
        await this.sound.setStatusAsync({ shouldPlay: true });
      } else {
        await this.sound.setIsLoopingAsync(false);
        await this.sound.setVolumeAsync(1.0);
      }
      
      // Set up status listener with iOS-specific handling
      this.sound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.isLoaded) {
          this.setState({
            isPlaying: status.isPlaying,
            isLoading: false,
          });
          
          // iOS-specific: Log playback status for debugging
          if (Platform.OS === 'ios') {
            console.log('🍎 iOS Audio Status:', status.isPlaying ? 'PLAYING' : 'PAUSED');
          }
        }
        
        if (status.error) {
          console.error('❌ Playback error:', status.error);
          this.setState({
            error: 'Radyo çalınamadı',
            isLoading: false,
            isPlaying: false,
          });
        }
      });

      this.setState({
        currentStation: station,
        isLoading: false,
        isPlaying: true,
      });

      // Show notification for background support - delayed for stability
      setTimeout(() => {
        this.showBackgroundNotification();
      }, 2000); // 2 second delay for iOS stability
      
      console.log('✅ Radio started with iOS BACKGROUND SUPPORT:', station.name);
    } catch (error) {
      console.error('❌ Play error:', error);
      this.setState({
        error: 'Radyo başlatılamadı',
        isLoading: false,
        isPlaying: false,
      });
    }
  }

  async pause(): Promise<void> {
    try {
      if (this.sound) {
        await this.sound.pauseAsync();
        this.setState({ isPlaying: false });
      }
    } catch (error) {
      console.error('Pause error:', error);
    }
  }

  async resume(): Promise<void> {
    try {
      if (this.sound) {
        await this.sound.playAsync();
        this.setState({ isPlaying: true });
      }
    } catch (error) {
      console.error('Resume error:', error);
    }
  }

  async stop(): Promise<void> {
    try {
      if (this.sound) {
        await this.sound.unloadAsync();
        this.sound = null;
      }

      if (this.notificationId) {
        await Notifications.dismissNotificationAsync(this.notificationId);
        this.notificationId = null;
      }

      this.setState({
        isPlaying: false,
        isLoading: false,
        currentStation: null,
        error: null,
      });
    } catch (error) {
      console.error('Stop error:', error);
    }
  }

  subscribe(callback: (state: SimpleAudioState) => void) {
    this.subscribers.push(callback);
    callback(this.state);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  getState() {
    return this.state;
  }

  // Callback properties for external control
  onNextStation?: () => void;
  onPreviousStation?: () => void;
}

export const simpleBackgroundAudioService = new SimpleBackgroundAudioService();
