const https = require('https');
const http = require('http');

// Düzeltilen radyoları test et
const testUrls = [
  { name: 'Power Türk', url: 'https://listen.powerapp.com.tr/powerturk/mpeg/icecast.audio' },
  { name: 'A Haber', url: 'https://trkvz-radyo.radyotvonline.com/ahaber/ahaber.stream/playlist.m3u8' },
  { name: 'TRT FM', url: 'https://radio-trtfm.live.trt.com.tr/master_720.m3u8' },
  { name: 'TRT 3', url: 'https://radio-trt3.live.trt.com.tr/master_720.m3u8' },
  { name: 'Radyo Viva', url: 'https://4.seslimedya.com/radyoviva/mp3/4play.mp3' },
  { name: 'Virgin Radio', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/VIRGIN_RADIO_TURKEY.mp3' }
];

function testUrl(url, timeout = 8000) {
  return new Promise((resolve) => {
    const client = url.startsWith('https:') ? https : http;
    const startTime = Date.now();
    
    try {
      const req = client.get(url, {
        timeout: timeout,
        headers: {
          'User-Agent': 'TurkRadioApp/1.0',
          'Accept': 'audio/mpeg, audio/x-mpeg, audio/mp3, audio/aac, application/vnd.apple.mpegurl, */*'
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

async function testFixedRadios() {
  console.log('🔧 Düzeltilen radyoları test ediyorum...\n');
  
  for (let i = 0; i < testUrls.length; i++) {
    const radio = testUrls[i];
    console.log(`Testing ${i + 1}/${testUrls.length}: ${radio.name}...`);
    
    const result = await testUrl(radio.url);
    
    const status = result.success ? '✅' : '❌';
    const error = result.error ? ` - ${result.error}` : '';
    console.log(`${status} ${radio.name} (${result.responseTime}ms)${error}`);
    
    if (result.contentType) {
      console.log(`   Content-Type: ${result.contentType}`);
    }
    console.log('');
    
    // Rate limiting
    if (i < testUrls.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log('✨ Test tamamlandı!');
}

testFixedRadios().catch(console.error);
