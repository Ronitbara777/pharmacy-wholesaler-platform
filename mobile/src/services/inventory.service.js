import api from './api';

const InventoryService = {
  // Get all products with filters
  getProducts: async (params = {}) => {
    try {
      console.log('📦 API Call - getProducts with params:', params);
      const queryString = new URLSearchParams(params).toString();
      const url = `/products?${queryString}`;
      console.log('📦 API URL:', url);
      
      const response = await api.get(url);
      console.log('📦 API Response - getProducts:', response);
      return response;
    } catch (error) {
      console.error('❌ Error fetching products:', error);
      console.error('❌ Error response:', error.response?.data);
      throw error;
    }
  },

  // Get single product by ID
  getProductById: async (id) => {
    try {
      console.log('📦 API Call - getProductById:', id);
      const response = await api.get(`/products/${id}`);
      console.log('📦 API Response - getProductById:', response);
      return response;
    } catch (error) {
      console.error('❌ Error fetching product:', error);
      throw error;
    }
  },

  // Create new product
  createProduct: async (productData) => {
    try {
      console.log('📦 API Call - createProduct with data:', productData);
      const response = await api.post('/products', productData);
      console.log('📦 API Response - createProduct:', response);
      return response;
    } catch (error) {
      console.error('❌ Error creating product:', error);
      console.error('❌ Error response:', error.response?.data);
      throw error;
    }
  },

  // Update product
  // Update product
updateProduct: async (id, productData) => {
  try {
    console.log('📦 API Call - updateProduct ID:', id);
    console.log('📦 API Call - updateProduct data:', productData);
    
    const response = await api.put(`/products/${id}`, productData);
    
    console.log('📦 API Response - updateProduct:', response);
    return response;
  } catch (error) {
    console.error('❌ Error updating product:', error);
    console.error('❌ Error response:', error.response?.data);
    throw error;
  }
},

  // Delete product
  deleteProduct: async (id) => {
    try {
      console.log('📦 API Call - deleteProduct ID:', id);
      const response = await api.delete(`/products/${id}`);
      console.log('📦 API Response - deleteProduct:', response);
      return response;
    } catch (error) {
      console.error('❌ Error deleting product:', error);
      console.error('❌ Error response:', error.response?.data);
      throw error;
    }
  },

  // Get all warehouses for filter
  getWarehouses: async () => {
    try {
      console.log('📦 API Call - getWarehouses');
      const response = await api.get('/warehouses');
      console.log('📦 API Response - getWarehouses:', response);
      return response;
    } catch (error) {
      console.error('❌ Error fetching warehouses:', error);
      throw error;
    }
  },

  // Get categories (from products)
  getCategories: async () => {
    try {
      console.log('📦 API Call - getCategories');
      const response = await api.get('/products');
      if (response.success) {
        const categories = [...new Set(response.data.map(p => p.category).filter(Boolean))];
        console.log('📦 Categories found:', categories);
        return { success: true, data: categories };
      }
      return response;
    } catch (error) {
      console.error('❌ Error fetching categories:', error);
      throw error;
    }
  }
};

export default InventoryService;