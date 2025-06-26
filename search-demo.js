#!/usr/bin/env node

/**
 * Search Feature Demo
 * Arama özelliğinin nasıl çalıştığını gösterir
 */

// Örnek radyo verisi (gerçek verilerden basitleştirilmiş)
const SAMPLE_RADIOS = [
  { id: 'trt-fm', name: '🎵 TRT FM', category: 'pop', description: 'TRT FM - Pop Müzik', city: 'Ankara' },
  { id: 'trt-3', name: '📻 TRT 3', category: 'classical', description: 'TRT 3 - Klasik Müzik', city: 'Ankara' },
  { id: 'a-haber', name: '📰 A Haber', category: 'news', description: 'A Haber - Haber', city: 'İstanbul' },
  { id: 'power-turk', name: '⚡ Power Türk', category: 'pop', description: 'Türkçe Pop - Power Group', city: 'İstanbul' },
  { id: 'power-pop', name: '⚡ Power Pop', category: 'pop', description: 'Pop Müzik - Power Group', city: 'İstanbul' },
  { id: 'best-fm', name: '🎵 Best FM', category: 'pop', description: 'En İyi Müzikler', city: 'İstanbul' },
  { id: 'slow-turk', name: '🎶 Slow Türk', category: 'pop', description: 'Slow Türkçe Şarkılar', city: 'Ankara' },
  { id: 'radyo-viva', name: '🎤 Radyo Viva', category: 'pop', description: 'Canlı Müzik', city: 'İzmir' }
];

// Arama fonksiyonu (App.tsx'teki ile aynı logic)
function searchRadios(query, radios) {
  if (!query) return radios;
  
  const queryLower = query.toLowerCase();
  
  return radios.filter(station => {
    const searchableText = [
      station.name,
      station.description,
      station.category,
      station.city
    ].filter(Boolean).join(' ').toLowerCase();
    
    // Türkçe arama terimleri için özel eşleştirmeler
    const searchMappings = {
      'haber': ['news', 'gündem', 'aktüel'],
      'müzik': ['music', 'pop', 'şarkı'],
      'pop': ['pop', 'popular'],
      'klasik': ['classical', 'classic', 'sanat'],
      'türk': ['turkish', 'türkiye'],
      'fm': ['fm', 'radyo'],
      'spor': ['sport', 'sports', 'futbol']
    };
    
    // Doğrudan eşleştirme
    if (searchableText.includes(queryLower)) {
      return true;
    }
    
    // Eşleştirme tablosunu kontrol et
    for (const [key, synonyms] of Object.entries(searchMappings)) {
      if (queryLower.includes(key) && synonyms.some(synonym => searchableText.includes(synonym))) {
        return true;
      }
    }
    
    return false;
  });
}

// Test senaryoları
const testQueries = [
  '',           // Boş arama
  'trt',        // TRT radyoları
  'power',      // Power grubu
  'haber',      // Haber kategorisi
  'pop',        // Pop kategorisi
  'klasik',     // Klasik müzik
  'ankara',     // Şehir
  'istanbul',   // Şehir
  'müzik',      // Genel müzik
  'fm',         // FM radyoları
  'slow',       // Slow müzik
  'viva',       // Radyo Viva
  'xyz123'      // Bulunamayacak arama
];

console.log('🔍 RADYO ARAMA ÖZELLİĞİ DEMO');
console.log('=' + '='.repeat(50));
console.log(`📻 Toplam Radyo Sayısı: ${SAMPLE_RADIOS.length}`);
console.log('');

testQueries.forEach(query => {
  const results = searchRadios(query, SAMPLE_RADIOS);
  const displayQuery = query || '(boş)';
  
  console.log(`🔍 Arama: "${displayQuery}"`);
  console.log(`📊 Sonuç: ${results.length}/${SAMPLE_RADIOS.length}`);
  
  if (results.length > 0) {
    console.log('   Bulunanlar:');
    results.forEach(radio => {
      console.log(`   • ${radio.name} (${radio.category})`);
    });
  } else {
    console.log('   ❌ Hiç radyo bulunamadı');
  }
  console.log('');
});

console.log('🎯 ARAMA ÖZELLİKLERİ:');
console.log('• İsim ile arama (TRT, Power, Best)');
console.log('• Kategori ile arama (pop, haber, klasik)');
console.log('• Şehir ile arama (Ankara, İstanbul, İzmir)');
console.log('• Türkçe terim eşleştirme (haber→news, müzik→pop)');
console.log('• Büyük/küçük harf duyarsız');
console.log('• Gerçek zamanlı filtreleme');

console.log('\n✨ KULLANICI DENEYİMİ:');
console.log('• Arama çubuğunda yazmaya başladığınızda anlık sonuçlar');
console.log('• Sonuç sayısı gösterimi');
console.log('• Sonuç bulunamadığında yardım metni');
console.log('• Temizle butonu (X)');
console.log('• Refresh ile arama sıfırlama');
