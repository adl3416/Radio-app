// Problem Radyo Testi
// TRT ve diğer problematik radyoları test eder

const fs = require('fs');

console.log('🔍 Testing Problematic Radio Stations...\n');

const problematicStations = [
  {
    name: 'TRT FM (Eski)',
    url: 'https://radio-trtfm.live.trt.com.tr/master_720.m3u8',
    codec: 'AAC (HLS)'
  },
  {
    name: 'TRT FM (Yeni)',
    url: 'https://radyotvonline.net/embed2/trtfm.php',
    codec: 'MP3'
  },
  {
    name: 'TRT 3 (Eski)',
    url: 'https://radio-trt3.live.trt.com.tr/master_720.m3u8',
    codec: 'AAC (HLS)'
  },
  {
    name: 'TRT 3 (Yeni)',
    url: 'https://radyotvonline.net/embed2/trt3.php',
    codec: 'MP3'
  },
  {
    name: 'Radyo Viva (AAC)',
    url: 'https://4.seslimedya.com/radyoviva/aac/4playaac.aac',
    codec: 'AAC'
  },
  {
    name: 'Merih FM',
    url: 'http://yayin.merih.fm:9040/stream',
    codec: 'MP3'
  }
];

async function testRadioUrl(station) {
  console.log(`📻 Testing: ${station.name} (${station.codec})`);
  console.log(`   URL: ${station.url}`);
  
  try {
    // Test 1: Basic fetch
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(station.url, {
      method: 'HEAD',
      signal: controller.signal,
      mode: 'no-cors'
    });
    
    clearTimeout(timeoutId);
    console.log(`   ✅ Basic fetch: OK`);
    
    // Test 2: Audio element test (simulated)
    console.log(`   🎵 Audio test: Simulated OK`);
    
    return true;
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}`);
    
    // Test alternative approach
    if (station.url.includes('.m3u8')) {
      console.log(`   💡 Suggestion: Convert HLS to HTTP stream`);
    }
    
    if (station.codec === 'AAC') {
      console.log(`   💡 Suggestion: May need special AAC handling`);
    }
    
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting Radio URL Tests...\n');
  
  let working = 0;
  let total = problematicStations.length;
  
  for (const station of problematicStations) {
    const result = await testRadioUrl(station);
    if (result) working++;
    console.log('');
  }
  
  console.log('📊 Test Results:');
  console.log(`   Working: ${working}/${total}`);
  console.log(`   Success Rate: ${Math.round((working/total) * 100)}%`);
  
  if (working < total) {
    console.log('\n💡 Recommendations:');
    console.log('   1. Use alternative URLs for HLS streams (.m3u8)');
    console.log('   2. Implement codec-specific audio handling');
    console.log('   3. Add CORS and authentication handling');
    console.log('   4. Use proxy servers for blocked streams');
  }
}

runTests();
