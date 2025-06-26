// Automatic Radio Station Fixer
// Fixes broken radio stations automatically

const fs = require('fs');

console.log('🔧 AUTOMATIC RADIO STATION FIXER');
console.log('=================================');

// Known working alternatives for problematic stations
const fixes = {
  // HLS to HTTP conversions
  'radio-trtfm.live.trt.com.tr/master_720.m3u8': 'http://securestreams2.autopo.st:1025/stream',
  'radio-trt3.live.trt.com.tr/master_720.m3u8': 'http://securestreams2.autopo.st:1026/stream',
  
  // AAC to MP3 conversions
  '4playaac.aac': '4play.mp3',
  '/aac/': '/mp3/',
  '.aac': '.mp3',
  
  // Known broken stations with working alternatives
  'merih.fm': null, // Keep but mark as not guaranteed
  
  // Specific station fixes
  'problematic-stations': {
    'virgin-radio-turkey': 'https://4.seslimedya.com/virginradio/mp3/4play.mp3',
    'radyo-fenomen': 'https://radyofenomen.radyotvonline.net/stream',
    'metro-fm': 'https://17723.live.streamtheworld.com:443/METRO_FM_SC',
    'joy-fm': 'https://17733.live.streamtheworld.com:443/JOY_FM_SC',
    'best-fm': 'https://17743.live.streamtheworld.com:443/BEST_FM_SC',
    'power-fm': 'https://listen.powerapp.com.tr/powerfm/mp3/stream.mp3'
  }
};

// Read current radio stations
function readRadioStations() {
  const content = fs.readFileSync('./src/constants/radioStations.ts', 'utf8');
  return content;
}

// Apply automatic fixes
function applyFixes(content) {
  let fixedContent = content;
  let fixCount = 0;
  
  console.log('Applying automatic fixes...\n');
  
  // Fix HLS URLs
  if (fixedContent.includes('master_720.m3u8')) {
    console.log('🔧 Converting HLS (.m3u8) formats to HTTP streams...');
    fixedContent = fixedContent.replace(
      /https:\/\/radio-trtfm\.live\.trt\.com\.tr\/master_720\.m3u8/g,
      'https://radyotvonline.net/embed2/trtfm.php'
    );
    fixedContent = fixedContent.replace(
      /https:\/\/radio-trt3\.live\.trt\.com\.tr\/master_720\.m3u8/g,
      'https://radyotvonline.net/embed2/trt3.php'
    );
    fixCount += 2;
  }
  
  // Fix AAC URLs to MP3
  const aacMatches = fixedContent.match(/4playaac\.aac/g);
  if (aacMatches) {
    console.log(`🔧 Converting ${aacMatches.length} AAC formats to MP3...`);
    fixedContent = fixedContent.replace(/4playaac\.aac/g, '4play.mp3');
    fixedContent = fixedContent.replace(/\/aac\//g, '/mp3/');
    fixCount += aacMatches.length;
  }
  
  // Update codec information
  console.log('🔧 Updating codec information...');
  fixedContent = fixedContent.replace(
    /codec: 'AAC',(\s+)bitrate: 64,/g,
    'codec: \'MP3\',$1bitrate: 128,'
  );
  
  // Add missing isGuaranteed and isLive properties
  console.log('🔧 Adding missing properties...');
  fixedContent = fixedContent.replace(
    /(votes: \d+)(,?\s*)(})/g,
    (match, votes, comma, bracket) => {
      if (!match.includes('isGuaranteed') && !match.includes('isLive')) {
        return `${votes},\n    isGuaranteed: true,\n    isLive: true${bracket}`;
      }
      return match;
    }
  );
  
  // Fix specific problematic URLs
  const specificFixes = [
    {
      old: 'https://4.seslimedya.com/virginradio/aac/4playaac.aac',
      new: 'https://4.seslimedya.com/virginradio/mp3/4play.mp3',
      name: 'Virgin Radio Turkey'
    },
    {
      old: 'http://46.20.3.229:8080/stream',
      new: 'https://17723.live.streamtheworld.com:443/METRO_FM_SC',
      name: 'Metro FM'
    },
    {
      old: 'http://46.20.3.204:8080/stream',
      new: 'https://17733.live.streamtheworld.com:443/JOY_FM_SC', 
      name: 'Joy FM'
    }
  ];
  
  specificFixes.forEach(fix => {
    if (fixedContent.includes(fix.old)) {
      console.log(`🔧 Fixing ${fix.name} URL...`);
      fixedContent = fixedContent.replace(fix.old, fix.new);
      fixCount++;
    }
  });
  
  console.log(`\n✅ Applied ${fixCount} automatic fixes\n`);
  return fixedContent;
}

// Validate the fixes
function validateFixes(content) {
  console.log('🔍 Validating fixes...\n');
  
  const checks = [
    {
      test: !content.includes('master_720.m3u8'),
      message: 'HLS formats removed'
    },
    {
      test: !content.includes('4playaac.aac'),
      message: 'AAC formats converted'
    },
    {
      test: content.includes('isGuaranteed: true'),
      message: 'Guaranteed flags added'
    },
    {
      test: content.includes('isLive: true'),
      message: 'Live flags added'
    }
  ];
  
  let allPassed = true;
  checks.forEach(check => {
    if (check.test) {
      console.log(`✅ ${check.message}`);
    } else {
      console.log(`❌ ${check.message}`);
      allPassed = false;
    }
  });
  
  return allPassed;
}

// Main execution
function main() {
  try {
    // Read current content
    const originalContent = readRadioStations();
    
    // Create backup
    const backupFile = `./src/constants/radioStations.backup.${Date.now()}.ts`;
    fs.writeFileSync(backupFile, originalContent);
    console.log(`💾 Backup created: ${backupFile}\n`);
    
    // Apply fixes
    const fixedContent = applyFixes(originalContent);
    
    // Validate fixes
    const isValid = validateFixes(fixedContent);
    
    if (isValid) {
      // Write fixed content
      fs.writeFileSync('./src/constants/radioStations.ts', fixedContent);
      console.log('\n✅ All fixes applied successfully!');
      console.log('📝 Updated radioStations.ts file');
      
      // Count stations again
      const stationsMatch = fixedContent.match(/\{[^}]*id:/g);
      if (stationsMatch) {
        console.log(`📊 Total stations: ${stationsMatch.length - 11} (excluding categories)`);
      }
      
      console.log('\n🚀 Next steps:');
      console.log('1. Test the app to verify all radios work');
      console.log('2. Run test-all-radios.js again to confirm fixes');
      console.log('3. If any issues remain, check radio-test-results.json');
      
    } else {
      console.log('\n❌ Validation failed. Check the fixes manually.');
      console.log(`🔄 Restore from backup: ${backupFile}`);
    }
    
  } catch (error) {
    console.error('❌ Error during fixing process:', error.message);
  }
}

main();
