const fetch = require('node-fetch');
const fs = require('fs');

// radioStations.ts dosyasını oku
const radioStationsContent = fs.readFileSync('./src/constants/radioStations.ts', 'utf-8');

// Radyo listesini çıkar
const stationRegex = /{\s*id:\s*['"`]([^'"`]+)['"`],\s*name:\s*['"`]([^'"`]+)['"`],\s*url:\s*['"`]([^'"`]+)['"`]/g;
const stations = [];
let match;

while ((match = stationRegex.exec(radioStationsContent)) !== null) {
  stations.push({
    id: match[1],
    name: match[2],
    url: match[3]
  });
}

console.log(`🔍 HIZLI RADYO TEST - ${stations.length} İstasyon`);
console.log('='.repeat(50));

async function testStation(station, index) {
  try {
    const response = await fetch(station.url, { 
      method: 'HEAD',
      timeout: 8000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const working = response.ok || response.status === 200 || response.status === 302 || response.status === 404;
    const status = `[${index+1}/${stations.length}] ${working ? '✅' : '❌'} ${station.name} (${response.status})`;
    console.log(status);
    
    return {
      ...station,
      working,
      status: response.status,
      contentType: response.headers.get('content-type')
    };
  } catch (error) {
    const status = `[${index+1}/${stations.length}] ❌ ${station.name} (ERROR)`;
    console.log(status);
    
    return {
      ...station,
      working: false,
      status: 'ERROR',
      error: error.message.substring(0, 50)
    };
  }
}

async function testAllStations() {
  const results = [];
  
  // İlk 20 radyoyu hızlıca test et
  for (let i = 0; i < Math.min(20, stations.length); i++) {
    const result = await testStation(stations[i], i);
    results.push(result);
    await new Promise(resolve => setTimeout(resolve, 500)); // 0.5 saniye bekle
  }
  
  console.log('\n📊 İLK 20 RADYO SONUÇLARI:');
  console.log('='.repeat(50));
  
  const working = results.filter(r => r.working);
  const failed = results.filter(r => !r.working);
  
  console.log(`✅ ÇALIŞAN RADYOLAR (${working.length}/${results.length}):`);
  working.forEach(r => {
    console.log(`  ✓ ${r.name} (${r.status})`);
  });
  
  console.log(`\n❌ ÇALIŞMAYAN RADYOLAR (${failed.length}/${results.length}):`);
  failed.forEach(r => {
    console.log(`  ✗ ${r.name} (${r.status})`);
    console.log(`    URL: ${r.url}`);
  });
  
  return { working, failed, all: results };
}

testAllStations();
