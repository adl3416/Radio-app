const fetch = require('node-fetch');

console.log('🚀 QUICK TEST - Top 10 Radios');
console.log('===============================');

// İlk 10 radyoyu test et
const testUrls = [
  'https://listen.powerapp.com.tr/powerturk/mpeg/icecast.audio',
  'https://listen.powerapp.com.tr/powerpop/mpeg/icecast.audio',
  'https://listen.powerapp.com.tr/powerlove/mpeg/icecast.audio',
  'https://listen.powerapp.com.tr/powerdance/mpeg/icecast.audio',
  'https://radyoland.com/ahaber/live',
  'https://radyoland.com/trtfm/live',
  'https://radyoland.com/trt3/live',
  'https://4.seslimedya.com/radyoviva/mp3/4play.mp3',
  'https://playerservices.streamtheworld.com/api/livestream-redirect/VIRGIN_RADIO_TURKEY.mp3',
  'https://4.seslimedya.com/radyod/mp3/4play.mp3'
];

const names = [
  'Power Türk', 'Power Pop', 'Power Love', 'Power Dance',
  'A Haber', 'TRT FM', 'TRT 3', 'Radyo Viva', 'Virgin Radio', 'Radyo D'
];

async function quickTest() {
  let working = 0;
  
  for (let i = 0; i < testUrls.length; i++) {
    try {
      const response = await fetch(testUrls[i], { 
        method: 'HEAD',
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; RadioTest/1.0)'
        }
      });
      
      const isWorking = response.ok || response.status === 200;
      console.log(`${isWorking ? '✅' : '❌'} ${names[i]}: ${response.status}`);
      if (isWorking) working++;
      
    } catch (error) {
      console.log(`❌ ${names[i]}: ERROR`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`\n📊 RESULTS: ${working}/${testUrls.length} radios working`);
  console.log(`Success Rate: ${Math.round((working/testUrls.length) * 100)}%`);
}

quickTest();
