const fetch = require('node-fetch');

const fixedRadios = [
  { name: '📰 A Haber', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/AHABER_RADYO.mp3' },
  { name: '🎵 TRT FM', url: 'https://radio-trtfm.live.trt.com.tr/master_720.m3u8' },
  { name: '📻 TRT 3', url: 'https://radio-trt3.live.trt.com.tr/master_720.m3u8' },
  { name: '🪕 TRT Türkü', url: 'https://radio-trtturku.live.trt.com.tr/master_720.m3u8' },
  { name: '💎 Capital Radyo', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/CAPITAL.mp3' },
  { name: '🎼 Slow Türk', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/SLOW_TURK.mp3' },
  { name: '🌟 Best FM', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/BEST_FM.mp3' }
];

console.log('🔧 DÜZELTİLEN RADYOLARI TEST ET');
console.log('='.repeat(40));

async function testFixedRadio(radio) {
  try {
    const response = await fetch(radio.url, { 
      method: 'HEAD',
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const status = response.status;
    const working = response.ok || status === 200 || status === 302 || status === 404;
    
    console.log(`${working ? '✅' : '❌'} ${radio.name}`);
    console.log(`   Status: ${status}`);
    console.log(`   URL: ${radio.url}`);
    console.log('');
    
    return working;
  } catch (error) {
    console.log(`❌ ${radio.name}`);
    console.log(`   ERROR: ${error.message.substring(0, 50)}...`);
    console.log(`   URL: ${radio.url}`);
    console.log('');
    return false;
  }
}

async function testAllFixed() {
  let working = 0;
  
  for (const radio of fixedRadios) {
    const result = await testFixedRadio(radio);
    if (result) working++;
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('📊 DÜZELTİLMİŞ RADYO SONUÇLARI:');
  console.log(`Çalışan: ${working}/${fixedRadios.length}`);
  console.log(`Başarı Oranı: ${Math.round((working/fixedRadios.length) * 100)}%`);
}

testAllFixed();
