import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';

const StockScreen = () => {
  const [stock, setStock] = useState({ product: '', quantity: '' });

  const handleSubmit = () => {
    console.log('Stock updated:', stock);
    // Add API call here
    setStock({ product: '', quantity: '' });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Update Stock</Text>
      <TextInput
        style={styles.input}
        placeholder="Product Name"
        value={stock.product}
        onChangeText={(text) => setStock({ ...stock, product: text })}
      />
      <TextInput
        style={styles.input}
        placeholder="Quantity"
        keyboardType="numeric"
        value={stock.quantity}
        onChangeText={(text) => setStock({ ...stock, quantity: text })}
      />
      <Button title="Update Stock" onPress={handleSubmit} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
});

export default StockScreen;