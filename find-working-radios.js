/**
 * Çalışan Türk Radyo Bulma Aracı
 * Radio Browser API'sinden çalışan radyoları bulur ve test eder
 */

const https = require('https');
const fs = require('fs');

// Radio Browser API'sinden çalışan Türk radyolarını çek
async function getWorkingTurkishRadios() {
  console.log('🔍 Radio Browser API\'sinden çalışan Türk radyoları alınıyor...\n');
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'de1.api.radio-browser.info',
      path: '/json/stations/bycountrycodeexact/TR?hidebroken=true&order=votes&reverse=true&limit=50',
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

// URL test fonksiyonu
function testRadioUrl(url, timeout = 8000) {
  return new Promise((resolve) => {
    try {
      const urlObj = new URL(url);
      const client = https;
      
      const startTime = Date.now();
      
      const req = client.request({
        hostname: urlObj.hostname,
        port: urlObj.port || 443,
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
          contentType: res.headers['content-type'],
          server: res.headers['server']
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
    } catch (error) {
      resolve({
        url,
        status: 0,
        working: false,
        error: 'Invalid URL: ' + error.message
      });
    }
  });
}

async function findWorkingRadios() {
  try {
    const stations = await getWorkingTurkishRadios();
    console.log(`📻 ${stations.length} Türk radyo istasyonu bulundu\n`);
    
    const workingStations = [];
    let testCount = 0;
    
    for (const station of stations) {
      testCount++;
      console.log(`[${testCount}/${stations.length}] Testing: ${station.name}`);
      console.log(`URL: ${station.url_resolved}`);
      
      const result = await testRadioUrl(station.url_resolved);
      
      if (result.working) {
        console.log(`✅ ÇALIŞIYOR (${result.responseTime}ms)`);
        
        workingStations.push({
          id: station.stationuuid,
          name: station.name,
          url: station.url_resolved,
          category: getCategory(station.tags),
          description: `${station.country || 'Turkey'} • ${station.bitrate || 'Unknown'}kbps`,
          tags: station.tags,
          votes: station.votes,
          bitrate: station.bitrate,
          codec: station.codec,
          language: station.language,
          country: station.country,
          state: station.state,
          homepage: station.homepage,
          favicon: station.favicon,
          lastcheckok: station.lastcheckok,
          testResult: result
        });
      } else {
        console.log(`❌ ÇALIŞMIYOR - ${result.error || 'Status: ' + result.status}`);
      }
      
      console.log('');
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // İlk 20 çalışan radyoyu bulduğumuzda dur
      if (workingStations.length >= 40) {
        console.log('🎯 40 çalışan radyo bulundu, test durduruluyor...\n');
        break;
      }
    }
    
    console.log(`\n📊 Sonuçlar:`);
    console.log(`Test edilen: ${testCount}`);
    console.log(`Çalışan: ${workingStations.length}`);
    console.log(`Başarı oranı: ${Math.round((workingStations.length / testCount) * 100)}%\n`);
    
    // TypeScript formatında dosya oluştur
    generateRadioStationsFile(workingStations);
    
    return workingStations;
    
  } catch (error) {
    console.error('Hata:', error);
  }
}

function getCategory(tags) {
  if (!tags) return 'Genel';
  
  const tagLower = tags.toLowerCase();
  
  if (tagLower.includes('news') || tagLower.includes('haber')) return 'Haber';
  if (tagLower.includes('pop')) return 'Pop';
  if (tagLower.includes('rock')) return 'Rock';
  if (tagLower.includes('jazz')) return 'Jazz';
  if (tagLower.includes('classical') || tagLower.includes('klasik')) return 'Klasik';
  if (tagLower.includes('folk') || tagLower.includes('halk')) return 'Türk Halk Müziği';
  if (tagLower.includes('sport') || tagLower.includes('spor')) return 'Spor';
  if (tagLower.includes('talk')) return 'Sohbet';
  if (tagLower.includes('dance')) return 'Dans';
  if (tagLower.includes('hit')) return 'Hit Müzikler';
  
  return 'Müzik';
}

function generateRadioStationsFile(workingStations) {
  const timestamp = new Date().toISOString().split('T')[0];
  
  let content = `// Çalışan Türk Radyo İstasyonları
// Oluşturulma tarihi: ${timestamp}
// Toplam istasyon: ${workingStations.length}
// Kaynak: Radio Browser API + URL Test

export interface RadioStation {
  id: string;
  name: string;
  url: string;
  category: string;
  description?: string;
  country?: string;
  language?: string;
  codec?: string;
  bitrate?: number;
  tags?: string[];
  favicon?: string;
  homepage?: string;
  streamUrl?: string;
  imageUrl?: string;
  isLive?: boolean;
  genre?: string;
  city?: string;
  website?: string;
  votes?: number;
  isGuaranteed?: boolean;
}

export const WORKING_RADIO_STATIONS: RadioStation[] = [
`;

  workingStations.forEach((station, index) => {
    content += `  {
    id: "${station.id}",
    name: "${station.name.replace(/"/g, '\\"')}",
    url: "${station.url}",
    category: "${station.category}",
    description: "${station.description}",
    country: "${station.country || 'Turkey'}",
    language: "${station.language || 'turkish'}",
    codec: "${station.codec || 'MP3'}",
    bitrate: ${station.bitrate || 128},
    votes: ${station.votes || 0},
    isGuaranteed: true, // API test ile doğrulandı
    homepage: "${station.homepage || ''}",
    favicon: "${station.favicon || ''}",
    isLive: true
  }${index < workingStations.length - 1 ? ',' : ''}
`;
  });

  content += `];

export default WORKING_RADIO_STATIONS;
`;

  fs.writeFileSync('working-radio-stations.ts', content);
  console.log('✅ working-radio-stations.ts dosyası oluşturuldu');
  
  // JSON dosyası da oluştur
  fs.writeFileSync('working-radio-stations.json', JSON.stringify(workingStations, null, 2));
  console.log('✅ working-radio-stations.json dosyası oluşturuldu');
}

// Programı çalıştır
findWorkingRadios();
