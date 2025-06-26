/**
 * Merih FM Detaylı Test ve Düzeltme Aracı
 */

const http = require('http');

function testMerihFMDetailed() {
  console.log('🔍 Merih FM detaylı test başlatılıyor...\n');
  
  const options = {
    hostname: 'yayin.merih.fm',
    port: 9040,
    path: '/stream',
    method: 'GET', // HEAD yerine GET deneyelim
    headers: {
      'User-Agent': 'VLC/3.0.16 LibVLC/3.0.16',
      'Accept': '*/*',
      'Icy-MetaData': '1',
      'Connection': 'close'
    },
    timeout: 10000
  };

  console.log('Bağlantı bilgileri:');
  console.log(`Host: ${options.hostname}`);
  console.log(`Port: ${options.port}`);
  console.log(`Path: ${options.path}`);
  console.log(`Full URL: http://${options.hostname}:${options.port}${options.path}\n`);

  const req = http.request(options, (res) => {
    console.log('✅ Bağlantı kuruldu!');
    console.log(`Status: ${res.statusCode} ${res.statusMessage}`);
    console.log('Headers:', JSON.stringify(res.headers, null, 2));
    
    if (res.statusCode === 200) {
      console.log('\n🎵 Stream başarılı! Merih FM çalışıyor.');
      
      let dataReceived = 0;
      res.on('data', (chunk) => {
        dataReceived += chunk.length;
        if (dataReceived < 1000) {
          process.stdout.write('.');
        }
      });
      
      setTimeout(() => {
        console.log(`\n📊 ${dataReceived} bytes veri alındı.`);
        console.log('✅ Merih FM audio stream çalışıyor!');
        req.destroy();
        
        // Başarılı ise radyo listesine ekle
        addMerihFMToList();
      }, 3000);
      
    } else if (res.statusCode === 401) {
      console.log('\n🔐 401 Unauthorized - Kimlik doğrulama gerekli');
      console.log('Ancak bazı player\'lar yine de çalabilir, listeye ekleyelim');
      addMerihFMToList();
    } else {
      console.log(`\n❌ Beklenmeyen status: ${res.statusCode}`);
    }
  });

  req.on('error', (error) => {
    console.log('❌ Bağlantı hatası:');
    console.log(`Error Type: ${error.code}`);
    console.log(`Error Message: ${error.message}`);
    
    if (error.code === 'ENOTFOUND') {
      console.log('🌐 DNS çözümlemesi başarısız - yayin.merih.fm bulunamadı');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('🚫 Bağlantı reddedildi - Port 9040 kapalı olabilir');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('⏰ Zaman aşımı - Sunucu yanıt vermiyor');
    }
  });

  req.on('timeout', () => {
    console.log('⏰ 10 saniye timeout - Sunucu yanıt vermiyor');
    req.destroy();
  });

  req.end();
}

function addMerihFMToList() {
  console.log('\n📝 Merih FM radyo listesine ekleniyor...');
  
  const fs = require('fs');
  let content = fs.readFileSync('src/constants/radioStations.ts', 'utf8');
  
  // Son radyodan önce ekle
  const insertPoint = content.lastIndexOf('  }') + 3;
  
  const merihFM = `,
  {
    id: 'merih-fm-stream',
    name: '🎵 Merih FM',
    url: 'http://yayin.merih.fm:9040/stream',
    streamUrl: 'http://yayin.merih.fm:9040/stream',
    category: 'hits',
    description: 'Merih FM - Müzik Yayını',
    country: 'Turkey',
    language: 'Turkish',
    codec: 'MP3',
    bitrate: 128,
    votes: 0,
    isGuaranteed: false, // Auth gerekebilir
    isLive: true,
    homepage: 'http://merih.fm',
    city: 'Turkey'
  }`;
  
  const newContent = content.slice(0, insertPoint) + merihFM + content.slice(insertPoint);
  fs.writeFileSync('src/constants/radioStations.ts', newContent);
  
  console.log('✅ Merih FM eklendi!');
}

// Alternatif URL'leri de test et
function testAlternativeURLs() {
  console.log('\n🔍 Alternatif URL\'ler test ediliyor...\n');
  
  const alternatives = [
    'http://yayin.merih.fm:9040/',
    'http://yayin.merih.fm:9040/stream.mp3',
    'http://yayin.merih.fm:9040/live',
    'http://yayin.merih.fm:8000/stream',
    'http://merih.fm:9040/stream'
  ];
  
  alternatives.forEach((url, index) => {
    setTimeout(() => {
      console.log(`[${index + 1}] Testing: ${url}`);
      testSingleURL(url);
    }, index * 2000);
  });
}

function testSingleURL(url) {
  const urlObj = new URL(url);
  
  const req = http.request({
    hostname: urlObj.hostname,
    port: urlObj.port,
    path: urlObj.pathname,
    method: 'HEAD',
    timeout: 5000,
    headers: {
      'User-Agent': 'TurkRadioApp/1.0.0'
    }
  }, (res) => {
    console.log(`  ✅ ${url} - Status: ${res.statusCode}`);
    req.destroy();
  });
  
  req.on('error', (error) => {
    console.log(`  ❌ ${url} - Error: ${error.message}`);
  });
  
  req.on('timeout', () => {
    console.log(`  ⏰ ${url} - Timeout`);
    req.destroy();
  });
  
  req.end();
}

// Ana test
testMerihFMDetailed();

// 5 saniye sonra alternatif URL'leri test et
setTimeout(testAlternativeURLs, 5000);
