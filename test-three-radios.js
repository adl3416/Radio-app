const fetch = require('node-fetch');

const radios = [
  { name: 'A Haber', url: 'https://bozok.radyotvonline.com/ahaber128' },
  { name: 'TRT FM', url: 'https://nmzico.streamakaci.com/trtfm.mp3' },
  { name: 'TRT 3', url: 'https://nmzico.streamakaci.com/trt3.mp3' }
];

console.log('🔍 Testing Fixed Radios');
console.log('========================');

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
    const working = response.ok || status === 200 || status === 302;
    
    console.log(`${working ? '✅' : '❌'} ${radio.name}: ${status} - ${radio.url}`);
    return working;
  } catch (error) {
    console.log(`❌ ${radio.name}: ERROR - ${error.message}`);
    return false;
  }
}

async function testAll() {
  let working = 0;
  
  for (const radio of radios) {
    const result = await testRadio(radio);
    if (result) working++;
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between tests
  }
  
  console.log('\n📊 Results:');
  console.log(`Working: ${working}/${radios.length}`);
  console.log(`Success Rate: ${Math.round((working/radios.length) * 100)}%`);
}

testAll();
