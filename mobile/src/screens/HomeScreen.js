import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';

console.log('📱 HomeScreen loaded');

export default function HomeScreen({ navigation }) {
  console.log('📱 HomeScreen rendering');
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🏠 Home Screen</Text>
      <Text style={styles.subtitle}>Navigation Test</Text>
      <Button 
        title="Go to Inventory" 
        onPress={() => {
          console.log('👆 Navigating to Inventory');
          navigation.navigate('Inventory');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
});