import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  RefreshControl,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Text,
  Searchbar,
  Chip,
  Button,
  Divider,
  FAB,
  Menu,
  IconButton,
  Avatar,
  Badge,
  ActivityIndicator,
  Portal,
  Dialog,
  TextInput,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import InventoryService from '../services/inventory.service';

console.log('📦 InventoryScreen loaded');

export default function InventoryScreen({ navigation }) {
  console.log('📦 InventoryScreen rendering');
  
  // State for data
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // UI State
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedWarehouse, setSelectedWarehouse] = useState('All');
  const [sortBy, setSortBy] = useState('name');
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);
  
  // Modal states
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [addEditModalVisible, setAddEditModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form state for add/edit
  const [formData, setFormData] = useState({
    name: '',
    batchNumber: '',
    expiryDate: '',
    quantity: '',
    price: '',
    mrp: '',
    company: '',
    category: '',
    warehouseId: '',
    shelf: '',
    rack: '',
    reorderLevel: '100',
  });

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const limit = 10;

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load data when filters change
  useEffect(() => {
    if (!loading) {
      loadProducts();
    }
  }, [page, selectedCategory, selectedWarehouse, searchQuery, sortBy]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Load warehouses and categories in parallel
      const [warehousesRes, categoriesRes] = await Promise.all([
        InventoryService.getWarehouses(),
        InventoryService.getCategories(),
      ]);

      if (warehousesRes?.success) {
        setWarehouses(warehousesRes.data);
      }

      if (categoriesRes?.success) {
        setCategories(['All', ...categoriesRes.data]);
      }

      // Load products
      await loadProducts();

    } catch (error) {
      console.error('Error loading initial data:', error);
      Alert.alert('Error', 'Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
  try {
    console.log('📦 ===== LOADING PRODUCTS =====');
    console.log('📦 Current filters:', {
      page,
      limit,
      search: searchQuery,
      category: selectedCategory,
      warehouse: selectedWarehouse,
      sortBy
    });

    const params = {
      page,
      limit,
      sortBy,
      sortOrder: 'asc',
    };

    // Only add params if they have values
    if (searchQuery && searchQuery.trim() !== '') {
      params.search = searchQuery.trim();
    }

    if (selectedCategory && selectedCategory !== 'All') {
      params.category = selectedCategory;
    }

    if (selectedWarehouse && selectedWarehouse !== 'All') {
      params.warehouseId = selectedWarehouse;
    }

    console.log('📦 Request params:', params);

    const response = await InventoryService.getProducts(params);
    
    console.log('📦 Full API Response:', JSON.stringify(response, null, 2));

    if (response && response.success) {
      console.log('📦 Products data:', response.data);
      console.log('📦 Number of products:', response.data?.length || 0);
      console.log('📦 Pagination:', response.pagination);
      
      if (response.data && response.data.length > 0) {
        console.log('📦 First product:', response.data[0]);
        setProducts(response.data);
      } else {
        console.log('📦 No products returned from API');
        setProducts([]);
      }
      
      setTotalPages(response.pagination?.pages || 1);
      setTotalProducts(response.pagination?.total || 0);
    } else {
      console.log('📦 API response not successful:', response);
      setProducts([]);
    }
  } catch (error) {
    console.error('❌ Error loading products:', error);
    console.error('❌ Error details:', error.response?.data || error.message);
    Alert.alert('Error', 'Failed to load products');
  } finally {
    console.log('📦 ===== LOADING COMPLETE =====');
  }
};

  const onRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    await loadProducts();
    setRefreshing(false);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    setPage(1); // Reset to first page on new search
  };

  const handleCategoryFilter = (category) => {
    setSelectedCategory(category);
    setPage(1);
    setFilterMenuVisible(false);
  };

  const handleWarehouseFilter = (warehouseId) => {
    setSelectedWarehouse(warehouseId);
    setPage(1);
  };

  const handleSort = (sortType) => {
    setSortBy(sortType);
    setSortMenuVisible(false);
  };

  const handleViewDetails = (product) => {
    setSelectedProduct(product);
    setDetailsModalVisible(true);
  };

  const handleAddProduct = () => {
    setIsEditing(false);
    setFormData({
      name: '',
      batchNumber: '',
      expiryDate: '',
      quantity: '',
      price: '',
      mrp: '',
      company: '',
      category: '',
      warehouseId: warehouses[0]?.id || '',
      shelf: '',
      rack: '',
      reorderLevel: '100',
    });
    setAddEditModalVisible(true);
  };

  const handleEditProduct = (product) => {
  console.log('✏️ EDIT - Product clicked:', product);
  console.log('✏️ EDIT - Product ID:', product.id);
  console.log('✏️ EDIT - Product data:', JSON.stringify(product, null, 2));
  
  setIsEditing(true);
  setSelectedProduct(product);
  setFormData({
    name: product.name || '',
    batchNumber: product.batchNumber || '',
    expiryDate: product.expiryDate ? new Date(product.expiryDate).toISOString().split('T')[0] : '',
    quantity: product.quantity?.toString() || '',
    price: product.price?.toString() || '',
    mrp: product.mrp?.toString() || '',
    company: product.company || '',
    category: product.category || '',
    warehouseId: product.warehouseId || '',
    shelf: product.shelf || '',
    rack: product.rack || '',
    reorderLevel: product.reorderLevel?.toString() || '100',
  });
  setAddEditModalVisible(true);
};

  const handleDeleteProduct = (product) => {
  console.log('🗑️ DELETE - Attempting to delete:', product);
  console.log('🗑️ DELETE - Product ID:', product.id);
  
  Alert.alert(
    'Delete Product',
    `Are you sure you want to delete ${product.name}?`,
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            console.log('🗑️ DELETE - Sending delete request for ID:', product.id);
            
            const response = await InventoryService.deleteProduct(product.id);
            
            console.log('🗑️ DELETE - Response:', response);
            
            if (response && response.success) {
              console.log('🗑️ DELETE - Success, reloading products...');
              Alert.alert('Success', 'Product deleted successfully');
              
              // Reload products
              await loadProducts();
              
              // Log the new state
              console.log('🗑️ DELETE - Products after reload:', products.length);
            } else {
              console.log('🗑️ DELETE - Failed:', response);
              Alert.alert('Error', response?.message || 'Failed to delete product');
            }
          } catch (error) {
            console.error('❌ DELETE - Error:', error);
            console.error('❌ DELETE - Error response:', error.response?.data);
            console.error('❌ DELETE - Error status:', error.response?.status);
            Alert.alert('Error', 'Failed to delete product');
          }
        }
      }
    ]
  );
};

  const handleSaveProduct = async () => {
  console.log('💾 SAVE - Starting save operation');
  console.log('💾 SAVE - Is editing:', isEditing);
  console.log('💾 SAVE - Form data:', formData);
  
  // Validate required fields
  const requiredFields = [
    { field: 'name', label: 'Product Name' },
    { field: 'batchNumber', label: 'Batch Number' },
    { field: 'expiryDate', label: 'Expiry Date' },
    { field: 'quantity', label: 'Quantity' },
    { field: 'company', label: 'Company' },
    { field: 'warehouseId', label: 'Warehouse' },
  ];

  const missingFields = requiredFields.filter(f => !formData[f.field]);
  
  if (missingFields.length > 0) {
    const fieldNames = missingFields.map(f => f.label).join(', ');
    Alert.alert('Error', `Please fill required fields: ${fieldNames}`);
    return;
  }

  // Validate expiry date format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(formData.expiryDate)) {
    Alert.alert('Error', 'Expiry date must be in YYYY-MM-DD format');
    return;
  }

  // Validate quantity is a number
  if (isNaN(parseInt(formData.quantity)) || parseInt(formData.quantity) < 0) {
    Alert.alert('Error', 'Quantity must be a valid positive number');
    return;
  }

  try {
    setLoading(true);
    
    const productData = {
      name: formData.name.trim(),
      batchNumber: formData.batchNumber.trim(),
      expiryDate: formData.expiryDate,
      quantity: parseInt(formData.quantity),
      price: parseFloat(formData.price) || 0,
      mrp: parseFloat(formData.mrp) || null,
      company: formData.company.trim(),
      category: formData.category.trim() || null,
      warehouseId: formData.warehouseId,
      shelf: formData.shelf.trim() || null,
      rack: formData.rack.trim() || null,
      reorderLevel: parseInt(formData.reorderLevel) || 100,
    };

    console.log('💾 SAVE - Product data to send:', productData);

    let response;
    if (isEditing) {
      console.log('💾 SAVE - Updating product ID:', selectedProduct.id);
      response = await InventoryService.updateProduct(selectedProduct.id, productData);
    } else {
      console.log('💾 SAVE - Creating new product');
      response = await InventoryService.createProduct(productData);
    }

    console.log('💾 SAVE - Response:', response);

    if (response && response.success) {
      Alert.alert('Success', `Product ${isEditing ? 'updated' : 'created'} successfully`);
      setAddEditModalVisible(false);
      
      // Reset form
      setFormData({
        name: '',
        batchNumber: '',
        expiryDate: '',
        quantity: '',
        price: '',
        mrp: '',
        company: '',
        category: '',
        warehouseId: warehouses[0]?.id || '',
        shelf: '',
        rack: '',
        reorderLevel: '100',
      });
      
      // Reload products
      console.log('💾 SAVE - Reloading products...');
      await loadProducts();
      console.log('💾 SAVE - Products reloaded');
      
    } else {
      console.log('💾 SAVE - Failed:', response);
      Alert.alert('Error', response?.message || 'Failed to save product');
    }
  } catch (error) {
    console.error('❌ SAVE - Error:', error);
    console.error('❌ SAVE - Error response:', error.response?.data);
    console.error('❌ SAVE - Error status:', error.response?.status);
    
    if (error.errors) {
      const errorMessages = error.errors.map(e => `${e.path}: ${e.msg}`).join('\n');
      Alert.alert('Validation Error', errorMessages);
    } else {
      Alert.alert('Error', `Failed to ${isEditing ? 'update' : 'create'} product`);
    }
  } finally {
    setLoading(false);
  }
};

  const getExpiryStatus = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { label: 'Expired', color: '#F44336', icon: 'skull' };
    if (diffDays < 30) return { label: 'Critical', color: '#FF9800', icon: 'alert' };
    if (diffDays < 60) return { label: 'Warning', color: '#FFC107', icon: 'warning' };
    return { label: 'Good', color: '#4CAF50', icon: 'checkmark-circle' };
  };

  const renderProductCard = (product) => {
    const expiryStatus = getExpiryStatus(product.expiryDate);
    const warehouse = warehouses.find(w => w.id === product.warehouseId);
    
    if (viewMode === 'grid') {
      return (
        <TouchableOpacity 
          key={product.id} 
          style={styles.gridCard}
          onPress={() => handleViewDetails(product)}
          onLongPress={() => handleEditProduct(product)}
        >
          <Card style={styles.gridCardInner}>
            <Card.Content>
              <View style={styles.gridHeader}>
                <Badge 
                  style={[styles.expiryBadge, { backgroundColor: expiryStatus.color }]}
                  size={24}
                >
                  {expiryStatus.label[0]}
                </Badge>
                {product.quantity === 0 && (
                  <Badge style={styles.outOfStockBadge} size={16}>!</Badge>
                )}
              </View>
              
              <Avatar.Icon 
                size={50} 
                icon="pill" 
                style={styles.productIcon}
                color="#fff"
              />
              
              <Text style={styles.gridProductName} numberOfLines={2}>
                {product.name}
              </Text>
              
              <Text style={styles.gridCompany}>{product.company}</Text>
              
              <Divider style={styles.gridDivider} />
              
              <View style={styles.gridDetails}>
                <View style={styles.gridDetailRow}>
                  <Ionicons name="cube-outline" size={14} color="#666" />
                  <Text style={styles.gridDetailText}>Batch: {product.batchNumber}</Text>
                </View>
                <View style={styles.gridDetailRow}>
                  <Ionicons name="calendar-outline" size={14} color="#666" />
                  <Text style={styles.gridDetailText}>
                    {new Date(product.expiryDate).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.gridDetailRow}>
                  <Ionicons name="location-outline" size={14} color="#666" />
                  <Text style={styles.gridDetailText}>
                    {warehouse?.name || 'Unknown'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.gridFooter}>
                <View>
                  <Text style={styles.gridPriceLabel}>Price</Text>
                  <Text style={styles.gridPrice}>₹{product.price}</Text>
                </View>
                <View style={styles.gridQuantityContainer}>
                  <Text style={styles.gridQuantityLabel}>Qty</Text>
                  <Text style={[
                    styles.gridQuantity,
                    product.quantity === 0 ? styles.textOutOfStock :
                    product.quantity < (product.reorderLevel || 100) ? styles.textLowStock : null
                  ]}>
                    {product.quantity}
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        </TouchableOpacity>
      );
    } else {
      return (
        <Card key={product.id} style={styles.listCard}>
          <Card.Content>
            <View style={styles.listHeader}>
              <View style={styles.listTitleSection}>
                <Text style={styles.listProductName}>{product.name}</Text>
                <Text style={styles.listCompany}>{product.company}</Text>
              </View>
              <Chip 
                mode="outlined"
                style={[styles.statusChip, { borderColor: expiryStatus.color }]}
                textStyle={{ color: expiryStatus.color }}
                icon={expiryStatus.icon}
              >
                {expiryStatus.label}
              </Chip>
            </View>

            <View style={styles.listDetails}>
              <View style={styles.listDetailRow}>
                <Ionicons name="cube-outline" size={16} color="#666" />
                <Text style={styles.listDetailText}>Batch: {product.batchNumber}</Text>
              </View>
              <View style={styles.listDetailRow}>
                <Ionicons name="calendar-outline" size={16} color="#666" />
                <Text style={styles.listDetailText}>
                  Expires: {new Date(product.expiryDate).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.listDetailRow}>
                <Ionicons name="location-outline" size={16} color="#666" />
                <Text style={styles.listDetailText}>
                  {warehouse?.name || 'Unknown'} • {product.shelf || 'No shelf'}
                </Text>
              </View>
            </View>

            <Divider style={styles.listDivider} />

            <View style={styles.listFooter}>
              <View>
                <Text style={styles.listPriceLabel}>Price</Text>
                <Text style={styles.listPrice}>₹{product.price}</Text>
                {product.mrp && (
                  <Text style={styles.listMrp}>MRP: ₹{product.mrp}</Text>
                )}
              </View>
              <View style={styles.listQuantitySection}>
                <Text style={styles.listQuantityLabel}>Quantity</Text>
                <Text style={[
                  styles.listQuantity,
                  product.quantity === 0 ? styles.textOutOfStock :
                  product.quantity < (product.reorderLevel || 100) ? styles.textLowStock : null
                ]}>
                  {product.quantity}
                </Text>
              </View>
              <View style={styles.listActions}>
                <IconButton
                  icon="eye"
                  size={20}
                  onPress={() => handleViewDetails(product)}
                />
                <IconButton
                  icon="pencil"
                  size={20}
                  onPress={() => handleEditProduct(product)}
                />
                <IconButton
                  icon="delete"
                  size={20}
                  onPress={() => handleDeleteProduct(product)}
                />
              </View>
            </View>
          </Card.Content>
        </Card>
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading inventory...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Title style={styles.headerTitle}>Inventory</Title>
          <Text style={styles.headerSubtitle}>
            {totalProducts} products • Page {page}/{totalPages}
          </Text>
                  <IconButton
          icon="refresh"
          size={24}
          onPress={() => {
            setSelectedCategory('All');
            setSelectedWarehouse('All');
            setSearchQuery('');
            setPage(1);
            loadProducts();
          }}
        />
        </View>
        <View style={styles.headerActions}>
          <IconButton
            icon={viewMode === 'grid' ? 'view-list' : 'view-grid'}
            size={24}
            onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          />
          
          <Menu
            visible={sortMenuVisible}
            onDismiss={() => setSortMenuVisible(false)}
            anchor={
              <IconButton
                icon="sort"
                size={24}
                onPress={() => setSortMenuVisible(true)}
              />
            }
          >
            // Add this in the header actions next to other icons

            <Menu.Item 
              onPress={() => handleSort('name')} 
              title="Sort by Name" 
              leadingIcon="sort-alphabetical-ascending"
            />
            <Menu.Item 
              onPress={() => handleSort('expiryDate')} 
              title="Sort by Expiry" 
              leadingIcon="calendar"
            />
            <Menu.Item 
              onPress={() => handleSort('quantity')} 
              title="Sort by Quantity" 
              leadingIcon="sort-numeric-ascending"
            />
            <Menu.Item 
              onPress={() => handleSort('price')} 
              title="Sort by Price" 
              leadingIcon="currency-inr"
            />
          </Menu>
          <IconButton
            icon="filter"
            size={24}
            onPress={() => setFilterMenuVisible(true)}
          />
          
        </View>
      </View>

      {/* Search Bar */}
      <Searchbar
        placeholder="Search products, batch, company..."
        onChangeText={handleSearch}
        value={searchQuery}
        style={styles.searchbar}
      />

      {/* Filter Chips */}
     

      {/* Warehouse Filter */}
      

      {/* Product List/Grid */}
      <ScrollView
        style={styles.productList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {products.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No products found</Text>
            <Button mode="contained" onPress={handleAddProduct}>
              Add Product
            </Button>
          </View>
        ) : (
          <View style={viewMode === 'grid' ? styles.gridContainer : styles.listContainer}>
            {products.map(product => renderProductCard(product))}
          </View>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <View style={styles.pagination}>
            <Button
              disabled={page === 1}
              onPress={() => setPage(p => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Text style={styles.pageText}>{page} / {totalPages}</Text>
            <Button
              disabled={page === totalPages}
              onPress={() => setPage(p => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={handleAddProduct}
        label="Add Product"
      />

      {/* Filter Modal */}
      <Portal>
        <Dialog visible={filterMenuVisible} onDismiss={() => setFilterMenuVisible(false)}>
          <Dialog.Title>Filter Products</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.filterLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {categories.map(category => (
                <Chip
                  key={category}
                  selected={selectedCategory === category}
                  onPress={() => handleCategoryFilter(category)}
                  style={styles.filterChip}
                >
                  {category}
                </Chip>
              ))}
            </ScrollView>

            <Text style={[styles.filterLabel, { marginTop: 16 }]}>Warehouse</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <Chip
                selected={selectedWarehouse === 'All'}
                onPress={() => handleWarehouseFilter('All')}
                style={styles.filterChip}
              >
                All
              </Chip>
              {warehouses.map(warehouse => (
                <Chip
                  key={warehouse.id}
                  selected={selectedWarehouse === warehouse.id}
                  onPress={() => handleWarehouseFilter(warehouse.id)}
                  style={styles.filterChip}
                >
                  {warehouse.name}
                </Chip>
              ))}
            </ScrollView>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setFilterMenuVisible(false)}>Apply</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Product Details Modal */}
      <Portal>
        <Dialog visible={detailsModalVisible} onDismiss={() => setDetailsModalVisible(false)}>
          {selectedProduct && (
            <>
              <Dialog.Title>{selectedProduct.name}</Dialog.Title>
              <Dialog.Content>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Batch Number:</Text>
                  <Text>{selectedProduct.batchNumber}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Expiry Date:</Text>
                  <Text>{new Date(selectedProduct.expiryDate).toLocaleDateString()}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Quantity:</Text>
                  <Text>{selectedProduct.quantity}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Price:</Text>
                  <Text>₹{selectedProduct.price}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>MRP:</Text>
                  <Text>₹{selectedProduct.mrp || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Company:</Text>
                  <Text>{selectedProduct.company}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Category:</Text>
                  <Text>{selectedProduct.category || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Location:</Text>
                  <Text>
                    {warehouses.find(w => w.id === selectedProduct.warehouseId)?.name} 
                    {selectedProduct.shelf && ` • Shelf ${selectedProduct.shelf}`}
                  </Text>
                </View>
              </Dialog.Content>
              <Dialog.Actions>
                <Button onPress={() => setDetailsModalVisible(false)}>Close</Button>
                <Button onPress={() => {
                  setDetailsModalVisible(false);
                  handleEditProduct(selectedProduct);
                }}>Edit</Button>
              </Dialog.Actions>
            </>
          )}
        </Dialog>
      </Portal>

      {/* Add/Edit Product Modal */}
      {/* Add/Edit Product Modal */}
<Portal>
  <Dialog visible={addEditModalVisible} onDismiss={() => setAddEditModalVisible(false)}>
    <Dialog.Title>{isEditing ? 'Edit Product' : 'Add Product'}</Dialog.Title>
    <Dialog.Content>
      <ScrollView style={styles.formContainer}>
        <TextInput
          label="Product Name *"
          value={formData.name}
          onChangeText={text => setFormData({...formData, name: text})}
          mode="outlined"
          style={styles.formInput}
          error={!formData.name}
        />
        <TextInput
          label="Batch Number *"
          value={formData.batchNumber}
          onChangeText={text => setFormData({...formData, batchNumber: text})}
          mode="outlined"
          style={styles.formInput}
          error={!formData.batchNumber}
        />
        <TextInput
          label="Expiry Date (YYYY-MM-DD) *"
          value={formData.expiryDate}
          onChangeText={text => setFormData({...formData, expiryDate: text})}
          mode="outlined"
          style={styles.formInput}
          placeholder="2024-12-31"
          error={!formData.expiryDate}
        />
        <TextInput
          label="Quantity *"
          value={formData.quantity}
          onChangeText={text => setFormData({...formData, quantity: text})}
          mode="outlined"
          keyboardType="numeric"
          style={styles.formInput}
          error={!formData.quantity}
        />
        <TextInput
          label="Company *"
          value={formData.company}
          onChangeText={text => setFormData({...formData, company: text})}
          mode="outlined"
          style={styles.formInput}
          error={!formData.company}
        />
        <TextInput
          label="Price (₹)"
          value={formData.price}
          onChangeText={text => setFormData({...formData, price: text})}
          mode="outlined"
          keyboardType="numeric"
          style={styles.formInput}
        />
        <TextInput
          label="MRP (₹)"
          value={formData.mrp}
          onChangeText={text => setFormData({...formData, mrp: text})}
          mode="outlined"
          keyboardType="numeric"
          style={styles.formInput}
        />
        <TextInput
          label="Category"
          value={formData.category}
          onChangeText={text => setFormData({...formData, category: text})}
          mode="outlined"
          style={styles.formInput}
        />
        
        {/* Warehouse Picker */}
        <Text style={styles.pickerLabel}>Warehouse *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerContainer}>
          {warehouses.map(warehouse => (
            <Chip
              key={warehouse.id}
              selected={formData.warehouseId === warehouse.id}
              onPress={() => setFormData({...formData, warehouseId: warehouse.id})}
              style={styles.pickerChip}
              mode={formData.warehouseId === warehouse.id ? 'flat' : 'outlined'}
            >
              {warehouse.name}
            </Chip>
          ))}
        </ScrollView>

        <TextInput
          label="Shelf"
          value={formData.shelf}
          onChangeText={text => setFormData({...formData, shelf: text})}
          mode="outlined"
          style={styles.formInput}
        />
        <TextInput
          label="Rack"
          value={formData.rack}
          onChangeText={text => setFormData({...formData, rack: text})}
          mode="outlined"
          style={styles.formInput}
        />
        <TextInput
          label="Reorder Level"
          value={formData.reorderLevel}
          onChangeText={text => setFormData({...formData, reorderLevel: text})}
          mode="outlined"
          keyboardType="numeric"
          style={styles.formInput}
        />
        
        <Text style={styles.requiredNote}>* Required fields</Text>
      </ScrollView>
    </Dialog.Content>
    <Dialog.Actions>
      <Button onPress={() => setAddEditModalVisible(false)}>Cancel</Button>
      <Button onPress={handleSaveProduct}>Save</Button>
    </Dialog.Actions>
  </Dialog>
</Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 24,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  headerActions: {
    flexDirection: 'row',
  },
  searchbar: {
    margin: 16,
    marginTop: 8,
    elevation: 2,
  },
  chipContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  chip: {
    marginRight: 8,
  },
  productList: {
    flex: 1,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
  },
  gridCard: {
    width: '48%',
    margin: '1%',
  },
  gridCardInner: {
    elevation: 2,
  },
  gridHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  expiryBadge: {
    alignSelf: 'flex-start',
  },
  outOfStockBadge: {
    backgroundColor: '#F44336',
  },
  productIcon: {
    alignSelf: 'center',
    marginBottom: 8,
    backgroundColor: '#007AFF',
  },
  gridProductName: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  gridCompany: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  gridDivider: {
    marginVertical: 8,
  },
  gridDetails: {
    marginBottom: 8,
  },
  gridDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  gridDetailText: {
    fontSize: 11,
    marginLeft: 4,
    color: '#666',
  },
  gridFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridPriceLabel: {
    fontSize: 10,
    color: '#666',
  },
  gridPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  gridQuantityContainer: {
    alignItems: 'center',
  },
  gridQuantityLabel: {
    fontSize: 10,
    color: '#666',
  },
  gridQuantity: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 8,
  },
  listCard: {
    marginBottom: 8,
    elevation: 2,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  listTitleSection: {
    flex: 1,
  },
  listProductName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  listCompany: {
    fontSize: 12,
    color: '#666',
  },
  statusChip: {
    height: 32,
  },
  listDetails: {
    marginBottom: 8,
  },
  listDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  listDetailText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  listDivider: {
    marginVertical: 8,
  },
  listFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listPriceLabel: {
    fontSize: 12,
    color: '#666',
  },
  listPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  listMrp: {
    fontSize: 10,
    color: '#999',
  },
  listQuantitySection: {
    alignItems: 'center',
  },
  listQuantityLabel: {
    fontSize: 12,
    color: '#666',
  },
  listQuantity: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  listActions: {
    flexDirection: 'row',
  },
  textLowStock: {
    color: '#FF9800',
  },
  textOutOfStock: {
    color: '#F44336',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginVertical: 16,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  pageText: {
    marginHorizontal: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  filterChip: {
    marginRight: 8,
  },
  formContainer: {
    maxHeight: 400,
  },
  formInput: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontWeight: 'bold',
    color: '#666',
  },
  pickerLabel: {
  fontSize: 12,
  color: '#666',
  marginBottom: 8,
  marginTop: 8,
},
pickerContainer: {
  marginBottom: 16,
},
pickerChip: {
  marginRight: 8,
},
requiredNote: {
  fontSize: 11,
  color: '#999',
  fontStyle: 'italic',
  marginTop: 8,
  textAlign: 'right',
},
});