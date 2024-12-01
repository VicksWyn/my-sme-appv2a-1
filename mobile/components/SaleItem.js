import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const SaleItem = ({ sale }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.product}>{sale.product}</Text>
      <Text style={styles.amount}>${sale.amount}</Text>
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
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SaleItem;