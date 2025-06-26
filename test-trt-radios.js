// TRT Radyo URL Test
// Bu script TRT radyolarının alternatif URL'lerini test eder

const trtStations = [
  {
    name: 'TRT FM',
    originalUrl: 'https://radio-trtfm.live.trt.com.tr/master_720.m3u8',
    alternatives: [
      'https://radio-trtfm.live.trt.com.tr/master.m3u8',
      'https://radio-trtfm.live.trt.com.tr/master_480.m3u8',
      'http://securestreams2.autopo.st:1025/stream',
      'https://trtcanlitv-lh.akamaihd.net/i/TRTFM_1@181845/master.m3u8',
      'https://streams.trtradio.com.tr/trtfm',
      'https://radio-trtfm.live.trt.com.tr/playlist.m3u8'
    ]
  },
  {
    name: 'TRT 3',
    originalUrl: 'https://radio-trt3.live.trt.com.tr/master_720.m3u8',
    alternatives: [
      'https://radio-trt3.live.trt.com.tr/master.m3u8',
      'https://radio-trt3.live.trt.com.tr/master_480.m3u8',
      'http://securestreams2.autopo.st:1026/stream',
      'https://trtcanlitv-lh.akamaihd.net/i/TRT3_1@181846/master.m3u8',
      'https://streams.trtradio.com.tr/trt3',
      'https://radio-trt3.live.trt.com.tr/playlist.m3u8'
    ]
  }
];

async function testUrl(url) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      mode: 'no-cors'
    });
    
    clearTimeout(timeoutId);
    console.log(`✅ ${url} - WORKING`);
    return true;
  } catch (error) {
    console.log(`❌ ${url} - FAILED: ${error.message}`);
    return false;
  }
}

async function testTRTStations() {
  console.log('🔍 Testing TRT Radio Stations...\n');
  
  for (const station of trtStations) {
    console.log(`📻 ${station.name}`);
    console.log(`Original: ${station.originalUrl}`);
    
    // Test original
    const originalWorks = await testUrl(station.originalUrl);
    
    if (!originalWorks) {
      console.log('Testing alternatives...');
      let found = false;
      
      for (const alt of station.alternatives) {
        const works = await testUrl(alt);
        if (works && !found) {
          console.log(`🎯 RECOMMENDED: ${alt}`);
          found = true;
        }
      }
      
      if (!found) {
        console.log('⚠️ No working alternative found');
      }
    }
    
    console.log('');
  }
}

// Tarayıcı environment'ında çalıştır
if (typeof window !== 'undefined') {
  testTRTStations();
} else {
  console.log('Bu script tarayıcıda çalışmalı');
}
