// Sleep Timer Service - Auto-stop radio after specified time
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SleepTimerState {
  isActive: boolean;
  duration: number; // in minutes
  startTime: Date | null;
  endTime: Date | null;
  remainingTime: number; // in seconds
}

const SLEEP_TIMER_STORAGE_KEY = 'sleep-timer-settings';

// Predefined durations in minutes
export const SLEEP_TIMER_DURATIONS = [
  { label: '5 dakika', value: 5 },
  { label: '10 dakika', value: 10 },
  { label: '15 dakika', value: 15 },
  { label: '30 dakika', value: 30 },
  { label: '45 dakika', value: 45 },
  { label: '60 dakika', value: 60 },
  { label: '90 dakika', value: 90 },
  { label: '120 dakika', value: 120 },
];

class SleepTimerService {
  private listeners: Array<(state: SleepTimerState) => void> = [];
  private state: SleepTimerState = {
    isActive: false,
    duration: 30,
    startTime: null,
    endTime: null,
    remainingTime: 0,
  };

  private timerInterval: NodeJS.Timeout | null = null;
  private onTimerComplete: (() => void) | null = null;

  constructor() {
    this.loadSettings();
  }

  public subscribe(listener: (state: SleepTimerState) => void) {
    this.listeners.push(listener);
    listener(this.state);
    
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.state));
  }

  private async saveSettings() {
    try {
      const settingsToSave = {
        duration: this.state.duration,
        // Don't save active timer state - it shouldn't persist across app restarts
      };
      await AsyncStorage.setItem(SLEEP_TIMER_STORAGE_KEY, JSON.stringify(settingsToSave));
    } catch (error) {
      console.error('Failed to save sleep timer settings:', error);
    }
  }

  private async loadSettings() {
    try {
      const settingsJson = await AsyncStorage.getItem(SLEEP_TIMER_STORAGE_KEY);
      if (settingsJson) {
        const savedSettings = JSON.parse(settingsJson);
        this.state.duration = savedSettings.duration || 30;
        this.notifyListeners();
      }
    } catch (error) {
      console.error('Failed to load sleep timer settings:', error);
    }
  }

  public async setDuration(minutes: number) {
    this.state.duration = minutes;
    await this.saveSettings();
    this.notifyListeners();
  }

  public async startTimer(onComplete?: () => void) {
    if (this.state.isActive) {
      return; // Timer already running
    }

    this.onTimerComplete = onComplete || null;
    
    const now = new Date();
    const endTime = new Date(now.getTime() + this.state.duration * 60 * 1000);
    
    this.state = {
      ...this.state,
      isActive: true,
      startTime: now,
      endTime: endTime,
      remainingTime: this.state.duration * 60,
    };

    this.notifyListeners();
    this.startCountdown();
  }

  public async stopTimer() {
    this.state = {
      ...this.state,
      isActive: false,
      startTime: null,
      endTime: null,
      remainingTime: 0,
    };

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    this.notifyListeners();
  }

  public async extendTimer(additionalMinutes: number) {
    if (!this.state.isActive || !this.state.endTime) {
      return;
    }

    const newEndTime = new Date(this.state.endTime.getTime() + additionalMinutes * 60 * 1000);
    this.state.endTime = newEndTime;
    this.state.remainingTime += additionalMinutes * 60;
    
    this.notifyListeners();
  }

  private startCountdown() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }

    this.timerInterval = setInterval(() => {
      if (!this.state.isActive || !this.state.endTime) {
        return;
      }

      const now = new Date();
      const remaining = Math.max(0, Math.floor((this.state.endTime.getTime() - now.getTime()) / 1000));
      
      this.state.remainingTime = remaining;
      this.notifyListeners();

      if (remaining <= 0) {
        this.handleTimerComplete();
      }
    }, 1000);
  }

  private async handleTimerComplete() {
    await this.stopTimer();
    
    if (this.onTimerComplete) {
      this.onTimerComplete();
    }
  }

  public getState(): SleepTimerState {
    return { ...this.state };
  }

  public getRemainingTimeFormatted(): string {
    const minutes = Math.floor(this.state.remainingTime / 60);
    const seconds = this.state.remainingTime % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  public isActive(): boolean {
    return this.state.isActive;
  }

  public cleanup() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.listeners = [];
  }
}

export const sleepTimerService = new SleepTimerService();
