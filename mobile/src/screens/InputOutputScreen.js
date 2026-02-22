import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  FlatList,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Text,
  TextInput,
  Chip,
  Divider,
  RadioButton,
  IconButton,
  Portal,
  Dialog,
  Snackbar,
  ProgressBar,
  Avatar,
  List,
  Switch,
  useTheme,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import Papa from 'papaparse';
import { Camera, CameraType } from 'expo-camera';
import DateTimePicker from 'react-native-modal-datetime-picker';

console.log('📥 InputOutputScreen loaded');

// Mock data for temporary database (will be replaced with actual DB)
const mockTempDB = {
  pendingItems: [
    { 
      id: 'temp1', 
      name: 'Paracetamol 500mg', 
      batch: 'B2024-001', 
      expiry: '2024-12-15', 
      quantity: 500, 
      price: 2.5,
      mrp: 3.0,
      company: 'GSK',
      category: 'Analgesic',
      warehouse: 'Main',
      shelf: 'A-12',
      status: 'pending',
      source: 'csv',
      importedAt: '2024-02-22T10:30:00Z'
    },
    { 
      id: 'temp2', 
      name: 'Amoxicillin 250mg', 
      batch: 'B2024-002', 
      expiry: '2024-11-30', 
      quantity: 300, 
      price: 5.0,
      mrp: 6.5,
      company: 'Cipla',
      category: 'Antibiotic',
      warehouse: 'Main',
      shelf: 'B-05',
      status: 'pending',
      source: 'scan',
      importedAt: '2024-02-22T09:15:00Z'
    },
  ],
  processedItems: [
    { 
      id: 'proc1', 
      name: 'Vitamin C 1000mg', 
      batch: 'B2024-003', 
      expiry: '2024-10-20', 
      quantity: 150, 
      price: 8.0,
      mrp: 9.5,
      company: 'Sun Pharma',
      category: 'Vitamin',
      warehouse: 'Cold Storage',
      shelf: 'C-08',
      status: 'processed',
      source: 'manual',
      processedAt: '2024-02-21T14:30:00Z'
    },
  ]
};

// Mock warehouses
const warehouses = [
  { id: 'wh1', name: 'Main Warehouse', sections: ['A', 'B', 'C', 'D'] },
  { id: 'wh2', name: 'Cold Storage', sections: ['COLD-1', 'COLD-2'] },
  { id: 'wh3', name: 'Bulk Storage', sections: ['BULK-A', 'BULK-B'] },
];

export default function InputOutputScreen({ navigation }) {
  console.log('📥 InputOutputScreen rendering');
  
  const [mode, setMode] = useState('input'); // 'input' or 'output'
  const [activeTab, setActiveTab] = useState('import'); // 'import', 'scan', 'manual', 'verify'
  const [tempData, setTempData] = useState(mockTempDB.pendingItems);
  const [processedData, setProcessedData] = useState(mockTempDB.processedItems);
  const [selectedItems, setSelectedItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [cameraPermission, setCameraPermission] = useState(null);
  const [scannedText, setScannedText] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateField, setDateField] = useState(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  // Form state for manual entry
  const [manualForm, setManualForm] = useState({
    name: '',
    batch: '',
    expiry: '',
    quantity: '',
    price: '',
    mrp: '',
    company: '',
    category: '',
    warehouse: 'Main Warehouse',
    shelf: '',
    supplier: '',
    invoiceNo: '',
  });

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('all');
  const [selectedSource, setSelectedSource] = useState('all');
  const [verifyModalVisible, setVerifyModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Camera setup
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setCameraPermission(status === 'granted');
    })();
  }, []);

  // CSV Import Function
  const handleCSVImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'application/vnd.ms-excel'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        setLoading(true);
        const file = result.assets[0];
        
        // Read file content
        const fileContent = await FileSystem.readAsStringAsync(file.uri);
        
        // Parse CSV
        Papa.parse(fileContent, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            // Transform CSV data to product format
            const importedProducts = results.data.map((row, index) => ({
              id: `temp-${Date.now()}-${index}`,
              name: row['Product Name'] || row['name'] || '',
              batch: row['Batch'] || row['batch'] || '',
              expiry: row['Expiry'] || row['expiry'] || '',
              quantity: parseInt(row['Quantity'] || row['qty'] || 0),
              price: parseFloat(row['Price'] || row['price'] || 0),
              mrp: parseFloat(row['MRP'] || row['mrp'] || 0),
              company: row['Company'] || row['company'] || '',
              category: row['Category'] || row['category'] || '',
              warehouse: 'Main Warehouse',
              shelf: row['Shelf'] || row['shelf'] || '',
              status: 'pending',
              source: 'csv',
              importedAt: new Date().toISOString(),
            }));

            setTempData([...tempData, ...importedProducts]);
            setLoading(false);
            setSnackbarMessage(`Imported ${importedProducts.length} products from CSV`);
            setSnackbarVisible(true);
          },
          error: (error) => {
            console.error('CSV Parse Error:', error);
            Alert.alert('Error', 'Failed to parse CSV file');
            setLoading(false);
          },
        });
      }
    } catch (error) {
      console.error('CSV Import Error:', error);
      Alert.alert('Error', 'Failed to import CSV');
      setLoading(false);
    }
  };

  // Image Scanning Function
  const handleScanImage = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        setScanning(true);
        // Here you would integrate with OCR service
        // For now, we'll simulate OCR with mock data
        setTimeout(() => {
          const mockScannedProduct = {
            id: `temp-${Date.now()}`,
            name: 'Scanned Product',
            batch: 'SCAN001',
            expiry: '2024-12-31',
            quantity: 100,
            price: 10.0,
            mrp: 12.0,
            company: 'Scanned Company',
            category: 'General',
            warehouse: 'Main Warehouse',
            shelf: 'SCAN-01',
            status: 'pending',
            source: 'scan',
            importedAt: new Date().toISOString(),
          };
          
          setTempData([...tempData, mockScannedProduct]);
          setScanning(false);
          setSnackbarMessage('Product scanned successfully');
          setSnackbarVisible(true);
        }, 2000);
      }
    } catch (error) {
      console.error('Scan Error:', error);
      Alert.alert('Error', 'Failed to scan image');
      setScanning(false);
    }
  };

  // Manual Entry Submit
  const handleManualSubmit = () => {
    // Validate form
    if (!manualForm.name || !manualForm.batch || !manualForm.expiry || !manualForm.quantity) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    const newProduct = {
      id: `temp-${Date.now()}`,
      ...manualForm,
      quantity: parseInt(manualForm.quantity),
      price: parseFloat(manualForm.price) || 0,
      mrp: parseFloat(manualForm.mrp) || 0,
      status: 'pending',
      source: 'manual',
      importedAt: new Date().toISOString(),
    };

    setTempData([...tempData, newProduct]);
    setManualForm({
      name: '',
      batch: '',
      expiry: '',
      quantity: '',
      price: '',
      mrp: '',
      company: '',
      category: '',
      warehouse: 'Main Warehouse',
      shelf: '',
      supplier: '',
      invoiceNo: '',
    });
    
    setSnackbarMessage('Product added manually');
    setSnackbarVisible(true);
  };

  // Verify and move to structured DB
  const handleVerifyAndSave = async (items) => {
    setLoading(true);
    
    try {
      // Simulate API call to save to structured DB
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Move items from temp to processed
      const itemsToProcess = items.length > 0 ? items : selectedItems;
      
      const processed = itemsToProcess.map(item => ({
        ...item,
        status: 'processed',
        processedAt: new Date().toISOString(),
      }));
      
      setProcessedData([...processedData, ...processed]);
      setTempData(tempData.filter(item => !itemsToProcess.find(i => i.id === item.id)));
      setSelectedItems([]);
      
      setSnackbarMessage(`Successfully saved ${itemsToProcess.length} products`);
      setSnackbarVisible(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to save products');
    } finally {
      setLoading(false);
      setVerifyModalVisible(false);
    }
  };

  // Handle output (selling)
  const handleSellProduct = (product) => {
    Alert.alert(
      'Sell Product',
      `Enter quantity to sell for ${product.name}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sell',
          onPress: () => {
            // Here you would process the sale
            Alert.alert('Success', 'Sale recorded');
          }
        }
      ]
    );
  };

  // Filter temp data
  const getFilteredTempData = () => {
    let filtered = [...tempData];
    
    if (searchQuery) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.batch.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.company.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (selectedWarehouse !== 'all') {
      filtered = filtered.filter(item => item.warehouse === selectedWarehouse);
    }
    
    if (selectedSource !== 'all') {
      filtered = filtered.filter(item => item.source === selectedSource);
    }
    
    return filtered;
  };

  // Render import tab
  const renderImportTab = () => (
    <View style={styles.tabContent}>
      {/* Import Options */}
      <View style={styles.importOptions}>
        <Card style={styles.importCard} onPress={handleCSVImport}>
          <Card.Content style={styles.importCardContent}>
            <Ionicons name="document-text" size={40} color="#007AFF" />
            <Text style={styles.importCardTitle}>CSV Import</Text>
            <Text style={styles.importCardDesc}>Upload CSV file with product data</Text>
          </Card.Content>
        </Card>

        <Card style={styles.importCard} onPress={handleScanImage}>
          <Card.Content style={styles.importCardContent}>
            <Ionicons name="camera" size={40} color="#4CAF50" />
            <Text style={styles.importCardTitle}>Scan Image</Text>
            <Text style={styles.importCardDesc}>Scan invoice or product label</Text>
          </Card.Content>
        </Card>

        <Card style={styles.importCard} onPress={() => setActiveTab('manual')}>
          <Card.Content style={styles.importCardContent}>
            <Ionicons name="create" size={40} color="#FF9800" />
            <Text style={styles.importCardTitle}>Manual Entry</Text>
            <Text style={styles.importCardDesc}>Enter product details manually</Text>
          </Card.Content>
        </Card>
      </View>

      {/* Pending Items */}
      <Card style={styles.pendingCard}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <Title>Pending Verification</Title>
            <Chip icon="clock-outline">{tempData.length} items</Chip>
          </View>

          {tempData.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="cube-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No pending items</Text>
            </View>
          ) : (
            <>
              {/* Filters */}
              <View style={styles.filterContainer}>
                <TextInput
                  placeholder="Search pending items..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  mode="outlined"
                  dense
                  style={styles.searchInput}
                />
                
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <Chip
                    selected={selectedWarehouse === 'all'}
                    onPress={() => setSelectedWarehouse('all')}
                    style={styles.filterChip}
                  >
                    All Warehouses
                  </Chip>
                  {warehouses.map(w => (
                    <Chip
                      key={w.id}
                      selected={selectedWarehouse === w.name}
                      onPress={() => setSelectedWarehouse(w.name)}
                      style={styles.filterChip}
                    >
                      {w.name}
                    </Chip>
                  ))}
                </ScrollView>
              </View>

              {/* Pending Items List */}
              {getFilteredTempData().map(item => (
                <Card key={item.id} style={styles.pendingItemCard}>
                  <Card.Content>
                    <View style={styles.pendingItemHeader}>
                      <View style={styles.pendingItemTitle}>
                        <Text style={styles.pendingItemName}>{item.name}</Text>
                        <Chip 
                          icon={item.source === 'csv' ? 'file-document' : 
                                item.source === 'scan' ? 'camera' : 'pencil'}
                          mode="outlined"
                          style={styles.sourceChip}
                        >
                          {item.source}
                        </Chip>
                      </View>
                      <IconButton
                        icon="checkbox-blank-outline"
                        size={24}
                        onPress={() => {
                          if (selectedItems.includes(item)) {
                            setSelectedItems(selectedItems.filter(i => i.id !== item.id));
                          } else {
                            setSelectedItems([...selectedItems, item]);
                          }
                        }}
                      />
                    </View>

                    <View style={styles.pendingItemDetails}>
                      <View style={styles.detailRow}>
                        <Ionicons name="cube-outline" size={16} color="#666" />
                        <Text style={styles.detailText}>Batch: {item.batch}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Ionicons name="calendar-outline" size={16} color="#666" />
                        <Text style={styles.detailText}>Expiry: {new Date(item.expiry).toLocaleDateString()}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Ionicons name="business-outline" size={16} color="#666" />
                        <Text style={styles.detailText}>{item.company}</Text>
                      </View>
                    </View>

                    <Divider style={styles.divider} />

                    <View style={styles.pendingItemFooter}>
                      <View>
                        <Text style={styles.footerLabel}>Quantity</Text>
                        <Text style={styles.footerValue}>{item.quantity}</Text>
                      </View>
                      <View>
                        <Text style={styles.footerLabel}>Price</Text>
                        <Text style={styles.footerValue}>₹{item.price}</Text>
                      </View>
                      <View style={styles.footerActions}>
                        <Button 
                          mode="text" 
                          onPress={() => {
                            setSelectedProduct(item);
                            setVerifyModalVisible(true);
                          }}
                        >
                          Verify
                        </Button>
                      </View>
                    </View>
                  </Card.Content>
                </Card>
              ))}

              {selectedItems.length > 0 && (
                <View style={styles.bulkActions}>
                  <Button 
                    mode="contained" 
                    onPress={() => handleVerifyAndSave(selectedItems)}
                    loading={loading}
                  >
                    Save Selected ({selectedItems.length})
                  </Button>
                  <Button 
                    mode="outlined" 
                    onPress={() => setSelectedItems([])}
                  >
                    Clear
                  </Button>
                </View>
              )}
            </>
          )}
        </Card.Content>
      </Card>
    </View>
  );

  // Render manual entry tab
  const renderManualTab = () => (
    <ScrollView style={styles.tabContent}>
      <Card style={styles.formCard}>
        <Card.Content>
          <Title>Manual Product Entry</Title>
          <Paragraph>Enter product details manually</Paragraph>

          <TextInput
            label="Product Name *"
            value={manualForm.name}
            onChangeText={text => setManualForm({...manualForm, name: text})}
            mode="outlined"
            style={styles.formInput}
          />

          <TextInput
            label="Batch Number *"
            value={manualForm.batch}
            onChangeText={text => setManualForm({...manualForm, batch: text})}
            mode="outlined"
            style={styles.formInput}
          />

          <TouchableOpacity onPress={() => {
            setDateField('expiry');
            setShowDatePicker(true);
          }}>
            <TextInput
              label="Expiry Date *"
              value={manualForm.expiry}
              editable={false}
              mode="outlined"
              style={styles.formInput}
              right={<TextInput.Icon icon="calendar" />}
            />
          </TouchableOpacity>

          <View style={styles.formRow}>
            <TextInput
              label="Quantity *"
              value={manualForm.quantity}
              onChangeText={text => setManualForm({...manualForm, quantity: text})}
              mode="outlined"
              keyboardType="numeric"
              style={[styles.formInput, styles.halfInput]}
            />
            <TextInput
              label="Price (₹)"
              value={manualForm.price}
              onChangeText={text => setManualForm({...manualForm, price: text})}
              mode="outlined"
              keyboardType="numeric"
              style={[styles.formInput, styles.halfInput]}
            />
          </View>

          <TextInput
            label="Company"
            value={manualForm.company}
            onChangeText={text => setManualForm({...manualForm, company: text})}
            mode="outlined"
            style={styles.formInput}
          />

          <TextInput
            label="Category"
            value={manualForm.category}
            onChangeText={text => setManualForm({...manualForm, category: text})}
            mode="outlined"
            style={styles.formInput}
          />

          <TextInput
            label="Shelf Location"
            value={manualForm.shelf}
            onChangeText={text => setManualForm({...manualForm, shelf: text})}
            mode="outlined"
            style={styles.formInput}
          />

          <TextInput
            label="Supplier"
            value={manualForm.supplier}
            onChangeText={text => setManualForm({...manualForm, supplier: text})}
            mode="outlined"
            style={styles.formInput}
          />

          <TextInput
            label="Invoice Number"
            value={manualForm.invoiceNo}
            onChangeText={text => setManualForm({...manualForm, invoiceNo: text})}
            mode="outlined"
            style={styles.formInput}
          />

          <Button 
            mode="contained" 
            onPress={handleManualSubmit}
            style={styles.submitButton}
            icon="check"
          >
            Add Product
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );

  // Render output (selling) tab
  const renderOutputTab = () => (
    <View style={styles.tabContent}>
      <Card style={styles.outputCard}>
        <Card.Content>
          <Title>Sell Products</Title>
          <Paragraph>Search and select products to sell</Paragraph>

          <TextInput
            placeholder="Search products by name, batch..."
            mode="outlined"
            style={styles.searchInput}
          />

          {/* Quick search results would go here */}
          <List.Item
            title="Paracetamol 500mg"
            description="Batch: B2024-001 • Qty: 500 • ₹2.5"
            left={props => <List.Icon {...props} icon="pill" />}
            right={props => (
              <Button mode="contained" onPress={() => {}}>Sell</Button>
            )}
          />
        </Card.Content>
      </Card>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Mode Selector (Input/Output) */}
      <View style={styles.modeSelector}>
        <TouchableOpacity
          style={[styles.modeButton, mode === 'input' && styles.modeButtonActive]}
          onPress={() => setMode('input')}
        >
          <Ionicons 
            name="arrow-down-circle" 
            size={24} 
            color={mode === 'input' ? '#007AFF' : '#666'} 
          />
          <Text style={[styles.modeText, mode === 'input' && styles.modeTextActive]}>
            Input
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modeButton, mode === 'output' && styles.modeButtonActive]}
          onPress={() => setMode('output')}
        >
          <Ionicons 
            name="arrow-up-circle" 
            size={24} 
            color={mode === 'output' ? '#007AFF' : '#666'} 
          />
          <Text style={[styles.modeText, mode === 'output' && styles.modeTextActive]}>
            Output
          </Text>
        </TouchableOpacity>
      </View>

      {mode === 'input' ? (
        <>
          {/* Input Tabs */}
          <View style={styles.inputTabs}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'import' && styles.activeTab]}
              onPress={() => setActiveTab('import')}
            >
              <Text style={[styles.tabText, activeTab === 'import' && styles.activeTabText]}>
                Import
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'scan' && styles.activeTab]}
              onPress={() => setActiveTab('scan')}
            >
              <Text style={[styles.tabText, activeTab === 'scan' && styles.activeTabText]}>
                Scan
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'manual' && styles.activeTab]}
              onPress={() => setActiveTab('manual')}
            >
              <Text style={[styles.tabText, activeTab === 'manual' && styles.activeTabText]}>
                Manual
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          {activeTab === 'import' && renderImportTab()}
          {activeTab === 'scan' && (
            <View style={styles.scanContainer}>
              {cameraPermission ? (
                <View style={styles.cameraPlaceholder}>
                  <Ionicons name="camera" size={64} color="#ccc" />
                  <Text>Camera would open here</Text>
                  <Button 
                    mode="contained" 
                    onPress={handleScanImage}
                    style={styles.scanButton}
                  >
                    Take Photo
                  </Button>
                </View>
              ) : (
                <Text>No camera permission</Text>
              )}
            </View>
          )}
          {activeTab === 'manual' && renderManualTab()}
        </>
      ) : (
        // Output Mode
        renderOutputTab()
      )}

      {/* Verification Modal */}
      <Portal>
        <Modal
          visible={verifyModalVisible}
          onDismiss={() => setVerifyModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          {selectedProduct && (
            <ScrollView>
              <View style={styles.modalHeader}>
                <Title>Verify Product</Title>
                <IconButton icon="close" onPress={() => setVerifyModalVisible(false)} />
              </View>

              <Divider />

              <View style={styles.modalContent}>
                <Text style={styles.modalLabel}>Product Name</Text>
                <Text style={styles.modalValue}>{selectedProduct.name}</Text>

                <Text style={styles.modalLabel}>Batch Number</Text>
                <Text style={styles.modalValue}>{selectedProduct.batch}</Text>

                <Text style={styles.modalLabel}>Expiry Date</Text>
                <TextInput
                  value={selectedProduct.expiry}
                  mode="outlined"
                  style={styles.modalInput}
                />

                <Text style={styles.modalLabel}>Quantity</Text>
                <TextInput
                  value={String(selectedProduct.quantity)}
                  keyboardType="numeric"
                  mode="outlined"
                  style={styles.modalInput}
                />

                <Text style={styles.modalLabel}>Warehouse</Text>
                <TextInput
                  value={selectedProduct.warehouse}
                  mode="outlined"
                  style={styles.modalInput}
                />

                <Text style={styles.modalLabel}>Shelf Location</Text>
                <TextInput
                  value={selectedProduct.shelf}
                  mode="outlined"
                  style={styles.modalInput}
                />
              </View>

              <View style={styles.modalActions}>
                <Button 
                  mode="contained" 
                  onPress={() => {
                    handleVerifyAndSave([selectedProduct]);
                    setVerifyModalVisible(false);
                  }}
                  style={styles.modalButton}
                >
                  Save to Database
                </Button>
                <Button 
                  mode="outlined" 
                  onPress={() => setVerifyModalVisible(false)}
                  style={styles.modalButton}
                >
                  Cancel
                </Button>
              </View>
            </ScrollView>
          )}
        </Modal>
      </Portal>

      {/* Date Picker */}
      <DateTimePicker
        isVisible={showDatePicker}
        mode="date"
        onConfirm={(date) => {
          setShowDatePicker(false);
          if (dateField === 'expiry') {
            setManualForm({...manualForm, expiry: date.toISOString().split('T')[0]});
          }
        }}
        onCancel={() => setShowDatePicker(false)}
      />

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Processing...</Text>
        </View>
      )}

      {/* Snackbar */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{
          label: 'OK',
          onPress: () => setSnackbarVisible(false),
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
  modeSelector: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  modeButtonActive: {
    backgroundColor: '#E3F2FD',
  },
  modeText: {
    fontSize: 16,
    color: '#666',
  },
  modeTextActive: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  inputTabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  tabContent: {
    flex: 1,
  },
  importOptions: {
    flexDirection: 'row',
    padding: 10,
    gap: 10,
  },
  importCard: {
    flex: 1,
    elevation: 2,
  },
  importCardContent: {
    alignItems: 'center',
    padding: 15,
  },
  importCardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  importCardDesc: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  pendingCard: {
    margin: 10,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  emptyState: {
    alignItems: 'center',
    padding: 30,
  },
  emptyText: {
    marginTop: 10,
    color: '#999',
  },
  filterContainer: {
    marginBottom: 15,
  },
  searchInput: {
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  filterChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  pendingItemCard: {
    marginBottom: 10,
    elevation: 1,
  },
  pendingItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  pendingItemTitle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pendingItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  sourceChip: {
    height: 28,
  },
  pendingItemDetails: {
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
  divider: {
    marginVertical: 10,
  },
  pendingItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLabel: {
    fontSize: 11,
    color: '#666',
  },
  footerValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  footerActions: {
    flexDirection: 'row',
  },
  bulkActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    gap: 10,
  },
  formCard: {
    margin: 10,
    elevation: 2,
  },
  formInput: {
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  submitButton: {
    marginTop: 10,
    padding: 6,
  },
  scanContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraPlaceholder: {
    alignItems: 'center',
    gap: 20,
  },
  scanButton: {
    marginTop: 20,
  },
  outputCard: {
    margin: 10,
    elevation: 2,
  },
  modalContainer: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    padding: 16,
  },
  modalLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 12,
    marginBottom: 4,
  },
  modalValue: {
    fontSize: 16,
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: '#fff',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#007AFF',
  },
});