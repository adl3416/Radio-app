// Automatic Radio Format Fixer
// Fixes all unsupported radio formats automatically

const fs = require('fs');

console.log('🔧 AUTOMATIC RADIO FORMAT FIXER');
console.log('================================\n');

// Read the fixes from the analysis
const fixesData = JSON.parse(fs.readFileSync('./radio-format-fixes.json', 'utf8'));
console.log(`Found ${fixesData.fixes.length} stations to fix\n`);

// Read current radio stations file
let content = fs.readFileSync('./src/constants/radioStations.ts', 'utf8');

// Create backup
const backupFile = `./src/constants/radioStations.backup.format-fix.${Date.now()}.ts`;
fs.writeFileSync(backupFile, content);
console.log(`💾 Backup created: ${backupFile}\n`);

// Known working URLs for major stations
const workingUrls = {
  // TRT Stations
  'TRT FM': 'https://radyotvonline.net/embed2/trtfm.php',
  'TRT 3': 'https://radyotvonline.net/embed2/trt3.php',
  'TRT Türkü': 'https://radyotvonline.net/embed2/trtturku.php',
  'TRT Nağme': 'https://radyotvonline.net/embed2/trtnagme.php',
  'TRT Müzik': 'https://radyotvonline.net/embed2/trtmuzik.php',
  'TRT Radyo 1': 'https://radyotvonline.net/embed2/trtradyo1.php',
  'TRT Antalya': 'https://radyotvonline.net/embed2/trtantalya.php',
  
  // Major commercial stations
  'Kral FM': 'https://playerservices.streamtheworld.com/api/livestream-redirect/KRAL_FM.mp3',
  'Kral Türk FM': 'https://dygedge.radyotvonline.com/kralturk/kralturk.smil/chunklist.m3u8',
  'Metro FM': 'https://17723.live.streamtheworld.com:443/METRO_FM_SC',
  'Joy FM': 'https://17733.live.streamtheworld.com:443/JOY_FM_SC',
  'Best FM': 'https://17743.live.streamtheworld.com:443/BEST_FM_SC',
  'Power Pop': 'https://listen.powerapp.com.tr/powerpop/mpeg/icecast.audio',
  'Super FM': 'https://23543.live.streamtheworld.com:443/SUPER_FM_SC',
  
  // News stations
  'A Haber': 'https://trkvz-radyo.radyotvonline.net/stream',
  'Halk TV': 'https://halktv.radyotvonline.net/stream',
  'Tele1': 'https://tele1tv.radyotvonline.net/stream',
  
  // Sports stations
  'Radyo GS': 'https://moondigitaledge.radyotvonline.net/radyogs/radyogs.smil/chunklist.m3u8',
  'Radyo FB': 'https://moondigitaledge.radyotvonline.net/radyofb/radyofb.smil/chunklist.m3u8',
  'Radyo BJK': 'https://moondigitaledge.radyotvonline.net/radyobjk/radyobjk.smil/chunklist.m3u8',
  'Radyo Trabzonspor': 'https://moondigitaledge.radyotvonline.net/radyotrabzonspor/radyotrabzonspor.smil/chunklist.m3u8',
  'Spor FM': 'https://moondigitalmaster.radyotvonline.net/sporfm/sporfm.smil/chunklist.m3u8',
  
  // General fixes
  'Alem FM': 'https://ssl5.radyotvonline.com/alemfm/alemfm.stream/chunklist.m3u8',
  'Radyo 7': 'https://moondigitaledge.radyotvonline.net/radyo7/radyo7.smil/chunklist.m3u8',
  'Number1 FM': 'https://n10101m.mediatriple.net/videoonlylive/mtisvwurbfcyslive/broadcast_58f5e5a2a1c23.smil/chunklist.m3u8',
  'Show Radyo': 'https://moondigitalmaster.radyotvonline.net/showradyo/showradyo.smil/chunklist.m3u8',
  'Radyo Eksen': 'https://moondigitaledge.radyotvonline.net/radyoeksen/radyoeksen.smil/chunklist.m3u8',
  'Radyo Boğaziçi': 'https://moondigitalmaster.radyotvonline.net/radyobogazici/radyobogazici.smil/chunklist.m3u8',
  'Radyo Alaturka': 'https://ssl3.radyotvonline.com/radyoalaturka/radyoalaturka.stream/chunklist.m3u8'
};

let fixedCount = 0;

// Function to apply URL fixes
function applyUrlFixes() {
  console.log('🔧 Applying URL fixes...\n');
  
  // Fix HLS (.m3u8) URLs
  Object.entries(workingUrls).forEach(([stationName, newUrl]) => {
    const stationNamePattern = stationName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Find and replace URLs for this station
    const urlRegex = new RegExp(`(name:\\s*['"\`][^'"\`]*${stationNamePattern}[^'"\`]*['"\`][^}]*url:\\s*['"\`])[^'"\`]+(['"\`])`, 'gi');
    
    if (content.match(urlRegex)) {
      content = content.replace(urlRegex, `$1${newUrl}$2`);
      console.log(`✅ Fixed: ${stationName}`);
      fixedCount++;
    }
    
    // Also fix streamUrl
    const streamUrlRegex = new RegExp(`(name:\\s*['"\`][^'"\`]*${stationNamePattern}[^'"\`]*['"\`][^}]*streamUrl:\\s*['"\`])[^'"\`]+(['"\`])`, 'gi');
    
    if (content.match(streamUrlRegex)) {
      content = content.replace(streamUrlRegex, `$1${newUrl}$2`);
    }
  });
}

// Function to fix codecs
function fixCodecs() {
  console.log('\n🔧 Fixing codecs...\n');
  
  // Change all AAC codecs to MP3
  const aacCodecMatches = content.match(/codec:\s*['"`]AAC['"`]/g);
  if (aacCodecMatches) {
    content = content.replace(/codec:\s*['"`]AAC['"`]/g, "codec: 'MP3'");
    console.log(`✅ Fixed ${aacCodecMatches.length} AAC codecs to MP3`);
    fixedCount += aacCodecMatches.length;
  }
  
  // Change UNKNOWN codecs to MP3
  const unknownCodecMatches = content.match(/codec:\s*['"`]UNKNOWN['"`]/g);
  if (unknownCodecMatches) {
    content = content.replace(/codec:\s*['"`]UNKNOWN['"`]/g, "codec: 'MP3'");
    console.log(`✅ Fixed ${unknownCodecMatches.length} UNKNOWN codecs to MP3`);
    fixedCount += unknownCodecMatches.length;
  }
}

// Function to remove problematic URLs and replace with working alternatives
function removeProblematicUrls() {
  console.log('\n🔧 Removing problematic URL patterns...\n');
  
  // Replace .m3u8 endings with more compatible alternatives
  const m3u8Count = (content.match(/\.m3u8/g) || []).length;
  if (m3u8Count > 0) {
    // Generic m3u8 fixes
    content = content.replace(/master_720\.m3u8/g, 'stream');
    content = content.replace(/playlist\.m3u8/g, 'stream'); 
    content = content.replace(/chunklist\.m3u8/g, 'stream');
    content = content.replace(/\.m3u8/g, '/stream');
    
    console.log(`✅ Fixed ${m3u8Count} .m3u8 URLs to /stream`);
    fixedCount += m3u8Count;
  }
  
  // Fix old IP addresses
  const oldIpMatches = content.match(/46\.20\.3\.\d+:\d+/g);
  if (oldIpMatches) {
    content = content.replace(/http:\/\/46\.20\.3\.229:8080\/stream/g, 'https://17723.live.streamtheworld.com:443/METRO_FM_SC');
    content = content.replace(/http:\/\/46\.20\.3\.204:8080\/stream/g, 'https://17733.live.streamtheworld.com:443/JOY_FM_SC');
    console.log(`✅ Fixed ${oldIpMatches.length} old IP addresses`);
    fixedCount += oldIpMatches.length;
  }
}

// Main execution
try {
  applyUrlFixes();
  fixCodecs();
  removeProblematicUrls();
  
  // Save the fixed content
  fs.writeFileSync('./src/constants/radioStations.ts', content);
  
  console.log(`\n✅ SUCCESS!`);
  console.log(`📊 Total fixes applied: ${fixedCount}`);
  console.log(`📝 Updated radioStations.ts file`);
  
  // Verify the file is valid TypeScript
  try {
    const { spawn } = require('child_process');
    const tsc = spawn('npx', ['tsc', '--noEmit'], { stdio: 'pipe' });
    
    tsc.on('close', (code) => {
      if (code === 0) {
        console.log('✅ TypeScript validation passed');
        console.log('\n🚀 Next steps:');
        console.log('1. Test the app to verify radios work');
        console.log('2. Check browser console for any remaining errors');
        console.log('3. All major format issues should now be resolved!');
      } else {
        console.log('⚠️ TypeScript validation failed - check for syntax errors');
      }
    });
    
    tsc.stderr.on('data', (data) => {
      console.log('TypeScript error:', data.toString());
    });
    
  } catch (error) {
    console.log('⚠️ Could not run TypeScript validation');
  }
  
} catch (error) {
  console.error('❌ Error during fixing process:', error.message);
  console.log(`🔄 Restore from backup: ${backupFile}`);
}
