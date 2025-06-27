/**
 * Radio Station Updater Script
 * Bu script Türkiye'deki en popüler 200 radyo istasyonunu çeker,
 * test eder, duplikatları siler ve çalışan radyoları günceller.
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Radio Browser API Base URL
const API_BASE_URL = 'https://de1.api.radio-browser.info';

// Türkiye'nin en popüler radyo istasyonları (manuel liste)
const PRIORITY_RADIOS = [
  'TRT 1', 'TRT FM', 'TRT Radyo 3', 'TRT Müzik',
  'Power FM', 'Power XL', 'Power Türk', 'Power Love',
  'Radyo D', 'Radyo Fenomen', 'Metro FM', 'Joy FM',
  'Kral FM', 'Kral Pop', 'Süper FM', 'Capital',
  'Slow Türk', 'Romantik Türk', 'Alem FM', 'Virgin Radio',
  'Number One FM', 'Show Radio', 'Radyo Viva', 'Pal FM'
];

class RadioUpdater {
  constructor() {
    this.workingStations = [];
    this.failedStations = [];
    this.duplicates = [];
    this.testTimeout = 15000; // 15 saniye timeout
  }

  async fetchTurkishStations() {
    console.log('🔍 API\'den Türk radyo istasyonları çekiliyor...');
    
    return new Promise((resolve, reject) => {
      const url = `${API_BASE_URL}/json/stations/bycountrycodeexact/TR?hidebroken=true&order=votes&reverse=true&limit=1000`;
      
      https.get(url, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const stations = JSON.parse(data);
            console.log(`✅ ${stations.length} istasyon çekildi`);
            resolve(stations);
          } catch (error) {
            reject(error);
          }
        });
      }).on('error', (error) => {
        reject(error);
      });
    });
  }

  async testRadioURL(url) {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve(false);
      }, this.testTimeout);

      try {
        const urlObj = new URL(url);
        const client = urlObj.protocol === 'https:' ? https : http;
        
        const req = client.get(url, (res) => {
          clearTimeout(timeout);
          
          // Check content type for audio streams
          const contentType = res.headers['content-type'] || '';
          const isAudio = contentType.includes('audio') || 
                         contentType.includes('application/octet-stream') ||
                         contentType.includes('video/mp2t') ||
                         res.headers['icy-name'] ||
                         res.headers['icy-description'];
          
          if (res.statusCode === 200 && isAudio) {
            resolve(true);
          } else {
            resolve(false);
          }
          
          req.destroy();
        });

        req.on('error', () => {
          clearTimeout(timeout);
          resolve(false);
        });

        req.setTimeout(this.testTimeout, () => {
          req.destroy();
          clearTimeout(timeout);
          resolve(false);
        });
        
      } catch (error) {
        clearTimeout(timeout);
        resolve(false);
      }
    });
  }

  prioritizeStations(stations) {
    console.log('🎯 İstasyonlar önceliklerine göre sıralanıyor...');
    
    const prioritized = [];
    const regular = [];
    
    stations.forEach(station => {
      const name = station.name.toLowerCase();
      const isPriority = PRIORITY_RADIOS.some(priority => 
        name.includes(priority.toLowerCase()) || 
        priority.toLowerCase().includes(name)
      );
      
      if (isPriority) {
        prioritized.push(station);
      } else {
        regular.push(station);
      }
    });
    
    // Öncelikli radyoları votes'a göre sırala
    prioritized.sort((a, b) => b.votes - a.votes);
    // Diğerlerini de votes'a göre sırala
    regular.sort((a, b) => b.votes - a.votes);
    
    console.log(`📊 ${prioritized.length} öncelikli, ${regular.length} regular istasyon`);
    return [...prioritized, ...regular];
  }

  removeDuplicates(stations) {
    console.log('🔍 Duplikatlar temizleniyor...');
    
    const seen = new Map();
    const unique = [];
    
    stations.forEach(station => {
      const name = station.name.toLowerCase().trim();
      const url = station.url_resolved || station.url;
      
      // İsim benzerliği kontrolü
      const nameKey = name.replace(/[^a-z0-9]/g, '');
      
      // URL benzerliği kontrolü  
      const urlKey = url.replace(/[^a-z0-9]/g, '');
      
      if (!seen.has(nameKey) && !seen.has(urlKey)) {
        seen.set(nameKey, true);
        seen.set(urlKey, true);
        unique.push(station);
      } else {
        this.duplicates.push(station);
      }
    });
    
    console.log(`🗑️ ${this.duplicates.length} duplikat silindi, ${unique.length} benzersiz istasyon kaldı`);
    return unique;
  }

  processStation(station) {
    const url = station.url_resolved || station.url;
    
    return {
      id: station.stationuuid || `station-${Date.now()}-${Math.random()}`,
      name: station.name || 'Bilinmeyen Radyo',
      url: url,
      description: this.generateDescription(station),
      votes: station.votes || 0,
      bitrate: station.bitrate || 128,
      codec: station.codec || 'MP3',
      country: station.country || 'Turkey',
      language: station.language || 'turkish',
      tags: station.tags || '',
      category: this.determineCategory(station),
      isLive: station.lastcheckok === 1,
      website: station.homepage || '',
      favicon: station.favicon || ''
    };
  }

  generateDescription(station) {
    const parts = [];
    
    if (station.tags) {
      const tags = station.tags.split(',').slice(0, 3);
      parts.push(...tags);
    }
    
    if (station.state) {
      parts.push(station.state);
    }
    
    if (station.codec && station.bitrate) {
      parts.push(`${station.codec} ${station.bitrate}kbps`);
    }
    
    if (parts.length === 0) {
      parts.push('Türk Radyosu');
    }
    
    return parts.join(' • ').substring(0, 100);
  }

  determineCategory(station) {
    const name = station.name.toLowerCase();
    const tags = (station.tags || '').toLowerCase();
    const combined = `${name} ${tags}`;
    
    if (combined.match(/haber|news|gündem/)) return 'Haber';
    if (combined.match(/müzik|music|pop|rock|türk|sanat/)) return 'Müzik';
    if (combined.match(/spor|sport|futbol/)) return 'Spor';
    if (combined.match(/dini|religious|kuran|islam/)) return 'Dini';
    if (combined.match(/klasik|classical|sanat/)) return 'Klasik';
    if (combined.match(/trt|devlet|resmi/)) return 'Kamu';
    
    return 'Genel';
  }

  async testStations(stations) {
    console.log(`🧪 ${stations.length} istasyon test ediliyor...`);
    
    const batchSize = 10; // 10'lu gruplar halinde test et
    const batches = [];
    
    for (let i = 0; i < stations.length; i += batchSize) {
      batches.push(stations.slice(i, i + batchSize));
    }
    
    for (let i = 0; i < batches.length; i++) {
      console.log(`📡 Batch ${i + 1}/${batches.length} test ediliyor...`);
      
      const batchPromises = batches[i].map(async (station) => {
        const url = station.url_resolved || station.url;
        const isWorking = await this.testRadioURL(url);
        
        if (isWorking) {
          this.workingStations.push(this.processStation(station));
          console.log(`✅ ${station.name} - Çalışıyor`);
        } else {
          this.failedStations.push(station);
          console.log(`❌ ${station.name} - Çalışmıyor`);
        }
      });
      
      await Promise.all(batchPromises);
      
      // Her batch sonrası kısa bekleme
      if (i < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`\n📊 Test Sonuçları:`);
    console.log(`✅ Çalışan: ${this.workingStations.length}`);
    console.log(`❌ Çalışmayan: ${this.failedStations.length}`);
  }

  generateConstantsFile() {
    const filePath = path.join(__dirname, 'src', 'constants', 'radioStations.ts');
    
    // En iyi 200 istasyonu al
    const top200 = this.workingStations.slice(0, 200);
    
    const content = `/**
 * Updated Radio Stations - ${new Date().toLocaleString('tr-TR')}
 * Automatically generated from Radio Browser API
 * ${top200.length} tested and working Turkish radio stations
 */

export interface RadioStation {
  id: string;
  name: string;
  url: string;
  description: string;
  votes?: number;
  bitrate?: number;
  codec?: string;
  category?: string;
  isLive?: boolean;
  website?: string;
  favicon?: string;
}

export const RADIO_STATIONS: RadioStation[] = ${JSON.stringify(top200, null, 2)};

// Statistics
export const RADIO_STATS = {
  totalStations: ${top200.length},
  lastUpdated: '${new Date().toISOString()}',
  categories: {
${this.generateCategoryStats(top200)}
  },
  topByVotes: [
${top200.slice(0, 10).map(station => `    { name: '${station.name}', votes: ${station.votes} }`).join(',\n')}
  ]
};
`;

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`\n💾 Dosya güncellendi: ${filePath}`);
    console.log(`📊 ${top200.length} istasyon kayıt edildi`);
  }

  generateCategoryStats(stations) {
    const categories = {};
    
    stations.forEach(station => {
      const category = station.category || 'Genel';
      categories[category] = (categories[category] || 0) + 1;
    });
    
    return Object.entries(categories)
      .map(([category, count]) => `    '${category}': ${count}`)
      .join(',\n');
  }

  async run() {
    try {
      console.log('🚀 Radyo istasyonu güncellemesi başlıyor...\n');
      
      // 1. API'den istasyonları çek
      const rawStations = await this.fetchTurkishStations();
      
      // 2. Öncelikle sırala
      const prioritized = this.prioritizeStations(rawStations);
      
      // 3. Duplikatları temizle
      const unique = this.removeDuplicates(prioritized);
      
      // 4. İlk 400 istasyonu al (test için)
      const testCandidates = unique.slice(0, 400);
      
      // 5. Test et
      await this.testStations(testCandidates);
      
      // 6. Dosyayı güncelle
      if (this.workingStations.length >= 50) {
        this.generateConstantsFile();
        console.log('\n🎉 Güncelleme başarıyla tamamlandı!');
      } else {
        console.log('\n❌ Yeterli çalışan istasyon bulunamadı');
      }
      
    } catch (error) {
      console.error('❌ Hata:', error.message);
    }
  }
}

// Script'i çalıştır
if (require.main === module) {
  const updater = new RadioUpdater();
  updater.run();
}

module.exports = RadioUpdater;
