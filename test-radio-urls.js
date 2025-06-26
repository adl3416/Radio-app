/**
 * Radyo URL Test Aracı
 * Bu araç radyo URL'lerinin çalışıp çalışmadığını test eder
 */

const https = require('https');
const http = require('http');
const fs = require('fs');

// Test edilecek URL'ler
const TEST_URLS = [
  'https://14983.live.streamtheworld.com/POWER_XL_AAC_SC',
  'https://14983.live.streamtheworld.com/POWER_AAC_SC',
  'https://14983.live.streamtheworld.com/POWERFM_AAC_SC',
  'https://14983.live.streamtheworld.com/POWERTURK_AAC_SC',
  'https://moondigitalmaster.radyotvonline.net/kanal7.mp3',
  'https://moondigitalmaster.radyotvonline.net/radyod.mp3',
  'https://moondigitalmaster.radyotvonline.net/powerfm.mp3',
  'https://radyo.dogannet.tv/cnnturk',
  'https://radyo.dogannet.tv/ntvradyo',
  'https://radyo.dogannet.tv/radyoeks',
];

function testUrl(url, timeout = 10000) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const startTime = Date.now();
    
    const req = client.request({
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: 'HEAD',
      timeout: timeout,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*',
        'Connection': 'close'
      }
    }, (res) => {
      const responseTime = Date.now() - startTime;
      req.destroy();
      
      resolve({
        url,
        status: res.statusCode,
        working: res.statusCode >= 200 && res.statusCode < 400,
        responseTime,
        contentType: res.headers['content-type'],
        server: res.headers['server'],
        headers: res.headers
      });
    });

    req.on('error', (error) => {
      const responseTime = Date.now() - startTime;
      resolve({
        url,
        status: 0,
        working: false,
        responseTime,
        error: error.message,
        errorCode: error.code
      });
    });

    req.on('timeout', () => {
      const responseTime = Date.now() - startTime;
      req.destroy();
      resolve({
        url,
        status: 0,
        working: false,
        responseTime,
        error: 'Timeout',
        errorCode: 'TIMEOUT'
      });
    });

    req.end();
  });
}

async function testAllUrls() {
  console.log('🔍 Radyo URL Test Başlatılıyor...\n');
  
  const results = [];
  let workingCount = 0;
  
  for (const url of TEST_URLS) {
    console.log(`Testing: ${url}`);
    const result = await testUrl(url);
    results.push(result);
    
    if (result.working) {
      workingCount++;
      console.log(`✅ ÇALIŞIYOR (${result.responseTime}ms) - Status: ${result.status}`);
      if (result.contentType) {
        console.log(`   Content-Type: ${result.contentType}`);
      }
    } else {
      console.log(`❌ ÇALIŞMIYOR - ${result.error || 'Status: ' + result.status}`);
    }
    console.log('');
    
    // Rate limiting için kısa bekleme
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n📊 Test Sonuçları:');
  console.log(`Toplam URL: ${TEST_URLS.length}`);
  console.log(`Çalışan: ${workingCount}`);
  console.log(`Çalışmayan: ${TEST_URLS.length - workingCount}`);
  console.log(`Başarı Oranı: ${Math.round((workingCount / TEST_URLS.length) * 100)}%`);
  
  // Sonuçları dosyaya kaydet
  const reportData = {
    testDate: new Date().toISOString(),
    totalUrls: TEST_URLS.length,
    workingUrls: workingCount,
    failedUrls: TEST_URLS.length - workingCount,
    successRate: Math.round((workingCount / TEST_URLS.length) * 100),
    results: results
  };
  
  fs.writeFileSync('radio-test-report.json', JSON.stringify(reportData, null, 2));
  console.log('\n📄 Detaylı rapor: radio-test-report.json dosyasına kaydedildi');
  
  return results;
}

// Test'i çalıştır
testAllUrls().catch(console.error);
