const fetch = require('node-fetch');

const updatedRadios = [
  { name: 'A Haber', url: 'https://5.seslimedya.com/ahaber/mp3/4play.mp3' },
  { name: 'TRT FM', url: 'https://5.seslimedya.com/trtfm/mp3/4play.mp3' },
  { name: 'TRT 3', url: 'https://5.seslimedya.com/trt3/mp3/4play.mp3' },
  { name: 'TRT Türkü', url: 'https://5.seslimedya.com/trtturku/mp3/4play.mp3' },
  // Power radyolarını da kontrol ekleyelim
  { name: 'Power Türk', url: 'https://listen.powerapp.com.tr/powerturk/mpeg/icecast.audio' },
  { name: 'Power Pop', url: 'https://listen.powerapp.com.tr/powerpop/mpeg/icecast.audio' }
];

console.log('🔍 GÜNCELLENMIŞ RADYOLAR TESTİ');
console.log('===============================');

async function testRadio(radio) {
  try {
    const response = await fetch(radio.url, { 
      method: 'HEAD',
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const status = response.status;
    const working = response.ok || status === 200 || status === 302 || status === 206;
    const contentType = response.headers.get('content-type');
    
    console.log(`${working ? '✅' : '❌'} ${radio.name}`);
    console.log(`   Status: ${status}`);
    if (contentType) console.log(`   Type: ${contentType}`);
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

async function testAll() {
  let working = 0;
  
  for (const radio of updatedRadios) {
    const result = await testRadio(radio);
    if (result) working++;
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('📊 SONUÇLAR:');
  console.log(`Çalışan: ${working}/${updatedRadios.length}`);
  console.log(`Başarı Oranı: ${Math.round((working/updatedRadios.length) * 100)}%`);
  
  if (working === updatedRadios.length) {
    console.log('\n🎉 TÜM RADYOLAR ÇALIŞIYOR!');
  } else {
    console.log('\n⚠️  Bazı radyolarda hala problem var.');
  }
}

testAll();
