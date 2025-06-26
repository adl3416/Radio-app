#!/usr/bin/env node

/**
 * Find Alternative Radio Streams
 * 
 * Bu araç çalışmayan radyolar için alternatif stream URL'leri bulur
 */

const https = require('https');
const fs = require('fs');

const FAILED_STATIONS = [
  { name: 'TRT FM', searchTerms: ['TRT FM', 'TRT-FM', 'TRTFM'] },
  { name: 'TRT 3', searchTerms: ['TRT 3', 'TRT3', 'TRT-3'] },
  { name: 'A Haber', searchTerms: ['A Haber', 'AHABER', 'A-Haber'] }
];

class AlternativeStreamFinder {
  constructor() {
    this.baseUrl = 'https://de1.api.radio-browser.info/json';
    this.results = {};
  }

  async searchStation(stationInfo) {
    console.log(`\n🔍 Searching alternatives for: ${stationInfo.name}`);
    
    for (const term of stationInfo.searchTerms) {
      console.log(`   Searching for: "${term}"`);
      
      try {
        const results = await this.searchByName(term);
        if (results.length > 0) {
          console.log(`   ✅ Found ${results.length} alternatives`);
          this.results[stationInfo.name] = results;
          return;
        }
      } catch (error) {
        console.log(`   ❌ Search failed: ${error.message}`);
      }
      
      // Wait between searches
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`   ⚠️ No alternatives found for ${stationInfo.name}`);
  }

  async searchByName(name) {
    return new Promise((resolve, reject) => {
      const searchUrl = `${this.baseUrl}/stations/byname/${encodeURIComponent(name)}`;
      
      https.get(searchUrl, { headers: { 'User-Agent': 'TurkRadioApp/1.0' } }, (res) => {
        let data = '';
        
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const stations = JSON.parse(data);
            
            // Filter Turkish stations and working URLs
            const turkishStations = stations.filter(station => 
              station.country && station.country.toLowerCase().includes('turkey') ||
              station.language && station.language.toLowerCase().includes('turkish') ||
              station.name.toLowerCase().includes('trt') ||
              station.name.toLowerCase().includes('türk')
            );
            
            // Sort by votes/popularity
            turkishStations.sort((a, b) => (b.votes || 0) - (a.votes || 0));
            
            resolve(turkishStations.slice(0, 5)); // Top 5 alternatives
          } catch (error) {
            reject(error);
          }
        });
        
        res.on('error', reject);
      }).on('error', reject);
    });
  }

  async testUrl(url) {
    return new Promise((resolve) => {
      const isHttps = url.startsWith('https');
      const requestModule = isHttps ? https : require('http');
      
      const timeout = setTimeout(() => {
        resolve({ working: false, error: 'Timeout' });
      }, 10000);

      try {
        const req = requestModule.get(url, {
          headers: {
            'User-Agent': 'TurkRadioApp/1.0',
            'Accept': 'audio/*'
          }
        }, (res) => {
          clearTimeout(timeout);
          
          const working = res.statusCode === 200 && 
                         (res.headers['content-type']?.includes('audio') || 
                          res.headers['icy-name']);
          
          resolve({
            working,
            statusCode: res.statusCode,
            contentType: res.headers['content-type'],
            icyName: res.headers['icy-name']
          });
          
          req.destroy();
        });

        req.on('error', (error) => {
          clearTimeout(timeout);
          resolve({ working: false, error: error.message });
        });

        req.setTimeout(10000, () => {
          req.destroy();
          resolve({ working: false, error: 'Request timeout' });
        });

      } catch (error) {
        clearTimeout(timeout);
        resolve({ working: false, error: error.message });
      }
    });
  }

  async verifyAlternatives() {
    console.log('\n🧪 Testing alternative URLs...\n');
    
    for (const [stationName, alternatives] of Object.entries(this.results)) {
      console.log(`Testing ${stationName}:`);
      
      for (let i = 0; i < alternatives.length; i++) {
        const station = alternatives[i];
        console.log(`  ${i + 1}. ${station.name} (${station.url})`);
        
        const test = await this.testUrl(station.url);
        station.testResult = test;
        
        if (test.working) {
          console.log(`     ✅ ÇALIŞIYOR - ${test.icyName || test.contentType}`);
        } else {
          console.log(`     ❌ Çalışmıyor - ${test.error || test.statusCode}`);
        }
        
        // Wait between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      console.log('');
    }
  }

  generateFixScript() {
    console.log('\n📝 Generating fix script...');
    
    let fixScript = '// ALTERNATIVE RADIO STREAMS - WORKING REPLACEMENTS\n\n';
    fixScript += '// Run this to update radioStations.ts with working alternatives\n\n';
    
    for (const [stationName, alternatives] of Object.entries(this.results)) {
      const workingAlternatives = alternatives.filter(alt => alt.testResult?.working);
      
      if (workingAlternatives.length > 0) {
        fixScript += `// ${stationName} - ${workingAlternatives.length} working alternatives found:\n`;
        
        workingAlternatives.forEach((alt, index) => {
          fixScript += `// ${index + 1}. ${alt.name}\n`;
          fixScript += `//    URL: ${alt.url}\n`;
          fixScript += `//    Votes: ${alt.votes || 0}\n`;
          fixScript += `//    Metadata: ${alt.testResult.icyName || 'N/A'}\n\n`;
        });
        
        // Generate replacement code
        const bestAlternative = workingAlternatives[0];
        fixScript += `// RECOMMENDED REPLACEMENT for ${stationName}:\n`;
        fixScript += `/*\n`;
        fixScript += `{\n`;
        fixScript += `  id: '${stationName.toLowerCase().replace(/\s+/g, '-')}',\n`;
        fixScript += `  name: '${bestAlternative.name}',\n`;
        fixScript += `  url: '${bestAlternative.url}',\n`;
        fixScript += `  streamUrl: '${bestAlternative.url}',\n`;
        fixScript += `  category: '${stationName.includes('Haber') ? 'news' : 'pop'}',\n`;
        fixScript += `  description: '${bestAlternative.name} - Working Alternative',\n`;
        fixScript += `  country: 'Turkey',\n`;
        fixScript += `  language: 'Turkish',\n`;
        fixScript += `  codec: 'MP3',\n`;
        fixScript += `  bitrate: ${bestAlternative.bitrate || 128},\n`;
        fixScript += `  votes: ${bestAlternative.votes || 0},\n`;
        fixScript += `  isGuaranteed: true,\n`;
        fixScript += `  isLive: true\n`;
        fixScript += `}\n`;
        fixScript += `*/\n\n`;
      } else {
        fixScript += `// ${stationName} - NO WORKING ALTERNATIVES FOUND\n\n`;
      }
    }
    
    fs.writeFileSync('RADIO_ALTERNATIVES_FIX.js', fixScript);
    console.log('💾 Fix script saved: RADIO_ALTERNATIVES_FIX.js');
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      searchResults: this.results,
      summary: {
        stationsSearched: Object.keys(this.results).length,
        totalAlternatives: Object.values(this.results).reduce((sum, alts) => sum + alts.length, 0),
        workingAlternatives: Object.values(this.results).reduce((sum, alts) => 
          sum + alts.filter(alt => alt.testResult?.working).length, 0)
      }
    };
    
    fs.writeFileSync('RADIO_ALTERNATIVES_REPORT.json', JSON.stringify(report, null, 2));
    console.log('💾 Detailed report saved: RADIO_ALTERNATIVES_REPORT.json');

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📋 ALTERNATIVE STREAMS SUMMARY');
    console.log('='.repeat(60));
    console.log(`🔍 Stations Searched: ${report.summary.stationsSearched}`);
    console.log(`📻 Total Alternatives Found: ${report.summary.totalAlternatives}`);
    console.log(`✅ Working Alternatives: ${report.summary.workingAlternatives}`);
    
    for (const [stationName, alternatives] of Object.entries(this.results)) {
      const working = alternatives.filter(alt => alt.testResult?.working).length;
      const total = alternatives.length;
      console.log(`   ${stationName}: ${working}/${total} working`);
    }
  }

  async run() {
    console.log('🔍 Alternative Radio Stream Finder Started');
    console.log(`📋 Searching alternatives for ${FAILED_STATIONS.length} failed stations\n`);

    // Search for alternatives
    for (const station of FAILED_STATIONS) {
      await this.searchStation(station);
    }

    // Test found alternatives
    if (Object.keys(this.results).length > 0) {
      await this.verifyAlternatives();
      this.generateReport();
      this.generateFixScript();
    } else {
      console.log('❌ No alternatives found for any station');
    }
  }
}

// Run the finder
const finder = new AlternativeStreamFinder();
finder.run().catch(error => {
  console.error('❌ Alternative search failed:', error);
  process.exit(1);
});
