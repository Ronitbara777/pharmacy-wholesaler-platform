import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput as RNTextInput,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Searchbar,
  Chip,
  Button,
  Divider,
  Text,
  FAB,
  Menu,
  Portal,
  Dialog,
  RadioButton,
  IconButton,
  Avatar,
  Badge,
  ActivityIndicator,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

console.log('📦 InventoryScreen loaded');

// Mock data - expanded with more realistic products
const mockProducts = [
  { 
    id: '1', 
    name: 'Paracetamol 500mg', 
    batch: 'B2024-001', 
    expiry: '2024-12-15', 
    quantity: 500, 
    price: 2.5, 
    mrp: 3.0,
    shelf: 'A-12', 
    rack: 'Rack 3',
    company: 'GSK',
    category: 'Analgesic',
    manufacturer: 'GlaxoSmithKline',
    createdAt: '2024-01-15',
    lastUpdated: '2024-02-20'
  },
  { 
    id: '2', 
    name: 'Amoxicillin 250mg', 
    batch: 'B2024-002', 
    expiry: '2024-11-30', 
    quantity: 300, 
    price: 5.0, 
    mrp: 6.5,
    shelf: 'B-05', 
    rack: 'Rack 1',
    company: 'Cipla',
    category: 'Antibiotic',
    manufacturer: 'Cipla Ltd',
    createdAt: '2024-01-20',
    lastUpdated: '2024-02-18'
  },
  { 
    id: '3', 
    name: 'Vitamin C 1000mg', 
    batch: 'B2024-003', 
    expiry: '2024-10-20', 
    quantity: 45, 
    price: 8.0, 
    mrp: 9.5,
    shelf: 'C-08', 
    rack: 'Rack 2',
    company: 'Sun Pharma',
    category: 'Vitamin',
    manufacturer: 'Sun Pharmaceutical',
    createdAt: '2024-02-01',
    lastUpdated: '2024-02-19'
  },
  { 
    id: '4', 
    name: 'Cetirizine 10mg', 
    batch: 'B2024-004', 
    expiry: '2024-09-05', 
    quantity: 200, 
    price: 1.8, 
    mrp: 2.5,
    shelf: 'A-03', 
    rack: 'Rack 3',
    company: 'GSK',
    category: 'Antihistamine',
    manufacturer: 'GlaxoSmithKline',
    createdAt: '2024-01-10',
    lastUpdated: '2024-02-15'
  },
  { 
    id: '5', 
    name: 'Ibuprofen 400mg', 
    batch: 'B2024-005', 
    expiry: '2024-08-15', 
    quantity: 0, 
    price: 3.2, 
    mrp: 4.0,
    shelf: 'B-12', 
    rack: 'Rack 1',
    company: 'Cipla',
    category: 'Anti-inflammatory',
    manufacturer: 'Cipla Ltd',
    createdAt: '2024-01-05',
    lastUpdated: '2024-02-10'
  },
  { 
    id: '6', 
    name: 'Omeprazole 20mg', 
    batch: 'B2024-006', 
    expiry: '2025-01-20', 
    quantity: 450, 
    price: 4.5, 
    mrp: 5.5,
    shelf: 'D-01', 
    rack: 'Rack 4',
    company: 'Sun Pharma',
    category: 'Antacid',
    manufacturer: 'Sun Pharmaceutical',
    createdAt: '2024-02-05',
    lastUpdated: '2024-02-22'
  },
];

// Categories for filtering
const categories = [
  'All',
  'Analgesic',
  'Antibiotic',
  'Vitamin',
  'Antihistamine',
  'Anti-inflammatory',
  'Antacid',
];

export default function InventoryScreen({ navigation }) {
  console.log('📦 InventoryScreen rendering');
  
  // State Management
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [products, setProducts] = useState(mockProducts);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('name'); // 'name', 'expiry', 'quantity'
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // Filter products based on search and category
  const getFilteredProducts = () => {
    let filtered = [...products];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.batch.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filter
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'expiry') return new Date(a.expiry) - new Date(b.expiry);
      if (sortBy === 'quantity') return a.quantity - b.quantity;
      return 0;
    });

    return filtered;
  };

  const filteredProducts = getFilteredProducts();

  // Calculate stats
  const stats = {
    total: products.length,
    totalQuantity: products.reduce((sum, p) => sum + p.quantity, 0),
    lowStock: products.filter(p => p.quantity > 0 && p.quantity < 100).length,
    outOfStock: products.filter(p => p.quantity === 0).length,
    expiringSoon: products.filter(p => {
      const expiry = new Date(p.expiry);
      const threeMonthsLater = new Date();
      threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);
      return expiry <= threeMonthsLater && expiry > new Date();
    }).length,
    expired: products.filter(p => new Date(p.expiry) < new Date()).length,
    totalValue: products.reduce((sum, p) => sum + (p.price * p.quantity), 0),
  };

  // Helper function for expiry status
  const getExpiryStatus = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { label: 'Expired', color: '#F44336', icon: 'skull' };
    if (diffDays < 30) return { label: 'Critical', color: '#FF9800', icon: 'alert' };
    if (diffDays < 60) return { label: 'Warning', color: '#FFC107', icon: 'warning' };
    return { label: 'Good', color: '#4CAF50', icon: 'checkmark-circle' };
  };

  // Handle product actions
  const handleEditProduct = (product) => {
    Alert.alert('Edit Product', `Edit ${product.name}`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'OK', onPress: () => console.log('Edit product:', product.id) }
    ]);
  };

  const handleDeleteProduct = (product) => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete ${product.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          onPress: () => {
            setProducts(products.filter(p => p.id !== product.id));
            Alert.alert('Success', 'Product deleted successfully');
          },
          style: 'destructive'
        }
      ]
    );
  };

  const handleViewDetails = (product) => {
    setSelectedProduct(product);
    setDetailsModalVisible(true);
  };

  const handleAddProduct = () => {
    Alert.alert('Add Product', 'Open add product form');
  };

  // Render product card based on view mode
  const renderProductCard = (product) => {
    const expiryStatus = getExpiryStatus(product.expiry);
    
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
                  <Text style={styles.gridDetailText}>Batch: {product.batch}</Text>
                </View>
                <View style={styles.gridDetailRow}>
                  <Ionicons name="calendar-outline" size={14} color="#666" />
                  <Text style={styles.gridDetailText}>
                    {new Date(product.expiry).toLocaleDateString()}
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
                    product.quantity < 100 ? styles.textLowStock : null
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
      // List view
      return (
        <Card key={product.id} style={styles.listCard} mode="elevated">
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
                <Text style={styles.listDetailText}>Batch: {product.batch}</Text>
              </View>
              <View style={styles.listDetailRow}>
                <Ionicons name="calendar-outline" size={16} color="#666" />
                <Text style={styles.listDetailText}>
                  Expires: {new Date(product.expiry).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.listDetailRow}>
                <Ionicons name="location-outline" size={16} color="#666" />
                <Text style={styles.listDetailText}>
                  Shelf: {product.shelf} • Rack: {product.rack}
                </Text>
              </View>
              <View style={styles.listDetailRow}>
                <Ionicons name="pricetag-outline" size={16} color="#666" />
                <Text style={styles.listDetailText}>Category: {product.category}</Text>
              </View>
            </View>

            <Divider style={styles.listDivider} />

            <View style={styles.listFooter}>
              <View>
                <Text style={styles.listPriceLabel}>Price</Text>
                <Text style={styles.listPrice}>₹{product.price}</Text>
                <Text style={styles.listMrp}>MRP: ₹{product.mrp}</Text>
              </View>
              <View style={styles.listQuantitySection}>
                <Text style={styles.listQuantityLabel}>Quantity</Text>
                <Text style={[
                  styles.listQuantity,
                  product.quantity === 0 ? styles.textOutOfStock :
                  product.quantity < 100 ? styles.textLowStock : null
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Title style={styles.headerTitle}>Inventory</Title>
          <Text style={styles.headerSubtitle}>{stats.total} products • ₹{stats.totalValue.toFixed(2)} value</Text>
        </View>
        <View style={styles.headerActions}>
          <IconButton
            icon={viewMode === 'grid' ? 'view-grid' : 'view-list'}
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
            <Menu.Item 
              onPress={() => { setSortBy('name'); setSortMenuVisible(false); }} 
              title="Sort by Name" 
              leadingIcon="sort-alphabetical-ascending"
            />
            <Menu.Item 
              onPress={() => { setSortBy('expiry'); setSortMenuVisible(false); }} 
              title="Sort by Expiry" 
              leadingIcon="calendar"
            />
            <Menu.Item 
              onPress={() => { setSortBy('quantity'); setSortMenuVisible(false); }} 
              title="Sort by Quantity" 
              leadingIcon="sort-numeric-ascending"
            />
          </Menu>
          <IconButton
            icon="filter"
            size={24}
            onPress={() => setFilterModalVisible(true)}
          />
        </View>
      </View>

      {/* Search Bar */}
      <Searchbar
        placeholder="Search products, batch, company..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
        inputStyle={styles.searchInput}
      />

      {/* Categories */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        {categories.map((category) => (
          <Chip
            key={category}
            selected={selectedCategory === category}
            onPress={() => setSelectedCategory(category)}
            style={styles.categoryChip}
            mode={selectedCategory === category ? 'flat' : 'outlined'}
            selectedColor="#007AFF"
          >
            {category}
          </Chip>
        ))}
      </ScrollView>

      {/* Stats Cards */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.statsContainer}
        contentContainerStyle={styles.statsContent}
      >
        <Card style={styles.statCard}>
          <Card.Content>
            <Paragraph>Total Items</Paragraph>
            <Title>{stats.total}</Title>
          </Card.Content>
        </Card>
        <Card style={styles.statCard}>
          <Card.Content>
            <Paragraph>Total Qty</Paragraph>
            <Title>{stats.totalQuantity}</Title>
          </Card.Content>
        </Card>
        <Card style={[styles.statCard, { backgroundColor: '#FFF3E0' }]}>
          <Card.Content>
            <Paragraph>Low Stock</Paragraph>
            <Title style={{ color: '#FF9800' }}>{stats.lowStock}</Title>
          </Card.Content>
        </Card>
        <Card style={[styles.statCard, { backgroundColor: '#FFEBEE' }]}>
          <Card.Content>
            <Paragraph>Expiring</Paragraph>
            <Title style={{ color: '#F44336' }}>{stats.expiringSoon}</Title>
          </Card.Content>
        </Card>
        <Card style={[styles.statCard, { backgroundColor: '#E8F5E9' }]}>
          <Card.Content>
            <Paragraph>Total Value</Paragraph>
            <Title style={{ fontSize: 18 }}>₹{stats.totalValue.toFixed(0)}</Title>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Product List/Grid */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text>Loading products...</Text>
        </View>
      ) : (
        <ScrollView style={styles.productList}>
          {filteredProducts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="cube-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No products found</Text>
              <Button mode="contained" onPress={handleAddProduct} style={styles.emptyButton}>
                Add Product
              </Button>
            </View>
          ) : (
            <View style={viewMode === 'grid' ? styles.gridContainer : styles.listContainer}>
              {filteredProducts.map(product => renderProductCard(product))}
            </View>
          )}
        </ScrollView>
      )}

      {/* FAB for adding products */}
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={handleAddProduct}
        label="Add"
      />

      {/* Product Details Modal */}
      <Portal>
        <Modal
          visible={detailsModalVisible}
          onDismiss={() => setDetailsModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          {selectedProduct && (
            <ScrollView>
              <View style={styles.modalHeader}>
                <Avatar.Icon size={60} icon="pill" style={styles.modalIcon} />
                <View style={styles.modalTitleSection}>
                  <Title>{selectedProduct.name}</Title>
                  <Paragraph>{selectedProduct.company}</Paragraph>
                </View>
                <IconButton
                  icon="close"
                  size={24}
                  onPress={() => setDetailsModalVisible(false)}
                />
              </View>

              <Divider />

              <View style={styles.modalContent}>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Batch Number</Text>
                  <Text style={styles.modalValue}>{selectedProduct.batch}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Category</Text>
                  <Text style={styles.modalValue}>{selectedProduct.category}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Manufacturer</Text>
                  <Text style={styles.modalValue}>{selectedProduct.manufacturer}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Expiry Date</Text>
                  <Text style={styles.modalValue}>
                    {new Date(selectedProduct.expiry).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Quantity</Text>
                  <Text style={[
                    styles.modalValue,
                    selectedProduct.quantity === 0 ? styles.textOutOfStock : null
                  ]}>
                    {selectedProduct.quantity}
                  </Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Price (₹)</Text>
                  <Text style={styles.modalValue}>{selectedProduct.price}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>MRP (₹)</Text>
                  <Text style={styles.modalValue}>{selectedProduct.mrp}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Location</Text>
                  <Text style={styles.modalValue}>
                    Shelf {selectedProduct.shelf}, {selectedProduct.rack}
                  </Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Added On</Text>
                  <Text style={styles.modalValue}>
                    {new Date(selectedProduct.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Last Updated</Text>
                  <Text style={styles.modalValue}>
                    {new Date(selectedProduct.lastUpdated).toLocaleDateString()}
                  </Text>
                </View>
              </View>

              <View style={styles.modalActions}>
                <Button 
                  mode="contained" 
                  onPress={() => {
                    setDetailsModalVisible(false);
                    handleEditProduct(selectedProduct);
                  }}
                  style={styles.modalButton}
                >
                  Edit
                </Button>
                <Button 
                  mode="outlined" 
                  onPress={() => setDetailsModalVisible(false)}
                  style={styles.modalButton}
                >
                  Close
                </Button>
              </View>
            </ScrollView>
          )}
        </Modal>
      </Portal>

      {/* Filter Modal */}
      <Portal>
        <Dialog visible={filterModalVisible} onDismiss={() => setFilterModalVisible(false)}>
          <Dialog.Title>Filter Products</Dialog.Title>
          <Dialog.Content>
            <RadioButton.Group onValueChange={setSelectedCategory} value={selectedCategory}>
              {categories.map(category => (
                <RadioButton.Item key={category} label={category} value={category} />
              ))}
            </RadioButton.Group>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => {
              setSelectedCategory('All');
              setFilterModalVisible(false);
            }}>Reset</Button>
            <Button onPress={() => setFilterModalVisible(false)}>Apply</Button>
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
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchbar: {
    margin: 16,
    marginTop: 8,
    elevation: 2,
    borderRadius: 10,
  },
  searchInput: {
    fontSize: 14,
  },
  categoriesContainer: {
    maxHeight: 50,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoriesContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  categoryChip: {
    marginRight: 8,
  },
  statsContainer: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statsContent: {
    paddingHorizontal: 16,
  },
  statCard: {
    width: 120,
    marginRight: 12,
    elevation: 2,
  },
  productList: {
    flex: 1,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    justifyContent: 'space-between',
  },
  gridCard: {
    width: '48%',
    marginBottom: 12,
  },
  gridCardInner: {
    elevation: 3,
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
    color: '#fff',
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
    alignItems: 'center',
    marginTop: 4,
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
  
  // List view styles
  listContainer: {
    padding: 16,
  },
  listCard: {
    marginBottom: 12,
    elevation: 2,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  listTitleSection: {
    flex: 1,
  },
  listProductName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  listCompany: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  statusChip: {
    height: 32,
  },
  listDetails: {
    marginBottom: 12,
  },
  listDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  listDetailText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#444',
  },
  listDivider: {
    marginVertical: 12,
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
    fontSize: 11,
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
    fontSize: 20,
    fontWeight: 'bold',
  },
  listActions: {
    flexDirection: 'row',
  },
  
  // Utility styles
  textLowStock: {
    color: '#FF9800',
  },
  textOutOfStock: {
    color: '#F44336',
  },
  
  // Loading and empty states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
    marginBottom: 16,
  },
  emptyButton: {
    borderRadius: 8,
  },
  
  // FAB
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#007AFF',
  },
  
  // Modal styles
  modalContainer: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
  },
  modalIcon: {
    backgroundColor: '#007AFF',
    marginRight: 16,
  },
  modalTitleSection: {
    flex: 1,
  },
  modalContent: {
    padding: 20,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalLabel: {
    fontSize: 14,
    color: '#666',
  },
  modalValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 20,
    paddingTop: 0,
  },
  modalButton: {
    marginLeft: 12,
    borderRadius: 6,
  },
});