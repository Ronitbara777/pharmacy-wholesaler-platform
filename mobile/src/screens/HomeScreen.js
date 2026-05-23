import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';


export default function HomeScreen({ navigation }) {
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🏠 Home Screen</Text>
      <Text style={styles.subtitle}>Navigation Test</Text>
      <Button 
        title="Go to Inventory" 
        onPress={() => {
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