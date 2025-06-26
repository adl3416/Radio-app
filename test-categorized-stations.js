/**
 * Test script for categorized stations (dini, haber, spor)
 * Run this to see how the new functionality works
 */

const { radioBrowserService } = require('./src/services/radioBrowserService');

async function testCategorizedStations() {
  try {
    console.log('🔍 Testing categorized stations...\n');

    // Test individual category functions
    console.log('📿 Testing religious (dini) stations...');
    const religiousStations = await radioBrowserService.getReligiousStations();
    console.log(`Found ${religiousStations.length} religious stations`);
    if (religiousStations.length > 0) {
      console.log('Sample religious stations:');
      religiousStations.slice(0, 3).forEach(station => {
        console.log(`  - ${station.name} (${station.description})`);
      });
    }
    console.log('');

    console.log('📰 Testing news (haber) stations...');
    const newsStations = await radioBrowserService.getNewsStations();
    console.log(`Found ${newsStations.length} news stations`);
    if (newsStations.length > 0) {
      console.log('Sample news stations:');
      newsStations.slice(0, 3).forEach(station => {
        console.log(`  - ${station.name} (${station.description})`);
      });
    }
    console.log('');

    console.log('⚽ Testing sports (spor) stations...');
    const sportsStations = await radioBrowserService.getSportsStations();
    console.log(`Found ${sportsStations.length} sports stations`);
    if (sportsStations.length > 0) {
      console.log('Sample sports stations:');
      sportsStations.slice(0, 3).forEach(station => {
        console.log(`  - ${station.name} (${station.description})`);
      });
    }
    console.log('');

    // Test combined categorized function
    console.log('🎯 Testing combined categorized stations...');
    const categorized = await radioBrowserService.getCategorizedStations();
    console.log(`Combined categorized stations:
  - Religious: ${categorized.religious.length}
  - News: ${categorized.news.length}
  - Sports: ${categorized.sports.length}
  - Total: ${categorized.total}`);

    console.log('\n✅ All categorized station tests completed successfully!');

  } catch (error) {
    console.error('❌ Error testing categorized stations:', error.message);
  }
}

// Run the test
testCategorizedStations();
