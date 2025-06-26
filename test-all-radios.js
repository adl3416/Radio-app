// Comprehensive Radio Station Test
// Tests all 101 radio stations for functionality

const fs = require('fs');

console.log('🔍 COMPREHENSIVE RADIO STATION TEST');
console.log('====================================');
console.log('Testing all 101 radio stations...\n');

// Read the radio stations file
const content = fs.readFileSync('./src/constants/radioStations.ts', 'utf8');

// Extract all radio stations
const stationsMatch = content.match(/export const RADIO_STATIONS.*?=\s*\[(.*?)\];/s);
if (!stationsMatch) {
  console.log('❌ Could not find RADIO_STATIONS array');
  process.exit(1);
}

// Parse station data (simplified extraction)
const stationsContent = stationsMatch[1];
const stationBlocks = stationsContent.split('  },').filter(block => block.trim().length > 0);

console.log(`Found ${stationBlocks.length} station blocks\n`);

// Test each URL
async function testRadioUrl(url, name, codec = 'MP3') {
  if (!url) {
    return { success: false, error: 'No URL provided' };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
    
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      mode: 'no-cors'
    });
    
    clearTimeout(timeoutId);
    return { success: true, status: response.status || 'OK' };
  } catch (error) {
    // For no-cors mode, we can't get the actual response
    // So we'll do a more lenient test
    try {
      const controller2 = new AbortController();
      const timeoutId2 = setTimeout(() => controller2.abort(), 5000);
      
      await fetch(url, {
        method: 'GET',
        signal: controller2.signal,
        mode: 'no-cors'
      });
      
      clearTimeout(timeoutId2);
      return { success: true, status: 'Accessible' };
    } catch (error2) {
      return { 
        success: false, 
        error: error2.name === 'AbortError' ? 'Timeout' : error2.message.substring(0, 50)
      };
    }
  }
}

// Extract station info from a block
function extractStationInfo(block) {
  const idMatch = block.match(/id:\s*['"`]([^'"`]+)['"`]/);
  const nameMatch = block.match(/name:\s*['"`]([^'"`]+)['"`]/);
  const urlMatch = block.match(/url:\s*['"`]([^'"`]+)['"`]/);
  const codecMatch = block.match(/codec:\s*['"`]([^'"`]+)['"`]/);
  
  return {
    id: idMatch ? idMatch[1] : 'unknown',
    name: nameMatch ? nameMatch[1] : 'Unknown Station',
    url: urlMatch ? urlMatch[1] : null,
    codec: codecMatch ? codecMatch[1] : 'MP3'
  };
}

async function testAllStations() {
  console.log('🚀 Starting comprehensive test...\n');
  
  const results = {
    working: [],
    failing: [],
    suspicious: []
  };
  
  let tested = 0;
  
  for (const block of stationBlocks) {
    const station = extractStationInfo(block);
    tested++;
    
    console.log(`[${tested}/${stationBlocks.length}] Testing: ${station.name.substring(0, 30)}...`);
    
    if (!station.url) {
      console.log('   ❌ No URL found');
      results.failing.push({ ...station, error: 'No URL' });
      continue;
    }
    
    const testResult = await testRadioUrl(station.url, station.name, station.codec);
    
    if (testResult.success) {
      console.log(`   ✅ Working (${testResult.status})`);
      results.working.push(station);
    } else {
      console.log(`   ❌ Failed: ${testResult.error}`);
      
      // Check if it's a format issue
      if (station.url.includes('.m3u8')) {
        results.suspicious.push({ ...station, error: 'HLS format (.m3u8)', fixable: true });
      } else if (station.url.includes('.aac')) {
        results.suspicious.push({ ...station, error: 'AAC format', fixable: true });
      } else if (testResult.error.includes('Timeout')) {
        results.suspicious.push({ ...station, error: 'Timeout (slow server)', fixable: false });
      } else {
        results.failing.push({ ...station, error: testResult.error });
      }
    }
    
    // Small delay to avoid overwhelming servers
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.log('\n📊 TEST RESULTS:');
  console.log('================');
  console.log(`✅ Working: ${results.working.length}`);
  console.log(`❌ Failing: ${results.failing.length}`);
  console.log(`⚠️ Suspicious: ${results.suspicious.length}`);
  console.log(`📊 Total Tested: ${tested}`);
  console.log(`📈 Success Rate: ${Math.round((results.working.length / tested) * 100)}%`);
  
  if (results.failing.length > 0) {
    console.log('\n❌ FAILING STATIONS:');
    results.failing.forEach((station, index) => {
      console.log(`${index + 1}. ${station.name} - ${station.error}`);
      console.log(`   URL: ${station.url}`);
    });
  }
  
  if (results.suspicious.length > 0) {
    console.log('\n⚠️ SUSPICIOUS/FIXABLE STATIONS:');
    results.suspicious.forEach((station, index) => {
      console.log(`${index + 1}. ${station.name} - ${station.error}`);
      console.log(`   URL: ${station.url}`);
      if (station.fixable) {
        console.log(`   💡 Can be fixed automatically`);
      }
    });
  }
  
  console.log('\n🔧 RECOMMENDATIONS:');
  console.log('===================');
  
  if (results.suspicious.length > 0) {
    console.log('1. Fix HLS (.m3u8) formats by converting to HTTP streams');
    console.log('2. Convert AAC formats to MP3 alternatives');
    console.log('3. Update timeout handling for slow servers');
  }
  
  if (results.failing.length > 0) {
    console.log('4. Replace completely broken URLs with working alternatives');
    console.log('5. Remove stations that are permanently offline');
  }
  
  console.log('\n✅ Next step: Run fix-broken-radios.js to automatically fix issues');
  
  // Save results to file
  const reportData = {
    testDate: new Date().toISOString(),
    totalTested: tested,
    results: results,
    successRate: Math.round((results.working.length / tested) * 100)
  };
  
  fs.writeFileSync('./radio-test-results.json', JSON.stringify(reportData, null, 2));
  console.log('\n💾 Results saved to radio-test-results.json');
}

testAllStations().catch(console.error);
