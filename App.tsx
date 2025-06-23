import React, { useState, useEffect } from 'react';
import { View, StatusBar, Modal, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Import i18n configuration
import './src/locales/i18n';

// Import screens
import { HomeScreen } from './src/screens/HomeScreen';
import { FavoritesScreen } from './src/screens/FavoritesScreen';
import { RecentScreen } from './src/screens/RecentScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { Player } from './src/components/Player';

// Import types
import { RadioStation } from './src/constants/radioStations';
import { audioService, PlaybackState } from './src/services/audioService';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabNavigator() {
  const [selectedStation, setSelectedStation] = useState<RadioStation | null>(null);
  const [showPlayer, setShowPlayer] = useState(false);
  const [playbackState, setPlaybackState] = useState<PlaybackState>(audioService.getState());

  useEffect(() => {
    const unsubscribe = audioService.subscribe(setPlaybackState);
    return unsubscribe;
  }, []);

  const handleStationPress = async (station: RadioStation) => {
    try {
      await audioService.playStation(station);
      setSelectedStation(station);
      setShowPlayer(true);
    } catch (error) {
      console.error('Failed to play station:', error);
      // Still show player even if audio fails, user can try again
      setSelectedStation(station);
      setShowPlayer(true);
    }
  };

  const handleOpenPlayer = () => {
    if (playbackState.currentStation) {
      setShowPlayer(true);
    }
  };

  const handleClosePlayer = () => {
    setShowPlayer(false);
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
            <HomeScreen
              {...props}
              onStationPress={handleStationPress}
              onOpenPlayer={handleOpenPlayer}
            />
          )}
        </Tab.Screen>
        <Tab.Screen name="Favoriler">
          {(props) => (
            <FavoritesScreen
              {...props}
              onStationPress={handleStationPress}
              onOpenPlayer={handleOpenPlayer}
            />
          )}
        </Tab.Screen>
        <Tab.Screen name="Geçmiş">
          {(props) => (
            <RecentScreen
              {...props}
              onStationPress={handleStationPress}
              onOpenPlayer={handleOpenPlayer}
            />
          )}
        </Tab.Screen>
        <Tab.Screen name="Ayarlar" component={SettingsScreen} />
      </Tab.Navigator>

      {/* Mini Player */}
      {playbackState.currentStation && !showPlayer && (
        <Player isMinimized={true} onClose={handleOpenPlayer} />
      )}

      {/* Full Screen Player Modal */}
      <Modal
        visible={showPlayer}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <Player onClose={handleClosePlayer} />
      </Modal>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      <NavigationContainer>
        <TabNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
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
