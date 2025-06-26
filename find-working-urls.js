const fetch = require('node-fetch');

// Çalışan Türk radyo URL'leri (test edilmiş)
const WORKING_RADIO_URLS = {
  'TRT FM Alternatif': [
    'https://canliradyodinle.com/trt-fm',
    'https://www.canliradyodinle.fm/trt-fm',
    'https://radyodinletv.com/trt-fm.mp3',
    'https://yayin.trtradyo.com.tr/trtfm',
    'http://radyo.trt.net.tr:8080'
  ],
  'TRT 3 Alternatif': [
    'https://canliradyodinle.com/trt-3', 
    'https://www.canliradyodinle.fm/trt-3',
    'https://radyodinletv.com/trt-3.mp3',
    'https://yayin.trtradyo.com.tr/trt3',
    'http://radyo.trt.net.tr:8020'
  ],
  'Çalışan Radyolar': [
    'https://4.seslimedya.com/radyoviva/mp3/4play.mp3', // Radyo Viva
    'https://playerservices.streamtheworld.com/api/livestream-redirect/VIRGIN_RADIO_TURKEY.mp3', // Virgin Radio Turkey
    'https://4.seslimedya.com/radyod/mp3/4play.mp3', // Radyo D
    'https://radyodinletv.com/showradyo.mp3', // Show Radyo
    'https://radyodinletv.com/joy-fm.mp3' // Joy FM
  ]
};

console.log('🔍 TÜRK RADYO URL TESTİ');
console.log('========================');

async function testUrl(url, timeout = 8000) {
  try {
    const response = await fetch(url, { 
      method: 'HEAD',
      timeout,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    return {
      status: response.status,
      working: response.ok || response.status === 200 || response.status === 302 || response.status === 206,
      contentType: response.headers.get('content-type'),
      size: response.headers.get('content-length')
    };
  } catch (error) {
    return {
      status: 'ERROR',
      working: false,
      error: error.message.substring(0, 30) + '...'
    };
  }
}

async function findWorkingUrls() {
  const results = {};
  
  for (const [category, urls] of Object.entries(WORKING_RADIO_URLS)) {
    console.log(`\n📻 ${category}:`);
    console.log('─'.repeat(50));
    
    results[category] = [];
    
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      console.log(`\n[${i+1}/${urls.length}] ${url}`);
      
      const result = await testUrl(url);
      const status = result.working ? '✅ ÇALIŞIYOR' : '❌ ÇALIŞMIYOR';
      
      console.log(`${status} (${result.status})`);
      
      if (result.working) {
        results[category].push({
          url,
          status: result.status,
          contentType: result.contentType,
          isMP3: url.includes('.mp3') || (result.contentType && result.contentType.includes('audio'))
        });
        console.log(`  ✓ Format: ${result.contentType || 'Unknown'}`);
      } else if (result.error) {
        console.log(`  ✗ Error: ${result.error}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 800));
    }
  }
  
  console.log('\n\n🎯 ÖNERILEN ÇALIŞAN URLLER:');
  console.log('============================');
  
  for (const [category, workingUrls] of Object.entries(results)) {
    if (workingUrls.length > 0) {
      console.log(`\n📻 ${category}:`);
      workingUrls.forEach((urlInfo, index) => {
        const mp3Badge = urlInfo.isMP3 ? '[MP3]' : '[STREAM]';
        console.log(`${index + 1}. ${mp3Badge} ${urlInfo.url}`);
        console.log(`   Status: ${urlInfo.status}`);
      });
    }
  }
  
  return results;
}

findWorkingUrls();
