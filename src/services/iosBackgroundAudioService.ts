import { Audio } from 'expo-av';
import * as Notifications from 'expo-notifications';
import { Platform, AppState } from 'react-native';

// iOS-specific Background Audio Service
// This service is specifically designed to overcome iOS background limitations

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export interface IOSAudioState {
  isPlaying: boolean;
  isLoading: boolean;
  currentStation: any | null;
  error: string | null;
}

class IOSBackgroundAudioService {
  private sound: Audio.Sound | null = null;
  private subscribers: ((state: IOSAudioState) => void)[] = [];
  private notificationId: string | null = null;
  private isInitialized = false;
  private backgroundInterval: ReturnType<typeof setInterval> | null = null;
  
  private state: IOSAudioState = {
    isPlaying: false,
    isLoading: false,
    currentStation: null,
    error: null,
  };

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      console.log('🍎 INITIALIZING iOS AGGRESSIVE BACKGROUND AUDIO');
      
      // AGGRESSIVE iOS Audio Session Setup
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: false,
      });

      // Request FULL notification permissions for iOS
      if (Platform.OS !== 'web') {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: false,
            allowDisplayInCarPlay: true,
            allowCriticalAlerts: true,
            provideAppNotificationSettings: true,
            allowProvisional: true,
          },
        });
        
        console.log('📱 iOS Notification permissions:', status);
        this.setupNotificationActions();
      }

      // AGGRESSIVE App State monitoring
      AppState.addEventListener('change', this.handleAppStateChange);
      
      this.isInitialized = true;
      console.log('✅ iOS AGGRESSIVE Background Audio initialized');
    } catch (error) {
      console.error('❌ iOS Audio initialization error:', error);
    }
  }

  private setupNotificationActions() {
    Notifications.setNotificationCategoryAsync('ios_media', [
      { identifier: 'play_pause', buttonTitle: '⏯️' },
      { identifier: 'stop', buttonTitle: '⏹️' },
    ]);

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
    console.log('🍎 iOS App state changed to:', nextAppState);
    
    if (nextAppState === 'background' && this.state.isPlaying) {
      console.log('🍎 🚨 CRITICAL: iOS going to background - ACTIVATING AGGRESSIVE MODE');
      
      // Start aggressive background monitoring
      this.startBackgroundMonitoring();
      this.showAggressiveNotification();
      
    } else if (nextAppState === 'active') {
      console.log('🍎 iOS became active - stopping aggressive monitoring');
      this.stopBackgroundMonitoring();
    }
  };

  private startBackgroundMonitoring() {
    if (this.backgroundInterval) {
      clearInterval(this.backgroundInterval);
    }

    // Check every 500ms and force audio to continue
    this.backgroundInterval = setInterval(() => {
      if (this.sound && this.state.isPlaying) {
        this.sound.getStatusAsync().then((status: any) => {
          if (status.isLoaded && !status.isPlaying) {
            console.log('🔄 FORCING iOS audio resume in background');
            this.sound?.playAsync().catch(err => {
              console.error('❌ Failed to force resume:', err);
            });
          }
        }).catch(() => {
          // Silent fail
        });
      }
    }, 500);
  }

  private stopBackgroundMonitoring() {
    if (this.backgroundInterval) {
      clearInterval(this.backgroundInterval);
      this.backgroundInterval = null;
    }
  }

  private setState(newState: Partial<IOSAudioState>) {
    this.state = { ...this.state, ...newState };
    this.subscribers.forEach(callback => callback(this.state));
  }

  private async showAggressiveNotification() {
    if (Platform.OS === 'web' || !this.state.currentStation) return;

    try {
      if (this.notificationId) {
        await Notifications.dismissNotificationAsync(this.notificationId);
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `🍎🎵 ${this.state.currentStation.name}`,
          body: 'iOS Background Audio - Çalmaya devam ediyor!',
          categoryIdentifier: 'ios_media',
          sticky: true,
          autoDismiss: false,
          data: { 
            stationId: this.state.currentStation.id,
            iosBackgroundMode: true,
          },
        },
        trigger: null,
      });

      this.notificationId = notificationId;
      console.log('📱 iOS AGGRESSIVE NOTIFICATION shown');
    } catch (error) {
      console.error('❌ iOS Notification error:', error);
    }
  }

  async play(station: any): Promise<void> {
    try {
      this.setState({ isLoading: true, error: null });

      if (this.sound) {
        await this.sound.unloadAsync();
        this.sound = null;
      }

      console.log('🍎 Starting iOS radio with AGGRESSIVE background support');

      const { sound } = await Audio.Sound.createAsync(
        { uri: station.url },
        { 
          shouldPlay: true,
          isLooping: false,
          volume: 1.0,
          rate: 1.0,
          shouldCorrectPitch: false,
          progressUpdateIntervalMillis: 200, // Very frequent updates
          positionMillis: 0,
        }
      );

      this.sound = sound;
      
      // AGGRESSIVE iOS setup
      await this.sound.setIsLoopingAsync(false);
      await this.sound.setVolumeAsync(1.0);
      await this.sound.setStatusAsync({ shouldPlay: true });
      
      this.sound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.isLoaded) {
          this.setState({
            isPlaying: status.isPlaying,
            isLoading: false,
          });
          
          console.log('🍎 iOS Audio Status:', status.isPlaying ? 'PLAYING ✅' : 'PAUSED ❌');
        }
        
        if (status.error) {
          console.error('❌ iOS Playback error:', status.error);
          this.setState({
            error: 'iOS radyo hatası',
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

      // Show notification immediately for iOS
      setTimeout(() => {
        this.showAggressiveNotification();
      }, 1000);
      
      console.log('✅ iOS radio started with AGGRESSIVE support:', station.name);
    } catch (error) {
      console.error('❌ iOS Play error:', error);
      this.setState({
        error: 'iOS radyo başlatılamadı',
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
        this.stopBackgroundMonitoring();
      }
    } catch (error) {
      console.error('iOS Pause error:', error);
    }
  }

  async resume(): Promise<void> {
    try {
      if (this.sound) {
        await this.sound.playAsync();
        this.setState({ isPlaying: true });
      }
    } catch (error) {
      console.error('iOS Resume error:', error);
    }
  }

  async stop(): Promise<void> {
    try {
      this.stopBackgroundMonitoring();
      
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
      console.error('iOS Stop error:', error);
    }
  }

  subscribe(callback: (state: IOSAudioState) => void) {
    this.subscribers.push(callback);
    callback(this.state);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  getState() {
    return this.state;
  }

  onNextStation?: () => void;
  onPreviousStation?: () => void;
}

export const iosBackgroundAudioService = new IOSBackgroundAudioService();
