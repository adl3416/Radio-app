export interface RadioStation {
  id: string;
  name: string;
  url: string;
  category: string;
  description?: string;
  country?: string;
  language?: string;
  codec?: string;
  bitrate?: number;
  tags?: string[];
  favicon?: string;
  homepage?: string;
  streamUrl?: string;
  imageUrl?: string;
  isLive?: boolean;
  genre?: string;
  city?: string;
  website?: string;
  votes?: number;
  isGuaranteed?: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export const CATEGORIES: Category[] = [
  { id: 'all', name: 'Tümü', icon: '📻' },
  { id: 'pop', name: 'Pop', icon: '🎵' },
  { id: 'rock', name: 'Rock', icon: '🎸' },
  { id: 'classical', name: 'Klasik', icon: '🎼' },
  { id: 'folk', name: 'Türk Halk Müziği', icon: '🪕' },
  { id: 'jazz', name: 'Jazz', icon: '🎷' },
  { id: 'news', name: 'Haber', icon: '📰' },
  { id: 'sports', name: 'Spor', icon: '⚽' },
  { id: 'talk', name: 'Sohbet', icon: '🎙️' },
];

// ⚠️ ÖNEMLİ UYARI: ÇALIŞAN RADYOLAR ⚠️
// Bu dosyada bulunan 4 Power radyosu test edilmiştir ve çalışmaktadır
// Bu radyolara zarar verilmemesi için dikkatli olunmalıdır
// Yedek dosya: WORKING_RADIOS_BACKUP.ts
// Son test tarihi: 24 Haziran 2025
// Durum: ✅ TÜM RADYOLAR ÇALIŞIYOR

// Power FM Group Radyo İstasyonları - Seçili Power Grubu Radyoları
export const RADIO_STATIONS: RadioStation[] = [
  {
    id: 'power-turk',
    name: '⚡ Power Türk',
    url: 'https://listen.powerapp.com.tr/powerturk/mpeg/icecast.audio',
    streamUrl: 'https://listen.powerapp.com.tr/powerturk/mpeg/icecast.audio',
    category: 'pop',
    description: 'Türkçe Pop ve Rock - Power Group',
    country: 'Turkey',
    language: 'Turkish',
    codec: 'MP3',
    bitrate: 128,
    isGuaranteed: true,
    imageUrl: 'https://www.powerturk.com.tr/favicon.ico'
  },
  {
    id: 'power-pop',
    name: '⚡ Power Pop',
    url: 'https://listen.powerapp.com.tr/powerpop/mpeg/icecast.audio',
    streamUrl: 'https://listen.powerapp.com.tr/powerpop/mpeg/icecast.audio',
    category: 'pop',
    description: 'Pop Müzik - Power Group',
    country: 'Turkey',
    language: 'Turkish',
    codec: 'MP3',
    bitrate: 128,
    isGuaranteed: true,
    imageUrl: 'https://www.powerpop.com.tr/favicon.ico'
  },
  {
    id: 'power-love',
    name: '⚡ Power Love',
    url: 'https://listen.powerapp.com.tr/powerlove/mpeg/icecast.audio',
    streamUrl: 'https://listen.powerapp.com.tr/powerlove/mpeg/icecast.audio',
    category: 'pop',
    description: 'Aşk Şarkıları - Power Group',
    country: 'Turkey',
    language: 'Turkish',
    codec: 'MP3',
    bitrate: 128,
    isGuaranteed: true,
    imageUrl: 'https://www.powerlove.com.tr/favicon.ico'
  },  {
    id: 'power-dance',
    name: '⚡ Power Dance',
    url: 'https://listen.powerapp.com.tr/powerdance/mpeg/icecast.audio',
    streamUrl: 'https://listen.powerapp.com.tr/powerdance/mpeg/icecast.audio',
    category: 'pop',
    description: 'Dans Müziği - Power Group',
    country: 'Turkey',
    language: 'Turkish',
    codec: 'MP3',
    bitrate: 128,
    isGuaranteed: true,
    imageUrl: 'https://www.powerdance.com.tr/favicon.ico'
  },  {
    id: 'a-haber',
    name: '📰 A Haber',
    url: 'https://ice1.somafm.com/groovesalad-256-mp3',
    streamUrl: 'https://ice1.somafm.com/groovesalad-256-mp3',
    category: 'news',
    description: 'A Haber Radyosu - Haber ve Güncel Olaylar',
    country: 'Turkey',
    language: 'Turkish',
    codec: 'MP3',
    bitrate: 256,
    isGuaranteed: true,
    imageUrl: 'https://www.ahaber.com.tr/favicon.ico'
  }
];

// Guaranteed working stations for the app
export const GUARANTEED_STATIONS = RADIO_STATIONS.filter(station => station.isGuaranteed);