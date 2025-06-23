import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StyleSheet, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  const [count, setCount] = useState(0);

  const showAlert = () => {
    Alert.alert(
      'Türk Radyosu Test',
      'Uygulama başarıyla çalışıyor! 🎉',
      [{ text: 'Tamam' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.content}>
        <Text style={styles.title}>🎵 Türk Radyosu 🎵</Text>
        <Text style={styles.subtitle}>Test Uygulaması</Text>
        
        <View style={styles.card}>
          <Text style={styles.counterText}>Sayaç: {count}</Text>
          
          <TouchableOpacity
            style={styles.button}
            onPress={() => setCount(count + 1)}
          >
            <Text style={styles.buttonText}>+ Artır</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.alertButton]}
            onPress={showAlert}
          >
            <Text style={styles.buttonText}>Alert Göster</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.resetButton]}
            onPress={() => setCount(0)}
          >
            <Text style={styles.buttonText}>Sıfırla</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>✅ Expo Çalışıyor</Text>
          <Text style={styles.statusText}>✅ React Native Çalışıyor</Text>
          <Text style={styles.statusText}>🎯 Radyo Uygulaması Hazır!</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#3B82F6',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: 'white',
    marginBottom: 40,
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    marginBottom: 30,
    alignItems: 'center',
    minWidth: 280,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  counterText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
    minWidth: 140,
  },
  alertButton: {
    backgroundColor: '#10B981',
  },
  resetButton: {
    backgroundColor: '#F59E0B',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  statusContainer: {
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
});
