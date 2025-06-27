/**
 * Quick Radio Test Script
 * Yeni eklenen 200 radyo istasyonunu hızlı test eder
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Test edilecek radyo sayısı
const TEST_COUNT = 10; // İlk 10 radyoyu test et
const TIMEOUT = 10000; // 10 saniye timeout

class QuickRadioTester {
  constructor() {
    this.workingCount = 0;
    this.failedCount = 0;
    this.results = [];
  }

  async testRadioURL(url, name) {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve({ working: false, error: 'Timeout' });
      }, TIMEOUT);

      try {
        const urlObj = new URL(url);
        const client = urlObj.protocol === 'https:' ? https : http;
        
        const req = client.get(url, (res) => {
          clearTimeout(timeout);
          
          const contentType = res.headers['content-type'] || '';
          const isAudio = contentType.includes('audio') || 
                         contentType.includes('application/octet-stream') ||
                         contentType.includes('video/mp2t') ||
                         res.headers['icy-name'] ||
                         res.headers['icy-description'];
          
          if (res.statusCode === 200 && isAudio) {
            resolve({ working: true, contentType: contentType });
          } else {
            resolve({ working: false, error: `Status: ${res.statusCode}, Type: ${contentType}` });
          }
          
          req.destroy();
        });

        req.on('error', (error) => {
          clearTimeout(timeout);
          resolve({ working: false, error: error.message });
        });

        req.setTimeout(TIMEOUT, () => {
          req.destroy();
          clearTimeout(timeout);
          resolve({ working: false, error: 'Socket timeout' });
        });
        
      } catch (error) {
        clearTimeout(timeout);
        resolve({ working: false, error: error.message });
      }
    });
  }

  async testStations() {
    // Test radyolarını import et
    const { TOP_50_RADIOS } = require('./test-radios');
    
    console.log(`🧪 En popüler ${TOP_50_RADIOS.length} radyo istasyonu test ediliyor...`);
    console.log('════════════════════════════════════════════════════════');
    
    const testStations = TOP_50_RADIOS.slice(0, TEST_COUNT);
    
    for (let i = 0; i < testStations.length; i++) {
      const station = testStations[i];
      const result = await this.testRadioURL(station.url, station.name);
      
      const status = result.working ? '✅' : '❌';
      const details = result.working ? 
        `${result.contentType || 'Audio stream'}` : 
        `${result.error}`;
        
      console.log(`${status} ${station.name.padEnd(30)} | ${details}`);
      
      if (result.working) {
        this.workingCount++;
      } else {
        this.failedCount++;
      }
      
      this.results.push({
        name: station.name,
        url: station.url,
        working: result.working,
        details: details
      });
      
      // Kısa bekleme
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log('════════════════════════════════════════════════════════');
    console.log(`📊 TEST SONUÇLARI:`);
    console.log(`✅ Çalışan: ${this.workingCount}/${testStations.length} (${((this.workingCount/testStations.length)*100).toFixed(1)}%)`);
    console.log(`❌ Çalışmayan: ${this.failedCount}/${testStations.length} (${((this.failedCount/testStations.length)*100).toFixed(1)}%)`);
    
    if (this.workingCount >= testStations.length * 0.8) {
      console.log('🎉 BAŞARILI: %80+ radyo çalışıyor!');
    } else if (this.workingCount >= testStations.length * 0.6) {
      console.log('⚠️  ORTA: %60-80 arası radyo çalışıyor');
    } else {
      console.log('🚨 DİKKAT: %60\'dan az radyo çalışıyor');
    }
    
    // En popüler 10 radyonun durumunu göster
    console.log('\\n🏆 EN POPÜLER 10 RADYO DURUMU:');
    const top10 = testStations.slice(0, 10);
    top10.forEach((station, index) => {
      const result = this.results.find(r => r.name === station.name);
      const status = result.working ? '✅' : '❌';
      console.log(`${index + 1}. ${status} ${station.name} (${station.votes || 0} oy)`);
    });
  }
}

// Script'i çalıştır
if (require.main === module) {
  const tester = new QuickRadioTester();
  tester.testStations().catch(console.error);
}

module.exports = QuickRadioTester;
