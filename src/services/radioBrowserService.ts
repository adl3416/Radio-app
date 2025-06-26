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
   * Get Turkish radio stations (up to 1500 - Maximum)
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
        `${this.baseUrl}/json/stations/bycountry/turkey?limit=1500&order=votes&reverse=true`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const stations: RadioBrowserStation[] = await response.json();
      const processed = this.processStations(stations);
      
      // Cache the results for longer
      this.cache.set(cacheKey, processed);
      setTimeout(() => this.cache.delete(cacheKey), this.cacheTimeout * 2); // 1 hour cache
      
      console.log(`Fetched ${processed.length} Turkish stations from Radio Browser API`);
      return processed;
      
    } catch (error) {
      console.error('Failed to fetch Turkish stations:', error);
      throw new Error('Türk radyo istasyonları yüklenemedi');
    }
  }

  /**
   * Get ALL Turkish radio stations from API (no limit)
   */
  async getAllTurkishStations(): Promise<ProcessedRadioStation[]> {
    const cacheKey = 'all-turkish-stations';
    const cached = this.cache.get(cacheKey);
    
    if (cached) {
      console.log('Using cached ALL Turkish stations');
      return cached;
    }

    try {
      // Use the exact endpoint you mentioned with hidebroken=true
      const response = await fetch(
        `${this.baseUrl}/json/stations/bycountrycodeexact/TR?hidebroken=true&order=votes&reverse=true`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const stations: RadioBrowserStation[] = await response.json();
      const processed = this.processStations(stations);
      
      // Cache the results for longer since this is a large dataset
      this.cache.set(cacheKey, processed);
      setTimeout(() => this.cache.delete(cacheKey), this.cacheTimeout * 2); // 1 hour cache
      
      console.log(`Fetched ${processed.length} Turkish stations from Radio Browser API (ALL)`);
      return processed;
      
    } catch (error) {
      console.error('Failed to fetch ALL Turkish stations:', error);
      throw new Error('Tüm Türk radyo istasyonları yüklenemedi');
    }
  }
  /**
   * Search stations by name or tag
   */
  async searchStations(query: string, country = 'turkey'): Promise<ProcessedRadioStation[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/json/stations/search?name=${encodeURIComponent(query)}&country=${country}&limit=200&order=votes&reverse=true`
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
  }  /**
   * Get stations by tag
   */
  private async getStationsByTag(tag: string): Promise<ProcessedRadioStation[]> {
    try {
      const response = await fetch(`${this.baseUrl}/stations/bytag/${encodeURIComponent(tag)}?limit=100&hidebroken=true`);
      const data = await response.json();
      return this.processStations(data);
    } catch (error) {
      console.warn(`Failed to fetch stations by tag ${tag}:`, error);
      return [];
    }
  }

  /**
   * Search stations by name (internal helper)
   */
  private async searchStationsByKeyword(name: string): Promise<ProcessedRadioStation[]> {
    try {
      const response = await fetch(`${this.baseUrl}/stations/search?name=${encodeURIComponent(name)}&limit=100&hidebroken=true`);
      const data = await response.json();
      return this.processStations(data);
    } catch (error) {
      console.warn(`Failed to search stations by name ${name}:`, error);
      return [];
    }
  }

  /**
   * Get popular Turkish stations by genre
   */
  async getTurkishByGenre(genre: string): Promise<ProcessedRadioStation[]> {
    try {
      const allTurkish = await this.getAllTurkishStations(); // Use the new function to get all stations
      
      // Filter by genre/tag
      const filtered = allTurkish.filter(station => 
        station.genre?.toLowerCase().includes(genre.toLowerCase()) ||
        station.category?.toLowerCase().includes(genre.toLowerCase()) ||
        station.name.toLowerCase().includes(genre.toLowerCase())
      );
      
      return filtered.slice(0, 100); // Increased limit to 100 stations
      
    } catch (error) {
      console.error(`Failed to get Turkish stations by genre ${genre}:`, error);
      return [];
    }
  }

  /**
   * Get Turkish stations with pagination
   */
  async getTurkishStationsPaginated(page: number = 1, limit: number = 100): Promise<{
    stations: ProcessedRadioStation[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const allStations = await this.getAllTurkishStations();
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedStations = allStations.slice(startIndex, endIndex);
      
      return {
        stations: paginatedStations,
        total: allStations.length,
        page,
        totalPages: Math.ceil(allStations.length / limit)
      };
      
    } catch (error) {
      console.error('Failed to get paginated Turkish stations:', error);
      throw new Error('Sayfalı radyo listesi yüklenemedi');
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

  /**
   * Get Turkish religious (dini) stations
   */
  async getReligiousStations(): Promise<ProcessedRadioStation[]> {
    const cacheKey = 'religious-stations';
    const cached = this.cache.get(cacheKey);
    
    if (cached) {
      console.log('Using cached religious stations');
      return cached;
    }

    try {
      // Search for religious stations using multiple approaches
      const [tagResults, nameResults] = await Promise.all([
        this.searchStationsByTags(['religion', 'religious', 'islam', 'islamic', 'dini', 'ilahi']),
        this.searchStationsByName(['dini', 'ilahi', 'islam', 'kuran', 'din'])
      ]);

      // Combine and deduplicate results
      const combined = [...tagResults, ...nameResults];
      const uniqueStations = this.deduplicateStations(combined);
      
      // Filter for Turkish stations
      const turkishReligious = uniqueStations.filter(station => 
        station.country?.toLowerCase() === 'turkey' || 
        station.language?.toLowerCase().includes('turkish') ||
        station.name.toLowerCase().includes('türk')
      );

      // Cache the results
      this.cache.set(cacheKey, turkishReligious);
      setTimeout(() => this.cache.delete(cacheKey), this.cacheTimeout);
      
      console.log(`Fetched ${turkishReligious.length} Turkish religious stations`);
      return turkishReligious;
      
    } catch (error) {
      console.error('Failed to fetch religious stations:', error);
      throw new Error('Dini radyo istasyonları yüklenemedi');
    }
  }

  /**
   * Get Turkish news (haber) stations
   */
  async getNewsStations(): Promise<ProcessedRadioStation[]> {
    const cacheKey = 'news-stations';
    const cached = this.cache.get(cacheKey);
    
    if (cached) {
      console.log('Using cached news stations');
      return cached;
    }

    try {
      // Search for news stations using multiple approaches
      const [tagResults, nameResults] = await Promise.all([
        this.searchStationsByTags(['news', 'haber', 'haberler', 'gündem', 'politik']),
        this.searchStationsByName(['haber', 'news', 'gündem', 'haberler', 'ajans'])
      ]);

      // Combine and deduplicate results
      const combined = [...tagResults, ...nameResults];
      const uniqueStations = this.deduplicateStations(combined);
      
      // Filter for Turkish stations
      const turkishNews = uniqueStations.filter(station => 
        station.country?.toLowerCase() === 'turkey' || 
        station.language?.toLowerCase().includes('turkish') ||
        station.name.toLowerCase().includes('türk')
      );

      // Cache the results
      this.cache.set(cacheKey, turkishNews);
      setTimeout(() => this.cache.delete(cacheKey), this.cacheTimeout);
      
      console.log(`Fetched ${turkishNews.length} Turkish news stations`);
      return turkishNews;
      
    } catch (error) {
      console.error('Failed to fetch news stations:', error);
      throw new Error('Haber radyo istasyonları yüklenemedi');
    }
  }

  /**
   * Get Turkish sports (spor) stations
   */
  async getSportsStations(): Promise<ProcessedRadioStation[]> {
    const cacheKey = 'sports-stations';
    const cached = this.cache.get(cacheKey);
    
    if (cached) {
      console.log('Using cached sports stations');
      return cached;
    }

    try {
      // Search for sports stations using multiple approaches
      const [tagResults, nameResults] = await Promise.all([
        this.searchStationsByTags(['sport', 'sports', 'spor', 'futbol', 'football', 'basketbol']),
        this.searchStationsByName(['spor', 'sport', 'futbol', 'basketbol', 'maç'])
      ]);

      // Combine and deduplicate results
      const combined = [...tagResults, ...nameResults];
      const uniqueStations = this.deduplicateStations(combined);
      
      // Filter for Turkish stations
      const turkishSports = uniqueStations.filter(station => 
        station.country?.toLowerCase() === 'turkey' || 
        station.language?.toLowerCase().includes('turkish') ||
        station.name.toLowerCase().includes('türk')
      );

      // Cache the results
      this.cache.set(cacheKey, turkishSports);
      setTimeout(() => this.cache.delete(cacheKey), this.cacheTimeout);
      
      console.log(`Fetched ${turkishSports.length} Turkish sports stations`);
      return turkishSports;
      
    } catch (error) {
      console.error('Failed to fetch sports stations:', error);
      throw new Error('Spor radyo istasyonları yüklenemedi');
    }
  }

  /**
   * Get categorized Turkish stations (dini, haber, spor)
   */
  async getCategorizedStations(): Promise<{
    religious: ProcessedRadioStation[];
    news: ProcessedRadioStation[];
    sports: ProcessedRadioStation[];
    total: number;
  }> {
    try {
      const [religious, news, sports] = await Promise.all([
        this.getReligiousStations(),
        this.getNewsStations(),
        this.getSportsStations()
      ]);

      return {
        religious,
        news,
        sports,
        total: religious.length + news.length + sports.length
      };
      
    } catch (error) {
      console.error('Failed to fetch categorized stations:', error);
      throw new Error('Kategorili radyo istasyonları yüklenemedi');
    }
  }

  /**
   * Helper function to search stations by tags
   */
  private async searchStationsByTags(tags: string[]): Promise<ProcessedRadioStation[]> {
    const results: ProcessedRadioStation[] = [];
    
    for (const tag of tags) {
      try {
        const stations = await this.getStationsByTag(tag);
        results.push(...stations);
      } catch (error) {
        console.warn(`Failed to fetch stations for tag: ${tag}`, error);
      }
    }
    
    return results;
  }
  /**
   * Helper function to search stations by name keywords
   */
  private async searchStationsByName(keywords: string[]): Promise<ProcessedRadioStation[]> {
    const results: ProcessedRadioStation[] = [];
    
    for (const keyword of keywords) {
      try {
        const stations = await this.searchStationsByKeyword(keyword);
        results.push(...stations);
      } catch (error) {
        console.warn(`Failed to search stations for keyword: ${keyword}`, error);
      }
    }
    
    return results;
  }

  /**
   * Helper function to deduplicate stations by UUID
   */
  private deduplicateStations(stations: ProcessedRadioStation[]): ProcessedRadioStation[] {
    const seen = new Set<string>();
    return stations.filter(station => {
      if (seen.has(station.id)) {
        return false;
      }
      seen.add(station.id);
      return true;
    });
  }

}

export const radioBrowserService = new RadioBrowserService();
export default RadioBrowserService;
