import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Picker } from 'react-native';
import { supabase } from '../lib/supabase';

const SalesScreen = () => {
  const [sale, setSale] = useState({ 
    product_id: '', 
    quantity: '',
    unit_price: '',
    unit_of_measure: 'piece'
  });
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('stock_items')
        .select('id, name, unit_price, quantity, unit_of_measure, custom_unit')
        .order('name');

      if (error) throw error;
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error.message);
    }
  };

  const handleProductSelect = (productId) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setSelectedProduct(product);
      setSale(prev => ({
        ...prev,
        product_id: productId,
        unit_price: product.unit_price.toString(),
        unit_of_measure: product.unit_of_measure
      }));
    }
  };

  const handleSubmit = async () => {
    try {
      if (!selectedProduct) {
        alert('Please select a product');
        return;
      }

      const quantity = parseFloat(sale.quantity);
      if (isNaN(quantity) || quantity <= 0) {
        alert('Please enter a valid quantity');
        return;
      }

      if (quantity > selectedProduct.quantity) {
        alert('Not enough stock available');
        return;
      }

      // Create the sale record
      const { error: saleError } = await supabase
        .from('sales_items')
        .insert([{
          stock_item_id: sale.product_id,
          quantity: quantity,
          unit_price: parseFloat(sale.unit_price)
        }]);

      if (saleError) throw saleError;

      // Update stock quantity
      const { error: stockError } = await supabase
        .from('stock_items')
        .update({ quantity: selectedProduct.quantity - quantity })
        .eq('id', sale.product_id);

      if (stockError) throw stockError;

      alert('Sale recorded successfully');
      setSale({ 
        product_id: '', 
        quantity: '',
        unit_price: '',
        unit_of_measure: 'piece'
      });
      setSelectedProduct(null);
      fetchProducts(); // Refresh product list
    } catch (error) {
      console.error('Error submitting sale:', error.message);
      alert('Failed to record sale');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Record Sale</Text>
      
      <Text style={styles.label}>Product</Text>
      <Picker
        selectedValue={sale.product_id}
        style={styles.picker}
        onValueChange={handleProductSelect}>
        <Picker.Item label="Select a product" value="" />
        {products.map(product => (
          <Picker.Item 
            key={product.id} 
            label={`${product.name} (${product.unit_of_measure === 'other' ? product.custom_unit : product.unit_of_measure})`} 
            value={product.id} 
          />
        ))}
      </Picker>

      {selectedProduct && (
        <>
          <Text style={styles.stockInfo}>
            Available: {selectedProduct.quantity} {selectedProduct.unit_of_measure === 'other' 
              ? selectedProduct.custom_unit 
              : selectedProduct.unit_of_measure}
          </Text>
          
          <Text style={styles.label}>Quantity</Text>
          <TextInput
            style={styles.input}
            placeholder={`Quantity (in ${selectedProduct.unit_of_measure === 'other' 
              ? selectedProduct.custom_unit 
              : selectedProduct.unit_of_measure})`}
            keyboardType="numeric"
            value={sale.quantity}
            onChangeText={(text) => setSale(prev => ({ ...prev, quantity: text }))}
          />

          <Text style={styles.label}>Unit Price</Text>
          <TextInput
            style={styles.input}
            placeholder="Unit Price"
            keyboardType="numeric"
            value={sale.unit_price}
            onChangeText={(text) => setSale(prev => ({ ...prev, unit_price: text }))}
          />

          <Text style={styles.total}>
            Total: ${((parseFloat(sale.quantity) || 0) * (parseFloat(sale.unit_price) || 0)).toFixed(2)}
          </Text>
        </>
      )}

      <Button 
        title="Record Sale" 
        onPress={handleSubmit}
        disabled={!selectedProduct || !sale.quantity || !sale.unit_price}
      />
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
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: '#666',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
  },
  picker: {
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 15,
    borderRadius: 5,
  },
  stockInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  total: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 15,
    color: '#2196F3',
  },
});

export default SalesScreen;