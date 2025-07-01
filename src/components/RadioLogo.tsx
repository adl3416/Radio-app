import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

interface RadioLogoProps {
  station: any;
  size?: number;
  failedLogos?: Set<string>;
  handleLogoError?: (stationId: string) => void;
}

export const RadioLogo: React.FC<RadioLogoProps> = ({ 
  station, 
  size = 50, 
  failedLogos = new Set(),
  handleLogoError 
}) => {
  // İlk olarak local asset dosyalarını kontrol et
  if (station.favicon && typeof station.favicon === 'object') {
    // Local asset (require()) kullanılıyorsa direkt göster
    return (
      <Image 
        source={station.favicon}
        style={[styles.modernRadioLogo, { width: size, height: size, borderRadius: size / 2 }]}
        onError={(error) => {
          console.log(`❌ Local favicon hatası: ${station.name}`, error.nativeEvent);
          handleLogoError?.(station.id);
        }}
      />
    );
  }
  
  if (station.logo && typeof station.logo === 'object') {
    // Local asset (require()) kullanılıyorsa direkt göster
    return (
      <Image 
        source={station.logo}
        style={[styles.modernRadioLogo, { width: size, height: size, borderRadius: size / 2 }]}
        onError={(error) => {
          console.log(`❌ Local logo hatası: ${station.name}`, error.nativeEvent);
          handleLogoError?.(station.id);
        }}
      />
    );
  }
  
  // İstasyon adına göre özel logo kontrolü
  if (station.name.toLowerCase().includes('kral')) {
    return (
      <Image 
        source={require('../../assets/kral.png')}
        style={[styles.modernRadioLogo, { width: size, height: size, borderRadius: size / 2 }]}
        onError={(error) => {
          console.log(`❌ Kral FM logo hatası:`, error.nativeEvent);
          handleLogoError?.(station.id);
        }}
      />
    );
  }
  
  // Super FM için özel logo kontrolü
  if (station.name.toLowerCase().includes('super')) {
    return (
      <Image 
        source={require('../../assets/super.png')}
        style={[styles.modernRadioLogo, { width: size, height: size, borderRadius: size / 2 }]}
        onError={(error) => {
          console.log(`❌ Super FM logo hatası:`, error.nativeEvent);
          handleLogoError?.(station.id);
        }}
      />
    );
  }
  
  // Fallback kontrolü - hem favicon hem logo yoksa veya hata aldıysa
  const hasValidUrl = (station.favicon && typeof station.favicon === 'string') || 
                      (station.logo && typeof station.logo === 'string');
  const shouldShowFallback = !hasValidUrl || failedLogos.has(station.id);
  
  if (shouldShowFallback) {
    return (
      <View style={[styles.modernDefaultLogo, { width: size, height: size, borderRadius: size / 2 }]}>
        <Text style={[styles.modernDefaultLogoText, { fontSize: size * 0.4 }]}>
          {station.name.charAt(0).toUpperCase()}
        </Text>
      </View>
    );
  }

  // URL-based logo loading (favicon veya logo)
  const logoUrl = (station.favicon && typeof station.favicon === 'string') ? station.favicon :
                  (station.logo && typeof station.logo === 'string') ? station.logo :
                  'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Radio_icon.svg/32px-Radio_icon.svg.png';
  
  return (
    <Image 
      source={{ uri: logoUrl }}
      style={[styles.modernRadioLogo, { width: size, height: size, borderRadius: size / 2 }]}
      onError={(error) => {
        console.log(`❌ Logo yükleme hatası: ${station.name} - ${logoUrl}`, error.nativeEvent);
        handleLogoError?.(station.id);
      }}
      onLoadStart={() => {
        console.log(`🖼️ Logo yükleniyor: ${station.name} - ${logoUrl}`);
      }}
      onLoad={() => {
        console.log(`✅ Logo başarıyla yüklendi: ${station.name}`);
      }}
      onLoadEnd={() => {
        console.log(`🏁 Logo yükleme tamamlandı: ${station.name}`);
      }}
      defaultSource={require('../../assets/icon.png')}
      resizeMode="cover"
    />
  );
};

const styles = StyleSheet.create({
  modernRadioLogo: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  modernDefaultLogo: {
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  modernDefaultLogoText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
