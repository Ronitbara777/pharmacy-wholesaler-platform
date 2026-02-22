import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';

export default function InventoryTestScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>📦 Inventory Screen</Text>
      <Button 
        title="Go Back" 
        onPress={() => navigation.goBack()}
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
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});