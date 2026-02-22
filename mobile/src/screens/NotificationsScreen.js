import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Text,
  Chip,
  Badge,
  IconButton,
  Divider,
  Button,
  Switch,
  List,
  Avatar,
  Searchbar,
  Menu,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

console.log('🔔 NotificationsScreen loaded');

// Mock notifications data
const mockNotifications = [
  {
    id: '1',
    type: 'expiry',
    title: 'Products Expiring Soon',
    message: '5 products will expire in the next 30 days',
    products: [
      { name: 'Paracetamol 500mg', batch: 'B2024-001', expiry: '2024-12-15', daysLeft: 25 },
      { name: 'Amoxicillin 250mg', batch: 'B2024-002', expiry: '2024-11-30', daysLeft: 18 },
      { name: 'Vitamin C 1000mg', batch: 'B2024-003', expiry: '2024-10-20', daysLeft: 12 },
    ],
    severity: 'high',
    timestamp: '2024-02-22T09:00:00Z',
    read: false,
  },
  {
    id: '2',
    type: 'stock',
    title: 'Low Stock Alert',
    message: '3 products are running low on stock',
    products: [
      { name: 'Ibuprofen 400mg', current: 45, threshold: 100 },
      { name: 'Metformin 500mg', current: 30, threshold: 100 },
      { name: 'Aspirin 75mg', current: 12, threshold: 50 },
    ],
    severity: 'medium',
    timestamp: '2024-02-22T10:30:00Z',
    read: false,
  },
  {
    id: '3',
    type: 'system',
    title: 'System Update',
    message: 'Database backup completed successfully',
    details: 'Backup size: 2.3 GB, Duration: 5 minutes',
    severity: 'info',
    timestamp: '2024-02-22T08:00:00Z',
    read: true,
  },
  {
    id: '4',
    type: 'expiry',
    title: 'Expired Products',
    message: '2 products have expired and need disposal',
    products: [
      { name: 'Cetirizine 10mg', batch: 'B2024-004', expiry: '2024-08-05' },
      { name: 'Omeprazole 20mg', batch: 'B2024-005', expiry: '2024-07-20' },
    ],
    severity: 'critical',
    timestamp: '2024-02-21T14:00:00Z',
    read: false,
  },
  {
    id: '5',
    type: 'stock',
    title: 'Reorder Recommended',
    message: '5 products have reached reorder point',
    products: [
      { name: 'Paracetamol 500mg', current: 150, reorderAt: 200 },
      { name: 'Amoxicillin 250mg', current: 80, reorderAt: 100 },
    ],
    severity: 'low',
    timestamp: '2024-02-21T11:00:00Z',
    read: true,
  },
  {
    id: '6',
    type: 'system',
    title: 'New Version Available',
    message: 'App version 2.0.0 is ready to install',
    details: 'Includes new features and bug fixes',
    severity: 'info',
    timestamp: '2024-02-20T16:00:00Z',
    read: true,
  },
];

// Alert preferences
const defaultPreferences = {
  expiryAlerts: true,
  expiryDays: 30,
  lowStockAlerts: true,
  lowStockThreshold: 100,
  systemAlerts: true,
  emailNotifications: false,
  pushNotifications: true,
  soundEnabled: true,
};

export default function NotificationsScreen({ navigation }) {
  console.log('🔔 NotificationsScreen rendering');
  
  const [notifications, setNotifications] = useState(mockNotifications);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // all, unread, expiry, stock, system
  const [searchQuery, setSearchQuery] = useState('');
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);

  // Calculate stats
  const stats = {
    total: notifications.length,
    unread: notifications.filter(n => !n.read).length,
    critical: notifications.filter(n => n.severity === 'critical' && !n.read).length,
    expiry: notifications.filter(n => n.type === 'expiry').length,
    stock: notifications.filter(n => n.type === 'stock').length,
  };

  const onRefresh = () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  };

  // Filter notifications
  const getFilteredNotifications = () => {
    let filtered = [...notifications];

    // Apply search
    if (searchQuery) {
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.message.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply type filter
    if (filter !== 'all') {
      if (filter === 'unread') {
        filtered = filtered.filter(n => !n.read);
      } else {
        filtered = filtered.filter(n => n.type === filter);
      }
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return filtered;
  };

  const filteredNotifications = getFilteredNotifications();

  // Mark as read
  const markAsRead = (id) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  // Mark all as read
  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  // Delete notification
  const deleteNotification = (id) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  // Clear all
  const clearAll = () => {
    setNotifications([]);
  };

  // Get icon based on type and severity
  const getNotificationIcon = (type, severity) => {
    if (type === 'expiry') return 'calendar';
    if (type === 'stock') return 'warning';
    if (type === 'system') return 'information-circle';
    return 'notifications';
  };

  // Get color based on severity
  const getSeverityColor = (severity) => {
    switch(severity) {
      case 'critical': return '#F44336';
      case 'high': return '#FF9800';
      case 'medium': return '#FFC107';
      case 'low': return '#4CAF50';
      default: return '#2196F3';
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

  // Render notification item
  const renderNotification = (notification) => (
    <TouchableOpacity
      key={notification.id}
      onPress={() => {
        markAsRead(notification.id);
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
                icon={getNotificationIcon(notification.type, notification.severity)}
                style={[styles.notificationIcon, { backgroundColor: getSeverityColor(notification.severity) }]}
              />
              <View style={styles.titleContainer}>
                <Text style={styles.notificationTitleText}>{notification.title}</Text>
                <Text style={styles.notificationTime}>{formatTimestamp(notification.timestamp)}</Text>
              </View>
            </View>
            <View style={styles.notificationActions}>
              {!notification.read && <Badge style={styles.unreadBadge} size={10} />}
              <Menu
                visible={false}
                onDismiss={() => {}}
                anchor={
                  <IconButton
                    icon="dots-vertical"
                    size={20}
                    onPress={() => {}}
                  />
                }
              >
                <Menu.Item onPress={() => markAsRead(notification.id)} title="Mark as Read" />
                <Menu.Item onPress={() => deleteNotification(notification.id)} title="Delete" />
              </Menu>
            </View>
          </View>

          <Text style={styles.notificationMessage}>{notification.message}</Text>

          {notification.products && notification.products.length > 0 && (
            <View style={styles.productList}>
              {notification.products.slice(0, 2).map((product, index) => (
                <Chip key={index} style={styles.productChip} mode="outlined">
                  {product.name}
                  {product.daysLeft && ` (${product.daysLeft}d)`}
                  {product.current && `: ${product.current}`}
                </Chip>
              ))}
              {notification.products.length > 2 && (
                <Chip mode="outlined">+{notification.products.length - 2} more</Chip>
              )}
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
            {!notification.read && (
              <Button 
                mode="text" 
                onPress={() => markAsRead(notification.id)}
                compact
              >
                Mark Read
              </Button>
            )}
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
          <Title style={styles.headerTitle}>Alerts</Title>
          <Text style={styles.headerSubtitle}>
            {stats.unread} unread • {stats.critical} critical
          </Text>
        </View>
        <View style={styles.headerActions}>
          <IconButton
            icon="filter"
            size={24}
            onPress={() => setFilterMenuVisible(true)}
          />
          <IconButton
            icon="cog"
            size={24}
            onPress={() => setShowPreferences(true)}
          />
        </View>
      </View>

      {/* Search Bar */}
      <Searchbar
        placeholder="Search alerts..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      {/* Filter Chips */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
      >
        <Chip
          selected={filter === 'all'}
          onPress={() => setFilter('all')}
          style={styles.filterChip}
        >
          All ({stats.total})
        </Chip>
        <Chip
          selected={filter === 'unread'}
          onPress={() => setFilter('unread')}
          style={styles.filterChip}
        >
          Unread ({stats.unread})
        </Chip>
        <Chip
          selected={filter === 'expiry'}
          onPress={() => setFilter('expiry')}
          style={styles.filterChip}
        >
          Expiry ({stats.expiry})
        </Chip>
        <Chip
          selected={filter === 'stock'}
          onPress={() => setFilter('stock')}
          style={styles.filterChip}
        >
          Stock ({stats.stock})
        </Chip>
        <Chip
          selected={filter === 'system'}
          onPress={() => setFilter('system')}
          style={styles.filterChip}
        >
          System
        </Chip>
      </ScrollView>

      {/* Notifications List */}
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
            <Text style={styles.emptySubtext}>You're all caught up!</Text>
          </View>
        ) : (
          <>
            {filteredNotifications.map(renderNotification)}
            
            {filteredNotifications.length > 0 && (
              <View style={styles.bulkActions}>
                <Button mode="outlined" onPress={markAllAsRead} style={styles.bulkButton}>
                  Mark All Read
                </Button>
                <Button mode="outlined" onPress={clearAll} style={styles.bulkButton}>
                  Clear All
                </Button>
              </View>
            )}
          </>
        )}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Preferences Modal */}
      {showPreferences && (
        <View style={styles.modalOverlay}>
          <Card style={styles.preferencesCard}>
            <Card.Content>
              <View style={styles.modalHeader}>
                <Title>Alert Preferences</Title>
                <IconButton icon="close" onPress={() => setShowPreferences(false)} />
              </View>

              <Divider style={styles.divider} />

              <List.Section>
                <List.Subheader>Alert Types</List.Subheader>
                
                <List.Item
                  title="Expiry Alerts"
                  description={`Notify ${preferences.expiryDays} days before expiry`}
                  left={props => <List.Icon {...props} icon="calendar" />}
                  right={props => (
                    <Switch
                      value={preferences.expiryAlerts}
                      onValueChange={(value) => 
                        setPreferences({...preferences, expiryAlerts: value})
                      }
                    />
                  )}
                />
                
                {preferences.expiryAlerts && (
                  <View style={styles.preferenceDetail}>
                    <Text>Days before expiry</Text>
                    <View style={styles.daysSelector}>
                      {[15, 30, 45, 60].map(days => (
                        <Chip
                          key={days}
                          selected={preferences.expiryDays === days}
                          onPress={() => setPreferences({...preferences, expiryDays: days})}
                          style={styles.daysChip}
                        >
                          {days} days
                        </Chip>
                      ))}
                    </View>
                  </View>
                )}

                <List.Item
                  title="Low Stock Alerts"
                  description={`Alert when stock below ${preferences.lowStockThreshold}`}
                  left={props => <List.Icon {...props} icon="alert" />}
                  right={props => (
                    <Switch
                      value={preferences.lowStockAlerts}
                      onValueChange={(value) => 
                        setPreferences({...preferences, lowStockAlerts: value})
                      }
                    />
                  )}
                />

                {preferences.lowStockAlerts && (
                  <View style={styles.preferenceDetail}>
                    <Text>Threshold quantity</Text>
                    <View style={styles.daysSelector}>
                      {[50, 100, 200, 500].map(threshold => (
                        <Chip
                          key={threshold}
                          selected={preferences.lowStockThreshold === threshold}
                          onPress={() => setPreferences({...preferences, lowStockThreshold: threshold})}
                          style={styles.daysChip}
                        >
                          {threshold} units
                        </Chip>
                      ))}
                    </View>
                  </View>
                )}

                <List.Item
                  title="System Alerts"
                  description="Updates, maintenance, backups"
                  left={props => <List.Icon {...props} icon="information" />}
                  right={props => (
                    <Switch
                      value={preferences.systemAlerts}
                      onValueChange={(value) => 
                        setPreferences({...preferences, systemAlerts: value})
                      }
                    />
                  )}
                />

                <List.Subheader>Notification Methods</List.Subheader>

                <List.Item
                  title="Push Notifications"
                  left={props => <List.Icon {...props} icon="cellphone" />}
                  right={props => (
                    <Switch
                      value={preferences.pushNotifications}
                      onValueChange={(value) => 
                        setPreferences({...preferences, pushNotifications: value})
                      }
                    />
                  )}
                />

                <List.Item
                  title="Email Notifications"
                  left={props => <List.Icon {...props} icon="email" />}
                  right={props => (
                    <Switch
                      value={preferences.emailNotifications}
                      onValueChange={(value) => 
                        setPreferences({...preferences, emailNotifications: value})
                      }
                    />
                  )}
                />

                <List.Item
                  title="Sound"
                  left={props => <List.Icon {...props} icon="volume-high" />}
                  right={props => (
                    <Switch
                      value={preferences.soundEnabled}
                      onValueChange={(value) => 
                        setPreferences({...preferences, soundEnabled: value})
                      }
                    />
                  )}
                />
              </List.Section>

              <Button 
                mode="contained" 
                onPress={() => setShowPreferences(false)}
                style={styles.saveButton}
              >
                Save Preferences
              </Button>
            </Card.Content>
          </Card>
        </View>
      )}

      {/* Notification Details Modal */}
      {selectedNotification && detailsVisible && (
        <View style={styles.modalOverlay}>
          <Card style={styles.detailsCard}>
            <Card.Content>
              <View style={styles.modalHeader}>
                <View style={styles.detailsTitle}>
                  <Avatar.Icon
                    size={50}
                    icon={getNotificationIcon(selectedNotification.type, selectedNotification.severity)}
                    style={[styles.detailIcon, { backgroundColor: getSeverityColor(selectedNotification.severity) }]}
                  />
                  <View>
                    <Title>{selectedNotification.title}</Title>
                    <Text style={styles.detailTime}>
                      {new Date(selectedNotification.timestamp).toLocaleString()}
                    </Text>
                  </View>
                </View>
                <IconButton icon="close" onPress={() => setDetailsVisible(false)} />
              </View>

              <Divider style={styles.divider} />

              <Text style={styles.detailMessage}>{selectedNotification.message}</Text>

              {selectedNotification.products && (
                <View style={styles.detailProducts}>
                  <Text style={styles.detailSubtitle}>Affected Products:</Text>
                  {selectedNotification.products.map((product, index) => (
                    <Card key={index} style={styles.detailProductCard}>
                      <Card.Content>
                        <Text style={styles.detailProductName}>{product.name}</Text>
                        {product.batch && (
                          <Text style={styles.detailProductInfo}>Batch: {product.batch}</Text>
                        )}
                        {product.expiry && (
                          <Text style={styles.detailProductInfo}>
                            Expiry: {new Date(product.expiry).toLocaleDateString()}
                            {product.daysLeft && ` (${product.daysLeft} days left)`}
                          </Text>
                        )}
                        {product.current && (
                          <Text style={styles.detailProductInfo}>
                            Current: {product.current} • Threshold: {product.threshold || product.reorderAt}
                          </Text>
                        )}
                      </Card.Content>
                    </Card>
                  ))}
                </View>
              )}

              {selectedNotification.details && (
                <Text style={styles.detailExtra}>{selectedNotification.details}</Text>
              )}

              <View style={styles.detailActions}>
                <Button 
                  mode="contained" 
                  onPress={() => {
                    if (selectedNotification.type === 'expiry') {
                      navigation.navigate('Inventory');
                    } else if (selectedNotification.type === 'stock') {
                      navigation.navigate('Inventory');
                    }
                    setDetailsVisible(false);
                  }}
                  style={styles.detailButton}
                >
                  View in Inventory
                </Button>
                <Button 
                  mode="outlined" 
                  onPress={() => {
                    deleteNotification(selectedNotification.id);
                    setDetailsVisible(false);
                  }}
                >
                  Dismiss
                </Button>
              </View>
            </Card.Content>
          </Card>
        </View>
      )}
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
    marginBottom: 12,
    elevation: 2,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
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
  notificationIcon: {
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  notificationTitleText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  notificationTime: {
    fontSize: 12,
    color: '#666',
  },
  notificationActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unreadBadge: {
    backgroundColor: '#007AFF',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    marginLeft: 52,
  },
  productList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginLeft: 52,
    marginBottom: 12,
    gap: 8,
  },
  productChip: {
    height: 32,
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  bulkActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20,
  },
  bulkButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  bottomPadding: {
    height: 20,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  preferencesCard: {
    width: '100%',
    maxHeight: '80%',
    elevation: 5,
  },
  detailsCard: {
    width: '100%',
    maxHeight: '80%',
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailsTitle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  detailIcon: {
    marginRight: 12,
  },
  divider: {
    marginVertical: 16,
  },
  preferenceDetail: {
    paddingLeft: 56,
    paddingRight: 16,
    marginBottom: 16,
  },
  daysSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
  },
  daysChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  saveButton: {
    marginTop: 16,
  },
  detailMessage: {
    fontSize: 16,
    marginBottom: 16,
  },
  detailTime: {
    fontSize: 14,
    color: '#666',
  },
  detailProducts: {
    marginTop: 16,
  },
  detailSubtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  detailProductCard: {
    marginBottom: 8,
    elevation: 1,
  },
  detailProductName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  detailProductInfo: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  detailExtra: {
    fontSize: 14,
    color: '#666',
    marginTop: 16,
    fontStyle: 'italic',
  },
  detailActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    gap: 12,
  },
  detailButton: {
    flex: 1,
  },
});