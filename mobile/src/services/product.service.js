import api from './api';

const ProductService = {
  // Get all products with filters
  getProducts: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`/products?${queryString}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Get single product by ID
  getProductById: async (id) => {
    try {
      const response = await api.get(`/products/${id}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Create new product
  createProduct: async (productData) => {
    try {
      const response = await api.post('/products', productData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Update product
  updateProduct: async (id, productData) => {
    try {
      const response = await api.put(`/products/${id}`, productData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Delete product
  deleteProduct: async (id) => {
    try {
      const response = await api.delete(`/products/${id}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Get product stats for dashboard
  getProductStats: async () => {
    try {
      const response = await api.get('/products/stats');
      return response;
    } catch (error) {
      throw error;
    }
  },
};

export default ProductService;