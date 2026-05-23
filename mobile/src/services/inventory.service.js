import api from './api';

const InventoryService = {
  // Get all products with filters
  getProducts: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `/products?${queryString}`;
      
      const response = await api.get(url);
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
      const response = await api.get(`/products/${id}`);
      return response;
    } catch (error) {
      console.error('❌ Error fetching product:', error);
      throw error;
    }
  },

  // Create new product
  createProduct: async (productData) => {
    try {
      const response = await api.post('/products', productData);
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
    
    const response = await api.put(`/products/${id}`, productData);
    
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
      const response = await api.delete(`/products/${id}`);
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
      const response = await api.get('/warehouses');
      return response;
    } catch (error) {
      console.error('❌ Error fetching warehouses:', error);
      throw error;
    }
  },

  // Get categories (from products)
  getCategories: async () => {
    try {
      const response = await api.get('/products');
      if (response.success) {
        const categories = [...new Set(response.data.map(p => p.category).filter(Boolean))];
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