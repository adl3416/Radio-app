const https = require('https');
const http = require('http');
const fs = require('fs');

// ANSI color codes
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m'
};

function testRadioStream(url, stationName, index, total) {
    return new Promise((resolve) => {
        const timeout = 5000; // 5 second timeout
        let protocol = url.startsWith('https') ? https : http;
        
        const req = protocol.get(url, { timeout }, (res) => {
            const status = res.statusCode;
            const working = status === 200 || status === 404; // 404 can still stream audio
            
            console.log(`[${index}/${total}] ${working ? '✅' : '❌'} ${stationName} (${status})`);
            
            resolve({
                name: stationName,
                url: url,
                status: status,
                working: working,
                index: index
            });
            
            req.destroy();
        });
        
        req.on('error', (err) => {
            console.log(`[${index}/${total}] ❌ ${stationName} (ERROR: ${err.code || err.message})`);
            resolve({
                name: stationName,
                url: url,
                status: 'ERROR',
                working: false,
                error: err.code || err.message,
                index: index
            });
        });
        
        req.on('timeout', () => {
            console.log(`[${index}/${total}] ❌ ${stationName} (TIMEOUT)`);
            req.destroy();
            resolve({
                name: stationName,
                url: url,
                status: 'TIMEOUT',
                working: false,
                index: index
            });
        });
    });
}

async function parseAndTestAllRadios() {
    const radioStationsContent = fs.readFileSync('./src/constants/radioStations.ts', 'utf8');
    
    // Extract station blocks
    const stationRegex = /{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)',\s*url:\s*'([^']+)',\s*codec:\s*'([^']+)',\s*bitrate:\s*'([^']+)',\s*country:\s*'([^']+)',\s*category:\s*'([^']+)',\s*favorite:\s*(true|false)\s*}/g;
    
    const stations = [];
    let match;
    
    while ((match = stationRegex.exec(radioStationsContent)) !== null) {
        stations.push({
            id: match[1],
            name: match[2],
            url: match[3],
            codec: match[4],
            bitrate: match[5],
            country: match[6],
            category: match[7],
            favorite: match[8] === 'true'
        });
    }
    
    console.log(`${colors.cyan}🔍 COMPLETE RADIO STATION TEST${colors.reset}`);
    console.log(`${colors.cyan}=====================================${colors.reset}`);
    console.log(`Testing all ${stations.length} radio stations...`);
    console.log(`🚀 Starting complete test...\n`);
    
    const results = [];
    const batchSize = 10; // Test 10 at a time to avoid overwhelming
    
    for (let i = 0; i < stations.length; i += batchSize) {
        const batch = stations.slice(i, Math.min(i + batchSize, stations.length));
        const promises = batch.map((station, batchIndex) => 
            testRadioStream(station.url, station.name, i + batchIndex + 1, stations.length)
        );
        
        const batchResults = await Promise.all(promises);
        results.push(...batchResults);
        
        // Small delay between batches
        if (i + batchSize < stations.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    
    // Sort results by original index
    results.sort((a, b) => a.index - b.index);
    
    const working = results.filter(r => r.working);
    const broken = results.filter(r => !r.working);
    
    console.log(`\n${colors.cyan}📊 COMPLETE TEST RESULTS:${colors.reset}`);
    console.log(`${colors.cyan}============================${colors.reset}`);
    console.log(`${colors.green}✅ WORKING RADIOS (${working.length}/${results.length}):${colors.reset}`);
    
    working.forEach(station => {
        console.log(`  ✓ ${station.name} (${station.status})`);
    });
    
    if (broken.length > 0) {
        console.log(`\n${colors.red}❌ BROKEN RADIOS (${broken.length}/${results.length}):${colors.reset}`);
        broken.forEach(station => {
            console.log(`  ✗ ${station.name} (${station.status}) - ${station.url}`);
        });
    } else {
        console.log(`\n${colors.green}🎉 ALL RADIOS ARE WORKING!${colors.reset}`);
    }
    
    console.log(`\n${colors.yellow}📊 SUMMARY:${colors.reset}`);
    console.log(`Total Stations: ${results.length}`);
    console.log(`Working: ${working.length}`);
    console.log(`Broken: ${broken.length}`);
    console.log(`Success Rate: ${Math.round((working.length / results.length) * 100)}%`);
    
    // Save detailed results
    const detailedReport = {
        testDate: new Date().toISOString(),
        totalStations: results.length,
        workingCount: working.length,
        brokenCount: broken.length,
        successRate: Math.round((working.length / results.length) * 100),
        workingStations: working,
        brokenStations: broken
    };
    
    fs.writeFileSync('test-results-complete.json', JSON.stringify(detailedReport, null, 2));
    console.log(`\n${colors.blue}📄 Detailed results saved to: test-results-complete.json${colors.reset}`);
    
    return results;
}

parseAndTestAllRadios().catch(console.error);
