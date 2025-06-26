#!/usr/bin/env node

/**
 * Quick Radio Test - Test current problematic stations
 */

const https = require('https');
const http = require('http');

const PROBLEMATIC_STATIONS = [
  {
    name: 'TRT FM (NEW)',
    url: 'https://trt.radyotvonline.net/trtfm'
  },
  {
    name: 'TRT FM (OLD)',
    url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/TRT_FM.mp3'
  },
  {
    name: 'TRT 3 (OLD)',
    url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/TRT3.mp3'
  },
  {
    name: 'A Haber (OLD)',
    url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/AHABER_RADYO.mp3'
  },
  {
    name: 'Power Türk',
    url: 'https://listen.powerapp.com.tr/powerturk/mpeg/icecast.audio'
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
          'Accept': 'audio/*'
        }
      }, (res) => {
        clearTimeout(timeout);
        
        console.log(`📊 Status: ${res.statusCode}`);
        console.log(`📄 Content-Type: ${res.headers['content-type']}`);
        
        if (res.headers['icy-name']) {
          console.log(`🎵 Stream Name: ${res.headers['icy-name']}`);
        }
        
        const working = res.statusCode === 200 && 
                       (res.headers['content-type']?.includes('audio') || 
                        res.headers['icy-name']);
        
        if (working) {
          console.log(`✅ ÇALIŞIYOR`);
          
          // Listen for a bit to verify stream
          let dataReceived = false;
          res.on('data', (chunk) => {
            if (!dataReceived) {
              dataReceived = true;
              console.log(`📊 Data received: ${chunk.length} bytes`);
            }
          });
          
          setTimeout(() => {
            req.destroy();
            resolve({
              working: true,
              statusCode: res.statusCode,
              contentType: res.headers['content-type'],
              icyName: res.headers['icy-name'],
              dataReceived
            });
          }, 2000);
          
        } else {
          console.log(`❌ GEÇERSİZ FORMAT`);
          req.destroy();
          resolve({
            working: false,
            statusCode: res.statusCode,
            contentType: res.headers['content-type']
          });
        }
      });

      req.on('error', (error) => {
        clearTimeout(timeout);
        console.log(`❌ BAĞLANTI HATASI: ${error.message}`);
        resolve({ working: false, error: error.message });
      });

    } catch (error) {
      clearTimeout(timeout);
      console.log(`❌ HATA: ${error.message}`);
      resolve({ working: false, error: error.message });
    }
  });
}

async function run() {
  console.log('🎧 Quick Radio Station Test');
  console.log('=' + '='.repeat(50));
  
  const results = [];
  
  for (const station of PROBLEMATIC_STATIONS) {
    const result = await testStation(station);
    results.push({ station: station.name, ...result });
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📋 SONUÇLAR:');
  console.log('='.repeat(60));
  
  results.forEach(result => {
    const status = result.working ? '✅ ÇALIŞIYOR' : '❌ ÇALIŞMIYOR';
    console.log(`${result.station}: ${status}`);
    if (result.icyName) {
      console.log(`   📻 Stream: ${result.icyName}`);
    }
    if (result.error) {
      console.log(`   ⚠️ Hata: ${result.error}`);
    }
  });
  
  const workingCount = results.filter(r => r.working).length;
  console.log(`\n📊 Özet: ${workingCount}/${results.length} radyo çalışıyor`);
}

run().catch(console.error);
