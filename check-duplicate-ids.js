/**
 * Radyo ID Kontrolü ve Duplicate Tespit Aracı
 */

const fs = require('fs');

function checkDuplicateIds() {
  console.log('🔍 Duplicate ID kontrolü yapılıyor...\n');
  
  const content = fs.readFileSync('src/constants/radioStations.ts', 'utf8');
  
  // ID'leri bul
  const idMatches = content.match(/id:\s*['"`]([^'"`]+)['"`]/g);
  
  if (!idMatches) {
    console.log('❌ ID bulunamadı');
    return;
  }
  
  const ids = idMatches.map(match => {
    const idMatch = match.match(/id:\s*['"`]([^'"`]+)['"`]/);
    return idMatch ? idMatch[1] : null;
  }).filter(Boolean);
  
  console.log(`📊 Toplam bulunan ID: ${ids.length}`);
  
  // Duplicate'leri bul
  const duplicates = {};
  const seen = new Set();
  
  ids.forEach((id, index) => {
    if (seen.has(id)) {
      if (!duplicates[id]) {
        duplicates[id] = [];
      }
      duplicates[id].push(index + 1);
    } else {
      seen.add(id);
    }
  });
  
  const duplicateKeys = Object.keys(duplicates);
  
  if (duplicateKeys.length > 0) {
    console.log(`❌ ${duplicateKeys.length} adet duplicate ID bulundu:\n`);
    
    duplicateKeys.forEach(id => {
      console.log(`🔸 ID: "${id}" - Satır numaraları: ${duplicates[id].join(', ')}`);
    });
    
    // Duplicate'leri düzelt
    fixDuplicateIds(ids, duplicates);
  } else {
    console.log('✅ Duplicate ID bulunamadı!');
    console.log(`📻 Unique radyo sayısı: ${seen.size}`);
  }
}

function fixDuplicateIds(ids, duplicates) {
  console.log('\n🛠️ Duplicate ID\'ler düzeltiliyor...\n');
  
  let content = fs.readFileSync('src/constants/radioStations.ts', 'utf8');
  
  Object.keys(duplicates).forEach(duplicateId => {
    let counter = 1;
    
    // Her duplicate için yeni ID oluştur
    const regex = new RegExp(`id:\\s*['"\`]${duplicateId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"\`]`, 'g');
    
    content = content.replace(regex, (match) => {
      if (counter === 1) {
        counter++;
        return match; // İlkini olduğu gibi bırak
      } else {
        const newId = `${duplicateId}-${counter}`;
        counter++;
        console.log(`🔄 "${duplicateId}" -> "${newId}"`);
        return match.replace(duplicateId, newId);
      }
    });
  });
  
  // Dosyayı kaydet
  fs.writeFileSync('src/constants/radioStations.ts', content);
  console.log('✅ Duplicate ID\'ler düzeltildi!');
  
  // Tekrar kontrol et
  setTimeout(() => {
    console.log('\n🔍 Tekrar kontrol ediliyor...');
    checkDuplicateIds();
  }, 1000);
}

checkDuplicateIds();
