import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Text,
  Chip,
  Badge,
  IconButton,
  Divider,
  Button,
  Menu,
  Avatar,
  ActivityIndicator,
  Portal,
  Dialog,
  Searchbar,
  Snackbar,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import AlertService from '../services/alert.service';
import { useFocusEffect } from '@react-navigation/native';


export default function NotificationsScreen({ navigation }) {
  
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // all, unread, expiry, stock, system
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Load notifications when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadNotifications();
    }, [])
  );

  // Calculate stats
  const stats = {
    total: notifications.length,
    unread: notifications.filter(n => !n.read).length,
    expiry: notifications.filter(n => n.type === 'EXPIRY').length,
    stock: notifications.filter(n => n.type === 'LOW_STOCK').length,
    system: notifications.filter(n => n.type === 'SYSTEM').length,
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginRight: 8 }}>Alerts</Text>
        </View>
      ),
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 10 }}>
          {stats.unread > 0 && (
            <Button mode="text" onPress={handleMarkAllAsRead}>
              Mark all read
            </Button>
          )}
        </View>
      ),
    });
  }, [navigation, stats.unread, stats.total]);

  const loadNotifications = async () => {
    try {
      const response = await AlertService.getNotifications();
      
      if (response.success) {
        setNotifications(response.data);
      }
    } catch (error) {
      console.error('❌ Error loading notifications:', error);
      Alert.alert('Error', 'Failed to load notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };




  // Filter notifications
  const getFilteredNotifications = () => {
    let filtered = [...notifications];

    // Apply search
    if (searchQuery) {
      filtered = filtered.filter(n => 
        n.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.product?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply type filter
    if (filter !== 'all') {
      if (filter === 'unread') {
        filtered = filtered.filter(n => !n.read);
      } else if (filter === 'expiry') {
        filtered = filtered.filter(n => n.type === 'EXPIRY');
      } else if (filter === 'stock') {
        filtered = filtered.filter(n => n.type === 'LOW_STOCK');
      } else if (filter === 'system') {
        filtered = filtered.filter(n => n.type === 'SYSTEM');
      }
    }

    return filtered;
  };

  const filteredNotifications = getFilteredNotifications();

  // Mark as read
  const handleMarkAsRead = async (id) => {
    try {
      const response = await AlertService.markAsRead(id);
      
      if (response.success) {
        // Update local state
        setNotifications(notifications.map(n => 
          n.id === id ? { ...n, read: true } : n
        ));
        showSnackbar('Notification marked as read');
      }
    } catch (error) {
      console.error('❌ Error marking as read:', error);
      Alert.alert('Error', 'Failed to mark notification as read');
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      const response = await AlertService.markAllAsRead();
      
      if (response.success) {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
        showSnackbar('All notifications marked as read');
      }
    } catch (error) {
      console.error('❌ Error marking all as read:', error);
      Alert.alert('Error', 'Failed to mark all as read');
    }
  };

  // Delete notification
  const handleDelete = async (id) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await AlertService.deleteNotification(id);
              
              if (response.success) {
                setNotifications(notifications.filter(n => n.id !== id));
                if (selectedNotification?.id === id) {
                  setDetailsVisible(false);
                }
                showSnackbar('Notification deleted');
              }
            } catch (error) {
              console.error('❌ Error deleting notification:', error);
              Alert.alert('Error', 'Failed to delete notification');
            }
          }
        }
      ]
    );
  };

  // Clear all
 // Clear all
const handleClearAll = () => {
  if (notifications.length === 0) return;
  
  Alert.alert(
    'Clear All',
    `Are you sure you want to delete all ${notifications.length} notifications?`,
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear All',
        style: 'destructive',
        onPress: async () => {
          try {
            setLoading(true);
            const response = await AlertService.clearAllNotifications();
            
            if (response.success) {
              setNotifications([]);
              setDetailsVisible(false);
              showSnackbar(response.message || 'All notifications cleared');
            }
          } catch (error) {
            console.error('❌ Error clearing all:', error);
            Alert.alert('Error', error.message || 'Failed to clear notifications');
          } finally {
            setLoading(false);
          }
        }
      }
    ]
  );
};

  const showSnackbar = (message) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  // Get icon based on type
  const getNotificationIcon = (type) => {
    switch(type) {
      case 'EXPIRY': return 'calendar';
      case 'LOW_STOCK': return 'warning';
      case 'SYSTEM': return 'information-circle';
      default: return 'notifications';
    }
  };

  // Get color based on severity
  const getSeverityColor = (severity) => {
    switch(severity) {
      case 'CRITICAL': return '#DC2626';
      case 'HIGH': return '#D97706';
      case 'MEDIUM': return '#F59E0B';
      case 'LOW': return '#16A34A';
      default: return '#3B82F6';
    }
  };

  // Format timestamp
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
        <ActivityIndicator size="large" color="#0F172A" />
        <Text style={styles.loadingText}>Loading notifications...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Navigation Header Content moved to useLayoutEffect */}

      {/* Search Bar */}
      <Searchbar
        placeholder="Search alerts..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      {/* Filter Chips */}
      {/* Compact Filter Chips */}
<ScrollView 
  horizontal 
  showsHorizontalScrollIndicator={false} 
  style={styles.compactFilterContainer}
  contentContainerStyle={styles.compactFilterContent}
>
  <Chip
    selected={filter === 'all'}
    onPress={() => setFilter('all')}
    style={styles.compactFilterChip}
    textStyle={styles.compactFilterText}
  >
    All ({stats.total})
  </Chip>
  <Chip
    selected={filter === 'unread'}
    onPress={() => setFilter('unread')}
    style={styles.compactFilterChip}
    textStyle={styles.compactFilterText}
  >
    Unread ({stats.unread})
  </Chip>
  <Chip
    selected={filter === 'expiry'}
    onPress={() => setFilter('expiry')}
    style={styles.compactFilterChip}
    textStyle={styles.compactFilterText}
  >
    Expiry ({stats.expiry})
  </Chip>
  <Chip
    selected={filter === 'stock'}
    onPress={() => setFilter('stock')}
    style={styles.compactFilterChip}
    textStyle={styles.compactFilterText}
  >
    Stock ({stats.stock})
  </Chip>
  <Chip
    selected={filter === 'system'}
    onPress={() => setFilter('system')}
    style={styles.compactFilterChip}
    textStyle={styles.compactFilterText}
  >
    System ({stats.system})
  </Chip>
</ScrollView>

      {/* Notifications List */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 14, color: '#666', fontWeight: '500' }}>
          {stats.unread} unread alerts
        </Text>
        <Text style={{ fontSize: 12, color: '#9CA3AF' }}>
          {stats.total} total
        </Text>
      </View>
      <ScrollView
        style={styles.notificationsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredNotifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No notifications</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'Try a different search' : "You're all caught up!"}
            </Text>
          </View>
        ) : (
          filteredNotifications.map(notification => (
            <TouchableOpacity
              key={notification.id}
              onPress={() => {
                if (!notification.read) {
                  handleMarkAsRead(notification.id);
                }
                setSelectedNotification(notification);
                setDetailsVisible(true);
              }}
            >
              <Card style={[styles.notificationCard, !notification.read && styles.unreadCard]}>
                <Card.Content>
                  <View style={styles.notificationHeader}>
                    <View style={styles.notificationTitle}>
                      <Avatar.Icon
                        size={40}
                        icon={getNotificationIcon(notification.type)}
                        style={[styles.notificationIcon, { backgroundColor: getSeverityColor(notification.severity) }]}
                      />
                      <View style={styles.titleContainer}>
                        <Text style={styles.notificationTitleText}>
                          {notification.title}
                        </Text>
                        <Text style={styles.notificationTime}>
                          {formatTimestamp(notification.createdAt)}
                        </Text>
                      </View>
                    </View>
                    {!notification.read && <Badge style={styles.unreadBadge} size={10} />}
                  </View>

                  <Text style={styles.notificationMessage} numberOfLines={2}>
                    {notification.message}
                  </Text>

                  {notification.product && (
                    <View style={styles.productInfo}>
                      <Chip 
                        icon="pill" 
                        mode="outlined" 
                        style={styles.productChip}
                        onPress={() => {
                          setDetailsVisible(false);
                          navigation.navigate('Inventory', { 
                            screen: 'Inventory',
                            params: { productId: notification.product.id }
                          });
                        }}
                      >
                        {notification.product.name}
                      </Chip>
                    </View>
                  )}

                  <View style={styles.notificationFooter}>
                    <Chip 
                      mode="outlined"
                      style={[styles.typeChip, { borderColor: getSeverityColor(notification.severity) }]}
                      textStyle={{ color: getSeverityColor(notification.severity) }}
                    >
                      {notification.type} • {notification.severity}
                    </Chip>
                    
                    <View style={styles.footerActions}>
                      {!notification.read && (
                        <Button 
                          mode="text" 
                          onPress={() => handleMarkAsRead(notification.id)}
                          compact
                        >
                          Mark Read
                        </Button>
                      )}
                      <IconButton
                        icon="delete"
                        size={20}
                        onPress={() => handleDelete(notification.id)}
                      />
                    </View>
                  </View>
                </Card.Content>
              </Card>
            </TouchableOpacity>
          ))
        )}
        
        {notifications.length > 0 && (
          <Button 
            mode="outlined" 
            onPress={handleClearAll}
            style={styles.clearButton}
            color="#DC2626"
          >
            Clear All Notifications
          </Button>
        )}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Notification Details Modal */}
      <Portal>
        <Dialog visible={detailsVisible} onDismiss={() => setDetailsVisible(false)}>
          {selectedNotification && (
            <>
              <Dialog.Title>{selectedNotification.title}</Dialog.Title>
              <Dialog.Content>
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Message</Text>
                  <Text style={styles.detailValue}>{selectedNotification.message}</Text>
                </View>

                <Divider style={styles.divider} />

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Type</Text>
                  <Chip 
                    mode="outlined"
                    style={{ borderColor: getSeverityColor(selectedNotification.severity) }}
                  >
                    {selectedNotification.type}
                  </Chip>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Severity</Text>
                  <Chip 
                    mode="outlined"
                    style={{ borderColor: getSeverityColor(selectedNotification.severity) }}
                    textStyle={{ color: getSeverityColor(selectedNotification.severity) }}
                  >
                    {selectedNotification.severity}
                  </Chip>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Received</Text>
                  <Text>{new Date(selectedNotification.createdAt).toLocaleString()}</Text>
                </View>

                {selectedNotification.product && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Related Product</Text>
                    <Card style={styles.productCard}>
                      <Card.Content>
                        <Text style={styles.productName}>{selectedNotification.product.name}</Text>
                        <Text>Batch: {selectedNotification.product.batchNumber}</Text>
                        {selectedNotification.product.expiryDate && (
                          <Text>Expires: {new Date(selectedNotification.product.expiryDate).toLocaleDateString()}</Text>
                        )}
                      </Card.Content>
                    </Card>
                  </View>
                )}

                {selectedNotification.data && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Additional Data</Text>
                    <Text style={styles.dataText}>{JSON.stringify(selectedNotification.data, null, 2)}</Text>
                  </View>
                )}
              </Dialog.Content>
              <Dialog.Actions>
                <Button onPress={() => setDetailsVisible(false)}>Close</Button>
                <Button onPress={() => handleDelete(selectedNotification.id)}>Delete</Button>
              </Dialog.Actions>
            </>
          )}
        </Dialog>
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
  filterContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterChip: {
    marginRight: 8,
  },
  notificationsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  notificationCard: {
    marginBottom: 8,
    elevation: 2,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  notificationTitle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactFilterContainer: {
  maxHeight: 40,
  marginBottom: 12,
},
compactFilterContent: {
  paddingHorizontal: 16,
  gap: 6,
  alignItems: 'center',
},
compactFilterChip: {
  height: 35,
  marginRight: 0, // Remove margin, use gap instead
},
compactFilterText: {
  fontSize: 13,
  marginHorizontal: 8,
},
  notificationIcon: {
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  notificationTitleText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  notificationTime: {
    fontSize: 11,
    color: '#666',
  },
  unreadBadge: {
    backgroundColor: '#3B82F6',
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
    marginLeft: 52,
  },
  productInfo: {
    marginLeft: 52,
    marginBottom: 8,
  },
  productChip: {
    alignSelf: 'flex-start',
  },
  notificationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: 52,
  },
  typeChip: {
    height: 28,
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  clearButton: {
    marginVertical: 16,
  },
  bottomPadding: {
    height: 20,
  },
  detailSection: {
    marginBottom: 16,
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
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
  },
  divider: {
    marginVertical: 12,
  },
  productCard: {
    marginTop: 8,
    backgroundColor: '#f8f8f8',
  },
  productName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  dataText: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 4,
    fontFamily: 'monospace',
  },
});