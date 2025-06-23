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

// Garantili çalışan ve test edilmiş MP3 formatındaki radyo istasyonları
export const GUARANTEED_STATIONS: RadioStation[] = [
  {
    id: 'test-radio-mp3',
    name: 'Test Radyo (MP3)',
    url: 'https://ice1.somafm.com/groovesalad-256-mp3',
    streamUrl: 'https://ice1.somafm.com/groovesalad-256-mp3',
    category: 'pop',
    description: 'Groove Salad - ÇALIŞIYOR',
    country: 'USA',
    language: 'English',
    codec: 'MP3',
    bitrate: 256,
    imageUrl: 'https://somafm.com/img/groovesalad120.png',
    isLive: true,
    genre: 'Ambient',
    city: 'San Francisco',
    isGuaranteed: true
  },
  {
    id: 'ambient-streams',
    name: 'Ambient Streams',
    url: 'https://ice1.somafm.com/spacestation-256-mp3',
    streamUrl: 'https://ice1.somafm.com/spacestation-256-mp3',
    category: 'classical',
    description: 'Space Station Soma',
    country: 'USA',
    language: 'English',
    codec: 'MP3',
    bitrate: 256,
    imageUrl: 'https://somafm.com/img/spacestation120.png',
    isLive: true,
    genre: 'Ambient',
    city: 'San Francisco',
    isGuaranteed: true
  },
  {
    id: 'folk-forward',
    name: 'Folk Forward',
    url: 'https://ice1.somafm.com/folkfwd-256-mp3',
    streamUrl: 'https://ice1.somafm.com/folkfwd-256-mp3',
    category: 'folk',
    description: 'Folk Music',
    country: 'USA',
    language: 'English',
    codec: 'MP3',
    bitrate: 256,
    imageUrl: 'https://somafm.com/img/folkfwd120.png',
    isLive: true,
    genre: 'Folk',
    city: 'San Francisco',
    isGuaranteed: true
  },
  {
    id: 'electronic-beats',
    name: 'Electronic Beats',
    url: 'https://ice1.somafm.com/beatblender-256-mp3',
    streamUrl: 'https://ice1.somafm.com/beatblender-256-mp3',
    category: 'pop',
    description: 'Beat Blender',
    country: 'USA',
    language: 'English',
    codec: 'MP3',
    bitrate: 256,
    imageUrl: 'https://somafm.com/img/beatblender120.png',
    isLive: true,
    genre: 'Electronic',
    city: 'San Francisco',
    isGuaranteed: true
  },
  {
    id: 'chill-out-radio',
    name: 'Chill Out Radio',
    url: 'https://ice1.somafm.com/dronezone-256-mp3',
    streamUrl: 'https://ice1.somafm.com/dronezone-256-mp3',
    category: 'classical',
    description: 'Drone Zone',
    country: 'USA',
    language: 'English',
    codec: 'MP3',
    bitrate: 256,
    imageUrl: 'https://somafm.com/img/dronezone120.png',
    isLive: true,
    genre: 'Chill',
    city: 'San Francisco',
    isGuaranteed: true
  },
  {
    id: 'radyod',
    name: 'Radyo D',
    url: 'https://n10101m.mediatriple.net/videoonlylive/mtkgeuihrlfwlive/u_stream_5c9e187770cd0_1/playlist.m3u8',
    streamUrl: 'https://playerservices.streamtheworld.com/api/livestream-redirect/RADYOD.mp3',
    category: 'pop',
    description: 'StreamTheWorld MP3',
    country: 'Turkey',
    language: 'Turkish',
    codec: 'MP3',
    bitrate: 128,
    imageUrl: 'https://cdn.onlineradiobox.com/img/logo/9/74599.v6.png',
    isLive: true,
    genre: 'Pop',
    city: 'İstanbul',
    isGuaranteed: true
  },
  {
    id: 'joyfm',
    name: 'Joy FM',
    url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/JOY_FM.mp3',
    streamUrl: 'https://playerservices.streamtheworld.com/api/livestream-redirect/JOY_FM.mp3',
    category: 'pop',
    description: 'StreamTheWorld MP3',
    country: 'Turkey',
    language: 'Turkish',
    codec: 'MP3',
    bitrate: 128,
    imageUrl: 'https://cdn.onlineradiobox.com/img/logo/4/74594.v7.png',
    isLive: true,
    genre: 'Pop',
    city: 'İstanbul',
    isGuaranteed: true
  },
  {
    id: 'metrofm',
    name: 'Metro FM',
    url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/METRO_FM.mp3',
    streamUrl: 'https://playerservices.streamtheworld.com/api/livestream-redirect/METRO_FM.mp3',
    category: 'pop',
    description: 'StreamTheWorld MP3',
    country: 'Turkey',
    language: 'Turkish',
    codec: 'MP3',
    bitrate: 128,
    imageUrl: 'https://cdn.onlineradiobox.com/img/logo/0/74600.v6.png',
    isLive: true,
    genre: 'Pop',
    city: 'İstanbul',
    isGuaranteed: true
  },
  {
    id: 'virgin',
    name: 'Virgin Radio',
    url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/VIRGIN_RADIO.mp3',
    streamUrl: 'https://playerservices.streamtheworld.com/api/livestream-redirect/VIRGIN_RADIO.mp3',
    category: 'rock',
    description: 'StreamTheWorld MP3',
    country: 'Turkey',
    language: 'Turkish',
    codec: 'MP3',
    bitrate: 128,
    imageUrl: 'https://cdn.onlineradiobox.com/img/logo/4/74594.v7.png',
    isLive: true,
    genre: 'Rock',
    city: 'İstanbul',
    isGuaranteed: true
  },
  {
    id: 'slowturk',
    name: 'Slow Türk',
    url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/SLOW_TURK.mp3',
    streamUrl: 'https://playerservices.streamtheworld.com/api/livestream-redirect/SLOW_TURK.mp3',
    category: 'pop',
    description: 'StreamTheWorld MP3',
    country: 'Turkey',
    language: 'Turkish',
    codec: 'MP3',
    bitrate: 128,
    imageUrl: 'https://cdn.onlineradiobox.com/img/logo/4/74594.v7.png',
    isLive: true,
    genre: 'Slow',
    city: 'İstanbul',
    isGuaranteed: true
  }
];

// Ana radyo istasyonları listesi
export const RADIO_STATIONS: RadioStation[] = [
  ...GUARANTEED_STATIONS,
  {
    id: 'radyoeksen',
    name: 'Radyo Eksen',
    url: 'https://trkvz-radyolar.ercdn.net/radyoeksen/playlist.m3u8',
    streamUrl: 'https://trkvz-radyolar.ercdn.net/radyoeksen/playlist.m3u8',
    category: 'rock',
    description: 'Rock müzik',
    country: 'Turkey',
    language: 'Turkish',
    codec: 'MP3',
    bitrate: 128,
    imageUrl: 'https://cdn.onlineradiobox.com/img/logo/4/74594.v7.png',
    isLive: true,
    genre: 'Rock',
    city: 'İstanbul'
  },
  {
    id: 'radyopopular',
    name: 'Radyo Popular',
    url: 'https://trkvz-radyolar.ercdn.net/radyopopular/playlist.m3u8',
    streamUrl: 'https://trkvz-radyolar.ercdn.net/radyopopular/playlist.m3u8',
    category: 'pop',
    description: 'Popüler müzikler',
    country: 'Turkey',
    language: 'Turkish',
    codec: 'MP3',
    bitrate: 128,
    imageUrl: 'https://cdn.onlineradiobox.com/img/logo/4/74594.v7.png',
    isLive: true,
    genre: 'Pop',
    city: 'İstanbul'
  },
  {
    id: 'trtturku',
    name: 'TRT Türkü',
    url: 'https://radio-trtturku.live.trt.com.tr/master_360.m3u8',
    streamUrl: 'https://radio-trtturku.live.trt.com.tr/master_360.m3u8',
    category: 'folk',
    description: 'Türk halk müziği',
    country: 'Turkey',
    language: 'Turkish',
    codec: 'MP3',
    bitrate: 128,
    imageUrl: 'https://www.trt.net.tr/favicon.ico',
    isLive: true,
    genre: 'Türk Halk Müziği',
    city: 'Ankara'
  },
  {
    id: 'trtnagme',
    name: 'TRT Nağme',
    url: 'https://radio-trtnagme.live.trt.com.tr/master_360.m3u8',
    streamUrl: 'https://radio-trtnagme.live.trt.com.tr/master_360.m3u8',
    category: 'classical',
    description: 'Türk sanat müziği',
    country: 'Turkey',
    language: 'Turkish',
    codec: 'MP3',
    bitrate: 128,
    imageUrl: 'https://www.trt.net.tr/favicon.ico',
    isLive: true,
    genre: 'Türk Sanat Müziği',
    city: 'Ankara'
  },
  {
    id: 'trthaber',
    name: 'TRT Haber Radyo',
    url: 'https://radio-trthaber.live.trt.com.tr/master_360.m3u8',
    streamUrl: 'https://radio-trthaber.live.trt.com.tr/master_360.m3u8',
    category: 'news',
    description: 'Güncel haberler',
    country: 'Turkey',
    language: 'Turkish',
    codec: 'MP3',
    bitrate: 128,
    imageUrl: 'https://www.trt.net.tr/favicon.ico',
    isLive: true,
    genre: 'Haber',
    city: 'Ankara'
  },
  {
    id: 'trtspor',
    name: 'TRT Spor Radyo',
    url: 'https://radio-trtspor.live.trt.com.tr/master_360.m3u8',
    streamUrl: 'https://radio-trtspor.live.trt.com.tr/master_360.m3u8',
    category: 'sports',
    description: 'Spor haberleri',
    country: 'Turkey',
    language: 'Turkish',
    codec: 'MP3',
    bitrate: 128,
    imageUrl: 'https://www.trt.net.tr/favicon.ico',
    isLive: true,
    genre: 'Spor',
    city: 'İstanbul'
  },
  {
    id: 'joyfm',
    name: 'Joy FM',
    url: 'https://trkvz-radyolar.ercdn.net/joyfm/playlist.m3u8',
    streamUrl: 'https://trkvz-radyolar.ercdn.net/joyfm/playlist.m3u8',
    category: 'pop',
    description: 'Neşeli müzikler',
    country: 'Turkey',
    language: 'Turkish',
    codec: 'MP3',
    bitrate: 128,
    imageUrl: 'https://cdn.onlineradiobox.com/img/logo/4/74594.v7.png',
    isLive: true,
    genre: 'Pop',
    city: 'İstanbul'
  },
  {
    id: 'bestfm',
    name: 'Best FM',
    url: 'https://trkvz-radyolar.ercdn.net/bestfm/playlist.m3u8',
    streamUrl: 'https://trkvz-radyolar.ercdn.net/bestfm/playlist.m3u8',
    category: 'pop',
    description: 'En iyi müzikler',
    country: 'Turkey',
    language: 'Turkish',
    codec: 'MP3',
    bitrate: 128,
    imageUrl: 'https://cdn.onlineradiobox.com/img/logo/4/74594.v7.png',
    isLive: true,
    genre: 'Pop',
    city: 'İstanbul'
  },
  {
    id: 'virgin',
    name: 'Virgin Radio',
    url: 'https://trkvz-radyolar.ercdn.net/virgin/playlist.m3u8',
    streamUrl: 'https://trkvz-radyolar.ercdn.net/virgin/playlist.m3u8',
    category: 'rock',
    description: 'Rock ve alternatif müzik',
    country: 'Turkey',
    language: 'Turkish',
    codec: 'MP3',
    bitrate: 128,
    imageUrl: 'https://cdn.onlineradiobox.com/img/logo/4/74594.v7.png',
    isLive: true,
    genre: 'Rock',
    city: 'İstanbul'
  },
  {
    id: 'radyosu',
    name: 'Radyo Süper',
    url: 'https://trkvz-radyolar.ercdn.net/radyosu/playlist.m3u8',
    streamUrl: 'https://trkvz-radyolar.ercdn.net/radyosu/playlist.m3u8',
    category: 'pop',
    description: 'Süper hit müzikler',
    country: 'Turkey',
    language: 'Turkish',
    codec: 'MP3',
    bitrate: 128,
    imageUrl: 'https://cdn.onlineradiobox.com/img/logo/4/74594.v7.png',
    isLive: true,
    genre: 'Pop',
    city: 'İstanbul'
  }
];

export default RADIO_STATIONS;
