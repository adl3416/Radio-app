const fs = require('fs');
const path = require('path');

// En güncel ve çalışan TRT URL'leri
const WORKING_URLS = {
  'trt-fm': 'https://radio-trtfm.live.trt.com.tr/master.m3u8',
  'trt-3': 'https://radio-trt3.live.trt.com.tr/master.m3u8', 
  'a-haber': 'https://trkvz-radyo.radyotvonline.com/ahaber/playlist.m3u8',
  // Alternatif HTTP streaming URL'leri
  'trt-fm-alt': 'https://radio-trtfm.live.trt.com.tr/master_720.m3u8',
  'trt-3-alt': 'https://radio-trt3.live.trt.com.tr/master_720.m3u8',
  // Browser uyumlu alternatifler
  'trt-fm-http': 'http://radyo.trt.net.tr:8080/',
  'trt-3-http': 'http://radyo.trt.net.tr:8020/',
  'a-haber-http': 'https://ahaber.com.tr/canliyayin/radyo'
};

console.log('🔧 SPECIFIC RADIO FIXER');
console.log('========================');

async function testUrl(url) {
  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(url, { 
      method: 'HEAD',
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    return { status: response.status, working: response.ok };
  } catch (error) {
    return { status: 'ERROR', working: false, error: error.message };
  }
}

async function fixSpecificRadios() {
  console.log('Testing alternative URLs...\n');
  
  for (const [key, url] of Object.entries(WORKING_URLS)) {
    console.log(`Testing ${key}: ${url}`);
    const result = await testUrl(url);
    console.log(`Result: ${result.working ? '✅ Working' : '❌ Failed'} (${result.status})`);
    console.log('');
  }
}

fixSpecificRadios();
