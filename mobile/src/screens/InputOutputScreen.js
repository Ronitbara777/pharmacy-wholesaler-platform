import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Platform
} from 'react-native';
import {
  Card,
  Title,
  Text,
  Button,
  Chip,
  IconButton,
  Divider,
  ActivityIndicator,
  Portal,
  Dialog,
  TextInput,
  Snackbar,
  Menu
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';
import DateTimePicker from '@react-native-community/datetimepicker';
import MovementService from '../services/movement.service';

console.log('📥 InputOutputScreen loaded');

export default function InputOutputScreen({ navigation }) {
  console.log('📥 InputOutputScreen rendering');
  
  // State for mode selection
  const [mode, setMode] = useState('in'); // 'in' or 'out'
  
  // State for recent movements
  const [recentMovements, setRecentMovements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // State for form
  const [formVisible, setFormVisible] = useState(false);
  const [formData, setFormData] = useState({
    productId: '',
    quantity: '',
    party: '',
    invoiceNo: '',
    notes: '',
    price: '',
    batchNumber: '',
    expiryDate: ''
  });
  
  // State for products dropdown
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [productMenuVisible, setProductMenuVisible] = useState(false);
  
  // State for CSV import
  const [importing, setImporting] = useState(false);
  
  // State for camera
  const [cameraVisible, setCameraVisible] = useState(false);
  const [cameraPermission, setCameraPermission] = useState(null);
  
  // State for date picker
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // State for stats
  const [stats, setStats] = useState({
    today: { in: 0, out: 0 },
    week: { in: 0, out: 0 },
    month: { in: 0, out: 0 },
    total: { in: 0, out: 0 }
  });
  
  // Snackbar
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Load initial data
  useEffect(() => {
    loadInitialData();
    requestCameraPermission();
  }, []);

  // Load data when mode changes
  useEffect(() => {
    loadMovements();
  }, [mode]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadStats(),
        loadMovements(),
        loadProducts()
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await MovementService.getMovementStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadMovements = async () => {
    try {
      const params = {
        limit: 10,
        type: mode === 'in' ? 'STOCK_IN' : 'STOCK_OUT'
      };
      const response = await MovementService.getMovements(params);
      if (response.success) {
        setRecentMovements(response.data);
      }
    } catch (error) {
      console.error('Error loading movements:', error);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await MovementService.getProducts();
      if (response.success) {
        setProducts(response.data);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadStats(), loadMovements()]);
    setRefreshing(false);
  };

  const requestCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setCameraPermission(status === 'granted');
  };

  const handleProductSearch = (text) => {
    setProductSearch(text);
    if (text.trim() === '') {
      setFilteredProducts([]);
    } else {
      const filtered = products.filter(p => 
        p.name.toLowerCase().includes(text.toLowerCase()) ||
        p.batchNumber.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  };

  const selectProduct = (product) => {
    setFormData({
      ...formData,
      productId: product.id,
      batchNumber: product.batchNumber,
      price: product.price.toString(),
      expiryDate: product.expiryDate ? new Date(product.expiryDate).toISOString().split('T')[0] : ''
    });
    setProductSearch(product.name);
    setFilteredProducts([]);
    setProductMenuVisible(false);
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData({
        ...formData,
        expiryDate: selectedDate.toISOString().split('T')[0]
      });
    }
  };

  const validateForm = () => {
    if (!formData.productId) {
      Alert.alert('Error', 'Please select a product');
      return false;
    }
    if (!formData.quantity || parseInt(formData.quantity) <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return false;
    }
    if (mode === 'out' && !formData.party) {
      Alert.alert('Error', 'Please enter party/customer name for sales');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      
      const movementData = {
        type: mode === 'in' ? 'STOCK_IN' : 'STOCK_OUT',
        productId: formData.productId,
        quantity: parseInt(formData.quantity),
        party: formData.party,
        invoiceNo: formData.invoiceNo,
        notes: formData.notes,
        price: parseFloat(formData.price) || undefined,
        batchNumber: formData.batchNumber || undefined,
        expiryDate: formData.expiryDate || undefined
      };

      const response = await MovementService.createMovement(movementData);
      
      if (response.success) {
        setFormVisible(false);
        setFormData({
          productId: '',
          quantity: '',
          party: '',
          invoiceNo: '',
          notes: '',
          price: '',
          batchNumber: '',
          expiryDate: ''
        });
        setProductSearch('');
        await Promise.all([loadStats(), loadMovements()]);
        showSnackbar(`Stock ${mode === 'in' ? 'received' : 'sold'} successfully`);
      }
    } catch (error) {
      console.error('Error creating movement:', error);
      Alert.alert('Error', error.message || 'Failed to record movement');
    } finally {
      setLoading(false);
    }
  };

  const handleCSVImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/csv',
        copyToCacheDirectory: true
      });

      if (!result.canceled && result.assets[0]) {
        setImporting(true);
        
        const formData = new FormData();
        formData.append('file', {
          uri: result.assets[0].uri,
          type: 'text/csv',
          name: result.assets[0].name
        });

        const response = await MovementService.importCSV(formData);
        
        if (response.success) {
          showSnackbar(response.message);
          await loadStats();
          await loadMovements();
        }
      }
    } catch (error) {
      console.error('Error importing CSV:', error);
      Alert.alert('Error', error.message || 'Failed to import CSV');
    } finally {
      setImporting(false);
    }
  };

  const handleBarcodeScan = async () => {
    if (cameraPermission) {
      setCameraVisible(true);
    } else {
      Alert.alert('Permission Required', 'Camera permission is needed to scan barcodes');
    }
  };

  const showSnackbar = (message) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with Mode Selector */}
      <View style={styles.header}>
        <View style={styles.modeSelector}>
          <TouchableOpacity
            style={[styles.modeButton, mode === 'in' && styles.modeButtonActive]}
            onPress={() => setMode('in')}
          >
            <Ionicons 
              name="arrow-down-circle" 
              size={24} 
              color={mode === 'in' ? '#007AFF' : '#666'} 
            />
            <Text style={[styles.modeText, mode === 'in' && styles.modeTextActive]}>
              STOCK IN
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.modeButton, mode === 'out' && styles.modeButtonActive]}
            onPress={() => setMode('out')}
          >
            <Ionicons 
              name="arrow-up-circle" 
              size={24} 
              color={mode === 'out' ? '#007AFF' : '#666'} 
            />
            <Text style={[styles.modeText, mode === 'out' && styles.modeTextActive]}>
              STOCK OUT
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Compact Stats Cards - FIXED UI */}
      <View style={styles.compactStatsContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.compactStatsContent}
        >
          <View style={styles.compactStatItem}>
            <Text style={[styles.compactStatValue, { color: mode === 'in' ? '#4CAF50' : '#F44336' }]}>
              {mode === 'in' ? stats.today.in : stats.today.out}
            </Text>
            <Text style={styles.compactStatLabel}>Today</Text>
          </View>
          
          <View style={styles.compactStatDivider} />
          
          <View style={styles.compactStatItem}>
            <Text style={[styles.compactStatValue, { color: mode === 'in' ? '#4CAF50' : '#F44336' }]}>
              {mode === 'in' ? stats.week.in : stats.week.out}
            </Text>
            <Text style={styles.compactStatLabel}>Week</Text>
          </View>
          
          <View style={styles.compactStatDivider} />
          
          <View style={styles.compactStatItem}>
            <Text style={[styles.compactStatValue, { color: mode === 'in' ? '#4CAF50' : '#F44336' }]}>
              {mode === 'in' ? stats.month.in : stats.month.out}
            </Text>
            <Text style={styles.compactStatLabel}>Month</Text>
          </View>
          
          <View style={styles.compactStatDivider} />
          
          <View style={styles.compactStatItem}>
            <Text style={[styles.compactStatValue, { color: mode === 'in' ? '#4CAF50' : '#F44336' }]}>
              {mode === 'in' ? stats.total.in : stats.total.out}
            </Text>
            <Text style={styles.compactStatLabel}>Total</Text>
          </View>
        </ScrollView>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <Button
          mode="contained"
          onPress={() => setFormVisible(true)}
          style={styles.actionButton}
          icon={mode === 'in' ? 'arrow-down' : 'arrow-up'}
        >
          Manual {mode === 'in' ? 'Receiving' : 'Sale'}
        </Button>
        
        <Button
          mode="outlined"
          onPress={handleCSVImport}
          style={styles.actionButton}
          icon="file-document"
          loading={importing}
          disabled={importing}
        >
          Import CSV
        </Button>
        
        <Button
          mode="outlined"
          onPress={handleBarcodeScan}
          style={styles.actionButton}
          icon="barcode-scan"
        >
          Scan
        </Button>
      </View>

      {/* Recent Movements */}
      <View style={styles.recentHeader}>
        <Title>Recent {mode === 'in' ? 'Receivings' : 'Sales'}</Title>
        <Chip icon="refresh" onPress={onRefresh}>Refresh</Chip>
      </View>

      <ScrollView
        style={styles.recentList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {recentMovements.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Ionicons name="time-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No recent {mode === 'in' ? 'receivings' : 'sales'}</Text>
            </Card.Content>
          </Card>
        ) : (
          recentMovements.map(movement => (
            <Card key={movement.id} style={styles.movementCard}>
              <Card.Content>
                <View style={styles.movementHeader}>
                  <View>
                    <Text style={styles.productName}>{movement.product?.name}</Text>
                    <Text style={styles.batchText}>Batch: {movement.batchNumber}</Text>
                  </View>
                  <Chip 
                    mode="outlined"
                    style={{ 
                      borderColor: movement.type === 'STOCK_IN' ? '#4CAF50' : '#F44336',
                      backgroundColor: movement.type === 'STOCK_IN' ? '#E8F5E9' : '#FFEBEE'
                    }}
                  >
                    {movement.type === 'STOCK_IN' ? 'IN' : 'OUT'} {movement.quantity}
                  </Chip>
                </View>
                
                <Divider style={styles.divider} />
                
                <View style={styles.movementDetails}>
                  {movement.party && (
                    <Text style={styles.detailText}>Party: {movement.party}</Text>
                  )}
                  {movement.invoiceNo && (
                    <Text style={styles.detailText}>Invoice: {movement.invoiceNo}</Text>
                  )}
                  <Text style={styles.detailText}>
                    By: {movement.user?.name} • {formatDateTime(movement.createdAt)}
                  </Text>
                  {movement.notes && (
                    <Text style={styles.notesText}>Note: {movement.notes}</Text>
                  )}
                </View>
              </Card.Content>
            </Card>
          ))
        )}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Manual Entry Form Modal */}
      <Portal>
        <Dialog visible={formVisible} onDismiss={() => setFormVisible(false)} style={styles.formDialog}>
          <Dialog.Title>{mode === 'in' ? 'Record Stock Receiving' : 'Record Sale'}</Dialog.Title>
          <Dialog.Content>
            <ScrollView style={styles.formContainer}>
              {/* Product Selection */}
              <Text style={styles.inputLabel}>Select Product *</Text>
              <Menu
                visible={productMenuVisible}
                onDismiss={() => setProductMenuVisible(false)}
                anchor={
                  <TouchableOpacity onPress={() => setProductMenuVisible(true)}>
                    <TextInput
                      mode="outlined"
                      placeholder="Search product..."
                      value={productSearch}
                      onChangeText={handleProductSearch}
                      onFocus={() => setProductMenuVisible(true)}
                      style={styles.formInput}
                      right={<TextInput.Icon icon="chevron-down" />}
                    />
                  </TouchableOpacity>
                }
                style={styles.productMenu}
              >
                <ScrollView style={{ maxHeight: 300 }}>
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map(product => (
                      <Menu.Item
                        key={product.id}
                        onPress={() => selectProduct(product)}
                        title={`${product.name} (${product.batchNumber})`}
                        description={`Qty: ${product.quantity} | ₹${product.price}`}
                      />
                    ))
                  ) : productSearch.trim() !== '' ? (
                    <Menu.Item title="No products found" disabled />
                  ) : null}
                </ScrollView>
              </Menu>

              {/* Quantity */}
              <TextInput
                label={`Quantity * ${mode === 'out' ? '(max available)' : ''}`}
                value={formData.quantity}
                onChangeText={text => setFormData({...formData, quantity: text})}
                mode="outlined"
                keyboardType="numeric"
                style={styles.formInput}
              />

              {/* Party/Customer (for OUT) */}
              {mode === 'out' && (
                <TextInput
                  label="Party/Customer Name *"
                  value={formData.party}
                  onChangeText={text => setFormData({...formData, party: text})}
                  mode="outlined"
                  style={styles.formInput}
                />
              )}

              {/* Invoice Number */}
              <TextInput
                label="Invoice Number"
                value={formData.invoiceNo}
                onChangeText={text => setFormData({...formData, invoiceNo: text})}
                mode="outlined"
                style={styles.formInput}
              />

              {/* Price (optional) */}
              <TextInput
                label="Price (leave blank to use product price)"
                value={formData.price}
                onChangeText={text => setFormData({...formData, price: text})}
                mode="outlined"
                keyboardType="numeric"
                style={styles.formInput}
              />

              {/* Batch Number (optional) */}
              <TextInput
                label="Batch Number (optional)"
                value={formData.batchNumber}
                onChangeText={text => setFormData({...formData, batchNumber: text})}
                mode="outlined"
                style={styles.formInput}
              />

              {/* Expiry Date (optional) */}
              <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                <TextInput
                  label="Expiry Date (optional)"
                  value={formData.expiryDate}
                  mode="outlined"
                  editable={false}
                  style={styles.formInput}
                  right={<TextInput.Icon icon="calendar" />}
                />
              </TouchableOpacity>

              {/* Notes */}
              <TextInput
                label="Notes"
                value={formData.notes}
                onChangeText={text => setFormData({...formData, notes: text})}
                mode="outlined"
                multiline
                numberOfLines={3}
                style={styles.formInput}
              />
            </ScrollView>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setFormVisible(false)}>Cancel</Button>
            <Button 
              mode="contained" 
              onPress={handleSubmit}
              loading={loading}
            >
              Save
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
        />
      )}

      {/* Camera Scanner (simplified) */}
      <Portal>
        <Dialog visible={cameraVisible} onDismiss={() => setCameraVisible(false)}>
          <Dialog.Title>Scan Barcode</Dialog.Title>
          <Dialog.Content>
            <View style={styles.cameraPlaceholder}>
              <Ionicons name="camera" size={64} color="#ccc" />
              <Text>Camera would open here</Text>
              <Text style={styles.cameraHint}>
                This would scan barcodes and auto-fill product info
              </Text>
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setCameraVisible(false)}>Close</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Snackbar */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{
          label: 'OK',
          onPress: () => setSnackbarVisible(false)
        }}
      >
        {snackbarMessage}
      </Snackbar>
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
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modeSelector: {
    flexDirection: 'row',
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    padding: 4,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 6,
    gap: 8,
  },
  modeButtonActive: {
    backgroundColor: '#fff',
    elevation: 2,
  },
  modeText: {
    fontSize: 14,
    color: '#666',
  },
  modeTextActive: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  // NEW COMPACT STATS STYLES
  compactStatsContainer: {
    marginTop: 8,
    marginBottom: 12,
    height: 65,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  compactStatsContent: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  compactStatItem: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
  },
  compactStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  compactStatLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  compactStatDivider: {
    width: 1,
    height: 35,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 12,
  },
  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    minWidth: 100,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  recentList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyCard: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 8,
  },
  movementCard: {
    marginBottom: 8,
    elevation: 2,
  },
  movementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  batchText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  divider: {
    marginVertical: 8,
  },
  movementDetails: {
    gap: 4,
  },
  detailText: {
    fontSize: 13,
    color: '#666',
  },
  notesText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 4,
  },
  bottomPadding: {
    height: 80,
  },
  formDialog: {
    maxHeight: '80%',
  },
  formContainer: {
    maxHeight: 400,
  },
  formInput: {
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  inputLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  productMenu: {
    width: '100%',
    marginTop: 40,
  },
  cameraPlaceholder: {
    alignItems: 'center',
    padding: 20,
    gap: 12,
  },
  cameraHint: {
    textAlign: 'center',
    color: '#666',
    fontSize: 12,
  },
});