// Çalışan Türk Radyo İstasyonları
// Oluşturulma tarihi: 2025-06-24
// Toplam istasyon: 23
// Kaynak: Radio Browser API + URL Test

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

export const WORKING_RADIO_STATIONS: RadioStation[] = [
  {
    id: "96201b3d-0601-11e8-ae97-52543be04c81",
    name: "Arabesk FM",
    url: "http://yayin.arabeskfm.biz:8042/",
    category: "Müzik",
    description: "Türkiye • 80kbps",
    country: "Türkiye",
    language: "turkish",
    codec: "AAC+",
    bitrate: 80,
    votes: 24963,
    isGuaranteed: true, // API test ile doğrulandı
    homepage: "http://www.arabeskfm.biz/",
    favicon: "",
    isLive: true
  },
  {
    id: "f3dfbec0-8ddb-457c-94cd-368631337c0f",
    name: "DAMAR TURK FM",
    url: "https://live.radyositesihazir.com:10997/",
    category: "Genel",
    description: "Türkiye • 128kbps",
    country: "Türkiye",
    language: "french,german,turkish",
    codec: "MP3",
    bitrate: 128,
    votes: 14408,
    isGuaranteed: true, // API test ile doğrulandı
    homepage: "https://www.damarturkfm.com/",
    favicon: "https://www.damarturkfm.com/favicon.ico",
    isLive: true
  },
  {
    id: "1e0dcee9-bfb6-41a4-8356-e8c4540dfcf0",
    name: "Radyo Şiran",
    url: "https://live.radyositesihazir.com/8078/stream",
    category: "Türk Halk Müziği",
    description: "Türkiye • 128kbps",
    country: "Türkiye",
    language: "turkish",
    codec: "MP3",
    bitrate: 128,
    votes: 12711,
    isGuaranteed: true, // API test ile doğrulandı
    homepage: "https://live.radyositesihazir.com/8078/stream",
    favicon: "",
    isLive: true
  },
  {
    id: "fb1fd397-78fd-11ea-8a3b-52543be04c81",
    name: "Power POP",
    url: "https://listen.powerapp.com.tr/powerpop/128/chunks.m3u8",
    category: "Pop",
    description: "Türkiye • Unknownkbps",
    country: "Türkiye",
    language: "turkish",
    codec: "UNKNOWN",
    bitrate: 128,
    votes: 9032,
    isGuaranteed: true, // API test ile doğrulandı
    homepage: "https://www.powerapp.com.tr/powerpop/",
    favicon: "https://www.powerapp.com.tr/i/favicov2/apple-icon-120x120.png?v=817",
    isLive: true
  },
  {
    id: "8c0eaabf-29b1-4fae-86f1-e7cfa7ec4953",
    name: "Radio 5 Turkey",
    url: "http://radyo.yayin.com.tr:4108/stream",
    category: "Hit Müzikler",
    description: "Türkiye • 128kbps",
    country: "Türkiye",
    language: "english",
    codec: "AAC+",
    bitrate: 128,
    votes: 8872,
    isGuaranteed: true, // API test ile doğrulandı
    homepage: "https://www.radio5.com.tr/",
    favicon: "https://radio5.com.tr/wp-content/plugins/under-construction-page/themes/images/favicon.png",
    isLive: true
  },
  {
    id: "09f8922f-56bb-41bd-ad35-a7e54c5520e3",
    name: "KRAL TÜRK FM",
    url: "https://live.radyositesihazir.com/8032/stream",
    category: "Genel",
    description: "Türkiye • 128kbps",
    country: "Türkiye",
    language: "turkish",
    codec: "MP3",
    bitrate: 128,
    votes: 7890,
    isGuaranteed: true, // API test ile doğrulandı
    homepage: "https://live.radyositesihazir.com/8032/stream",
    favicon: "",
    isLive: true
  },
  {
    id: "862444ed-dcfb-4c23-b2ad-b85d5c8f91ba",
    name: "a HABER",
    url: "https://trkvz-radyolar.ercdn.net/ahaberradyo/playlist.m3u8",
    category: "Genel",
    description: "Türkiye • 64kbps",
    country: "Türkiye",
    language: "turkish",
    codec: "AAC",
    bitrate: 64,
    votes: 6055,
    isGuaranteed: true, // API test ile doğrulandı
    homepage: "https://www.ahaber.com.tr/",
    favicon: "",
    isLive: true
  },
  {
    id: "b3e6320b-0ffc-4d4e-a999-2467897b17e6",
    name: "Radyo Fenomen",
    url: "https://live.radyofenomen.com/fenomen/128/icecast.audio",
    category: "Müzik",
    description: "Türkiye • 56kbps",
    country: "Türkiye",
    language: "turkish",
    codec: "AAC+",
    bitrate: 56,
    votes: 5269,
    isGuaranteed: true, // API test ile doğrulandı
    homepage: "https://www.radyofenomen.com/",
    favicon: "",
    isLive: true
  },
  {
    id: "de28a78a-6cee-453d-b9df-13557334dfdb",
    name: "Radyo Seymen",
    url: "https://yayin.radyoseymen.com.tr:1070/stream",
    category: "Genel",
    description: "Türkiye • 128kbps",
    country: "Türkiye",
    language: "turkish",
    codec: "AAC+",
    bitrate: 128,
    votes: 4293,
    isGuaranteed: true, // API test ile doğrulandı
    homepage: "https://www.radyoseymen.com.tr/",
    favicon: "",
    isLive: true
  },
  {
    id: "1ca0c477-cdb5-4e7e-a6b2-db854e6b311d",
    name: "DamarTurk FM",
    url: "https://live.radyositesihazir.com:10997/stream?type=http&nocache=99881",
    category: "Genel",
    description: "Türkiye • 128kbps",
    country: "Türkiye",
    language: "turkish",
    codec: "MP3",
    bitrate: 128,
    votes: 3940,
    isGuaranteed: true, // API test ile doğrulandı
    homepage: "https://www.damarturkfm.com/",
    favicon: "https://www.damarturkfm.com/favicon.ico",
    isLive: true
  },
  {
    id: "706def0c-7017-4601-8305-db1cdb2e9420",
    name: "Super Fm",
    url: "https://23543.live.streamtheworld.com:443/SUPER_FM_SC",
    category: "Pop",
    description: "Türkiye • 64kbps",
    country: "Türkiye",
    language: "turkish",
    codec: "MP3",
    bitrate: 64,
    votes: 3408,
    isGuaranteed: true, // API test ile doğrulandı
    homepage: "https://superfm.com.tr/",
    favicon: "https://superfm.com.tr/favicon.ico",
    isLive: true
  },
  {
    id: "63410135-4ae6-11e8-9b06-52543be04c81",
    name: "RS FM",
    url: "https://icecast-rian.cdnvideo.ru/voicestm",
    category: "Genel",
    description: "Türkiye • 128kbps",
    country: "Türkiye",
    language: "turkish",
    codec: "MP3",
    bitrate: 128,
    votes: 2899,
    isGuaranteed: true, // API test ile doğrulandı
    homepage: "",
    favicon: "",
    isLive: true
  },
  {
    id: "2a372113-4b74-41aa-a1e8-3dcb5d66de61",
    name: "JOY TÜRK TURKEY",
    url: "https://27913.live.streamtheworld.com:443/JOY_TURK_SC?/",
    category: "Genel",
    description: "Türkiye • 64kbps",
    country: "Türkiye",
    language: "turkish",
    codec: "MP3",
    bitrate: 64,
    votes: 1825,
    isGuaranteed: true, // API test ile doğrulandı
    homepage: "https://playerservices.streamtheworld.com/api/livestream-redirect/JOY_TURK_SC?/",
    favicon: "",
    isLive: true
  },
  {
    id: "5509836d-9ca5-4584-bd61-86298fa725b4",
    name: "Number one",
    url: "https://n10101m.mediatriple.net/numberone",
    category: "Genel",
    description: "Türkiye • 32kbps",
    country: "Türkiye",
    language: "turkish",
    codec: "AAC+",
    bitrate: 32,
    votes: 1774,
    isGuaranteed: true, // API test ile doğrulandı
    homepage: "https://numberone.com.tr/",
    favicon: "",
    isLive: true
  },
  {
    id: "6420aa7b-70b7-4239-aa43-e3fb17638b0b",
    name: "Diyanet Radyo",
    url: "https://eustr73.mediatriple.net/videoonlylive/mtikoimxnztxlive/broadcast_5e3c1171d7d2a.smil/playlist.m3u8",
    category: "Genel",
    description: "Türkiye • 140kbps",
    country: "Türkiye",
    language: "turkish",
    codec: "AAC",
    bitrate: 140,
    votes: 1615,
    isGuaranteed: true, // API test ile doğrulandı
    homepage: "https://www.diyanetradyo.com/Canli-Dinle",
    favicon: "",
    isLive: true
  },
  {
    id: "4bead555-fefa-401b-b9e1-e5f525c714b8",
    name: "Numberone Turk",
    url: "https://n10101m.mediatriple.net/numberoneturk",
    category: "Pop",
    description: "Türkiye • 32kbps",
    country: "Türkiye",
    language: "turkish",
    codec: "AAC+",
    bitrate: 32,
    votes: 1467,
    isGuaranteed: true, // API test ile doğrulandı
    homepage: "https://www.numberone.com.tr/2015/12/17/nr1-turk-fm-dinle-canli-radyo-dinle/",
    favicon: "",
    isLive: true
  },
  {
    id: "a96f83d1-d225-4eda-91cd-1a99dc230032",
    name: "Alem Fm",
    url: "https://turkmedya.radyotvonline.net/alemfmaac",
    category: "Klasik",
    description: "Türkiye • 128kbps",
    country: "Türkiye",
    language: "turkish",
    codec: "AAC",
    bitrate: 128,
    votes: 1382,
    isGuaranteed: true, // API test ile doğrulandı
    homepage: "https://www.alemfm.com/",
    favicon: "https://www.alemfm.com/assets/img/alemfm-apple-touch-icon.png",
    isLive: true
  },
  {
    id: "6f54c6a5-7032-4a86-b00e-21f1169f678a",
    name: "SUPER FM 2 TURKEY",
    url: "https://25583.live.streamtheworld.com:443/SUPER2_SC?/",
    category: "Genel",
    description: "Türkiye • 64kbps",
    country: "Türkiye",
    language: "turkish",
    codec: "MP3",
    bitrate: 64,
    votes: 1231,
    isGuaranteed: true, // API test ile doğrulandı
    homepage: "https://playerservices.streamtheworld.com/api/livestream-redirect/SUPER2_SC?/",
    favicon: "",
    isLive: true
  },
  {
    id: "585600d9-bdc4-4a2e-93c5-2421041cc55c",
    name: "Radyo 45lik yeni",
    url: "https://stream.radyo45lik.com:4545/",
    category: "Müzik",
    description: "Türkiye • 128kbps",
    country: "Türkiye",
    language: "turkish",
    codec: "AAC+",
    bitrate: 128,
    votes: 1189,
    isGuaranteed: true, // API test ile doğrulandı
    homepage: "https://www.radyo45lik.com/",
    favicon: "",
    isLive: true
  },
  {
    id: "f17523b9-2e77-46f3-8851-cdd842ca5b8f",
    name: "Metro fm turkey",
    url: "https://28513.live.streamtheworld.com:443/METRO_FM_SC",
    category: "Genel",
    description: "Türkiye • 64kbps",
    country: "Türkiye",
    language: "turkish",
    codec: "MP3",
    bitrate: 64,
    votes: 1151,
    isGuaranteed: true, // API test ile doğrulandı
    homepage: "https://playerservices.streamtheworld.com/api/livestream-redirect/METRO_FM_SC?",
    favicon: "",
    isLive: true
  },
  {
    id: "f940cc74-1673-4bc8-adbc-832d5d51a012",
    name: "Kurd1 FM",
    url: "https://listen.radioking.com/radio/119251/stream/158701",
    category: "Türk Halk Müziği",
    description: "Türkiye • 128kbps",
    country: "Türkiye",
    language: "kurdish",
    codec: "MP3",
    bitrate: 128,
    votes: 1141,
    isGuaranteed: true, // API test ile doğrulandı
    homepage: "https://www.kurd1radyo.com/",
    favicon: "",
    isLive: true
  },
  {
    id: "c06ef146-a5b0-485f-a6e3-1df09514a5bf",
    name: "Kurd1 ",
    url: "https://listen.radioking.com/radio/119251/stream/158701",
    category: "Klasik",
    description: "Türkiye • 128kbps",
    country: "Türkiye",
    language: "turkish",
    codec: "MP3",
    bitrate: 128,
    votes: 1140,
    isGuaranteed: true, // API test ile doğrulandı
    homepage: "",
    favicon: "",
    isLive: true
  },
  {
    id: "dff6fd72-58fe-4eb5-8bf7-c3f76f5375ca",
    name: "TRT NAĞME",
    url: "https://tv-trtmuzik.medya.trt.com.tr/master_720.m3u8",
    category: "Genel",
    description: "Türkiye • Unknownkbps",
    country: "Türkiye",
    language: "turkish",
    codec: "UNKNOWN",
    bitrate: 128,
    votes: 1103,
    isGuaranteed: true, // API test ile doğrulandı
    homepage: "https://tv-trtmuzik.medya.trt.com.tr/master_720.m3u8",
    favicon: "https://cdn-i.pr.trt.com.tr/trtdinle//w768/q70/12467465.jpeg",
    isLive: true
  }
];

export default WORKING_RADIO_STATIONS;
