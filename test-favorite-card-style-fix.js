/**
 * Favorite Card Style Fix Test
 * Bu test, favori radyoların arka plan stil düzeltmesini test eder
 */

const fs = require('fs');

console.log('🎨 Favorite Card Style Fix Test');
console.log('================================\n');

// Test 1: App.tsx'de stil değişikliklerini kontrol et
function testStyleChanges() {
  console.log('1. Stil değişiklikleri kontrol ediliyor...');
  
  const appContent = fs.readFileSync('./App.tsx', 'utf8');
  
  const hasCurrentlyPlayingCard = appContent.includes('isCurrentlyPlaying && styles.currentlyPlayingCard');
  const removedFavoriteCard = !appContent.includes('isFavorite && styles.favoriteCard');
  const hasCurrentlyPlayingStyle = appContent.includes('currentlyPlayingCard: {');
  const hasFavoriteStationName = appContent.includes('favoriteStationName');
  const hasHeartEmoji = appContent.includes('{isFavorite && <Text style={styles.favoriteIndicator}>❤️</Text>}');
  
  console.log(`   ✅ isCurrentlyPlaying card uygulandı: ${hasCurrentlyPlayingCard ? 'Evet' : 'Hayır'}`);
  console.log(`   ✅ favoriteCard kullanımı kaldırıldı: ${removedFavoriteCard ? 'Evet' : 'Hayır'}`);
  console.log(`   ✅ currentlyPlayingCard stili eklendi: ${hasCurrentlyPlayingStyle ? 'Evet' : 'Hayır'}`);
  console.log(`   ✅ favoriteStationName stili eklendi: ${hasFavoriteStationName ? 'Evet' : 'Hayır'}`);
  console.log(`   ✅ ❤️ emoji kullanımı: ${hasHeartEmoji ? 'Evet' : 'Hayır'}`);
  
  return hasCurrentlyPlayingCard && removedFavoriteCard && hasCurrentlyPlayingStyle && hasFavoriteStationName && hasHeartEmoji;
}

// Test 2: Stil tanımlarının varlığını kontrol et
function testStyleDefinitions() {
  console.log('\n2. Stil tanımları kontrol ediliyor...');
  
  const appContent = fs.readFileSync('./App.tsx', 'utf8');
  
  const hasCurrentlyPlayingCardStyle = appContent.includes('currentlyPlayingCard: {') && 
                                       appContent.includes("backgroundColor: '#FFF7ED'") &&
                                       appContent.includes("borderLeftColor: '#10B981'");
  const hasFavoriteCardStyle = appContent.includes('favoriteCard: {') && 
                               appContent.includes("backgroundColor: '#FFFFFF'") &&
                               appContent.includes("borderLeftColor: '#FF6B35'");
  const hasFavoriteStationNameStyle = appContent.includes('favoriteStationName: {') &&
                                      appContent.includes("color: '#FF6B35'");
  
  console.log(`   ✅ currentlyPlayingCard stili doğru: ${hasCurrentlyPlayingCardStyle ? 'Evet' : 'Hayır'}`);
  console.log(`   ✅ favoriteCard stili güncellendi: ${hasFavoriteCardStyle ? 'Evet' : 'Hayır'}`);
  console.log(`   ✅ favoriteStationName stili: ${hasFavoriteStationNameStyle ? 'Evet' : 'Hayır'}`);
  
  return hasCurrentlyPlayingCardStyle && hasFavoriteCardStyle && hasFavoriteStationNameStyle;
}

// Test 3: Favori göstergesi değişikliklerini kontrol et
function testFavoriteIndicator() {
  console.log('\n3. Favori göstergesi değişiklikleri kontrol ediliyor...');
  
  const appContent = fs.readFileSync('./App.tsx', 'utf8');
  
  const hasHeartEmoji = appContent.includes('❤️');
  const removedStarEmoji = !appContent.includes('⭐');
  const hasFavoriteNameColor = appContent.includes('isFavorite && styles.favoriteStationName');
  
  console.log(`   ✅ ❤️ emoji kullanılıyor: ${hasHeartEmoji ? 'Evet' : 'Hayır'}`);
  console.log(`   ✅ ⭐ emoji kaldırıldı: ${removedStarEmoji ? 'Evet' : 'Hayır'}`);
  console.log(`   ✅ Favori isim rengi uygulandı: ${hasFavoriteNameColor ? 'Evet' : 'Hayır'}`);
  
  return hasHeartEmoji && removedStarEmoji && hasFavoriteNameColor;
}

// Ana test fonksiyonu
function runTests() {
  const results = [];
  
  results.push(testStyleChanges());
  results.push(testStyleDefinitions());
  results.push(testFavoriteIndicator());
  
  const passedTests = results.filter(result => result === true).length;
  const totalTests = results.length;
  
  console.log('\n📊 Test Sonuçları:');
  console.log('==================');
  console.log(`Geçen testler: ${passedTests}/${totalTests}`);
  console.log(`Başarı oranı: ${Math.round((passedTests/totalTests) * 100)}%`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 Tüm testler başarılı! Favori card stil düzeltmesi tamamlandı!');
    console.log('\n✨ Değişiklikler:');
    console.log('   • Ana sayfada sadece çalan radyonun arka planı sarı');
    console.log('   • Favori radyoların ismi turuncu renkte');
    console.log('   • Favori göstergesi ❤️ emoji olarak güncellendi');
    console.log('   • Favori radyoların sol kenarında ince turuncu çizgi');
    console.log('   • Çalan radyonun sol kenarında yeşil çizgi ve sarı arka plan');
  } else {
    console.log('\n⚠️ Bazı testler başarısız. Lütfen kodları kontrol edin.');
  }
}

// Testleri çalıştır
runTests();
