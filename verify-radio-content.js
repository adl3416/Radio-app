#!/usr/bin/env node

/**
 * Radio Content Verification Tool
 * 
 * Bu araç radyo istasyonlarının doğru içeriği yayınlayıp yayınlamadığını kontrol eder:
 * 1. Stream'e bağlanır
 * 2. Metadata'yı okur (şarkı adı, sanatçı vb.)
 * 3. İçeriğin beklenen kanal ile uyumlu olup olmadığını kontrol eder
 * 4. Yanlış yayın yapan kanalları tespit eder
 */

const https = require('https');
const http = require('http');
const fs = require('fs');

// Radio Stations to verify (focusing on problematic ones)
const STATIONS_TO_VERIFY = [
  {
    id: 'trt-fm',
    name: 'TRT FM',
    url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/TRT_FM.mp3',
    expectedContent: ['TRT FM', 'türkçe pop', 'türk müziği', 'pop müzik'],
    category: 'pop'
  },
  {
    id: 'trt-3',
    name: 'TRT 3',
    url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/TRT3.mp3',
    expectedContent: ['TRT 3', 'klasik müzik', 'sanat müziği', 'classical'],
    category: 'classical'
  },
  {
    id: 'a-haber',
    name: 'A Haber',
    url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/AHABER_RADYO.mp3',
    expectedContent: ['A Haber', 'haber', 'news', 'gündem'],
    category: 'news'
  },
  {
    id: 'power-turk',
    name: 'Power Türk',
    url: 'https://listen.powerapp.com.tr/powerturk/mpeg/icecast.audio',
    expectedContent: ['Power Türk', 'türkçe', 'pop', 'rock'],
    category: 'pop'
  },
  {
    id: 'power-pop',
    name: 'Power Pop',
    url: 'https://listen.powerapp.com.tr/powerpop/mpeg/icecast.audio',
    expectedContent: ['Power Pop', 'pop müzik', 'international'],
    category: 'pop'
  }
];

class RadioVerifier {
  constructor() {
    this.results = [];
    this.timeout = 15000; // 15 seconds timeout
  }

  async verifyStation(station) {
    console.log(`\n🔍 Verifying: ${station.name}`);
    console.log(`📡 URL: ${station.url}`);
    
    try {
      const result = await this.checkStream(station);
      this.results.push(result);
      
      if (result.success) {
        console.log(`✅ ${station.name}: BAŞARILI`);
        if (result.metadata) {
          console.log(`📊 Metadata: ${result.metadata}`);
        }
        if (result.contentMatch) {
          console.log(`🎯 İçerik Uyumu: DOĞRU`);
        } else {
          console.log(`⚠️ İçerik Uyumu: ŞÜPHELİ - Kontrol edilmeli`);
        }
      } else {
        console.log(`❌ ${station.name}: BAŞARISIZ - ${result.error}`);
      }
      
    } catch (error) {
      console.log(`💥 ${station.name}: HATA - ${error.message}`);
      this.results.push({
        station: station.name,
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  async checkStream(station) {
    return new Promise((resolve, reject) => {
      const isHttps = station.url.startsWith('https');
      const requestModule = isHttps ? https : http;
      
      const timeout = setTimeout(() => {
        reject(new Error('Timeout: 15 saniye içinde yanıt alınamadı'));
      }, this.timeout);

      try {
        const req = requestModule.get(station.url, {
          headers: {
            'User-Agent': 'TurkRadioApp/1.0 (Radio Content Verifier)',
            'Accept': 'audio/mpeg, audio/*, */*',
            'Icy-MetaData': '1' // Request metadata from Icecast streams
          }
        }, (res) => {
          clearTimeout(timeout);
          
          const result = {
            station: station.name,
            success: true,
            statusCode: res.statusCode,
            headers: res.headers,
            contentType: res.headers['content-type'],
            icyName: res.headers['icy-name'],
            icyDescription: res.headers['icy-description'],
            icyGenre: res.headers['icy-genre'],
            server: res.headers['server'],
            timestamp: new Date().toISOString()
          };

          // Check if it's actually an audio stream
          const contentType = res.headers['content-type'] || '';
          const isAudioStream = contentType.includes('audio') || 
                              contentType.includes('mpeg') ||
                              contentType.includes('mp3') ||
                              res.headers['icy-name']; // Icecast stream indicator

          if (!isAudioStream && res.statusCode !== 200) {
            result.success = false;
            result.error = `Geçersiz content-type: ${contentType}`;
            resolve(result);
            return;
          }

          // Extract metadata for content verification
          let metadata = '';
          if (res.headers['icy-name']) {
            metadata += res.headers['icy-name'];
          }
          if (res.headers['icy-description']) {
            metadata += ' - ' + res.headers['icy-description'];
          }
          if (res.headers['icy-genre']) {
            metadata += ' (' + res.headers['icy-genre'] + ')';
          }

          result.metadata = metadata;

          // Check content match
          result.contentMatch = this.checkContentMatch(station, metadata);

          // Listen to some stream data to verify it's working
          let dataReceived = false;
          const dataTimeout = setTimeout(() => {
            if (!dataReceived) {
              result.success = false;
              result.error = 'Stream açıldı ama veri alınamadı';
              resolve(result);
            }
          }, 5000);

          res.on('data', (chunk) => {
            if (!dataReceived) {
              dataReceived = true;
              clearTimeout(dataTimeout);
              result.dataSize = chunk.length;
              resolve(result);
            }
          });

          res.on('error', (error) => {
            clearTimeout(dataTimeout);
            result.success = false;
            result.error = error.message;
            resolve(result);
          });

          // Close connection after getting initial data
          setTimeout(() => {
            req.destroy();
          }, 3000);
        });

        req.on('error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });

        req.setTimeout(this.timeout, () => {
          req.destroy();
          reject(new Error('Request timeout'));
        });

      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  checkContentMatch(station, metadata) {
    if (!metadata) return false;
    
    const metadataLower = metadata.toLowerCase();
    return station.expectedContent.some(keyword => 
      metadataLower.includes(keyword.toLowerCase())
    );
  }

  generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📋 RADYO DOĞRULAMA RAPORU');
    console.log('='.repeat(80));
    
    const successfulStations = this.results.filter(r => r.success);
    const failedStations = this.results.filter(r => !r.success);
    const suspiciousContent = this.results.filter(r => r.success && !r.contentMatch);

    console.log(`\n📊 ÖZET:`);
    console.log(`✅ Başarılı: ${successfulStations.length}/${this.results.length}`);
    console.log(`❌ Başarısız: ${failedStations.length}/${this.results.length}`);
    console.log(`⚠️ Şüpheli İçerik: ${suspiciousContent.length}/${this.results.length}`);

    if (suspiciousContent.length > 0) {
      console.log(`\n⚠️ ŞÜPHELİ İÇERİK TESPIT EDİLEN RADYOLAR:`);
      suspiciousContent.forEach(station => {
        console.log(`   - ${station.station}: "${station.metadata}"`);
      });
    }

    if (failedStations.length > 0) {
      console.log(`\n❌ ÇALIŞMAYAN RADYOLAR:`);
      failedStations.forEach(station => {
        console.log(`   - ${station.station}: ${station.error}`);
      });
    }

    console.log(`\n✅ BAŞARILI RADYOLAR:`);
    successfulStations.forEach(station => {
      const status = station.contentMatch ? '🎯 DOĞRU' : '⚠️ ŞÜPHELİ';
      console.log(`   - ${station.station}: ${status}`);
      if (station.metadata) {
        console.log(`     Metadata: "${station.metadata}"`);
      }
    });

    // Save detailed report
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.results.length,
        successful: successfulStations.length,
        failed: failedStations.length,
        suspicious: suspiciousContent.length
      },
      results: this.results
    };

    fs.writeFileSync('RADIO_CONTENT_VERIFICATION_REPORT.json', JSON.stringify(reportData, null, 2));
    console.log(`\n💾 Detaylı rapor kaydedildi: RADIO_CONTENT_VERIFICATION_REPORT.json`);
  }

  async run() {
    console.log('🎧 Radyo İçerik Doğrulama Aracı Başlatıldı');
    console.log(`📋 ${STATIONS_TO_VERIFY.length} radyo kontrol edilecek\n`);

    for (const station of STATIONS_TO_VERIFY) {
      await this.verifyStation(station);
      // Wait a bit between requests to be respectful
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    this.generateReport();
  }
}

// Run the verification
const verifier = new RadioVerifier();
verifier.run().catch(error => {
  console.error('❌ Verification failed:', error);
  process.exit(1);
});
