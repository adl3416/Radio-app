import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StyleSheet, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  const [count, setCount] = React.useState(0);

  const showAlert = () => {
    Alert.alert(
      'Türk Radyosu',
      'Uygulama başarıyla çalışıyor! 🎉\n\nŞimdi tam radyo uygulamasını aktif edebiliriz.',
      [{ text: 'Harika!' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.content}>
        <Text style={styles.title}>🎵 Türk Radyosu 🎵</Text>
        <Text style={styles.subtitle}>Başarıyla Çalışıyor!</Text>
        
        <View style={styles.testSection}>
          <Text style={styles.testText}>Test Sayacı: {count}</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => setCount(count + 1)}
          >
            <Text style={styles.buttonText}>Sayacı Artır</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.alertButton]}
            onPress={showAlert}
          >
            <Text style={styles.buttonText}>Test Alert</Text>
          </TouchableOpacity>
        </View>
          <View style={styles.infoSection}>
          <Text style={styles.infoText}>✅ React Native OK</Text>
          <Text style={styles.infoText}>✅ Expo OK</Text>
          <Text style={styles.infoText}>✅ TouchableOpacity OK</Text>
          <Text style={styles.infoText}>✅ Alert OK</Text>
          <Text style={styles.successText}>🎯 Radyo uygulaması hazır!</Text>
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
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: 'white',
    marginBottom: 40,
    textAlign: 'center',
  },
  testSection: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 30,
    alignItems: 'center',
    minWidth: 250,
  },
  testText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  alertButton: {
    backgroundColor: '#10B981',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  infoSection: {
    alignItems: 'center',
  },
  infoText: {
    fontSize: 16,
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  successText: {
    fontSize: 18,
    color: '#FBBF24',
    marginTop: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
