export default {
  // App
  appName: 'Türkiye Radyoları',
  appSubtitle: 'Canlı Radyo Yayınları',
  
  // Common
  ok: 'Tamam',
  cancel: 'İptal',
  retry: 'Tekrar Dene',
  continue: 'Devam Et',
  loading: 'Yükleniyor...',
  live: 'CANLI',
  offline: 'ÇEVRİMDIŞİ',
  playing: 'Çalıyor',
  paused: 'Duraklatıldı',
  error: 'Hata',
  
  // Navigation
  home: 'Anasayfa',
  favorites: 'Favoriler',
  recent: 'Geçmiş',
  settings: 'Ayarlar',
  
  // Search & Filter
  searchPlaceholder: 'Radyo istasyonu ara...',
  categories: 'Kategoriler',
  stations: 'istasyon',
  apiMode: 'Canlı API',
  localMode: 'Yerel',
  searchResults: 'Arama Sonuçları',
  noResults: 'Sonuç bulunamadı',
  noResultsDescription: 'Arama kriterlerinizi değiştirip tekrar deneyin',
  liveStations: 'Canlı İstasyonlar',
  allStations: 'Tüm İstasyonlar',
  guaranteedStations: 'Garantili İstasyonlar',
  guaranteedDescription: '%100 MP3 format garantisi • Test edilmiş URL\'ler • Sorunsuz çalma',
  
  // Modern UI
  favoritesCount: '{{count}} favori istasyon',
  noFavorites: 'Henüz favori istasyon yok',
  recentCount: 'Son {{count}} istasyon',
  noRecent: 'Henüz dinlenmiş istasyon yok',
  recentlyPlayed: 'Son dinlenen',
  customizeExperience: 'Deneyiminizi özelleştirin',
  appearance: 'Görünüm',
  currentLanguage: 'Mevcut dil',
  switchToTurkish: 'Türkçe\'ye geç',
  audioSettings: 'Ses Ayarları',
  highQuality: 'Yüksek Kalite',
  highQualityDesc: 'Daha iyi ses kalitesi (daha fazla veri)',
  autoPlay: 'Otomatik Oynat',
  autoPlayDesc: 'Uygulama açılırken son istasyonu oynat',
  notifications: 'Bildirimler',
  pushNotifications: 'Bildirimler',
  notificationsDesc: 'Yeni istasyonlar ve güncellemeler',
  aboutSupport: 'Hakkında & Destek',
  shareApp: 'Uygulamayı Paylaş',
  shareAppDesc: 'Arkadaşlarınızla paylaşın',
  rateApp: 'Uygulamayı Değerlendir',
  rateAppDesc: 'App Store\'da değerlendirin',
  contactUs: 'İletişim',
  contactUsDesc: 'Geri bildirim ve destek',
  version: 'Versiyon',
  legal: 'Yasal',
  privacyPolicy: 'Gizlilik Politikası',
  privacyPolicyDesc: 'Verilerinizi nasıl kullandığımız',
  termsOfService: 'Kullanım Şartları',
  termsDesc: 'Hizmet kullanım koşulları',
  changeLanguage: 'Dil Değişikliği',
  changeLanguageConfirm: 'Dili değiştirmek istediğinizden emin misiniz?',
  change: 'Değiştir',
  shareMessage: 'Türkiye Radyoları uygulamasını deneyin! En iyi Türk radyo istasyonlarını dinleyin. 📻',
  shareTitle: 'Türkiye Radyoları',
  emailError: 'E-posta uygulaması açılamadı',
  browseStations: 'İstasyonları Keşfet',
  startListening: 'Dinlemeye Başla',
  
  // Categories
  'category.all': 'Tümü',
  'category.pop': 'Pop',
  'category.rock': 'Rock',
  'category.classical': 'Klasik',
  'category.folk': 'Türk Halk Müziği',
  'category.jazz': 'Jazz',
  'category.news': 'Haber',
  'category.sports': 'Spor',
  'category.talk': 'Söyleşi',
  
  // Errors & Warnings
  apiError: 'API Hatası',
  apiErrorMessage: 'Canlı radyo verileri yüklenemedi. Garantili istasyonlar kullanılacak.',
  connectionError: 'Bağlantı hatası',
  streamError: 'Yayın hatası',
  unsupportedFormat: 'Desteklenmeyen format',
  tryAgain: 'Tekrar deneyin',
  
  // Theme & Language
  lightMode: 'Açık Tema',
  darkMode: 'Koyu Tema',
  turkish: 'Türkçe',
  english: 'İngilizce',

  screens: {
    home: {
      title: 'Türk Radyosu',
      popularStations: 'Popüler İstasyonlar',
      searchPlaceholder: 'Radyo istasyonu ara...'
    },
    favorites: {
      title: 'Favorilerim',
      empty: 'Henüz favori istasyonunuz yok',
      addFirst: 'İlk favori istasyonunuzu ekleyin',
      emptyDescription: 'Beğendiğiniz radyo istasyonlarını favorilere ekleyerek buradan kolayca erişebilirsiniz.'
    },
    recent: {
      title: 'Son Dinlenenler',
      empty: 'Henüz radyo dinlemediğiniz',
      startListening: 'Dinlemeye başlayın',
      emptyDescription: 'Dinlediğiniz radyo istasyonları burada görünecek ve kolayca tekrar erişebilirsiniz.'
    },
    settings: {
      title: 'Ayarlar',
      language: 'Dil',
      sleepTimer: 'Uyku Zamanlayıcısı',
      theme: 'Tema'
    }
  },
  player: {
    nowPlaying: 'Şimdi Çalıyor',
    buffering: 'Arabelleğe alınıyor...',
    connecting: 'Bağlanıyor...',
    connectionError: 'Bağlantı hatası',
    tryAgain: 'Tekrar deneyin'
  }
};
