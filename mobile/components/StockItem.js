import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const StockItem = ({ item }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.product}>{item.product}</Text>
      <Text style={styles.quantity}>Qty: {item.quantity}</Text>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  product: {
    fontSize: 16,
  },
  quantity: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default StockItem;