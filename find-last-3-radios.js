/**
 * 3 Çalışan Radyo Bulma Aracı
 * 100 radyoya ulaşmak için son 3 radyoyu bulur
 */

const https = require('https');
const http = require('http');

// Radio Browser API'sinden daha fazla çalışan radyo bul
async function getMoreWorkingRadios() {
  console.log('🔍 Son 3 çalışan radyo aranıyor...\n');
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'de1.api.radio-browser.info',
      path: '/json/stations/bycountrycodeexact/TR?hidebroken=true&order=votes&reverse=true&limit=30&offset=50',
      method: 'GET',
      headers: {
        'User-Agent': 'TurkRadioApp/1.0.0'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const stations = JSON.parse(data);
          resolve(stations);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

function testRadioUrl(url, timeout = 8000) {
  return new Promise((resolve) => {
    try {
      const urlObj = new URL(url);
      const client = urlObj.protocol === 'https:' ? https : http;
      
      const startTime = Date.now();
      
      const req = client.request({
        hostname: urlObj.hostname,
        port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: 'HEAD',
        timeout: timeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'audio/*,*/*',
          'Connection': 'close'
        }
      }, (res) => {
        const responseTime = Date.now() - startTime;
        req.destroy();
        
        const isWorking = res.statusCode >= 200 && res.statusCode < 400;
        
        resolve({
          url,
          status: res.statusCode,
          working: isWorking,
          responseTime,
          contentType: res.headers['content-type']
        });
      });

      req.on('error', (error) => {
        resolve({
          url,
          working: false,
          error: error.message
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          url,
          working: false,
          error: 'Timeout'
        });
      });

      req.end();
    } catch (error) {
      resolve({
        url,
        working: false,
        error: 'Invalid URL'
      });
    }
  });
}

function getCategory(tags) {
  if (!tags) return 'Genel';
  
  const tagLower = tags.toLowerCase();
  
  if (tagLower.includes('news') || tagLower.includes('haber')) return 'news';
  if (tagLower.includes('pop')) return 'pop';
  if (tagLower.includes('rock')) return 'rock';
  if (tagLower.includes('jazz')) return 'jazz';
  if (tagLower.includes('classical') || tagLower.includes('klasik')) return 'classical';
  if (tagLower.includes('folk') || tagLower.includes('halk')) return 'folk';
  if (tagLower.includes('sport') || tagLower.includes('spor')) return 'sports';
  if (tagLower.includes('talk')) return 'talk';
  if (tagLower.includes('dance')) return 'dance';
  if (tagLower.includes('hit')) return 'hits';
  
  return 'hits';
}

async function findLast3Radios() {
  try {
    const stations = await getMoreWorkingRadios();
    console.log(`📻 ${stations.length} yeni Türk radyo istasyonu bulundu\n`);
    
    const workingStations = [];
    let testCount = 0;
    
    for (const station of stations) {
      if (workingStations.length >= 3) break; // Sadece 3 tane bul
      
      testCount++;
      console.log(`[${testCount}] Testing: ${station.name}`);
      console.log(`URL: ${station.url_resolved}`);
      
      const result = await testRadioUrl(station.url_resolved);
      
      if (result.working) {
        console.log(`✅ ÇALIŞIYOR (${result.responseTime}ms)`);
        
        workingStations.push({
          id: station.stationuuid.slice(0, 8) + '-' + station.name.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 15),
          name: station.name,
          url: station.url_resolved,
          category: getCategory(station.tags),
          description: `${station.country || 'Turkey'} • ${station.bitrate || 128}kbps`,
          tags: station.tags,
          votes: station.votes,
          bitrate: station.bitrate,
          codec: station.codec,
          language: station.language,
          country: station.country,
          homepage: station.homepage,
          favicon: station.favicon
        });
      } else {
        console.log(`❌ ÇALIŞMIYOR - ${result.error}`);
      }
      
      console.log('');
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    console.log(`\n🎯 Son durum:`);
    console.log(`Test edilen: ${testCount}`);
    console.log(`Çalışan bulundu: ${workingStations.length}/3`);
    
    if (workingStations.length > 0) {
      console.log('\n✅ Bulunan çalışan radyolar:');
      workingStations.forEach((station, index) => {
        console.log(`${index + 1}. ${station.name} (${station.category})`);
      });
      
      generateRadioCode(workingStations);
    }
    
    return workingStations;
    
  } catch (error) {
    console.error('Hata:', error);
  }
}

function generateRadioCode(stations) {
  console.log('\n📝 TypeScript kodu:');
  console.log('='.repeat(50));
  
  stations.forEach((station, index) => {
    console.log(`  {
    id: '${station.id}',
    name: '🎵 ${station.name}',
    url: '${station.url}',
    streamUrl: '${station.url}',
    category: '${station.category}',
    description: '${station.description}',
    country: 'Turkey',
    language: 'Turkish',
    codec: '${station.codec || 'MP3'}',
    bitrate: ${station.bitrate || 128},
    votes: ${station.votes || 0},
    isGuaranteed: true,
    isLive: true${station.homepage ? `,
    homepage: '${station.homepage}'` : ''}
  }${index < stations.length - 1 ? ',' : ''}`);
  });
}

findLast3Radios();
