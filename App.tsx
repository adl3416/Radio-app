import React, { useState, useEffect } from 'react';
import { View, StatusBar, Modal, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Import i18n configuration
import './src/locales/i18n';

// Import contexts
import { AppProvider } from './src/contexts/AppContext';

// Import screens
import { UltraModernHomeScreen } from './src/screens/UltraModernHomeScreen';
import { ModernFavoritesScreen } from './src/screens/ModernFavoritesScreen';
import { ModernRecentScreen } from './src/screens/ModernRecentScreen';
import { ModernSettingsScreen } from './src/screens/ModernSettingsScreen';
import { ModernPlayer } from './src/components/ModernPlayer';
import { VinylPlayer } from './src/components/VinylPlayer';

// Import types
import { RadioStation } from './src/constants/radioStations';
import { audioService, PlaybackState } from './src/services/audioService';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabNavigator() {
  const [selectedStation, setSelectedStation] = useState<RadioStation | null>(null);
  const [showPlayer, setShowPlayer] = useState(false);
  const [showVinylPlayer, setShowVinylPlayer] = useState(false);
  const [playbackState, setPlaybackState] = useState<PlaybackState>(audioService.getState());

  useEffect(() => {
    const unsubscribe = audioService.subscribe(setPlaybackState);
    return unsubscribe;
  }, []);

  const handleStationPress = async (station: RadioStation) => {
    try {
      console.log('🎵 [APP] Attempting to play station:', station.name);
      console.log('🎵 [APP] Before setShowVinylPlayer - current state:', showVinylPlayer);
      await audioService.playStation(station);
      console.log('✅ [APP] Successfully started station:', station.name);
      setSelectedStation(station);
      setShowVinylPlayer(true); // RADYO ÇINARI Vinyl Player'ı aç
      console.log('🎵 [APP] After setShowVinylPlayer - should be true:', true);
      console.log('🎭 [APP] VinylPlayer will be rendered with props - isVisible:', true, 'currentStation:', station.name);
    } catch (error) {
      console.error('❌ [APP] Failed to play station:', error);
      setSelectedStation(station);
      setShowVinylPlayer(true); // RADYO ÇINARI Vinyl Player'ı aç
      console.log('🎵 [APP] After setShowVinylPlayer (error case) - should be true:', true);
      console.log('🎭 [APP] VinylPlayer will be rendered with props (error) - isVisible:', true, 'currentStation:', station.name);
    }
  };

  const handleOpenPlayer = () => {
    if (playbackState.currentStation) {
      setShowVinylPlayer(true);
    }
  };

  const handleClosePlayer = () => {
    setShowVinylPlayer(false);
  };

  return (
    <View style={styles.container}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: string;

            if (route.name === 'Anasayfa') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Favoriler') {
              iconName = focused ? 'heart' : 'heart-outline';
            } else if (route.name === 'Geçmiş') {
              iconName = focused ? 'time' : 'time-outline';
            } else if (route.name === 'Ayarlar') {
              iconName = focused ? 'settings' : 'settings-outline';
            } else {
              iconName = 'radio-outline';
            }

            return <Ionicons name={iconName as any} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#3B82F6',
          tabBarInactiveTintColor: '#6B7280',
          tabBarStyle: styles.tabBar,
          tabBarLabelStyle: styles.tabBarLabel,
          headerShown: false,
        })}
      >
        <Tab.Screen name="Anasayfa">
          {(props) => (
            <UltraModernHomeScreen
              {...props}
              onStationPress={handleStationPress}
              onOpenPlayer={handleOpenPlayer}
            />
          )}
        </Tab.Screen>
        <Tab.Screen name="Favoriler">
          {(props) => (
            <ModernFavoritesScreen
              {...props}
              onStationPress={handleStationPress}
              onOpenPlayer={handleOpenPlayer}
            />
          )}
        </Tab.Screen>
        <Tab.Screen name="Geçmiş">
          {(props) => (
            <ModernRecentScreen
              {...props}
              onStationPress={handleStationPress}
              onOpenPlayer={handleOpenPlayer}
            />
          )}
        </Tab.Screen>
        <Tab.Screen name="Ayarlar" component={ModernSettingsScreen} />
      </Tab.Navigator>

      {/* Mini Player */}
      {playbackState.currentStation && !showVinylPlayer && (
        <ModernPlayer isMinimized={true} onClose={handleOpenPlayer} />
      )}

      {/* RADYO ÇINARI - Vinyl Player */}
      <VinylPlayer 
        isVisible={showVinylPlayer} 
        onClose={handleClosePlayer} 
      />
    </View>
  );
}

export default function App() {
  return (
    <AppProvider>
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        <NavigationContainer>
          <TabNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingBottom: 4,
    paddingTop: 4,
    height: 60,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
});
