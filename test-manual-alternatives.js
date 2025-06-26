#!/usr/bin/env node

/**
 * Manual Radio Replacements
 * Çalışmayan radyolar için manuel olarak test edilmiş alternatifler
 */

const https = require('https');
const http = require('http');

// Manuel olarak bulunan alternatif URL'ler
const ALTERNATIVE_RADIOS = [
  // TRT 3 Alternatifleri
  {
    name: 'TRT 3 - Alternative 1',
    url: 'https://radio.trt.net.tr/master_trt3.m3u8'
  },
  {
    name: 'TRT 3 - Alternative 2', 
    url: 'https://trt.radyotvonline.net/trt3'
  },
  {
    name: 'TRT 3 - Alternative 3',
    url: 'http://radyo.dogannet.tv/trt3'
  },
  
  // A Haber Alternatifleri
  {
    name: 'A Haber - Alternative 1',
    url: 'https://ahaber.com.tr/canliyayin/radyo'
  },
  {
    name: 'A Haber - Alternative 2',
    url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/AHABER.mp3'
  },
  {
    name: 'A Haber - Alternative 3',
    url: 'https://radyoland.com/ahaber/live'
  },
  
  // Bilinen çalışan radyolar (kontrol için)
  {
    name: 'TRT FM (Working)',
    url: 'https://trt.radyotvonline.net/trtfm'
  },
  {
    name: 'Power Türk (Working)',
    url: 'https://listen.powerapp.com.tr/powerturk/mpeg/icecast.audio'
  }
];

async function testUrl(station) {
  console.log(`\n🔍 Testing: ${station.name}`);
  console.log(`📡 URL: ${station.url}`);
  
  return new Promise((resolve) => {
    const isHttps = station.url.startsWith('https');
    const requestModule = isHttps ? https : http;
    
    const timeout = setTimeout(() => {
      console.log(`❌ TIMEOUT`);
      resolve({ working: false, error: 'Timeout' });
    }, 10000);

    try {
      const req = requestModule.get(station.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'audio/*, */*'
        }
      }, (res) => {
        clearTimeout(timeout);
        
        console.log(`📊 Status: ${res.statusCode}`);
        console.log(`📄 Content-Type: ${res.headers['content-type'] || 'N/A'}`);
        
        if (res.headers['icy-name']) {
          console.log(`🎵 Stream Name: ${res.headers['icy-name']}`);
        }
        
        // Check if it's a valid audio stream
        const contentType = res.headers['content-type'] || '';
        const isAudio = contentType.includes('audio') || 
                       contentType.includes('mpeg') ||
                       contentType.includes('mp3') ||
                       contentType.includes('aac') ||
                       res.headers['icy-name'];
        
        const working = res.statusCode === 200 && isAudio;
        
        if (working) {
          console.log(`✅ ÇALIŞIYOR`);
        } else if (res.statusCode === 200) {
          console.log(`⚠️ HTTP 200 ama audio değil`);
        } else {
          console.log(`❌ BAŞARISIZ`);
        }
        
        req.destroy();
        resolve({
          working,
          statusCode: res.statusCode,
          contentType: res.headers['content-type'],
          icyName: res.headers['icy-name']
        });
      });

      req.on('error', (error) => {
        clearTimeout(timeout);
        console.log(`❌ ERROR: ${error.message}`);
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
  console.log('🔍 Manual Radio Alternative Tester');
  console.log('=' + '='.repeat(50));
  
  const results = [];
  
  for (const station of ALTERNATIVE_RADIOS) {
    const result = await testUrl(station);
    results.push({ station: station.name, url: station.url, ...result });
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('📋 SONUÇLAR:');
  console.log('='.repeat(70));
  
  const workingAlternatives = results.filter(r => r.working);
  const failedAlternatives = results.filter(r => !r.working);
  
  console.log(`\n✅ ÇALIŞAN ALTERNATİFLER (${workingAlternatives.length}):`);
  workingAlternatives.forEach(result => {
    console.log(`   ${result.station}`);
    console.log(`   URL: ${result.url}`);
    if (result.icyName) {
      console.log(`   Stream: ${result.icyName}`);
    }
    console.log('');
  });
  
  console.log(`\n❌ ÇALIŞMAYAN ALTERNATİFLER (${failedAlternatives.length}):`);
  failedAlternatives.forEach(result => {
    console.log(`   ${result.station}: ${result.error || result.statusCode}`);
  });
  
  console.log(`\n📊 Toplam: ${workingAlternatives.length}/${results.length} alternatif çalışıyor`);
  
  // Generate replacement code for working alternatives
  if (workingAlternatives.length > 0) {
    console.log('\n📝 REPLACEMENT CODE:');
    console.log('='.repeat(50));
    
    workingAlternatives.forEach(alt => {
      if (alt.station.includes('TRT 3')) {
        console.log('// TRT 3 Replacement:');
        console.log(`// URL: ${alt.url}`);
      } else if (alt.station.includes('A Haber')) {
        console.log('// A Haber Replacement:');
        console.log(`// URL: ${alt.url}`);
      }
    });
  }
}

run().catch(console.error);
