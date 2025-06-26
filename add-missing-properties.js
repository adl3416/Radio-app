// Add missing properties to all radio stations

const fs = require('fs');

console.log('🔧 Adding missing properties to all radio stations...\n');

// Read current content
let content = fs.readFileSync('./src/constants/radioStations.ts', 'utf8');

// Create backup
const backupFile = `./src/constants/radioStations.backup.properties.${Date.now()}.ts`;
fs.writeFileSync(backupFile, content);
console.log(`💾 Backup created: ${backupFile}\n`);

let fixCount = 0;

// Add isGuaranteed and isLive properties to stations that don't have them
content = content.replace(
  /(\s+)(votes: \d+)(,?\s*})/g,
  (match, indent, votes, ending) => {
    // Check if already has the properties
    const beforeMatch = content.substring(0, content.indexOf(match));
    const stationBlock = beforeMatch.split('  {').pop();
    
    const hasIsGuaranteed = stationBlock.includes('isGuaranteed:');
    const hasIsLive = stationBlock.includes('isLive:');
    
    if (!hasIsGuaranteed || !hasIsLive) {
      fixCount++;
      let additions = [];
      
      if (!hasIsGuaranteed) {
        additions.push(`${indent}isGuaranteed: true`);
      }
      
      if (!hasIsLive) {
        additions.push(`${indent}isLive: true`);
      }
      
      return `${votes},\n${additions.join(',\n')}${ending}`;
    }
    
    return match;
  }
);

// Also fix stations that end with city but no votes
content = content.replace(
  /(\s+)(city: '[^']*')(,?\s*})/g,
  (match, indent, city, ending) => {
    // Check if already has the properties
    const beforeMatch = content.substring(0, content.indexOf(match));
    const stationBlock = beforeMatch.split('  {').pop();
    
    const hasIsGuaranteed = stationBlock.includes('isGuaranteed:');
    const hasIsLive = stationBlock.includes('isLive:');
    const hasVotes = stationBlock.includes('votes:');
    
    if (!hasIsGuaranteed || !hasIsLive) {
      fixCount++;
      let additions = [];
      
      if (!hasVotes) {
        additions.push(`${indent}votes: 0`);
      }
      
      if (!hasIsGuaranteed) {
        additions.push(`${indent}isGuaranteed: true`);
      }
      
      if (!hasIsLive) {
        additions.push(`${indent}isLive: true`);
      }
      
      return `${city},\n${additions.join(',\n')}${ending}`;
    }
    
    return match;
  }
);

// Fix stations that end with homepage
content = content.replace(
  /(\s+)(homepage: '[^']*')(,?\s*})/g,
  (match, indent, homepage, ending) => {
    // Check if already has the properties
    const beforeMatch = content.substring(0, content.indexOf(match));
    const stationBlock = beforeMatch.split('  {').pop();
    
    const hasIsGuaranteed = stationBlock.includes('isGuaranteed:');
    const hasIsLive = stationBlock.includes('isLive:');
    
    if (!hasIsGuaranteed || !hasIsLive) {
      fixCount++;
      let additions = [];
      
      if (!hasIsGuaranteed) {
        additions.push(`${indent}isGuaranteed: true`);
      }
      
      if (!hasIsLive) {
        additions.push(`${indent}isLive: true`);
      }
      
      return `${homepage},\n${additions.join(',\n')}${ending}`;
    }
    
    return match;
  }
);

// Save the updated content
fs.writeFileSync('./src/constants/radioStations.ts', content);

console.log(`✅ Added missing properties to ${fixCount} stations`);
console.log('📝 Updated radioStations.ts file');

// Verify the changes
const updatedContent = fs.readFileSync('./src/constants/radioStations.ts', 'utf8');
const isGuaranteedCount = (updatedContent.match(/isGuaranteed: true/g) || []).length;
const isLiveCount = (updatedContent.match(/isLive: true/g) || []).length;

console.log(`\n📊 Verification:`);
console.log(`isGuaranteed properties: ${isGuaranteedCount}`);
console.log(`isLive properties: ${isLiveCount}`);

if (isGuaranteedCount >= 100 && isLiveCount >= 100) {
  console.log('\n✅ All properties successfully added!');
} else {
  console.log('\n⚠️ Some properties may still be missing. Check manually.');
}

console.log('\n🚀 Next: Run test-all-radios.js to verify all stations work');
