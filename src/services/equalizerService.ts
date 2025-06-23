// Equalizer Service - Audio Enhancement
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface EqualizerBand {
  frequency: number;
  gain: number;
  label: string;
}

export interface EqualizerPreset {
  id: string;
  name: string;
  bands: number[];
}

export interface EqualizerState {
  isEnabled: boolean;
  currentPreset: string;
  customBands: number[];
  presets: EqualizerPreset[];
}

const EQUALIZER_STORAGE_KEY = 'equalizer-settings';

// Default equalizer bands (Hz)
export const EQUALIZER_BANDS: EqualizerBand[] = [
  { frequency: 60, gain: 0, label: '60Hz' },
  { frequency: 170, gain: 0, label: '170Hz' },
  { frequency: 310, gain: 0, label: '310Hz' },
  { frequency: 600, gain: 0, label: '600Hz' },
  { frequency: 1000, gain: 0, label: '1kHz' },
  { frequency: 3000, gain: 0, label: '3kHz' },
  { frequency: 6000, gain: 0, label: '6kHz' },
  { frequency: 12000, gain: 0, label: '12kHz' },
  { frequency: 14000, gain: 0, label: '14kHz' },
  { frequency: 16000, gain: 0, label: '16kHz' },
];

// Predefined presets
export const DEFAULT_PRESETS: EqualizerPreset[] = [
  {
    id: 'flat',
    name: 'Düz (Flat)',
    bands: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  },
  {
    id: 'pop',
    name: 'Pop',
    bands: [-1, 2, 4, 4, 2, 0, -1, -1, -1, -1]
  },
  {
    id: 'rock',
    name: 'Rock',
    bands: [4, 3, -3, -4, -1, 2, 4, 5, 5, 5]
  },
  {
    id: 'jazz',
    name: 'Jazz',
    bands: [2, 1, 1, 2, -1, -1, 0, 1, 2, 3]
  },
  {
    id: 'classical',
    name: 'Klasik',
    bands: [3, 2, -1, -1, -1, -1, -1, 2, 3, 4]
  },
  {
    id: 'bass_boost',
    name: 'Bas Güçlendirme',
    bands: [6, 4, 3, 1, 0, -1, -2, -3, -3, -3]
  },
  {
    id: 'vocal_boost',
    name: 'Vokal Güçlendirme',
    bands: [-2, -1, 1, 3, 3, 3, 2, 1, 0, -1]
  },
  {
    id: 'treble_boost',
    name: 'Tiz Güçlendirme',
    bands: [-3, -2, -1, 0, 1, 2, 3, 4, 5, 6]
  }
];

class EqualizerService {
  private listeners: Array<(state: EqualizerState) => void> = [];
  private state: EqualizerState = {
    isEnabled: true,
    currentPreset: 'flat',
    customBands: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    presets: DEFAULT_PRESETS
  };

  constructor() {
    this.loadSettings();
  }

  public subscribe(listener: (state: EqualizerState) => void) {
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
      await AsyncStorage.setItem(EQUALIZER_STORAGE_KEY, JSON.stringify(this.state));
    } catch (error) {
      console.error('Failed to save equalizer settings:', error);
    }
  }

  private async loadSettings() {
    try {
      const settingsJson = await AsyncStorage.getItem(EQUALIZER_STORAGE_KEY);
      if (settingsJson) {
        const savedState = JSON.parse(settingsJson);
        this.state = { ...this.state, ...savedState };
        this.notifyListeners();
      }
    } catch (error) {
      console.error('Failed to load equalizer settings:', error);
    }
  }

  public async setEnabled(enabled: boolean) {
    this.state.isEnabled = enabled;
    await this.saveSettings();
    this.notifyListeners();
  }

  public async setPreset(presetId: string) {
    const preset = this.state.presets.find(p => p.id === presetId);
    if (preset) {
      this.state.currentPreset = presetId;
      this.state.customBands = [...preset.bands];
      await this.saveSettings();
      this.notifyListeners();
    }
  }

  public async setBandGain(bandIndex: number, gain: number) {
    if (bandIndex >= 0 && bandIndex < this.state.customBands.length) {
      this.state.customBands[bandIndex] = Math.max(-12, Math.min(12, gain));
      this.state.currentPreset = 'custom';
      await this.saveSettings();
      this.notifyListeners();
    }
  }

  public async resetToFlat() {
    this.state.currentPreset = 'flat';
    this.state.customBands = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    await this.saveSettings();
    this.notifyListeners();
  }

  public getCurrentBands(): number[] {
    return [...this.state.customBands];
  }

  public getState(): EqualizerState {
    return { ...this.state };
  }

  public getPresetByName(name: string): EqualizerPreset | undefined {
    return this.state.presets.find(preset => preset.name === name);
  }

  // Apply equalizer settings to audio (placeholder for future implementation)
  public applyEqualizer() {
    if (!this.state.isEnabled) {
      return;
    }

    // In a real implementation, this would apply the equalizer bands
    // to the audio output using native modules or audio processing libraries
    console.log('Applying equalizer with bands:', this.state.customBands);
  }
}

export const equalizerService = new EqualizerService();
