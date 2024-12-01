import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

const ReportsScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Reports</Text>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sales Summary</Text>
        {/* Add your reports content here */}
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Stock Status</Text>
        {/* Add your stock status content here */}
      </View>
    </ScrollView>
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
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});

export default ReportsScreen;