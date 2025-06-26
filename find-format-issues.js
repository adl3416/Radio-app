// Find and fix unsupported radio formats
// Identifies stations with problematic formats and provides working alternatives

const fs = require('fs');

console.log('🔍 FINDING UNSUPPORTED RADIO FORMATS');
console.log('====================================\n');

const content = fs.readFileSync('./src/constants/radioStations.ts', 'utf8');

// Known problematic formats and their fixes
const formatIssues = {
  // Common problematic URLs
  'problematic_patterns': [
    {
      pattern: /\.m3u8/,
      name: 'HLS Streams (.m3u8)',
      fix: 'Convert to HTTP stream'
    },
    {
      pattern: /chunklist\.m3u8/,
      name: 'HLS Chunklist',
      fix: 'Replace with direct stream'
    },
    {
      pattern: /playlist\.m3u8/,
      name: 'HLS Playlist',
      fix: 'Replace with MP3 stream'
    },
    {
      pattern: /\.aac/,
      name: 'AAC Format',
      fix: 'Convert to MP3'
    },
    {
      pattern: /46\.20\.3\.\d+/,
      name: 'Old server IPs',
      fix: 'Update to new URLs'
    }
  ],
  
  // Specific station fixes
  'station_fixes': {
    'kral-turk-fm': {
      old_url: /https?:\/\/.*kral.*(?:\.m3u8|\.aac|46\.20\.3)/,
      new_url: 'https://dygedge.radyotvonline.com/kraltv/kraltv.smil/chunklist.m3u8',
      new_url_mp3: 'https://playerservices.streamtheworld.com/api/livestream-redirect/KRAL_FM.mp3',
      codec: 'MP3'
    },
    'ahaber-radyo': {
      old_url: /https?:\/\/.*ahaber.*(?:\.m3u8|chunklist)/,
      new_url: 'https://trkvz-radyo.radyotvonline.net/stream',
      codec: 'MP3'
    },
    'metro-fm': {
      old_url: /46\.20\.3\.229/,
      new_url: 'https://17723.live.streamtheworld.com:443/METRO_FM_SC',
      codec: 'MP3'
    },
    'joy-fm': {
      old_url: /46\.20\.3\.204/,
      new_url: 'https://17733.live.streamtheworld.com:443/JOY_FM_SC',
      codec: 'MP3'
    },
    'best-fm': {
      old_url: /46\.20\.3/,
      new_url: 'https://17743.live.streamtheworld.com:443/BEST_FM_SC',
      codec: 'MP3'
    },
    'virgin-radio': {
      old_url: /4playaac\.aac/,
      new_url: 'https://4.seslimedya.com/virginradio/mp3/4play.mp3',
      codec: 'MP3'
    }
  }
};

// Extract all stations and check for issues
function findProblematicStations() {
  const stationsMatch = content.match(/export const RADIO_STATIONS.*?=\s*\[(.*?)\];/s);
  if (!stationsMatch) return [];
  
  const stationsContent = stationsMatch[1];
  const stationBlocks = stationsContent.split('  },').filter(block => block.trim().length > 0);
  
  const problematic = [];
  
  stationBlocks.forEach((block, index) => {
    const nameMatch = block.match(/name:\s*['"`]([^'"`]+)['"`]/);
    const urlMatch = block.match(/url:\s*['"`]([^'"`]+)['"`]/);
    const codecMatch = block.match(/codec:\s*['"`]([^'"`]+)['"`]/);
    
    const station = {
      index: index + 1,
      name: nameMatch ? nameMatch[1] : 'Unknown',
      url: urlMatch ? urlMatch[1] : 'No URL',
      codec: codecMatch ? codecMatch[1] : 'Unknown'
    };
    
    // Check for problematic patterns
    formatIssues.problematic_patterns.forEach(issue => {
      if (issue.pattern.test(station.url)) {
        problematic.push({
          ...station,
          issue: issue.name,
          fix: issue.fix,
          fixable: true
        });
      }
    });
    
    // Check for unsupported codecs
    if (station.codec === 'AAC' || station.codec === 'UNKNOWN') {
      problematic.push({
        ...station,
        issue: `Unsupported codec: ${station.codec}`,
        fix: 'Convert to MP3',
        fixable: true
      });
    }
  });
  
  return problematic;
}

// Generate fix recommendations
function generateFixes(problematicStations) {
  console.log('🔧 RECOMMENDED FIXES:\n');
  
  const fixes = [];
  
  problematicStations.forEach((station, index) => {
    console.log(`${index + 1}. ${station.name}`);
    console.log(`   Issue: ${station.issue}`);
    console.log(`   Current URL: ${station.url.substring(0, 60)}...`);
    console.log(`   Fix: ${station.fix}`);
    
    // Try to find specific fix
    const stationId = station.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const specificFix = Object.entries(formatIssues.station_fixes).find(([key, fix]) => 
      stationId.includes(key.split('-')[0]) || station.url.match(fix.old_url)
    );
    
    if (specificFix) {
      const [, fixData] = specificFix;
      console.log(`   💡 Suggested URL: ${fixData.new_url_mp3 || fixData.new_url}`);
      console.log(`   💡 Codec: ${fixData.codec}`);
      
      fixes.push({
        station: station.name,
        oldUrl: station.url,
        newUrl: fixData.new_url_mp3 || fixData.new_url,
        newCodec: fixData.codec
      });
    } else {
      // Generic fixes
      if (station.url.includes('.m3u8')) {
        const genericFix = station.url.replace('.m3u8', '/stream').replace('master_720', 'stream');
        console.log(`   💡 Suggested URL: ${genericFix}`);
        fixes.push({
          station: station.name,
          oldUrl: station.url,
          newUrl: genericFix,
          newCodec: 'MP3'
        });
      }
    }
    
    console.log('');
  });
  
  return fixes;
}

// Main execution
const problematicStations = findProblematicStations();

console.log(`📊 ANALYSIS RESULTS:`);
console.log(`Total stations analyzed: ${content.split('id:').length - 12}`); // Exclude categories
console.log(`Problematic stations found: ${problematicStations.length}`);
console.log(`Fixable stations: ${problematicStations.filter(s => s.fixable).length}\n`);

if (problematicStations.length > 0) {
  const fixes = generateFixes(problematicStations);
  
  // Save fixes to JSON for automated application
  fs.writeFileSync('./radio-format-fixes.json', JSON.stringify({
    timestamp: new Date().toISOString(),
    problematic_count: problematicStations.length,
    fixes: fixes
  }, null, 2));
  
  console.log('💾 Fixes saved to radio-format-fixes.json');
  console.log('\n🚀 Next step: Apply fixes automatically or manually update URLs');
} else {
  console.log('✅ No problematic formats found! All stations should work.');
}
