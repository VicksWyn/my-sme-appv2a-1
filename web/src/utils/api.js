import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export const fetchSales = async () => {
  try {
    const response = await axios.get(`${API_URL}/sales`);
    return response.data;
  } catch (error) {
    console.error('Error fetching sales:', error);
    throw error;
  }
};

export const createSale = async (saleData) => {
  try {
    const response = await axios.post(`${API_URL}/sales`, saleData);
    return response.data;
  } catch (error) {
    console.error('Error creating sale:', error);
    throw error;
  }
};

export const fetchStock = async () => {
  try {
    const response = await axios.get(`${API_URL}/stock`);
    return response.data;
  } catch (error) {
    console.error('Error fetching stock:', error);
    throw error;
  }
};

export const updateStock = async (stockData) => {
  try {
    const response = await axios.post(`${API_URL}/stock`, stockData);
    return response.data;
  } catch (error) {
    console.error('Error updating stock:', error);
    throw error;
  }
};