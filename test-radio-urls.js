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
        contentType: res.headers['content-type']
      });
    });
    req.on('error', (error) => {
      const responseTime = Date.now() - startTime;
      resolve({
        url,
        status: 0,
        working: false,
        responseTime,
        error: error.message
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
        error: 'Timeout'
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
    const result = await testUrl(url);
    results.push(result);
    if (result.working) {
      workingCount++;
    } else {
      // Sadece başarısız olanları terminale yaz
      console.log(`❌ ${url} (${result.error || 'Status: ' + result.status})`);
    }
    // Daha az yük için bekleme süresi artırıldı
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
  console.log(`\nToplam: ${TEST_URLS.length} | Çalışan: ${workingCount} | Başarı: ${Math.round((workingCount / TEST_URLS.length) * 100)}%`);
  // Sadece başarısızlar için rapor
  const failedResults = results.filter(result => !result.working);
  if (failedResults.length > 0) {
    fs.writeFileSync('radio-test-report.json', JSON.stringify(failedResults, null, 2));
    console.log('\n📄 Sadece başarısızlar radio-test-report.json dosyasına kaydedildi');
  } else {
    console.log('\nTüm URL\'ler çalışıyor. Rapor kaydedilmedi.');
  }
  return results;
}

// Test'i çalıştır
testAllUrls().catch(console.error);
