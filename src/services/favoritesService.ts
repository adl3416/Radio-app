import AsyncStorage from '@react-native-async-storage/async-storage';
import { RadioStation } from '../constants/radioStations';

const FAVORITES_KEY = 'favorite-stations';

class FavoritesService {
  private listeners: Array<(favorites: RadioStation[]) => void> = [];
  private favorites: RadioStation[] = [];
  private isProcessing = false; // Race condition koruması

  constructor() {
    this.loadFavorites();
  }

  public subscribe(listener: (favorites: RadioStation[]) => void) {
    this.listeners.push(listener);
    listener(this.favorites);
    
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.favorites));
  }

  public async loadFavorites(): Promise<RadioStation[]> {
    try {
      const favoritesJson = await AsyncStorage.getItem(FAVORITES_KEY);
      this.favorites = favoritesJson ? JSON.parse(favoritesJson) : [];
      this.notifyListeners();
      return this.favorites;
    } catch (error) {
      console.error('Failed to load favorites:', error);
      return [];
    }
  }

  public async addToFavorites(station: RadioStation): Promise<void> {
    try {
      if (!this.isFavorite(station.id)) {
        this.favorites.push(station);
        await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(this.favorites));
        this.notifyListeners();
      }
    } catch (error) {
      console.error('Failed to add favorite:', error);
    }
  }

  public async removeFromFavorites(stationId: string): Promise<void> {
    try {
      this.favorites = this.favorites.filter(station => station.id !== stationId);
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(this.favorites));
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to remove favorite:', error);
    }
  }

  public isFavorite(stationId: string): boolean {
    return this.favorites.some(station => station.id === stationId);
  }

  public getFavorites(): RadioStation[] {
    return this.favorites;
  }

  public async toggleFavorite(station: RadioStation): Promise<boolean> {
    if (this.isProcessing) {
      console.log('Toggle favorite already processing, skipping...');
      return this.isFavorite(station.id);
    }

    this.isProcessing = true;
    
    try {
      console.log('toggleFavorite called for:', station.name);
      console.log('Current favorites before toggle:', this.favorites.map(f => f.name).join(', '));
      
      const wasFavorite = this.isFavorite(station.id);
      console.log('Was favorite:', wasFavorite);
      
      if (wasFavorite) {
        await this.removeFromFavorites(station.id);
        console.log('Removed from favorites');
        return false;
      } else {
        await this.addToFavorites(station);
        console.log('Added to favorites');
        return true;
      }
    } finally {
      this.isProcessing = false;
    }
  }
}

export const favoritesService = new FavoritesService();
