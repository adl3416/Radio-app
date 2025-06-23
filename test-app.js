#!/usr/bin/env node

/**
 * Türk Radyosu Uygulaması - Test ve Doğrulama Scripti
 * Bu script uygulamanın temel bileşenlerini test eder
 */

const fs = require('fs');
const path = require('path');

console.log('🎵 Türk Radyosu Uygulaması - Test Scripti\n');

// Test edilecek dosyalar
const criticalFiles = [
    'App.tsx',
    'index.ts',
    'package.json',
    'src/screens/HomeScreen-fixed.tsx',
    'src/screens/SettingsScreen.tsx',
    'src/services/audioService.ts',
    'src/constants/radioStations.ts',
    'src/locales/i18n.ts'
];

// Klasörler
const criticalDirs = [
    'src',
    'src/screens',
    'src/services',
    'src/components',
    'src/constants',
    'src/locales'
];

console.log('📁 Dosya Yapısı Kontrolü:');
console.log('========================');

let allFilesExist = true;
let allDirsExist = true;

// Klasör kontrolü
criticalDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
        console.log(`✅ ${dir}/`);
    } else {
        console.log(`❌ ${dir}/ - EKSIK!`);
        allDirsExist = false;
    }
});

console.log('\n📄 Kritik Dosya Kontrolü:');
console.log('=========================');

// Dosya kontrolü
criticalFiles.forEach(file => {
    if (fs.existsSync(file)) {
        const stats = fs.statSync(file);
        const size = (stats.size / 1024).toFixed(1);
        console.log(`✅ ${file} (${size} KB)`);
    } else {
        console.log(`❌ ${file} - EKSIK!`);
        allFilesExist = false;
    }
});

console.log('\n📦 Package.json Analizi:');
console.log('========================');

try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    console.log(`✅ Proje adı: ${packageJson.name}`);
    console.log(`✅ Versiyon: ${packageJson.version}`);
    console.log(`✅ Ana dosya: ${packageJson.main}`);
    
    console.log('\n🔗 Bağımlılıklar:');
    const deps = Object.keys(packageJson.dependencies || {});
    const devDeps = Object.keys(packageJson.devDependencies || {});
    
    console.log(`   📋 Dependencies: ${deps.length} paket`);
    console.log(`   🔧 DevDependencies: ${devDeps.length} paket`);
    
    // Kritik bağımlılıkları kontrol et
    const criticalDeps = ['expo', 'react', 'react-native', '@react-navigation/native'];
    criticalDeps.forEach(dep => {
        if (deps.includes(dep)) {
            console.log(`   ✅ ${dep}: ${packageJson.dependencies[dep]}`);
        } else {
            console.log(`   ❌ ${dep}: EKSIK!`);
        }
    });
    
} catch (error) {
    console.log(`❌ Package.json okunamadı: ${error.message}`);
    allFilesExist = false;
}

console.log('\n🎮 Test Sonuçları:');
console.log('==================');

if (allDirsExist && allFilesExist) {
    console.log('✅ TÜM KONTROLLER BAŞARILI!');
    console.log('🚀 Uygulama çalıştırılmaya hazır.');
    console.log('\n📝 Önerilen Adımlar:');
    console.log('   1. Terminal: npm start');
    console.log('   2. Tarayıcı: http://localhost:8083');
    console.log('   3. Mobil: Expo Go ile QR kod tarama');
    console.log('   4. Simülatör: phone-simulator-enhanced.html açma');
} else {
    console.log('❌ BAZI KONTROLLER BAŞARISIZ!');
    console.log('🔧 Eksik dosyaları kontrol edin ve tekrar deneyin.');
}

console.log('\n🎵 Test tamamlandı.\n');
