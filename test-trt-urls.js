const fetch = require('node-fetch');

// TRT için bilinen çalışan URL'ler
const TRT_URLS = {
  'TRT FM': [
    'https://radio-trtfm.live.trt.com.tr/master_720.m3u8',
    'https://radyotvonline.net/trtfm',
    'https://canliradyodinle.com/trtfm/stream',
    'http://nmzico.streamakaci.com/trtfm.mp3',
    'https://radyocuonline.net/trtfm'
  ],
  'TRT 3': [
    'https://radio-trt3.live.trt.com.tr/master_720.m3u8',
    'https://radyotvonline.net/trt3',
    'https://canliradyodinle.com/trt3/stream',
    'http://nmzico.streamakaci.com/trt3.mp3',
    'https://radyocuonline.net/trt3'
  ],
  'TRT Türkü': [
    'https://radio-trtturku.live.trt.com.tr/master_720.m3u8',
    'https://radyotvonline.net/trtturku',
    'http://nmzico.streamakaci.com/trtturku.mp3'
  ]
};

console.log('🔍 TRT RADYO URL TESTİ');
console.log('======================');

async function testUrl(url, timeout = 10000) {
  try {
    const response = await fetch(url, { 
      method: 'HEAD',
      timeout,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    return {
      status: response.status,
      working: response.ok || response.status === 200 || response.status === 302,
      contentType: response.headers.get('content-type')
    };
  } catch (error) {
    return {
      status: 'ERROR',
      working: false,
      error: error.message.substring(0, 50)
    };
  }
}

async function testAllTrtUrls() {
  const workingUrls = {};
  
  for (const [radioName, urls] of Object.entries(TRT_URLS)) {
    console.log(`\n📻 ${radioName}:`);
    console.log('─'.repeat(40));
    
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      console.log(`\n[${i+1}/${urls.length}] Testing: ${url}`);
      
      const result = await testUrl(url);
      const status = result.working ? '✅ ÇALIŞIYOR' : '❌ ÇALIŞMIYOR';
      
      console.log(`${status} - Status: ${result.status}`);
      if (result.contentType) {
        console.log(`Content-Type: ${result.contentType}`);
      }
      if (result.error) {
        console.log(`Error: ${result.error}`);
      }
      
      if (result.working) {
        if (!workingUrls[radioName]) workingUrls[radioName] = [];
        workingUrls[radioName].push({
          url,
          status: result.status,
          contentType: result.contentType
        });
      }
      
      // Kısa bekleme
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log('\n\n🎯 ÇALIŞAN URLLER:');
  console.log('==================');
  
  for (const [radioName, urls] of Object.entries(workingUrls)) {
    console.log(`\n📻 ${radioName}:`);
    urls.forEach((urlInfo, index) => {
      console.log(`${index + 1}. ${urlInfo.url}`);
      console.log(`   Status: ${urlInfo.status}, Type: ${urlInfo.contentType || 'N/A'}`);
    });
  }
  
  return workingUrls;
}

testAllTrtUrls();
