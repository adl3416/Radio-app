/**
 * Next/Previous Radio Feature Test
 * Bu test, yeni eklenen next/previous radyo özelliklerini test eder
 */

const { exec } = require('child_process');
const fs = require('fs');

console.log('🧪 Next/Previous Radio Feature Test');
console.log('=====================================\n');

// Test 1: App.tsx'de next/previous fonksiyonlarının varlığını kontrol et
function testAppTsxFunctions() {
  console.log('1. App.tsx fonksiyonları kontrol ediliyor...');
  
  const appContent = fs.readFileSync('./App.tsx', 'utf8');
  
  const hasPlayNext = appContent.includes('playNextRadio');
  const hasPlayPrevious = appContent.includes('playPreviousRadio');
  const hasNextProp = appContent.includes('onNext={playNextRadio}');
  const hasPreviousProp = appContent.includes('onPrevious={playPreviousRadio}');
  
  console.log(`   ✅ playNextRadio fonksiyonu: ${hasPlayNext ? 'Var' : 'Yok'}`);
  console.log(`   ✅ playPreviousRadio fonksiyonu: ${hasPlayPrevious ? 'Var' : 'Yok'}`);
  console.log(`   ✅ onNext prop geçişi: ${hasNextProp ? 'Var' : 'Yok'}`);
  console.log(`   ✅ onPrevious prop geçişi: ${hasPreviousProp ? 'Var' : 'Yok'}`);
  
  return hasPlayNext && hasPlayPrevious && hasNextProp && hasPreviousProp;
}

// Test 2: NewPlayer.tsx'de interface ve fonksiyonları kontrol et
function testNewPlayerTsxInterfaces() {
  console.log('\n2. NewPlayer.tsx interfaces kontrol ediliyor...');
  
  const playerContent = fs.readFileSync('./src/components/NewPlayer.tsx', 'utf8');
  
  const hasMiniPlayerInterface = playerContent.includes('onNext?: () => Promise<void>') && 
                                 playerContent.includes('onPrevious?: () => Promise<void>');
  const hasFullPlayerInterface = playerContent.includes('interface FullPlayerProps') && 
                                 playerContent.includes('onNext?: () => Promise<void>');
  const hasHandleNext = playerContent.includes('handleNext');
  const hasHandlePrevious = playerContent.includes('handlePrevious');
  const hasSkipButtons = playerContent.includes('play-skip-forward') && 
                         playerContent.includes('play-skip-back');
  
  console.log(`   ✅ MiniPlayer interface güncellendi: ${hasMiniPlayerInterface ? 'Evet' : 'Hayır'}`);
  console.log(`   ✅ FullPlayer interface güncellendi: ${hasFullPlayerInterface ? 'Evet' : 'Hayır'}`);
  console.log(`   ✅ handleNext fonksiyonu: ${hasHandleNext ? 'Var' : 'Yok'}`);
  console.log(`   ✅ handlePrevious fonksiyonu: ${hasHandlePrevious ? 'Var' : 'Yok'}`);
  console.log(`   ✅ Skip butonları: ${hasSkipButtons ? 'Var' : 'Yok'}`);
  
  return hasMiniPlayerInterface && hasFullPlayerInterface && hasHandleNext && hasHandlePrevious && hasSkipButtons;
}

// Test 3: Stil tanımlarının varlığını kontrol et
function testStyleDefinitions() {
  console.log('\n3. Stil tanımları kontrol ediliyor...');
  
  const playerContent = fs.readFileSync('./src/components/NewPlayer.tsx', 'utf8');
  
  const hasMiniControlsRow = playerContent.includes('miniControlsRow');
  const hasMiniNextButton = playerContent.includes('miniNextButton');
  
  console.log(`   ✅ miniControlsRow stili: ${hasMiniControlsRow ? 'Var' : 'Yok'}`);
  console.log(`   ✅ miniNextButton stili: ${hasMiniNextButton ? 'Var' : 'Yok'}`);
  
  return hasMiniControlsRow && hasMiniNextButton;
}

// Test 4: TypeScript compilation kontrol et
function testTypeScriptCompilation() {
  console.log('\n4. TypeScript derleme kontrol ediliyor...');
  
  return new Promise((resolve) => {
    exec('npx tsc --noEmit', (error, stdout, stderr) => {
      if (error) {
        console.log(`   ❌ TypeScript hataları var: ${stderr}`);
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
  
  results.push(testAppTsxFunctions());
  results.push(testNewPlayerTsxInterfaces());
  results.push(testStyleDefinitions());
  results.push(await testTypeScriptCompilation());
  
  const passedTests = results.filter(result => result === true).length;
  const totalTests = results.length;
  
  console.log('\n📊 Test Sonuçları:');
  console.log('==================');
  console.log(`Geçen testler: ${passedTests}/${totalTests}`);
  console.log(`Başarı oranı: ${Math.round((passedTests/totalTests) * 100)}%`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 Tüm testler başarılı! Next/Previous radio özelliği hazır!');
    console.log('\n✨ Özellikler:');
    console.log('   • Mini player\'da next butonu');
    console.log('   • Full player\'da previous/next butonları');
    console.log('   • Radyo listesinde döngüsel geçiş');
    console.log('   • TypeScript desteği');
  } else {
    console.log('\n⚠️ Bazı testler başarısız. Lütfen hataları kontrol edin.');
  }
}

// Testleri çalıştır
runTests().catch(console.error);
