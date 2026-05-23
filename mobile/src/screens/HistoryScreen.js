// Add this at the top with other imports
import * as FileSystem from 'expo-file-system/legacy';
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Platform
} from 'react-native';
import {
  Card,
  Title,
  Text,
  Searchbar,
  Chip,
  IconButton,
  Divider,
  Button,
  Menu,
  Avatar,
  ActivityIndicator,
  Portal,
  Dialog,
  RadioButton,
  Snackbar
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import DateTimePicker from '@react-native-community/datetimepicker';
import HistoryService from '../services/history.service';
// Remove the direct import of expo-file-system and use require in the function

////
import { File, Directory, Paths } from 'expo-file-system';
// Add this line for encoding
const { EncodingType } = FileSystem;


export default function HistoryScreen({ navigation }) {

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: 'History',
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 10 }}>
          <Menu
            visible={exportMenuVisible}
            onDismiss={() => setExportMenuVisible(false)}
            anchor={
              <IconButton
                icon="download"
                size={24}
                onPress={() => setExportMenuVisible(true)}
                disabled={exporting}
              />
            }
          >
            <Menu.Item 
              onPress={() => handleExport('pdf')} 
              title="Export as PDF" 
              leadingIcon="file-pdf"
              disabled={exporting}
            />
            <Menu.Item 
              onPress={() => handleExport('csv')} 
              title="Export as CSV" 
              leadingIcon="file-delimited"
              disabled={exporting}
            />
          </Menu>
          <IconButton
            icon={viewMode === 'list' ? 'view-list' : 'view-grid'}
            size={24}
            onPress={() => setViewMode(viewMode === 'list' ? 'table' : 'list')}
          />
          <IconButton
            icon="filter"
            size={24}
            onPress={() => setFilterVisible(true)}
          />
        </View>
      ),
    });
  });
  
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'table'
  
  // Filter states
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedAction, setSelectedAction] = useState('all');
  const [selectedDateRange, setSelectedDateRange] = useState('week');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalActivities, setTotalActivities] = useState(0);
  const limit = 20;
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    week: 0,
    month: 0,
    actionDistribution: [],
    topUsers: []
  });
  
  // Selected activity for details
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [detailsVisible, setDetailsVisible] = useState(false);
  
  // Export
  const [exportMenuVisible, setExportMenuVisible] = useState(false);
  const [exporting, setExporting] = useState(false);
  
  // Snackbar
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Action types for filter
  const actionTypes = [
    { id: 'all', label: 'All Actions', icon: 'apps' },
    { id: 'LOGIN', label: 'Logins', icon: 'log-in' },
    { id: 'CREATE', label: 'Create', icon: 'add-circle' },
    { id: 'UPDATE', label: 'Update', icon: 'pencil' },
    { id: 'DELETE', label: 'Delete', icon: 'trash' },
    { id: 'VIEW', label: 'View', icon: 'eye' },
    { id: 'EXPORT', label: 'Export', icon: 'download' },
    { id: 'PRINT', label: 'Print', icon: 'printer' }
  ];

  // Date range options
  const dateRanges = [
    { id: 'today', label: 'Today' },
    { id: 'yesterday', label: 'Yesterday' },
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' },
    { id: 'custom', label: 'Custom Range' }
  ];

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (!loading) {
      loadActivities();
    }
  }, [page, selectedAction, selectedDateRange, startDate, endDate, searchQuery]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadStats(),
        loadActivities()
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await HistoryService.getActivityStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadActivities = async () => {
    try {
      const params = {
        page,
        limit
      };
      if (searchQuery && searchQuery.trim() !== '') {
        params.search = searchQuery.trim();
      }

      // Add date filters
      if (selectedDateRange === 'custom' && startDate && endDate) {
        params.startDate = startDate.toISOString();
        params.endDate = endDate.toISOString();
      } else if (selectedDateRange !== 'all') {
        const now = new Date();
        const start = new Date();
        
        switch(selectedDateRange) {
          case 'today':
            start.setHours(0, 0, 0, 0);
            params.startDate = start.toISOString();
            params.endDate = now.toISOString();
            break;
          case 'yesterday':
            start.setDate(start.getDate() - 1);
            start.setHours(0, 0, 0, 0);
            const end = new Date(start);
            end.setHours(23, 59, 59, 999);
            params.startDate = start.toISOString();
            params.endDate = end.toISOString();
            break;
          case 'week':
            start.setDate(start.getDate() - 7);
            params.startDate = start.toISOString();
            params.endDate = now.toISOString();
            break;
          case 'month':
            start.setMonth(start.getMonth() - 1);
            params.startDate = start.toISOString();
            params.endDate = now.toISOString();
            break;
        }
      }

      // Add action filter
      if (selectedAction !== 'all') {
        params.action = selectedAction;
      }

      const response = await HistoryService.getActivities(params);
      
      if (response.success) {
        setActivities(response.data);
        setTotalPages(response.pagination?.pages || 1);
        setTotalActivities(response.pagination?.total || 0);
      }
    } catch (error) {
      console.error('Error loading activities:', error);
      Alert.alert('Error', 'Failed to load history');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    await Promise.all([loadStats(), loadActivities()]);
    setRefreshing(false);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    setPage(1);
  };

  const handleExport = async (format) => {
  try {
    setExporting(true);
    setExportMenuVisible(false);

    // Build filter params
    const params = {};
    if (selectedAction !== 'all') params.action = selectedAction;
    
    // Add date filters
    if (selectedDateRange === 'custom' && startDate && endDate) {
      params.startDate = startDate.toISOString().split('T')[0];
      params.endDate = endDate.toISOString().split('T')[0];
    } else if (selectedDateRange !== 'week' && selectedDateRange !== 'all') {
      const now = new Date();
      const start = new Date();
      
      switch(selectedDateRange) {
        case 'today':
          start.setHours(0, 0, 0, 0);
          params.startDate = start.toISOString().split('T')[0];
          params.endDate = now.toISOString().split('T')[0];
          break;
        case 'yesterday':
          start.setDate(start.getDate() - 1);
          start.setHours(0, 0, 0, 0);
          const end = new Date(start);
          end.setHours(23, 59, 59, 999);
          params.startDate = start.toISOString().split('T')[0];
          params.endDate = end.toISOString().split('T')[0];
          break;
        case 'month':
          start.setMonth(start.getMonth() - 1);
          params.startDate = start.toISOString().split('T')[0];
          params.endDate = now.toISOString().split('T')[0];
          break;
      }
    }


    let response;
    if (format === 'pdf') {
      response = await HistoryService.exportToPDF(params);
    } else {
      response = await HistoryService.exportToCSV(params);
    }

    
    // Handle the response based on platform
    if (Platform.OS === 'web') {
      // For web, create a download link
      const blob = new Blob([response], { 
        type: format === 'pdf' ? 'application/pdf' : 'text/csv' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `history_export.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      showSnackbar(`Downloaded as ${format.toUpperCase()}`);
    } else {
      // For mobile, use the legacy API for now (simpler)
      const FileSystem = require('expo-file-system/legacy');
      const fileUri = FileSystem.documentDirectory + `history_export.${format}`;
      
      await FileSystem.writeAsStringAsync(fileUri, response, {
        encoding: FileSystem.EncodingType.UTF8
      });
      
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      
      if (fileInfo.exists) {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType: format === 'pdf' ? 'application/pdf' : 'text/csv',
            dialogTitle: `Export as ${format.toUpperCase()}`,
            UTI: format === 'pdf' ? 'com.adobe.pdf' : 'public.comma-separated-values-text'
          });
          showSnackbar(`Exported as ${format.toUpperCase()}`);
        } else {
          showSnackbar(`File saved to: ${fileUri}`);
        }
      } else {
        Alert.alert('Error', 'Failed to save file');
      }
    }

  } catch (error) {
    console.error('❌ Export error:', error);
    console.error('❌ Error details:', error.message);
    Alert.alert('Error', `Failed to export as ${format.toUpperCase()}: ${error.message}`);
  } finally {
    setExporting(false);
  }
};

  const showSnackbar = (message) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const getActionIcon = (action) => {
    switch(action) {
      case 'LOGIN': return 'log-in';
      case 'CREATE': return 'add-circle';
      case 'UPDATE': return 'pencil';
      case 'DELETE': return 'trash';
      case 'VIEW': return 'eye';
      case 'EXPORT': return 'download';
      case 'PRINT': return 'printer';
      default: return 'time';
    }
  };

  const getActionColor = (action) => {
    switch(action) {
      case 'LOGIN': return '#3B82F6';
      case 'CREATE': return '#16A34A';
      case 'UPDATE': return '#D97706';
      case 'DELETE': return '#DC2626';
      case 'VIEW': return '#8B5CF6';
      case 'EXPORT': return '#6366F1';
      case 'PRINT': return '#64748B';
      default: return '#9CA3AF';
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading history...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <Searchbar
        placeholder="Search history..."
        onChangeText={handleSearch}
        value={searchQuery}
        style={styles.searchbar}
      />

      {/* Stats Cards */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{stats.today}</Text>
          <Text style={styles.statLabel}>Today</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{stats.week}</Text>
          <Text style={styles.statLabel}>Week</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{stats.month}</Text>
          <Text style={styles.statLabel}>Month</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
      </View>

      {/* Active Filters */}
      {(selectedAction !== 'all' || selectedDateRange !== 'week') && (
        <View style={styles.activeFilters}>
          {selectedAction !== 'all' && (
            <Chip
              onClose={() => setSelectedAction('all')}
              style={styles.filterChip}
            >
              Action: {actionTypes.find(a => a.id === selectedAction)?.label}
            </Chip>
          )}
          {selectedDateRange !== 'week' && (
            <Chip
              onClose={() => setSelectedDateRange('week')}
              style={styles.filterChip}
            >
              Date: {dateRanges.find(d => d.id === selectedDateRange)?.label}
            </Chip>
          )}
        </View>
      )}

      {/* Activities List */}
      <ScrollView
        style={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activities.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="time-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No activities found</Text>
            <Text style={styles.emptySubtext}>Try changing your filters</Text>
          </View>
        ) : (
          activities.map(activity => (
            <TouchableOpacity
              key={activity.id}
              onPress={() => {
                setSelectedActivity(activity);
                setDetailsVisible(true);
              }}
            >
              <Card style={styles.activityCard}>
                <Card.Content>
                  <View style={styles.activityRow}>
                    <Avatar.Icon
                      size={40}
                      icon={getActionIcon(activity.action)}
                      style={[styles.activityIcon, { backgroundColor: getActionColor(activity.action) + '20' }]}
                      color={getActionColor(activity.action)}
                    />
                    
                    <View style={styles.activityContent}>
                      <View style={styles.activityHeader}>
                        <View>
                          <Text style={styles.actionText}>{activity.action}</Text>
                          <Text style={styles.entityText}>
                            {activity.entityType || 'System'} 
                            {activity.product && ` • ${activity.product.name}`}
                          </Text>
                        </View>
                        <Text style={styles.timeText}>
                          {formatTimestamp(activity.createdAt)}
                        </Text>
                      </View>

                      <View style={styles.activityDetails}>
                        <Chip mode="outlined" style={styles.userChip}>
                          {activity.user?.name || 'System'}
                        </Chip>
                        
                        {activity.details && (
                          <Text style={styles.detailsPreview} numberOfLines={1}>
                            {JSON.stringify(activity.details).slice(0, 50)}...
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                </Card.Content>
              </Card>
            </TouchableOpacity>
          ))
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
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Filter Dialog */}
      <Portal>
        <Dialog visible={filterVisible} onDismiss={() => setFilterVisible(false)}>
          <Dialog.Title>Filter History</Dialog.Title>
          <Dialog.Content>
            <ScrollView style={styles.filterContent}>
              <Text style={styles.filterLabel}>Action Type</Text>
              <RadioButton.Group onValueChange={setSelectedAction} value={selectedAction}>
                {actionTypes.map(action => (
                  <RadioButton.Item
                    key={action.id}
                    label={action.label}
                    value={action.id}
                  />
                ))}
              </RadioButton.Group>

              <Divider style={styles.filterDivider} />

              <Text style={styles.filterLabel}>Date Range</Text>
              <RadioButton.Group onValueChange={setSelectedDateRange} value={selectedDateRange}>
                {dateRanges.map(range => (
                  <RadioButton.Item
                    key={range.id}
                    label={range.label}
                    value={range.id}
                  />
                ))}
              </RadioButton.Group>

              {selectedDateRange === 'custom' && (
                <View style={styles.customDateContainer}>
                  <Button
                    mode="outlined"
                    onPress={() => setShowStartPicker(true)}
                    style={styles.dateButton}
                  >
                    {startDate ? startDate.toLocaleDateString() : 'Start Date'}
                  </Button>
                  <Button
                    mode="outlined"
                    onPress={() => setShowEndPicker(true)}
                    style={styles.dateButton}
                  >
                    {endDate ? endDate.toLocaleDateString() : 'End Date'}
                  </Button>
                </View>
              )}
            </ScrollView>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => {
              setSelectedAction('all');
              setSelectedDateRange('week');
              setStartDate(null);
              setEndDate(null);
            }}>Reset</Button>
            <Button onPress={() => {
              setFilterVisible(false);
              setPage(1);
            }}>Apply</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Date Pickers */}
      {showStartPicker && (
        <DateTimePicker
          value={startDate || new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowStartPicker(false);
            if (selectedDate) setStartDate(selectedDate);
          }}
        />
      )}
      {showEndPicker && (
        <DateTimePicker
          value={endDate || new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowEndPicker(false);
            if (selectedDate) setEndDate(selectedDate);
          }}
        />
      )}

      {/* Details Dialog */}
      <Portal>
        <Dialog visible={detailsVisible} onDismiss={() => setDetailsVisible(false)}>
          {selectedActivity && (
            <>
              <Dialog.Title>Activity Details</Dialog.Title>
              <Dialog.Content>
                <ScrollView style={styles.detailsContent}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Action:</Text>
                    <Chip 
                      icon={getActionIcon(selectedActivity.action)}
                      style={{ backgroundColor: getActionColor(selectedActivity.action) + '20' }}
                    >
                      {selectedActivity.action}
                    </Chip>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>User:</Text>
                    <Text>{selectedActivity.user?.name} ({selectedActivity.user?.email})</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Time:</Text>
                    <Text>{new Date(selectedActivity.createdAt).toLocaleString()}</Text>
                  </View>

                  {selectedActivity.entityType && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Entity:</Text>
                      <Text>{selectedActivity.entityType}</Text>
                    </View>
                  )}

                  {selectedActivity.product && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Product:</Text>
                      <Text>{selectedActivity.product.name}</Text>
                    </View>
                  )}

                  {selectedActivity.details && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>Details:</Text>
                      <Card style={styles.detailsCard}>
                        <Card.Content>
                          <Text style={styles.detailsJson}>
                            {JSON.stringify(selectedActivity.details, null, 2)}
                          </Text>
                        </Card.Content>
                      </Card>
                    </View>
                  )}

                  {selectedActivity.ipAddress && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>IP Address:</Text>
                      <Text>{selectedActivity.ipAddress}</Text>
                    </View>
                  )}

                  {selectedActivity.device && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Device:</Text>
                      <Text>{selectedActivity.device}</Text>
                    </View>
                  )}
                </ScrollView>
              </Dialog.Content>
              <Dialog.Actions>
                <Button onPress={() => setDetailsVisible(false)}>Close</Button>
              </Dialog.Actions>
            </>
          )}
        </Dialog>
      </Portal>

      {/* Loading Overlay for Export */}
      {exporting && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Exporting...</Text>
        </View>
      )}

      {/* Snackbar */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
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
  searchbar: {
    margin: 16,
    marginTop: 8,
    elevation: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  statBox: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    minWidth: 70,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
  },
  activeFilters: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  filterChip: {
    height: 32,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  activityCard: {
    marginBottom: 8,
    elevation: 2,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityIcon: {
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  actionText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  entityText: {
    fontSize: 12,
    color: '#666',
  },
  timeText: {
    fontSize: 11,
    color: '#999',
  },
  activityDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userChip: {
    height: 24,
  },
  detailsPreview: {
    fontSize: 11,
    color: '#666',
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  pageText: {
    marginHorizontal: 16,
  },
  bottomPadding: {
    height: 20,
  },
  filterContent: {
    maxHeight: 400,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  filterDivider: {
    marginVertical: 16,
  },
  customDateContainer: {
    marginTop: 16,
    gap: 12,
  },
  dateButton: {
    marginBottom: 8,
  },
  detailsContent: {
    maxHeight: 400,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: 'bold',
    width: 80,
  },
  detailSection: {
    marginTop: 12,
  },
  detailsCard: {
    marginTop: 8,
    backgroundColor: '#f5f5f5',
  },
  detailsJson: {
    fontFamily: 'monospace',
    fontSize: 12,
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
    zIndex: 1000,
  },
  
  
});