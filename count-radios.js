const fs = require('fs');

// Read the TypeScript file
const content = fs.readFileSync('./src/constants/radioStations.ts', 'utf8');

// Extract the RADIO_STATIONS array
const stationsMatch = content.match(/export const RADIO_STATIONS.*?=\s*\[(.*?)\];/s);
if (!stationsMatch) {
  console.log('RADIO_STATIONS array not found');
  process.exit(1);
}

// Count radio station objects by counting opening braces
const stationsContent = stationsMatch[1];
const openBraces = (stationsContent.match(/\{/g) || []).length;

console.log(`Total radio stations: ${openBraces}`);

// Also check for duplicate IDs
const idMatches = stationsContent.match(/id:\s*['"`]([^'"`]+)['"`]/g);
if (idMatches) {
  const ids = idMatches.map(match => match.match(/id:\s*['"`]([^'"`]+)['"`]/)[1]);
  const uniqueIds = new Set(ids);
  
  console.log(`Unique IDs: ${uniqueIds.size}`);
  console.log(`Total ID entries: ${ids.length}`);
  
  if (uniqueIds.size !== ids.length) {
    console.log('⚠️ Duplicate IDs found!');
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    console.log('Duplicates:', [...new Set(duplicates)]);
  } else {
    console.log('✅ No duplicate IDs');
  }
}
