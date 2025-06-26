#!/usr/bin/env node

/**
 * Specific TRT Station Finder
 */

const https = require('https');

async function findTRTStations() {
  return new Promise((resolve, reject) => {
    const searchUrl = `https://de1.api.radio-browser.info/json/stations/search?country=turkey&name=trt`;
    
    https.get(searchUrl, { headers: { 'User-Agent': 'TurkRadioApp/1.0' } }, (res) => {
      let data = '';
      
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const stations = JSON.parse(data);
          
          console.log('🔍 TRT Stations Found:');
          stations.forEach((station, index) => {
            console.log(`${index + 1}. ${station.name}`);
            console.log(`   URL: ${station.url}`);
            console.log(`   Votes: ${station.votes}`);
            console.log(`   Codec: ${station.codec}`);
            console.log(`   Bitrate: ${station.bitrate}`);
            console.log('');
          });
          
          resolve(stations);
        } catch (error) {
          reject(error);
        }
      });
      
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function testStream(url) {
  return new Promise((resolve) => {
    const isHttps = url.startsWith('https');
    const requestModule = isHttps ? https : require('http');
    
    const timeout = setTimeout(() => {
      resolve({ working: false, error: 'Timeout' });
    }, 8000);

    try {
      const req = requestModule.get(url, {
        headers: { 'User-Agent': 'TurkRadioApp/1.0' }
      }, (res) => {
        clearTimeout(timeout);
        
        const working = res.statusCode === 200;
        
        resolve({
          working,
          statusCode: res.statusCode,
          contentType: res.headers['content-type'],
          icyName: res.headers['icy-name']
        });
        
        req.destroy();
      });

      req.on('error', (error) => {
        clearTimeout(timeout);
        resolve({ working: false, error: error.message });
      });

    } catch (error) {
      clearTimeout(timeout);
      resolve({ working: false, error: error.message });
    }
  });
}

async function run() {
  try {
    const stations = await findTRTStations();
    
    console.log('🧪 Testing TRT stations...\n');
    
    for (const station of stations.slice(0, 10)) { // Test first 10
      console.log(`Testing: ${station.name}`);
      const result = await testStream(station.url);
      
      if (result.working) {
        console.log(`✅ ÇALIŞIYOR - ${result.contentType}`);
        
        if (station.name.toLowerCase().includes('3') || 
            station.name.toLowerCase().includes('klasik')) {
          console.log(`🎯 POTENTIAL TRT 3 REPLACEMENT: ${station.name}`);
          console.log(`   URL: ${station.url}`);
        }
      } else {
        console.log(`❌ Çalışmıyor - ${result.error}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

run();
