#!/usr/bin/env node

/**
 * Test Updated Radio Stations
 * Güncellenen radyo istasyonlarını test et
 */

const https = require('https');
const http = require('http');

const UPDATED_STATIONS = [
  {
    name: 'TRT FM (Updated)',
    url: 'https://trt.radyotvonline.net/trtfm',
    expected: 'TRT FM'
  },
  {
    name: 'TRT 3 (Updated)',
    url: 'https://radio.trt.net.tr/trt3',
    expected: 'TRT 3'
  },
  {
    name: 'A Haber (Updated)',
    url: 'https://stream.radyotvonline.com/ahaber',
    expected: 'A Haber'
  },
  {
    name: 'Power Türk (Control)',
    url: 'https://listen.powerapp.com.tr/powerturk/mpeg/icecast.audio',
    expected: 'Power'
  }
];

async function testStation(station) {
  console.log(`\n🔍 Testing: ${station.name}`);
  console.log(`📡 URL: ${station.url}`);
  
  return new Promise((resolve) => {
    const isHttps = station.url.startsWith('https');
    const requestModule = isHttps ? https : http;
    
    const timeout = setTimeout(() => {
      console.log(`❌ TIMEOUT (10s)`);
      resolve({ working: false, error: 'Timeout' });
    }, 10000);

    try {
      const req = requestModule.get(station.url, {
        headers: {
          'User-Agent': 'TurkRadioApp/1.0',
          'Accept': 'audio/*',
          'Icy-MetaData': '1'
        }
      }, (res) => {
        clearTimeout(timeout);
        
        console.log(`📊 Status: ${res.statusCode}`);
        console.log(`📄 Content-Type: ${res.headers['content-type'] || 'N/A'}`);
        
        if (res.headers['icy-name']) {
          console.log(`🎵 Stream Name: ${res.headers['icy-name']}`);
        }
        
        if (res.headers['icy-description']) {
          console.log(`📝 Description: ${res.headers['icy-description']}`);
        }
        
        if (res.headers['icy-genre']) {
          console.log(`🎼 Genre: ${res.headers['icy-genre']}`);
        }

        // Check if it's a valid audio stream
        const contentType = res.headers['content-type'] || '';
        const isAudio = contentType.includes('audio') || 
                       contentType.includes('mpeg') ||
                       contentType.includes('mp3') ||
                       contentType.includes('aac') ||
                       res.headers['icy-name'];
        
        const working = res.statusCode === 200 && isAudio;
        
        // Check content correctness
        const metadata = [
          res.headers['icy-name'],
          res.headers['icy-description'],
          res.headers['icy-genre']
        ].filter(Boolean).join(' ').toLowerCase();
        
        const contentCorrect = metadata.includes(station.expected.toLowerCase()) || 
                              station.url.includes(station.expected.toLowerCase().replace(' ', ''));
        
        if (working) {
          if (contentCorrect) {
            console.log(`✅ ÇALIŞIYOR ve DOĞRU İÇERİK`);
          } else {
            console.log(`⚠️ ÇALIŞIYOR ama İÇERİK ŞÜPHELİ`);
            console.log(`   Beklenen: ${station.expected}`);
            console.log(`   Bulunan: ${metadata || 'Metadata yok'}`);
          }
        } else if (res.statusCode === 200) {
          console.log(`⚠️ HTTP 200 ama audio formatı değil`);
        } else {
          console.log(`❌ BAŞARISIZ (${res.statusCode})`);
        }
        
        // Test data reception
        let dataReceived = false;
        res.on('data', (chunk) => {
          if (!dataReceived) {
            dataReceived = true;
            console.log(`📊 Data Size: ${chunk.length} bytes`);
          }
        });
        
        setTimeout(() => {
          req.destroy();
          resolve({
            working,
            contentCorrect,
            statusCode: res.statusCode,
            contentType: res.headers['content-type'],
            icyName: res.headers['icy-name'],
            metadata,
            dataReceived
          });
        }, 3000);
      });

      req.on('error', (error) => {
        clearTimeout(timeout);
        console.log(`❌ CONNECTION ERROR: ${error.message}`);
        resolve({ working: false, error: error.message });
      });

    } catch (error) {
      clearTimeout(timeout);
      console.log(`❌ EXCEPTION: ${error.message}`);
      resolve({ working: false, error: error.message });
    }
  });
}

async function run() {
  console.log('🎧 Updated Radio Stations Test');
  console.log('=' + '='.repeat(50));
  
  const results = [];
  
  for (const station of UPDATED_STATIONS) {
    const result = await testStation(station);
    results.push({ station: station.name, ...result });
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('📋 TEST SONUÇLARI:');
  console.log('='.repeat(70));
  
  const working = results.filter(r => r.working);
  const failed = results.filter(r => !r.working);
  const contentIssues = results.filter(r => r.working && !r.contentCorrect);
  
  console.log(`\n✅ ÇALIŞAN RADYOLAR (${working.length}/${results.length}):`);
  working.forEach(result => {
    const contentStatus = result.contentCorrect ? '🎯 DOĞRU' : '⚠️ ŞÜPHELİ';
    console.log(`   ${result.station}: ${contentStatus}`);
    if (result.icyName) {
      console.log(`      Stream: ${result.icyName}`);
    }
  });
  
  if (failed.length > 0) {
    console.log(`\n❌ ÇALIŞMAYAN RADYOLAR (${failed.length}):`);
    failed.forEach(result => {
      console.log(`   ${result.station}: ${result.error || result.statusCode}`);
    });
  }
  
  if (contentIssues.length > 0) {
    console.log(`\n⚠️ İÇERİK SORUNLARI (${contentIssues.length}):`);
    contentIssues.forEach(result => {
      console.log(`   ${result.station}: Yanlış yayın olabilir`);
      console.log(`      Metadata: ${result.metadata || 'Yok'}`);
    });
  }
  
  console.log(`\n📊 ÖZET:`);
  console.log(`   Toplam Test: ${results.length}`);
  console.log(`   Çalışan: ${working.length}`);
  console.log(`   Çalışmayan: ${failed.length}`);
  console.log(`   İçerik Sorunu: ${contentIssues.length}`);
  
  const score = ((working.length - contentIssues.length) / results.length * 100).toFixed(1);
  console.log(`   Kalite Skoru: ${score}% (çalışan + doğru içerik)`);
}

run().catch(console.error);
