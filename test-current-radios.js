const https = require('https');
const http = require('http');

// RadioStations dosyasını import edelim
const fs = require('fs');
const path = require('path');

// TypeScript dosyasını okuyup parse edelim (basit yöntem)
function parseRadioStations() {
  const content = fs.readFileSync(path.join(__dirname, 'src/constants/radioStations.ts'), 'utf8');
  
  // RADIO_STATIONS array'ini bul
  const match = content.match(/export const RADIO_STATIONS: RadioStation\[\] = \[([\s\S]*?)\];/);
  if (!match) {
    console.error('RADIO_STATIONS array bulunamadı');
    return [];
  }
  
  const arrayContent = match[1];
  
  // Her bir radio station objesini parse et
  const stations = [];
  const objectMatches = arrayContent.match(/\{[^}]*\}/g);
  
  if (objectMatches) {
    objectMatches.forEach((objStr, index) => {
      try {
        // id ve url'yi çıkar
        const idMatch = objStr.match(/id:\s*['"`]([^'"`]+)['"`]/);
        const nameMatch = objStr.match(/name:\s*['"`]([^'"`]+)['"`]/);
        const urlMatch = objStr.match(/url:\s*['"`]([^'"`]+)['"`]/);
        
        if (idMatch && nameMatch && urlMatch) {
          stations.push({
            id: idMatch[1],
            name: nameMatch[1],
            url: urlMatch[1]
          });
        }
      } catch (e) {
        console.log(`Station ${index + 1} parse edilemedi:`, e.message);
      }
    });
  }
  
  return stations;
}

function testUrl(url, timeout = 10000) {
  return new Promise((resolve) => {
    const client = url.startsWith('https:') ? https : http;
    const startTime = Date.now();
    
    try {
      const req = client.get(url, {
        timeout: timeout,
        headers: {
          'User-Agent': 'RadioApp/1.0',
          'Accept': 'audio/mpeg, audio/x-mpeg, audio/mp3, audio/aac, audio/x-aac, application/vnd.apple.mpegurl, */*'
        }
      }, (res) => {
        const responseTime = Date.now() - startTime;
        
        // Status kod kontrolü
        if (res.statusCode >= 200 && res.statusCode < 400) {
          // Content-Type kontrolü
          const contentType = res.headers['content-type'] || '';
          const isAudio = contentType.includes('audio/') || 
                         contentType.includes('application/vnd.apple.mpegurl') ||
                         contentType.includes('application/x-mpegURL');
          
          if (isAudio || res.statusCode === 200) {
            resolve({
              success: true,
              status: res.statusCode,
              contentType: contentType,
              responseTime: responseTime,
              message: 'OK'
            });
          } else {
            resolve({
              success: false,
              status: res.statusCode,
              contentType: contentType,
              responseTime: responseTime,
              message: `Ses formatı değil: ${contentType}`
            });
          }
        } else {
          resolve({
            success: false,
            status: res.statusCode,
            contentType: res.headers['content-type'] || '',
            responseTime: responseTime,
            message: `HTTP ${res.statusCode}`
          });
        }
        
        req.destroy();
      });
      
      req.on('error', (err) => {
        resolve({
          success: false,
          status: 0,
          contentType: '',
          responseTime: Date.now() - startTime,
          message: err.message
        });
      });
      
      req.on('timeout', () => {
        req.destroy();
        resolve({
          success: false,
          status: 0,
          contentType: '',
          responseTime: Date.now() - startTime,
          message: 'Timeout'
        });
      });
      
    } catch (error) {
      resolve({
        success: false,
        status: 0,
        contentType: '',
        responseTime: Date.now() - startTime,
        message: error.message
      });
    }
  });
}

async function testAllRadios() {
  console.log('🔍 Mevcut radyo istasyonları test ediliyor...\n');
  
  const stations = parseRadioStations();
  console.log(`📊 Toplam ${stations.length} radyo istasyonu bulundu\n`);
  
  if (stations.length === 0) {
    console.log('❌ Hiç radyo istasyonu bulunamadı!');
    return;
  }
  
  const results = [];
  const working = [];
  const broken = [];
  
  // İlk 20 radyoyu test et (hızlı kontrol için)
  const testStations = stations.slice(0, 20);
  console.log(`🚀 İlk ${testStations.length} radyo test ediliyor...\n`);
  
  for (let i = 0; i < testStations.length; i++) {
    const station = testStations[i];
    console.log(`Testing ${i + 1}/${testStations.length}: ${station.name}...`);
    
    const result = await testUrl(station.url);
    
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${station.name} - ${result.message} (${result.responseTime}ms)`);
    
    results.push({
      ...station,
      ...result
    });
    
    if (result.success) {
      working.push(station);
    } else {
      broken.push({
        ...station,
        error: result.message
      });
    }
    
    // Rate limiting
    if (i < testStations.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📈 TEST SONUÇLARI');
  console.log('='.repeat(60));
  console.log(`✅ Çalışan: ${working.length}`);
  console.log(`❌ Çalışmayan: ${broken.length}`);
  console.log(`📊 Toplam test edilen: ${results.length}`);
  console.log(`🎯 Başarı oranı: ${((working.length / results.length) * 100).toFixed(1)}%`);
  
  if (broken.length > 0) {
    console.log('\n🚨 ÇALIŞMAYAN RADYOLAR:');
    console.log('-'.repeat(40));
    broken.forEach((station, index) => {
      console.log(`${index + 1}. ${station.name} (${station.id})`);
      console.log(`   URL: ${station.url}`);
      console.log(`   Hata: ${station.error}`);
      console.log('');
    });
  }
  
  // Sonuçları dosyaya kaydet
  const reportData = {
    testDate: new Date().toISOString(),
    totalTested: results.length,
    working: working.length,
    broken: broken.length,
    successRate: ((working.length / results.length) * 100).toFixed(1) + '%',
    brokenStations: broken,
    workingStations: working.map(s => ({id: s.id, name: s.name, url: s.url}))
  };
  
  fs.writeFileSync('test-results-current.json', JSON.stringify(reportData, null, 2));
  console.log('\n💾 Test sonuçları test-results-current.json dosyasına kaydedildi');
  
  return reportData;
}

testAllRadios().catch(console.error);
