/**
 * Radio Browser API Service
 * Free radio station database API
 * https://www.radio-browser.info/
 */

export interface RadioBrowserStation {
  changeuuid: string;
  stationuuid: string;
  name: string;
  url: string;
  url_resolved: string;
  homepage: string;
  favicon: string;
  tags: string;
  country: string;
  countrycode: string;
  state: string;
  language: string;
  votes: number;
  lastchangetime: string;
  codec: string;
  bitrate: number;
  hls: number;
  lastcheckok: number;
  lastchecktime: string;
  lastcheckoktime: string;
  lastlocalchecktime: string;
  clicktimestamp: string;
  clickcount: number;
  clicktrend: number;
}

export interface ProcessedRadioStation {
  id: string;
  name: string;
  url: string;
  description: string;
  streamUrl: string;
  imageUrl: string;
  category: string;
  isLive: boolean;
  genre: string;
  city?: string;
  website?: string;
  country?: string;
  language?: string;
  votes?: number;
  bitrate?: number;
  codec?: string;
  isGuaranteed?: boolean;
}

class RadioBrowserService {
  private baseUrl = 'https://de1.api.radio-browser.info';
  private cache: Map<string, ProcessedRadioStation[]> = new Map();
  private cacheTimeout = 30 * 60 * 1000; // 30 minutes

  /**
   * Get Turkish radio stations
   */
  async getTurkishStations(): Promise<ProcessedRadioStation[]> {
    const cacheKey = 'turkish-stations';
    const cached = this.cache.get(cacheKey);
    
    if (cached) {
      console.log('Using cached Turkish stations');
      return cached;
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/json/stations/bycountry/turkey?limit=100&order=votes&reverse=true`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const stations: RadioBrowserStation[] = await response.json();
      const processed = this.processStations(stations);
      
      // Cache the results
      this.cache.set(cacheKey, processed);
      setTimeout(() => this.cache.delete(cacheKey), this.cacheTimeout);
      
      console.log(`Fetched ${processed.length} Turkish stations from Radio Browser API`);
      return processed;
      
    } catch (error) {
      console.error('Failed to fetch Turkish stations:', error);
      throw new Error('Türk radyo istasyonları yüklenemedi');
    }
  }

  /**
   * Search stations by name or tag
   */
  async searchStations(query: string, country = 'turkey'): Promise<ProcessedRadioStation[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/json/stations/search?name=${encodeURIComponent(query)}&country=${country}&limit=50&order=votes&reverse=true`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const stations: RadioBrowserStation[] = await response.json();
      return this.processStations(stations);
      
    } catch (error) {
      console.error('Failed to search stations:', error);
      throw new Error('Radyo arama başarısız');
    }
  }

  /**
   * Get stations by tag/genre
   */
  async getStationsByTag(tag: string): Promise<ProcessedRadioStation[]> {
    const cacheKey = `tag-${tag}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/json/stations/bytag/${encodeURIComponent(tag)}?limit=50&order=votes&reverse=true`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const stations: RadioBrowserStation[] = await response.json();
      const processed = this.processStations(stations);
      
      // Cache the results
      this.cache.set(cacheKey, processed);
      setTimeout(() => this.cache.delete(cacheKey), this.cacheTimeout);
      
      return processed;
      
    } catch (error) {
      console.error(`Failed to fetch stations by tag ${tag}:`, error);
      throw new Error(`${tag} radyoları yüklenemedi`);
    }
  }

  /**
   * Get popular Turkish stations by genre
   */
  async getTurkishByGenre(genre: string): Promise<ProcessedRadioStation[]> {
    try {
      const allTurkish = await this.getTurkishStations();
      
      // Filter by genre/tag
      const filtered = allTurkish.filter(station => 
        station.genre?.toLowerCase().includes(genre.toLowerCase()) ||
        station.category?.toLowerCase().includes(genre.toLowerCase()) ||
        station.name.toLowerCase().includes(genre.toLowerCase())
      );
      
      return filtered.slice(0, 20); // Limit to 20 stations
      
    } catch (error) {
      console.error(`Failed to get Turkish stations by genre ${genre}:`, error);
      return [];
    }
  }

  /**
   * Test station URL and mark as clickcount
   */
  async testAndClickStation(stationUuid: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseUrl}/json/url/${stationUuid}`,
        { method: 'GET' }
      );
      
      return response.ok;
    } catch (error) {
      console.error('Failed to test station:', error);
      return false;
    }
  }
  /**
   * Check if audio format is supported in web browsers
   */
  private isSupportedAudioFormat(url: string, codec?: string): boolean {
    if (!url) return false;
    
    const urlLower = url.toLowerCase();
    const codecLower = codec?.toLowerCase() || '';
    
    // Supported formats in most browsers
    const supportedFormats = [
      '.mp3',
      '.aac',
      '.m4a',
      '.ogg',
      '.wav'
    ];
    
    // Unsupported or problematic formats
    const unsupportedFormats = [
      '.m3u8',  // HLS streams - needs special handling
      '.pls',   // Playlist files
      '.m3u',   // Playlist files
      '.flv',   // Flash video
      '.wmv',   // Windows Media
      '.wma'    // Windows Media Audio
    ];
    
    // Check if URL contains unsupported formats
    if (unsupportedFormats.some(format => urlLower.includes(format))) {
      return false;
    }
    
    // Check codec
    if (codecLower && !['mp3', 'aac', 'mpeg', 'ogg'].includes(codecLower)) {
      return false;
    }
    
    // If URL contains supported format or no extension (direct stream)
    return supportedFormats.some(format => urlLower.includes(format)) || 
           (!urlLower.includes('.') && urlLower.startsWith('http'));
  }

  /**
   * Process raw stations from API to our format
   */
  private processStations(stations: RadioBrowserStation[]): ProcessedRadioStation[] {
    return stations
      .filter(station => 
        station.lastcheckok === 1 && // Only working stations
        station.url_resolved && 
        station.name &&
        this.isSupportedAudioFormat(station.url_resolved, station.codec) // Only supported formats
      )      .map(station => ({
        id: station.stationuuid,
        name: station.name,
        url: station.url_resolved,
        description: this.createDescription(station),
        streamUrl: station.url_resolved,
        imageUrl: station.favicon || this.getDefaultImage(station.tags),
        category: this.mapCategory(station.tags),
        isLive: station.lastcheckok === 1,
        genre: this.extractGenre(station.tags),
        city: station.state || undefined,
        website: station.homepage || undefined,
        country: station.country,
        language: station.language,
        votes: station.votes,
        bitrate: station.bitrate,
        codec: station.codec
      }));
  }

  private createDescription(station: RadioBrowserStation): string {
    const parts = [];
    
    if (station.language) parts.push(station.language);
    if (station.state) parts.push(station.state);
    if (station.bitrate) parts.push(`${station.bitrate}kbps`);
    if (station.codec) parts.push(station.codec.toUpperCase());
    
    return parts.join(' • ') || 'Radyo İstasyonu';
  }

  private mapCategory(tags: string): string {
    if (!tags) return 'Genel';
    
    const tagLower = tags.toLowerCase();
    
    if (tagLower.includes('news') || tagLower.includes('haber')) return 'Haber';
    if (tagLower.includes('music') || tagLower.includes('müzik')) return 'Müzik';
    if (tagLower.includes('pop')) return 'Pop';
    if (tagLower.includes('rock')) return 'Rock';
    if (tagLower.includes('jazz')) return 'Jazz';
    if (tagLower.includes('classical') || tagLower.includes('klasik')) return 'Klasik';
    if (tagLower.includes('folk') || tagLower.includes('halk')) return 'Halk Müziği';
    if (tagLower.includes('sport') || tagLower.includes('spor')) return 'Spor';
    if (tagLower.includes('talk')) return 'Talk Show';
    
    return 'Genel';
  }

  private extractGenre(tags: string): string {
    if (!tags) return 'Genel';
    
    const tagList = tags.split(',').map(t => t.trim());
    const musicTags = tagList.filter(tag => 
      !['radio', 'station', 'live', 'stream'].includes(tag.toLowerCase())
    );
    
    return musicTags[0] || 'Genel';
  }
  private getDefaultImage(tags: string): string {
    const category = this.mapCategory(tags);
    
    const defaultImages: Record<string, string> = {
      'Haber': 'https://via.placeholder.com/100x100/2563eb/ffffff?text=📰',
      'Müzik': 'https://via.placeholder.com/100x100/dc2626/ffffff?text=🎵',
      'Pop': 'https://via.placeholder.com/100x100/ec4899/ffffff?text=🎤',
      'Rock': 'https://via.placeholder.com/100x100/7c3aed/ffffff?text=🎸',
      'Jazz': 'https://via.placeholder.com/100x100/059669/ffffff?text=🎷',
      'Klasik': 'https://via.placeholder.com/100x100/b45309/ffffff?text=🎼',
      'Spor': 'https://via.placeholder.com/100x100/ea580c/ffffff?text=⚽',
      'Genel': 'https://via.placeholder.com/100x100/6b7280/ffffff?text=📻'
    };
    
    return defaultImages[category] || defaultImages['Genel'];
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

export const radioBrowserService = new RadioBrowserService();
