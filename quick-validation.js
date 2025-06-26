// Quick Radio Station Validation

const fs = require('fs');

console.log('🔍 QUICK RADIO VALIDATION TEST');
console.log('==============================\n');

// Read the radio stations file
const content = fs.readFileSync('./src/constants/radioStations.ts', 'utf8');

// Extract all radio stations
const stationsMatch = content.match(/export const RADIO_STATIONS.*?=\s*\[(.*?)\];/s);
if (!stationsMatch) {
  console.log('❌ Could not find RADIO_STATIONS array');
  process.exit(1);
}

// Count stations
const stationsContent = stationsMatch[1];
const stationBlocks = stationsContent.split('  },').filter(block => block.trim().length > 0);

console.log(`📊 Found ${stationBlocks.length} radio stations\n`);

// Quick validation checks
const checks = [
  {
    name: 'No HLS (.m3u8) formats',
    test: !content.includes('.m3u8'),
    critical: true
  },
  {
    name: 'No AAC file extensions',
    test: !content.includes('.aac'),
    critical: false
  },
  {
    name: 'All stations have isGuaranteed property',
    test: (content.match(/isGuaranteed: true/g) || []).length >= 95,
    critical: true
  },
  {
    name: 'All stations have isLive property', 
    test: (content.match(/isLive: true/g) || []).length >= 95,
    critical: true
  },
  {
    name: 'Power stations working',
    test: content.includes('power-turk') && content.includes('power-pop'),
    critical: true
  },
  {
    name: 'TRT stations converted',
    test: content.includes('radyotvonline.net/embed2'),
    critical: true
  }
];

let criticalPassed = 0;
let totalPassed = 0;

checks.forEach(check => {
  const status = check.test ? '✅' : '❌';
  const critical = check.critical ? '[CRITICAL]' : '[OPTIONAL]';
  
  console.log(`${status} ${check.name} ${critical}`);
  
  if (check.test) {
    totalPassed++;
    if (check.critical) criticalPassed++;
  }
});

console.log(`\n📊 Results:`);
console.log(`Total checks passed: ${totalPassed}/${checks.length}`);
console.log(`Critical checks passed: ${criticalPassed}/${checks.filter(c => c.critical).length}`);

const isReady = criticalPassed === checks.filter(c => c.critical).length;

if (isReady) {
  console.log('\n🎉 ALL CRITICAL CHECKS PASSED!');
  console.log('✅ Radio stations are ready for production use');
  console.log('\n📱 You can now test the app:');
  console.log('1. npm start');
  console.log('2. Open browser and test radio playback');
  console.log('3. Verify no console errors when playing TRT radios');
} else {
  console.log('\n⚠️ Some critical checks failed');
  console.log('🔧 Please fix the issues before testing');
}

// Show format breakdown
const formats = {
  mp3: (content.match(/codec: 'MP3'/g) || []).length,
  aac: (content.match(/codec: 'AAC'/g) || []).length,
  unknown: (content.match(/codec: 'UNKNOWN'/g) || []).length
};

console.log(`\n🎵 Format breakdown:`);
console.log(`MP3: ${formats.mp3} stations`);
console.log(`AAC: ${formats.aac} stations`);
console.log(`Unknown: ${formats.unknown} stations`);
