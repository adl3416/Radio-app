/**
 * Merih FM Test Aracı
 */

const http = require('http');

function testMerihFM() {
  const url = 'http://yayin.merih.fm:9040/stream';
  console.log('🔍 Merih FM test ediliyor...');
  console.log('URL:', url);
  
  const startTime = Date.now();
  
  const req = http.request({
    hostname: 'yayin.merih.fm',
    port: 9040,
    path: '/stream',
    method: 'HEAD',
    timeout: 10000,
    headers: {
      'User-Agent': 'TurkRadioApp/1.0.0',
      'Accept': 'audio/*,*/*'
    }
  }, (res) => {
    const responseTime = Date.now() - startTime;
    
    console.log('✅ Merih FM ÇALIŞIYOR!');
    console.log('Status:', res.statusCode);
    console.log('Response Time:', responseTime + 'ms');
    console.log('Content-Type:', res.headers['content-type']);
    console.log('Server:', res.headers['server']);
    console.log('Headers:', JSON.stringify(res.headers, null, 2));
    
    req.destroy();
  });

  req.on('error', (error) => {
    console.log('❌ Merih FM ÇALIŞMIYOR');
    console.log('Error:', error.message);
  });

  req.on('timeout', () => {
    console.log('⏰ Merih FM - Zaman aşımı (10s)');
    req.destroy();
  });

  req.end();
}

testMerihFM();
