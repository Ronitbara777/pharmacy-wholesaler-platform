import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  FlatList,
  Share,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Text,
  Searchbar,
  Chip,
  IconButton,
  Divider,
  Button,
  Menu,
  Avatar,
  List,
  DataTable,
  Portal,
  Modal,
  RadioButton,
  Dialog,
  Snackbar,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';

console.log('📋 HistoryScreen loaded');

// Mock history data
const mockHistory = [
  {
    id: '1',
    action: 'STOCK_IN',
    product: 'Paracetamol 500mg',
    quantity: 500,
    user: 'John Doe',
    timestamp: '2024-02-22T10:30:00Z',
    details: {
      batch: 'B2024-001',
      supplier: 'GSK',
      invoice: 'INV-2024-001',
      warehouse: 'Main Warehouse',
      shelf: 'A-12',
    },
    ipAddress: '192.168.1.100',
    device: 'Mobile App',
  },
  {
    id: '2',
    action: 'STOCK_OUT',
    product: 'Amoxicillin 250mg',
    quantity: 50,
    user: 'Sarah Smith',
    timestamp: '2024-02-22T09:15:00Z',
    details: {
      batch: 'B2024-002',
      party: 'City Medical Store',
      invoice: 'SALE-2024-089',
      amount: 250.00,
    },
    ipAddress: '192.168.1.101',
    device: 'Web Dashboard',
  },
  {
    id: '3',
    action: 'VIEW',
    product: 'Inventory Report',
    user: 'Mike Johnson',
    timestamp: '2024-02-22T08:45:00Z',
    details: {
      reportType: 'Stock Summary',
      format: 'PDF',
    },
    ipAddress: '192.168.1.102',
    device: 'Mobile App',
  },
  {
    id: '4',
    action: 'UPDATE',
    product: 'Vitamin C 1000mg',
    user: 'John Doe',
    timestamp: '2024-02-21T16:20:00Z',
    details: {
      field: 'price',
      oldValue: '7.5',
      newValue: '8.0',
      reason: 'Price update',
    },
    ipAddress: '192.168.1.100',
    device: 'Mobile App',
  },
  {
    id: '5',
    action: 'DELETE',
    product: 'Expired Product',
    quantity: 25,
    user: 'Sarah Smith',
    timestamp: '2024-02-21T14:00:00Z',
    details: {
      batch: 'B2023-099',
      reason: 'Expired',
      disposalMethod: 'Return to supplier',
    },
    ipAddress: '192.168.1.101',
    device: 'Mobile App',
  },
  {
    id: '6',
    action: 'PRINT',
    product: 'Inventory List',
    user: 'Mike Johnson',
    timestamp: '2024-02-21T11:30:00Z',
    details: {
      format: 'PDF',
      pages: 5,
      items: 150,
    },
    ipAddress: '192.168.1.102',
    device: 'Web Dashboard',
  },
  {
    id: '7',
    action: 'EXPORT',
    product: 'Sales Report',
    user: 'John Doe',
    timestamp: '2024-02-20T15:45:00Z',
    details: {
      format: 'Excel',
      dateRange: 'Feb 2024',
    },
    ipAddress: '192.168.1.100',
    device: 'Mobile App',
  },
  {
    id: '8',
    action: 'LOGIN',
    user: 'Sarah Smith',
    timestamp: '2024-02-20T09:00:00Z',
    details: {
      method: 'Biometric',
      status: 'Success',
    },
    ipAddress: '192.168.1.101',
    device: 'Mobile App',
  },
];

// Action types for filtering
const actionTypes = [
  { id: 'all', label: 'All Actions', icon: 'apps' },
  { id: 'STOCK_IN', label: 'Stock In', icon: 'arrow-down-circle' },
  { id: 'STOCK_OUT', label: 'Stock Out', icon: 'arrow-up-circle' },
  { id: 'VIEW', label: 'Views', icon: 'eye' },
  { id: 'UPDATE', label: 'Updates', icon: 'pencil' },
  { id: 'DELETE', label: 'Deletions', icon: 'trash' },
  { id: 'PRINT', label: 'Prints', icon: 'printer' },
  { id: 'EXPORT', label: 'Exports', icon: 'download' },
  { id: 'LOGIN', label: 'Logins', icon: 'log-in' },
];

// Date range options
const dateRanges = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
  { id: 'custom', label: 'Custom Range' },
];

export default function HistoryScreen({ navigation }) {
  console.log('📋 HistoryScreen rendering');
  
  const [history, setHistory] = useState(mockHistory);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState('all');
  const [selectedDateRange, setSelectedDateRange] = useState('week');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'table'
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [exportMenuVisible, setExportMenuVisible] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Calculate stats
  const stats = {
    total: history.length,
    stockIn: history.filter(h => h.action === 'STOCK_IN').length,
    stockOut: history.filter(h => h.action === 'STOCK_OUT').length,
    views: history.filter(h => h.action === 'VIEW').length,
    updates: history.filter(h => h.action === 'UPDATE').length,
    today: history.filter(h => {
      const today = new Date().toDateString();
      return new Date(h.timestamp).toDateString() === today;
    }).length,
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  };

  // Filter history
  const getFilteredHistory = () => {
    let filtered = [...history];

    // Apply search
    if (searchQuery) {
      filtered = filtered.filter(h => 
        (h.product && h.product.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (h.user && h.user.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (h.action && h.action.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply action filter
    if (selectedAction !== 'all') {
      filtered = filtered.filter(h => h.action === selectedAction);
    }

    // Apply date filter
    if (selectedDateRange !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter(h => {
        const itemDate = new Date(h.timestamp);
        
        switch(selectedDateRange) {
          case 'today':
            return itemDate >= today;
          case 'yesterday':
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            return itemDate >= yesterday && itemDate < today;
          case 'week':
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return itemDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(today);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return itemDate >= monthAgo;
          default:
            return true;
        }
      });
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return filtered;
  };

  const filteredHistory = getFilteredHistory();

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date >= today) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date >= yesterday) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  // Get icon for action
  const getActionIcon = (action) => {
    switch(action) {
      case 'STOCK_IN': return 'arrow-down-circle';
      case 'STOCK_OUT': return 'arrow-up-circle';
      case 'VIEW': return 'eye';
      case 'UPDATE': return 'pencil';
      case 'DELETE': return 'trash';
      case 'PRINT': return 'printer';
      case 'EXPORT': return 'download';
      case 'LOGIN': return 'log-in';
      default: return 'help-circle';
    }
  };

  // Get color for action
  const getActionColor = (action) => {
    switch(action) {
      case 'STOCK_IN': return '#4CAF50';
      case 'STOCK_OUT': return '#F44336';
      case 'VIEW': return '#2196F3';
      case 'UPDATE': return '#FF9800';
      case 'DELETE': return '#F44336';
      case 'PRINT': return '#9C27B0';
      case 'EXPORT': return '#3F51B5';
      case 'LOGIN': return '#009688';
      default: return '#757575';
    }
  };

  // Export to PDF
  const exportToPDF = async () => {
    try {
      const html = `
        <html>
          <head>
            <style>
              body { font-family: Arial; padding: 20px; }
              h1 { color: #007AFF; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th { background: #007AFF; color: white; padding: 10px; text-align: left; }
              td { padding: 10px; border-bottom: 1px solid #ddd; }
              .action { font-weight: bold; }
              .STOCK_IN { color: #4CAF50; }
              .STOCK_OUT { color: #F44336; }
            </style>
          </head>
          <body>
            <h1>Activity History Report</h1>
            <p>Generated on: ${new Date().toLocaleString()}</p>
            <p>Total Entries: ${filteredHistory.length}</p>
            
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Action</th>
                  <th>Product</th>
                  <th>User</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                ${filteredHistory.map(item => `
                  <tr>
                    <td>${new Date(item.timestamp).toLocaleString()}</td>
                    <td class="action ${item.action}">${item.action}</td>
                    <td>${item.product || '-'}</td>
                    <td>${item.user}</td>
                    <td>${item.quantity ? `Qty: ${item.quantity}` : ''}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
        setSnackbarMessage('PDF exported successfully');
      } else {
        setSnackbarMessage('PDF saved to: ' + uri);
      }
      
      setSnackbarVisible(true);
    } catch (error) {
      console.error('Export error:', error);
      setSnackbarMessage('Failed to export PDF');
      setSnackbarVisible(true);
    }
  };

  // Export to CSV
  const exportToCSV = async () => {
    try {
      const headers = ['Timestamp', 'Action', 'Product', 'Quantity', 'User', 'Details'];
      const rows = filteredHistory.map(item => [
        new Date(item.timestamp).toLocaleString(),
        item.action,
        item.product || '',
        item.quantity || '',
        item.user,
        JSON.stringify(item.details)
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const fileUri = FileSystem.documentDirectory + 'history_export.csv';
      await FileSystem.writeAsStringAsync(fileUri, csvContent);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
        setSnackbarMessage('CSV exported successfully');
      }

      setSnackbarVisible(true);
    } catch (error) {
      console.error('Export error:', error);
      setSnackbarMessage('Failed to export CSV');
      setSnackbarVisible(true);
    }
  };

  // Render list item
  const renderListItem = (item) => (
    <TouchableOpacity
      key={item.id}
      onPress={() => {
        setSelectedItem(item);
        setDetailsVisible(true);
      }}
    >
      <Card style={styles.historyCard}>
        <Card.Content>
          <View style={styles.historyItem}>
            <Avatar.Icon
              size={40}
              icon={getActionIcon(item.action)}
              style={[styles.actionIcon, { backgroundColor: getActionColor(item.action) + '20' }]}
              color={getActionColor(item.action)}
            />
            
            <View style={styles.historyContent}>
              <View style={styles.historyHeader}>
                <View>
                  <Text style={styles.actionText}>{item.action.replace('_', ' ')}</Text>
                  <Text style={styles.productText}>{item.product || item.user}</Text>
                </View>
                <Text style={styles.timeText}>{formatTimestamp(item.timestamp)}</Text>
              </View>

              <View style={styles.historyDetails}>
                {item.quantity && (
                  <Chip mode="outlined" style={styles.detailChip}>
                    Qty: {item.quantity}
                  </Chip>
                )}
                <Chip mode="outlined" style={styles.detailChip}>
                  {item.user}
                </Chip>
                {item.details?.batch && (
                  <Chip mode="outlined" style={styles.detailChip}>
                    Batch: {item.details.batch}
                  </Chip>
                )}
              </View>
            </View>

            <IconButton
              icon="chevron-right"
              size={24}
              onPress={() => {
                setSelectedItem(item);
                setDetailsVisible(true);
              }}
            />
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Title style={styles.headerTitle}>History</Title>
          <Text style={styles.headerSubtitle}>
            {stats.today} today • {stats.total} total
          </Text>
        </View>
        <View style={styles.headerActions}>
          <Menu
            visible={exportMenuVisible}
            onDismiss={() => setExportMenuVisible(false)}
            anchor={
              <IconButton
                icon="download"
                size={24}
                onPress={() => setExportMenuVisible(true)}
              />
            }
          >
            <Menu.Item onPress={exportToPDF} title="Export as PDF" leadingIcon="file-pdf" />
            <Menu.Item onPress={exportToCSV} title="Export as CSV" leadingIcon="file-delimited" />
          </Menu>
          <IconButton
            icon={viewMode === 'list' ? 'view-list' : 'view-grid'}
            size={24}
            onPress={() => setViewMode(viewMode === 'list' ? 'table' : 'list')}
          />
          <IconButton
            icon="filter"
            size={24}
            onPress={() => setFilterMenuVisible(true)}
          />
        </View>
      </View>

      {/* Search Bar */}
      <Searchbar
        placeholder="Search history..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      {/* Stats Cards */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.statsContainer}
      >
        <Card style={styles.statCard}>
          <Card.Content>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </Card.Content>
        </Card>
        <Card style={[styles.statCard, { backgroundColor: '#E8F5E9' }]}>
          <Card.Content>
            <Text style={styles.statValue}>{stats.stockIn}</Text>
            <Text style={styles.statLabel}>Stock In</Text>
          </Card.Content>
        </Card>
        <Card style={[styles.statCard, { backgroundColor: '#FFEBEE' }]}>
          <Card.Content>
            <Text style={styles.statValue}>{stats.stockOut}</Text>
            <Text style={styles.statLabel}>Stock Out</Text>
          </Card.Content>
        </Card>
        <Card style={[styles.statCard, { backgroundColor: '#E3F2FD' }]}>
          <Card.Content>
            <Text style={styles.statValue}>{stats.views}</Text>
            <Text style={styles.statLabel}>Views</Text>
          </Card.Content>
        </Card>
        <Card style={[styles.statCard, { backgroundColor: '#FFF3E0' }]}>
          <Card.Content>
            <Text style={styles.statValue}>{stats.updates}</Text>
            <Text style={styles.statLabel}>Updates</Text>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Active Filters */}
      <View style={styles.activeFilters}>
        {selectedAction !== 'all' && (
          <Chip
            onClose={() => setSelectedAction('all')}
            style={styles.filterChip}
          >
            Action: {actionTypes.find(a => a.id === selectedAction)?.label}
          </Chip>
        )}
        {selectedDateRange !== 'all' && (
          <Chip
            onClose={() => setSelectedDateRange('all')}
            style={styles.filterChip}
          >
            Date: {dateRanges.find(d => d.id === selectedDateRange)?.label}
          </Chip>
        )}
      </View>

      {/* History List */}
      {viewMode === 'list' ? (
        <FlatList
          data={filteredHistory}
          renderItem={({ item }) => renderListItem(item)}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="time-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No history found</Text>
            </View>
          }
        />
      ) : (
        // Table View
        <ScrollView horizontal>
          <DataTable style={styles.table}>
            <DataTable.Header style={styles.tableHeader}>
              <DataTable.Title>Time</DataTable.Title>
              <DataTable.Title>Action</DataTable.Title>
              <DataTable.Title>Product</DataTable.Title>
              <DataTable.Title numeric>Qty</DataTable.Title>
              <DataTable.Title>User</DataTable.Title>
              <DataTable.Title>Details</DataTable.Title>
            </DataTable.Header>

            {filteredHistory.map(item => (
              <DataTable.Row key={item.id}>
                <DataTable.Cell>{formatTimestamp(item.timestamp)}</DataTable.Cell>
                <DataTable.Cell>
                  <Chip 
                    mode="outlined"
                    style={{ borderColor: getActionColor(item.action) }}
                    textStyle={{ color: getActionColor(item.action) }}
                  >
                    {item.action}
                  </Chip>
                </DataTable.Cell>
                <DataTable.Cell>{item.product || '-'}</DataTable.Cell>
                <DataTable.Cell numeric>{item.quantity || '-'}</DataTable.Cell>
                <DataTable.Cell>{item.user}</DataTable.Cell>
                <DataTable.Cell>
                  <IconButton
                    icon="eye"
                    size={20}
                    onPress={() => {
                      setSelectedItem(item);
                      setDetailsVisible(true);
                    }}
                  />
                </DataTable.Cell>
              </DataTable.Row>
            ))}
          </DataTable>
        </ScrollView>
      )}

      {/* Filter Modal */}
      <Portal>
        <Modal
          visible={filterMenuVisible}
          onDismiss={() => setFilterMenuVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Card>
            <Card.Content>
              <View style={styles.modalHeader}>
                <Title>Filter History</Title>
                <IconButton icon="close" onPress={() => setFilterMenuVisible(false)} />
              </View>

              <Divider />

              <ScrollView style={styles.modalContent}>
                <Text style={styles.filterLabel}>Action Type</Text>
                <View style={styles.filterOptions}>
                  {actionTypes.map(action => (
                    <TouchableOpacity
                      key={action.id}
                      style={[
                        styles.filterOption,
                        selectedAction === action.id && styles.filterOptionSelected
                      ]}
                      onPress={() => setSelectedAction(action.id)}
                    >
                      <Ionicons 
                        name={action.icon} 
                        size={20} 
                        color={selectedAction === action.id ? '#007AFF' : '#666'} 
                      />
                      <Text style={[
                        styles.filterOptionText,
                        selectedAction === action.id && styles.filterOptionTextSelected
                      ]}>
                        {action.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.filterLabel}>Date Range</Text>
                <View style={styles.filterOptions}>
                  {dateRanges.map(range => (
                    <TouchableOpacity
                      key={range.id}
                      style={[
                        styles.filterOption,
                        selectedDateRange === range.id && styles.filterOptionSelected
                      ]}
                      onPress={() => setSelectedDateRange(range.id)}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        selectedDateRange === range.id && styles.filterOptionTextSelected
                      ]}>
                        {range.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <View style={styles.modalActions}>
                <Button 
                  onPress={() => {
                    setSelectedAction('all');
                    setSelectedDateRange('week');
                  }}
                >
                  Reset
                </Button>
                <Button 
                  mode="contained" 
                  onPress={() => setFilterMenuVisible(false)}
                >
                  Apply
                </Button>
              </View>
            </Card.Content>
          </Card>
        </Modal>
      </Portal>

      {/* Details Modal */}
      <Portal>
        <Modal
          visible={detailsVisible}
          onDismiss={() => setDetailsVisible(false)}
          contentContainerStyle={styles.detailsModal}
        >
          {selectedItem && (
            <Card>
              <Card.Content>
                <View style={styles.modalHeader}>
                  <Title>Activity Details</Title>
                  <IconButton icon="close" onPress={() => setDetailsVisible(false)} />
                </View>

                <Divider />

                <ScrollView style={styles.detailsContent}>
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Action</Text>
                    <View style={styles.detailAction}>
                      <Avatar.Icon
                        size={30}
                        icon={getActionIcon(selectedItem.action)}
                        style={[styles.detailIcon, { backgroundColor: getActionColor(selectedItem.action) + '20' }]}
                        color={getActionColor(selectedItem.action)}
                      />
                      <Text style={styles.detailActionText}>{selectedItem.action.replace('_', ' ')}</Text>
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Timestamp</Text>
                    <Text style={styles.detailValue}>
                      {new Date(selectedItem.timestamp).toLocaleString()}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>User</Text>
                    <Text style={styles.detailValue}>{selectedItem.user}</Text>
                  </View>

                  {selectedItem.product && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Product</Text>
                      <Text style={styles.detailValue}>{selectedItem.product}</Text>
                    </View>
                  )}

                  {selectedItem.quantity && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Quantity</Text>
                      <Text style={styles.detailValue}>{selectedItem.quantity}</Text>
                    </View>
                  )}

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Device</Text>
                    <Text style={styles.detailValue}>{selectedItem.device || 'Unknown'}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>IP Address</Text>
                    <Text style={styles.detailValue}>{selectedItem.ipAddress || 'Unknown'}</Text>
                  </View>

                  {selectedItem.details && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>Additional Details</Text>
                      {Object.entries(selectedItem.details).map(([key, value]) => (
                        <View key={key} style={styles.detailSubRow}>
                          <Text style={styles.detailSubLabel}>{key}:</Text>
                          <Text style={styles.detailSubValue}>{String(value)}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </ScrollView>
              </Card.Content>
            </Card>
          )}
        </Modal>
      </Portal>

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
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
  },
  searchbar: {
    margin: 16,
    marginTop: 8,
    elevation: 2,
  },
  statsContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statCard: {
    width: 100,
    marginRight: 12,
    elevation: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  activeFilters: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  filterChip: {
    height: 36,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  historyCard: {
    marginBottom: 8,
    elevation: 2,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    marginRight: 12,
  },
  historyContent: {
    flex: 1,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  actionText: {
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  productText: {
    fontSize: 14,
    color: '#666',
  },
  timeText: {
    fontSize: 12,
    color: '#999',
  },
  historyDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  detailChip: {
    height: 28,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  table: {
    backgroundColor: '#fff',
    margin: 16,
  },
  tableHeader: {
    backgroundColor: '#f0f0f0',
  },
  modalContainer: {
    margin: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalContent: {
    maxHeight: 400,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    gap: 6,
  },
  filterOptionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#666',
  },
  filterOptionTextSelected: {
    color: '#007AFF',
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
  },
  detailsModal: {
    margin: 20,
    maxHeight: '80%',
  },
  detailsContent: {
    maxHeight: 500,
  },
  detailSection: {
    marginBottom: 20,
  },
  detailRow: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
  },
  detailAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailIcon: {
    marginRight: 8,
  },
  detailActionText: {
    fontSize: 18,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  detailSubRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailSubLabel: {
    width: 100,
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
  },
  detailSubValue: {
    flex: 1,
    fontSize: 14,
  },
});