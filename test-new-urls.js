const https = require('https');
const http = require('http');
const { VERIFIED_WORKING_URLS, SAMPLE_TESTS } = require('./verified-urls.js');

function testUrl(url, timeout = 8000) {
  return new Promise((resolve) => {
    const client = url.startsWith('https:') ? https : http;
    const startTime = Date.now();
    
    try {
      const req = client.get(url, {
        timeout: timeout,
        headers: {
          'User-Agent': 'TurkRadioApp/1.0',
          'Accept': '*/*'
        }
      }, (res) => {
        const responseTime = Date.now() - startTime;
        const contentType = res.headers['content-type'] || '';
        
        if (res.statusCode >= 200 && res.statusCode < 400) {
          resolve({
            success: true,
            status: res.statusCode,
            contentType: contentType,
            responseTime: responseTime
          });
        } else {
          resolve({
            success: false,
            status: res.statusCode,
            contentType: contentType,
            responseTime: responseTime,
            error: `HTTP ${res.statusCode}`
          });
        }
        
        req.destroy();
      });
      
      req.on('error', (err) => {
        resolve({
          success: false,
          status: 0,
          responseTime: Date.now() - startTime,
          error: err.message
        });
      });
      
      req.on('timeout', () => {
        req.destroy();
        resolve({
          success: false,
          status: 0,
          responseTime: Date.now() - startTime,
          error: 'Timeout'
        });
      });
      
    } catch (error) {
      resolve({
        success: false,
        status: 0,
        responseTime: Date.now() - startTime,
        error: error.message
      });
    }
  });
}

async function testNewUrls() {
  console.log('🆕 Yeni URL\'leri test ediyorum...\n');
  
  const working = [];
  const broken = [];
  
  for (let i = 0; i < SAMPLE_TESTS.length; i++) {
    const test = SAMPLE_TESTS[i];
    const url = VERIFIED_WORKING_URLS[test.id];
    
    console.log(`Testing ${i + 1}/${SAMPLE_TESTS.length}: ${test.name}`);
    console.log(`URL: ${url}`);
    
    const result = await testUrl(url);
    
    const status = result.success ? '✅' : '❌';
    const error = result.error ? ` - ${result.error}` : '';
    console.log(`${status} ${test.name} (${result.responseTime}ms)${error}`);
    
    if (result.contentType) {
      console.log(`   Content-Type: ${result.contentType}`);
    }
    
    if (result.success) {
      working.push({ id: test.id, name: test.name, url: url });
    } else {
      broken.push({ id: test.id, name: test.name, url: url, error: result.error });
    }
    
    console.log('');
    
    // Rate limiting
    if (i < SAMPLE_TESTS.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  }
  
  console.log('📊 SONUÇLAR:');
  console.log(`✅ Çalışan: ${working.length}`);
  console.log(`❌ Çalışmayan: ${broken.length}`);
  console.log(`🎯 Başarı oranı: ${((working.length / SAMPLE_TESTS.length) * 100).toFixed(1)}%`);
  
  if (working.length > 0) {
    console.log('\n✅ ÇALIŞAN URL\'LER:');
    working.forEach(w => {
      console.log(`  ${w.name}: ${w.url}`);
    });
  }
  
  if (broken.length > 0) {
    console.log('\n❌ ÇALIŞMAYAN URL\'LER:');
    broken.forEach(b => {
      console.log(`  ${b.name}: ${b.error}`);
    });
  }
  
  return { working, broken };
}

testNewUrls().catch(console.error);
