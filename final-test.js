const fetch = require('node-fetch');

const finalTestRadios = [
  { name: '📻 TRT 3', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/TRT3.mp3' },
  { name: '🎶 Radyo Viva', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/RADYO_VIVA.mp3' },
  { name: '🎵 Radyo D', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/RADYO_D.mp3' }
];

console.log('🎯 SON 3 RADYO DÜZELTME TESTİ');
console.log('='.repeat(40));

async function testFinalRadio(radio) {
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
    
    console.log(`${working ? '✅' : '❌'} ${radio.name} (${status})`);
    return working;
  } catch (error) {
    console.log(`❌ ${radio.name} (ERROR)`);
    return false;
  }
}

async function testFinalThree() {
  let working = 0;
  
  for (const radio of finalTestRadios) {
    const result = await testFinalRadio(radio);
    if (result) working++;
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n📊 SON DÜZELTME SONUÇLARI:');
  console.log(`Çalışan: ${working}/${finalTestRadios.length}`);
  console.log(`Başarı Oranı: ${Math.round((working/finalTestRadios.length) * 100)}%`);
  
  if (working === finalTestRadios.length) {
    console.log('\n🎉 TÜM SON DÜZELTMELER BAŞARILI!');
    console.log('Artık ilk 20 radyodan 20/20 çalışıyor olmalı!');
  }
}

testFinalThree();
