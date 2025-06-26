// Check for missing properties in radio stations

const fs = require('fs');

const content = fs.readFileSync('./src/constants/radioStations.ts', 'utf8');

// Find all radio station blocks
const stationsMatch = content.match(/export const RADIO_STATIONS.*?=\s*\[(.*?)\];/s);
if (!stationsMatch) {
  console.log('❌ Could not find RADIO_STATIONS array');
  process.exit(1);
}

const stationsContent = stationsMatch[1];
const stationBlocks = stationsContent.split('  },').filter(block => block.trim().length > 0);

console.log(`🔍 Checking ${stationBlocks.length} stations for missing properties...\n`);

let needsIsGuaranteed = 0;
let needsIsLive = 0;
let needsHomepage = 0;

stationBlocks.forEach((block, index) => {
  const hasIsGuaranteed = block.includes('isGuaranteed:');
  const hasIsLive = block.includes('isLive:');
  const hasHomepage = block.includes('homepage:');
  
  if (!hasIsGuaranteed) {
    needsIsGuaranteed++;
  }
  
  if (!hasIsLive) {
    needsIsLive++;
  }
  
  if (!hasHomepage) {
    needsHomepage++;
  }
  
  if (!hasIsGuaranteed || !hasIsLive) {
    const nameMatch = block.match(/name:\s*['"`]([^'"`]+)['"`]/);
    const name = nameMatch ? nameMatch[1] : `Station ${index + 1}`;
    console.log(`⚠️  ${name} missing: ${!hasIsGuaranteed ? 'isGuaranteed ' : ''}${!hasIsLive ? 'isLive ' : ''}`);
  }
});

console.log(`\n📊 Summary:`);
console.log(`Missing isGuaranteed: ${needsIsGuaranteed}`);
console.log(`Missing isLive: ${needsIsLive}`);
console.log(`Missing homepage: ${needsHomepage}`);

if (needsIsGuaranteed === 0 && needsIsLive === 0) {
  console.log(`\n✅ All stations have required properties!`);
} else {
  console.log(`\n🔧 Need to add missing properties to ${Math.max(needsIsGuaranteed, needsIsLive)} stations`);
}
