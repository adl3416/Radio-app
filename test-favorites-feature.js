/**
 * Favorites Feature Test
 * Bu test favoriler özelliğinin çalışıp çalışmadığını kontrol eder
 */

const fs = require('fs');
const { exec } = require('child_process');

console.log('❤️ Favorites Feature Test');
console.log('==========================\n');

// Test 1: FavoritesPage component'i kontrol et
function testFavoritesPageComponent() {
  console.log('1. FavoritesPage component kontrol ediliyor...');
  
  try {
    const favoritesPageContent = fs.readFileSync('./src/screens/FavoritesPage.tsx', 'utf8');
    
    const hasInterface = favoritesPageContent.includes('interface FavoritesPageProps');
    const hasEmptyState = favoritesPageContent.includes('Henüz favori radyo yok');
    const hasHeartIcon = favoritesPageContent.includes('heart');
    const hasModal = favoritesPageContent.includes('Modal');
    const hasLinearGradient = favoritesPageContent.includes('LinearGradient');
    
    console.log(`   ✅ FavoritesPageProps interface: ${hasInterface ? 'Var' : 'Yok'}`);
    console.log(`   ✅ Empty state mesajı: ${hasEmptyState ? 'Var' : 'Yok'}`);
    console.log(`   ✅ Heart icon kullanımı: ${hasHeartIcon ? 'Var' : 'Yok'}`);
    console.log(`   ✅ Modal component: ${hasModal ? 'Var' : 'Yok'}`);
    console.log(`   ✅ LinearGradient: ${hasLinearGradient ? 'Var' : 'Yok'}`);
    
    return hasInterface && hasEmptyState && hasHeartIcon && hasModal && hasLinearGradient;
  } catch (error) {
    console.log(`   ❌ FavoritesPage.tsx dosyası bulunamadı`);
    return false;
  }
}

// Test 2: FavoritesService kontrol et
function testFavoritesService() {
  console.log('\n2. FavoritesService kontrol ediliyor...');
  
  try {
    const favoritesServiceContent = fs.readFileSync('./src/services/favoritesService.ts', 'utf8');
    
    const hasAsyncStorage = favoritesServiceContent.includes('AsyncStorage');
    const hasToggleFavorite = favoritesServiceContent.includes('toggleFavorite');
    const hasLoadFavorites = favoritesServiceContent.includes('loadFavorites');
    const hasSubscribe = favoritesServiceContent.includes('subscribe');
    const hasExport = favoritesServiceContent.includes('export const favoritesService');
    
    console.log(`   ✅ AsyncStorage entegrasyonu: ${hasAsyncStorage ? 'Var' : 'Yok'}`);
    console.log(`   ✅ toggleFavorite fonksiyonu: ${hasToggleFavorite ? 'Var' : 'Yok'}`);
    console.log(`   ✅ loadFavorites fonksiyonu: ${hasLoadFavorites ? 'Var' : 'Yok'}`);
    console.log(`   ✅ Subscribe sistemi: ${hasSubscribe ? 'Var' : 'Yok'}`);
    console.log(`   ✅ Service export'u: ${hasExport ? 'Var' : 'Yok'}`);
    
    return hasAsyncStorage && hasToggleFavorite && hasLoadFavorites && hasSubscribe && hasExport;
  } catch (error) {
    console.log(`   ❌ favoritesService.ts dosyası bulunamadı`);
    return false;
  }
}

// Test 3: App.tsx entegrasyonu kontrol et
function testAppTsxIntegration() {
  console.log('\n3. App.tsx entegrasyonu kontrol ediliyor...');
  
  try {
    const appContent = fs.readFileSync('./App.tsx', 'utf8');
    
    const hasFavoritesImport = appContent.includes('import { favoritesService }');
    const hasFavoritesPageImport = appContent.includes('import { FavoritesPage }');
    const hasFavoritesState = appContent.includes('isFavoritesOpen');
    const hasFavoritesButton = appContent.includes('favoritesHeaderButton');
    const hasFavoritesPage = appContent.includes('<FavoritesPage');
    const hasToggleFavorite = appContent.includes('toggleFavorite');
    
    console.log(`   ✅ favoritesService import: ${hasFavoritesImport ? 'Var' : 'Yok'}`);
    console.log(`   ✅ FavoritesPage import: ${hasFavoritesPageImport ? 'Var' : 'Yok'}`);
    console.log(`   ✅ isFavoritesOpen state: ${hasFavoritesState ? 'Var' : 'Yok'}`);
    console.log(`   ✅ Favorites button: ${hasFavoritesButton ? 'Var' : 'Yok'}`);
    console.log(`   ✅ FavoritesPage component: ${hasFavoritesPage ? 'Var' : 'Yok'}`);
    console.log(`   ✅ toggleFavorite fonksiyonu: ${hasToggleFavorite ? 'Var' : 'Yok'}`);
    
    return hasFavoritesImport && hasFavoritesPageImport && hasFavoritesState && 
           hasFavoritesButton && hasFavoritesPage && hasToggleFavorite;
  } catch (error) {
    console.log(`   ❌ App.tsx dosyası kontrol edilemedi`);
    return false;
  }
}

// Test 4: TypeScript compilation kontrol et
function testTypeScriptCompilation() {
  console.log('\n4. TypeScript derleme kontrol ediliyor...');
  
  return new Promise((resolve) => {
    exec('npx tsc --noEmit', (error, stdout, stderr) => {
      if (error) {
        console.log(`   ❌ TypeScript hataları var`);
        if (stderr) {
          const lines = stderr.split('\n').slice(0, 5); // İlk 5 hata
          lines.forEach(line => {
            if (line.trim()) console.log(`      ${line.trim()}`);
          });
        }
        resolve(false);
      } else {
        console.log(`   ✅ TypeScript derleme başarılı`);
        resolve(true);
      }
    });
  });
}

// Ana test fonksiyonu
async function runTests() {
  const results = [];
  
  results.push(testFavoritesPageComponent());
  results.push(testFavoritesService());
  results.push(testAppTsxIntegration());
  results.push(await testTypeScriptCompilation());
  
  const passedTests = results.filter(result => result === true).length;
  const totalTests = results.length;
  
  console.log('\n📊 Test Sonuçları:');
  console.log('==================');
  console.log(`Geçen testler: ${passedTests}/${totalTests}`);
  console.log(`Başarı oranı: ${Math.round((passedTests/totalTests) * 100)}%`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 Tüm testler başarılı! Favoriler özelliği hazır!');
    console.log('\n✨ Özellikler:');
    console.log('   • Ana sayfada favori butonu (kalp ikonu)');
    console.log('   • Header\'da favoriler sayısı ve butonu');
    console.log('   • Ayrı favoriler sayfası');
    console.log('   • AsyncStorage ile kalıcı favori kaydetme');
    console.log('   • Boş favoriler için güzel empty state');
    console.log('   • Favori radyoları kolayca çalma');
    console.log('\n🚀 Kullanım:');
    console.log('   1. Herhangi bir radyonun yanındaki ❤️ butonuna basın');
    console.log('   2. Header\'daki favoriler butonuna basarak favoriler sayfasını açın');
    console.log('   3. Favoriler sayfasında radyolarınızı dinleyin');
  } else {
    console.log('\n⚠️ Bazı testler başarısız. Lütfen hataları kontrol edin.');
  }
}

// Testleri çalıştır
runTests().catch(console.error);
