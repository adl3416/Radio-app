// Test recently added radio stations
// Check if the latest fixes broke the radio stations

const fs = require('fs');

console.log('🔍 TESTING RECENTLY FIXED RADIO STATIONS');
console.log('========================================\n');

// Read current radio stations
const content = fs.readFileSync('./src/constants/radioStations.ts', 'utf8');

// Extract stations and test URLs
async function testRadioUrl(url, name) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      mode: 'no-cors'
    });
    
    clearTimeout(timeoutId);
    return { success: true, status: 'OK' };
    
  } catch (error) {
    return { 
      success: false, 
      error: error.name === 'AbortError' ? 'Timeout' : error.message.substring(0, 50)
    };
  }
}

// Extract station data
function extractStations() {
  const stationsMatch = content.match(/export const RADIO_STATIONS.*?=\s*\[(.*?)\];/s);
  if (!stationsMatch) return [];
  
  const stationsContent = stationsMatch[1];
  const stationBlocks = stationsContent.split('  },').filter(block => block.trim().length > 0);
  
  const stations = [];
  
  stationBlocks.forEach((block, index) => {
    const nameMatch = block.match(/name:\s*['"`]([^'"`]+)['"`]/);
    const urlMatch = block.match(/url:\s*['"`]([^'"`]+)['"`]/);
    const codecMatch = block.match(/codec:\s*['"`]([^'"`]+)['"`]/);
    
    if (nameMatch && urlMatch) {
      stations.push({
        index: index + 1,
        name: nameMatch[1],
        url: urlMatch[1],
        codec: codecMatch ? codecMatch[1] : 'Unknown'
      });
    }
  });
  
  return stations;
}

// Test specific problematic stations
async function testRecentlyFixedStations() {
  const stations = extractStations();
  
  console.log(`Found ${stations.length} total stations\n`);
  
  // Focus on recently fixed stations that might be broken
  const suspiciousPatterns = [
    'radyotvonline.net',
    'streamtheworld.com',
    '/stream',
    'embed2',
    'moondigital'
  ];
  
  const recentlyFixed = stations.filter(station => 
    suspiciousPatterns.some(pattern => station.url.includes(pattern))
  );
  
  console.log(`Testing ${recentlyFixed.length} recently fixed stations...\n`);
  
  const results = { working: [], broken: [] };
  
  for (const station of recentlyFixed.slice(0, 20)) { // Test first 20
    console.log(`Testing: ${station.name.substring(0, 30)}...`);
    
    const result = await testRadioUrl(station.url, station.name);
    
    if (result.success) {
      console.log(`   ✅ Working`);
      results.working.push(station);
    } else {
      console.log(`   ❌ Broken: ${result.error}`);
      results.broken.push({ ...station, error: result.error });
    }
    
    // Small delay
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.log(`\n📊 RESULTS:`);
  console.log(`Working: ${results.working.length}`);
  console.log(`Broken: ${results.broken.length}`);
  console.log(`Success Rate: ${Math.round((results.working.length / (results.working.length + results.broken.length)) * 100)}%`);
  
  if (results.broken.length > 0) {
    console.log(`\n❌ BROKEN STATIONS:`);
    results.broken.forEach((station, index) => {
      console.log(`${index + 1}. ${station.name}`);
      console.log(`   URL: ${station.url}`);
      console.log(`   Error: ${station.error}`);
      console.log('');
    });
    
    console.log(`💡 RECOMMENDATIONS:`);
    console.log(`1. Revert to original working URLs`);
    console.log(`2. Use simpler HTTP streams instead of complex redirects`);
    console.log(`3. Test URLs individually before applying mass fixes`);
  }
  
  return results;
}

testRecentlyFixedStations().catch(console.error);
