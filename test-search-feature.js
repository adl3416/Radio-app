#!/usr/bin/env node

/**
 * Search Feature Demo
 * Arama özelliğinin nasıl çalıştığını test eder
 */

// Simulated radio data (first 10 stations from radioStations.ts)
const SAMPLE_RADIOS = [
  { id: 'power-turk', name: '⚡ Power Türk', description: 'Türkçe Pop ve Rock - Power Group' },
  { id: 'power-pop', name: '⚡ Power Pop', description: 'Pop Müzik - Power Group' },
  { id: 'power-love', name: '⚡ Power Love', description: 'Aşk Şarkıları - Power Group' },
  { id: 'power-dance', name: '⚡ Power Dance', description: 'Dans Müziği - Power Group' },
  { id: 'a-haber', name: '📰 A Haber', description: 'A Haber Radyosu - Haber ve Güncel Olaylar' },
  { id: 'trt-fm', name: '🎵 TRT FM', description: 'TRT FM - Türkiye Radyo Televizyon Kurumu' },
  { id: 'trt-3', name: '📻 TRT 3', description: 'TRT 3 - Klasik ve Sanat Müziği' },
  { id: 'best-fm', name: '🎵 Best FM', description: 'Best FM - En İyi Pop Müzik' },
  { id: 'slow-turk', name: '🎶 Slow Türk', description: 'Slow Türk - Yavaş Türkçe Şarkılar' },
  { id: 'radyo-d', name: '📻 Radyo D', description: 'Radyo D - Hit Müzikler ve Eğlence' }
];

function searchRadios(query, radios) {
  if (!query || query.length === 0) {
    return radios;
  }

  const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
  
  return radios.filter(radio => {
    const searchText = [
      radio.name,
      radio.description,
      radio.id
    ].join(' ').toLowerCase();
    
    return searchTerms.some(term => searchText.includes(term));
  });
}

function testSearch(query) {
  console.log(`\n🔍 Arama: "${query}"`);
  console.log('─'.repeat(50));
  
  const results = searchRadios(query, SAMPLE_RADIOS);
  
  if (results.length > 0) {
    console.log(`✅ ${results.length} radyo bulundu:`);
    results.forEach((radio, index) => {
      console.log(`  ${index + 1}. ${radio.name}`);
      console.log(`     ${radio.description}`);
    });
  } else {
    console.log('❌ Hiç radyo bulunamadı');
    console.log('💡 Öneri: Farklı terimler deneyin: haber, müzik, pop, trt, power...');
  }
}

console.log('🎧 ARAMA ÖZELLİĞİ DEMO');
console.log('='.repeat(60));
console.log(`📊 Toplam ${SAMPLE_RADIOS.length} radyo üzerinde arama yapılıyor\n`);

// Test different search queries
const searchQueries = [
  'power',
  'trt',
  'haber',
  'müzik',
  'pop',
  'dans',
  'klasik',
  'slow',
  'xyz123', // This should return no results
  '⚡', // Emoji search
  'Power Türk', // Exact match
  'pop müzik' // Multiple words
];

searchQueries.forEach(query => testSearch(query));

console.log('\n' + '='.repeat(60));
console.log('📋 ARAMA ÖZELLİKLERİ:');
console.log('─'.repeat(60));
console.log('✅ İstasyon adında arama');
console.log('✅ Açıklamada arama');
console.log('✅ ID\'de arama');
console.log('✅ Emoji ile arama (⚡, 📻, 🎵)');
console.log('✅ Çoklu kelime desteği');
console.log('✅ Büyük/küçük harf duyarsız');
console.log('✅ Gerçek zamanlı sonuçlar');

console.log('\n📱 KULLANICI DENEYİMİ:');
console.log('─'.repeat(60));
console.log('🔄 Yazarken anlık sonuçlar');
console.log('🧹 Temizle butonu (X)');
console.log('📊 Sonuç sayısı göstergesi');
console.log('💡 Arama önerileri');
console.log('🎨 Modern gradient arka plan');
console.log('✨ Gölgeli ve yuvarlatılmış tasarım');
