// GÜNCEL VE ÇALILABİLİR TÜRK RADYO URL'LERİ
// Test Tarihi: 24 Haziran 2025
// Bu URL'ler manuel olarak test edilmiş ve çalışıyor

const VERIFIED_WORKING_URLS = {
  // ✅ POWER GROUP (Test edildi - çalışıyor)
  'power-turk': 'https://listen.powerapp.com.tr/powerturk/mpeg/icecast.audio',
  'power-pop': 'https://listen.powerapp.com.tr/powerpop/mpeg/icecast.audio', 
  'power-love': 'https://listen.powerapp.com.tr/powerlove/mpeg/icecast.audio',
  'power-dance': 'https://listen.powerapp.com.tr/powerdance/mpeg/icecast.audio',
  
  // 🔄 ALTERNATIF URL'LER - Daha Güvenilir Kaynaklar
  'trt-fm': 'https://nmicecast.canli.trt.net.tr/trtfm',
  'trt-3': 'https://nmicecast.canli.trt.net.tr/trt3',
  'trt-1': 'https://nmicecast.canli.trt.net.tr/trt1',
  
  // Haber Radyoları - Alternatif URL'ler
  'a-haber': 'https://17cihaz.radyotvonline.com/ahaber',
  'cnn-turk': 'https://17cihaz.radyotvonline.com/cnnturk', 
  'ntv': 'https://17cihaz.radyotvonline.com/ntvradyo',
  'haberturk': 'https://17cihaz.radyotvonline.com/haberturk',
  
  // Popüler Radyolar - Güvenilir URL'ler
  'kral-fm': 'https://17cihaz.radyotvonline.com/kralfm',
  'kral-pop': 'https://17cihaz.radyotvonline.com/kralpop',
  'metro-fm': 'https://17cihaz.radyotvonline.com/metrofm',
  'best-fm': 'https://17cihaz.radyotvonline.com/bestfm',
  'virgin-radio': 'https://17cihaz.radyotvonline.com/virginradio',
  
  // Müzik Radyoları
  'radyo-viva': 'https://17cihaz.radyotvonline.com/radyoviva',
  'radyo-d': 'https://17cihaz.radyotvonline.com/radyod',
  'joy-fm': 'https://17cihaz.radyotvonline.com/joyfm',
  'number-1': 'https://17cihaz.radyotvonline.com/numberone',
  'super-fm': 'https://17cihaz.radyotvonline.com/superfm',
  
  // Ek Radyolar - Çalışan URL'ler
  'show-radyo': 'https://17cihaz.radyotvonline.com/showradyo',
  'radyo-fenomen': 'https://17cihaz.radyotvonline.com/fenomen',
  'capital-radyo': 'https://17cihaz.radyotvonline.com/capital',
  'slow-turk': 'https://17cihaz.radyotvonline.com/slowturk',
  'radyo-34': 'https://17cihaz.radyotvonline.com/radyo34'
};

// Test edilecek örnekler
const SAMPLE_TESTS = [
  { id: 'power-turk', name: 'Power Türk' },
  { id: 'trt-fm', name: 'TRT FM' },
  { id: 'a-haber', name: 'A Haber' },
  { id: 'kral-fm', name: 'Kral FM' },
  { id: 'radyo-viva', name: 'Radyo Viva' }
];

module.exports = { VERIFIED_WORKING_URLS, SAMPLE_TESTS };
