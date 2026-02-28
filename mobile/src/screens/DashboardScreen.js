import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Text,
  Button,
  Chip,
  Avatar,
  IconButton,
  Badge,
  Divider,
  List,
  ProgressBar,
  Dialog,
  Portal,
  ActivityIndicator,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import {
  LineChart,
  PieChart,
} from 'react-native-chart-kit';
import AuthService from '../services/auth.service';
import DashboardService from '../services/dashboard.service';

console.log('📊 DashboardScreen loaded');

const screenWidth = Dimensions.get('window').width;

export default function DashboardScreen({ navigation }) {
  console.log('📊 DashboardScreen rendering');
  
  // State for real data
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalValue: 0,
    lowStock: 0,
    expiringSoon: 0,
    expired: 0,
    categories: []
  });
  
  const [expiringProducts, setExpiringProducts] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [user, setUser] = useState(null);
  
  // UI State
  const [logoutDialogVisible, setLogoutDialogVisible] = useState(false);

  // Chart configuration
  const chartConfig = {
    backgroundGradientFrom: '#fff',
    backgroundGradientTo: '#fff',
    color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    decimalPlaces: 0,
    style: {
      borderRadius: 16,
    },
  };

  // Mock sales data (until backend endpoint is ready)
  const salesData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      data: [4500, 5200, 4800, 6100, 5900, 8200, 7400],
      color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
      strokeWidth: 2,
    }],
  };

  // Load all dashboard data
  const loadDashboardData = async () => {
    try {
      console.log('📊 Loading dashboard data...');
      
      // Fetch all data in parallel
      const [statsResponse, productsResponse, activitiesResponse, warehousesResponse] = await Promise.all([
        DashboardService.getStats(),
        DashboardService.getExpiringProducts(),
        DashboardService.getRecentActivities(),
        DashboardService.getWarehouses(),
      ]);

      console.log('📊 Stats response:', statsResponse);

      // Update stats
      if (statsResponse?.success) {
        setStats(statsResponse.data);
      }

      // Update expiring products
      if (productsResponse?.success) {
        // Filter products expiring within 30 days
        const expiring = productsResponse.data.filter(product => {
          const expiryDate = new Date(product.expiryDate);
          const today = new Date();
          const diffDays = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
          return diffDays <= 30 && diffDays > 0;
        });
        setExpiringProducts(expiring.slice(0, 5)); // Show only top 5
      }

      // Update activities
      if (activitiesResponse?.success) {
        setRecentActivities(activitiesResponse.data.slice(0, 5)); // Show only top 5
      }

      // Update warehouses
      if (warehousesResponse?.success) {
        setWarehouses(warehousesResponse.data);
      }

      // Get current user
      const currentUser = await AuthService.getCurrentUser();
      setUser(currentUser);

    } catch (error) {
      console.error('❌ Error loading dashboard:', error);
      Alert.alert(
        'Error',
        'Failed to load dashboard data. Pull down to refresh.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadDashboardData();
  }, []);

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  // Logout function
  const handleLogout = async () => {
    try {
      await AuthService.logout();
      navigation.replace('Login');
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to logout');
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `₹${amount?.toFixed(2) || '0.00'}`;
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Get activity icon
  const getActivityIcon = (action) => {
    switch(action) {
      case 'CREATE': return 'add-circle';
      case 'UPDATE': return 'create';
      case 'DELETE': return 'trash';
      case 'LOGIN': return 'log-in';
      case 'STOCK_IN': return 'arrow-down-circle';
      case 'STOCK_OUT': return 'arrow-up-circle';
      default: return 'time';
    }
  };

  // Get activity color
  const getActivityColor = (action) => {
    switch(action) {
      case 'CREATE': return '#4CAF50';
      case 'UPDATE': return '#FF9800';
      case 'DELETE': return '#F44336';
      case 'LOGIN': return '#2196F3';
      case 'STOCK_IN': return '#4CAF50';
      case 'STOCK_OUT': return '#F44336';
      default: return '#757575';
    }
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with User Info and Logout */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            Good {new Date().getHours() < 12 ? 'Morning' : 'Afternoon'}!
          </Text>
          <Text style={styles.date}>{new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</Text>
        </View>
        <View style={styles.headerRight}>
          <Avatar.Icon 
            size={50} 
            icon="account" 
            style={styles.avatar}
            color="#fff"
          />
          <IconButton
            icon="logout"
            size={24}
            onPress={() => setLogoutDialogVisible(true)}
            style={styles.logoutButton}
          />
        </View>
      </View>
          
      {/* Logout Confirmation Dialog */}
      <Portal>
        <Dialog visible={logoutDialogVisible} onDismiss={() => setLogoutDialogVisible(false)}>
          <Dialog.Title>Logout</Dialog.Title>
          <Dialog.Content>
            <Paragraph>Are you sure you want to logout?</Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setLogoutDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleLogout}>Logout</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Cards */}
        <View style={styles.summaryGrid}>
          <Card style={styles.summaryCard} onPress={() => navigation.navigate('Inventory')}>
            <Card.Content>
              <View style={styles.summaryIconContainer}>
                <Ionicons name="cube-outline" size={24} color="#007AFF" />
              </View>
              <Text style={styles.summaryValue}>{stats.totalProducts || 0}</Text>
              <Text style={styles.summaryLabel}>Total Products</Text>
            </Card.Content>
          </Card>

          <Card style={styles.summaryCard} onPress={() => navigation.navigate('Inventory')}>
            <Card.Content>
              <View style={[styles.summaryIconContainer, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="cash-outline" size={24} color="#4CAF50" />
              </View>
              <Text style={styles.summaryValue}>{formatCurrency(stats.totalValue)}</Text>
              <Text style={styles.summaryLabel}>Inventory Value</Text>
            </Card.Content>
          </Card>

          <Card style={styles.summaryCard} onPress={() => navigation.navigate('Inventory')}>
            <Card.Content>
              <View style={[styles.summaryIconContainer, { backgroundColor: '#FFF3E0' }]}>
                <Ionicons name="warning-outline" size={24} color="#FF9800" />
              </View>
              <Text style={styles.summaryValue}>{stats.lowStock || 0}</Text>
              <Text style={styles.summaryLabel}>Low Stock</Text>
            </Card.Content>
          </Card>

          <Card style={styles.summaryCard} onPress={() => navigation.navigate('Alerts')}>
            <Card.Content>
              <View style={[styles.summaryIconContainer, { backgroundColor: '#FFEBEE' }]}>
                <Ionicons name="alert-circle-outline" size={24} color="#F44336" />
              </View>
              <Text style={styles.summaryValue}>{stats.expiringSoon || 0}</Text>
              <Text style={styles.summaryLabel}>Expiring Soon</Text>
            </Card.Content>
          </Card>
        </View>

        {/* Sales Chart (Mock data for now) */}
        <Card style={styles.chartCard}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <Title>Sales Overview</Title>
              <Chip icon="calendar" mode="outlined">This Week</Chip>
            </View>
            <LineChart
              data={salesData}
              width={screenWidth - 40}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
              formatYLabel={(value) => `₹${value}`}
            />
          </Card.Content>
        </Card>

        {/* Warehouse Space Utilization */}
        {warehouses.length > 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.cardHeader}>
                <Title>Warehouse Space</Title>
                <Chip icon="information" mode="outlined">
                  Total: {warehouses.reduce((sum, w) => sum + (w.capacity || 0), 0)} units
                </Chip>
              </View>

              {warehouses.map(warehouse => {
                const usedPercent = warehouse.capacity 
                  ? Math.round((warehouse.usedSpace || 0) / warehouse.capacity * 100)
                  : 0;
                
                return (
                  <View key={warehouse.id} style={styles.warehouseItem}>
                    <View style={styles.warehouseHeader}>
                      <View style={styles.warehouseTitle}>
                        <View style={[styles.warehouseDot, { backgroundColor: usedPercent > 80 ? '#F44336' : '#4CAF50' }]} />
                        <Text style={styles.warehouseName}>{warehouse.name}</Text>
                      </View>
                      <Text style={styles.warehousePercentage}>{usedPercent}%</Text>
                    </View>
                    <ProgressBar 
                      progress={usedPercent / 100} 
                      color={usedPercent > 80 ? '#F44336' : '#4CAF50'}
                      style={styles.progressBar}
                    />
                    <View style={styles.warehouseFooter}>
                      <Text style={styles.warehouseStats}>
                        Used: {warehouse.usedSpace || 0} units
                      </Text>
                      <Text style={styles.warehouseRemaining}>
                        Free: {warehouse.capacity ? warehouse.capacity - (warehouse.usedSpace || 0) : 0} units
                      </Text>
                    </View>
                  </View>
                );
              })}
            </Card.Content>
          </Card>
        )}

        {/* Category Distribution */}
        {stats.categories && stats.categories.length > 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <Title>Inventory by Category</Title>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <PieChart
                  data={stats.categories.map((cat, index) => ({
                    name: cat.category || 'Other',
                    population: cat._count || 0,
                    color: `hsl(${index * 60}, 70%, 60%)`,
                    legendFontColor: '#7F7F7F',
                  }))}
                  width={screenWidth - 32}
                  height={200}
                  chartConfig={chartConfig}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  absolute
                />
              </ScrollView>
            </Card.Content>
          </Card>
        )}

        {/* Expiring Products Alert */}
        {expiringProducts.length > 0 && (
          <Card style={[styles.card, styles.alertCard]}>
            <Card.Content>
              <View style={styles.cardHeader}>
                <View style={styles.alertTitle}>
                  <Ionicons name="alert-circle" size={24} color="#F44336" />
                  <Title style={styles.alertTitleText}>Products Near Expiry</Title>
                </View>
                <Badge style={styles.alertBadge}>{expiringProducts.length}</Badge>
              </View>

              {expiringProducts.map(product => {
                const expiryDate = new Date(product.expiryDate);
                const today = new Date();
                const daysLeft = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
                
                return (
                  <TouchableOpacity 
                    key={product.id} 
                    style={styles.expiryItem}
                    onPress={() => navigation.navigate('Inventory', { productId: product.id })}
                  >
                    <View style={styles.expiryInfo}>
                      <Text style={styles.expiryProductName}>{product.name}</Text>
                      <Text style={styles.expiryBatch}>Batch: {product.batchNumber}</Text>
                    </View>
                    <View style={styles.expiryDetails}>
                      <View style={[
                        styles.daysBadge,
                        { backgroundColor: daysLeft < 10 ? '#F44336' : '#FF9800' }
                      ]}>
                        <Text style={styles.daysText}>{daysLeft} days</Text>
                      </View>
                      <Text style={styles.expiryQuantity}>Qty: {product.quantity}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}

              <Button 
                mode="text" 
                onPress={() => navigation.navigate('Alerts')}
                style={styles.viewAllButton}
              >
                View All Alerts
              </Button>
            </Card.Content>
          </Card>
        )}

        {/* Recent Activities */}
        {recentActivities.length > 0 && (
          <Card style={[styles.card, styles.lastCard]}>
            <Card.Content>
              <View style={styles.cardHeader}>
                <Title>Recent Activities</Title>
                <Chip icon="clock-outline" mode="outlined">Last 24h</Chip>
              </View>

              {recentActivities.map(activity => (
                <List.Item
                  key={activity.id}
                  title={activity.entityType || 'Activity'}
                  description={`${activity.action} • ${new Date(activity.createdAt).toLocaleTimeString()}`}
                  left={props => (
                    <View style={[styles.activityIcon, { backgroundColor: getActivityColor(activity.action) + '20' }]}>
                      <Ionicons 
                        name={getActivityIcon(activity.action)} 
                        size={24} 
                        color={getActivityColor(activity.action)} 
                      />
                    </View>
                  )}
                  right={props => activity.details?.quantity && (
                    <Chip mode="outlined" style={styles.activityChip}>
                      {activity.details.quantity} units
                    </Chip>
                  )}
                  style={styles.activityItem}
                />
              ))}

              <Button 
                mode="text" 
                onPress={() => navigation.navigate('History')}
                style={styles.viewAllButton}
              >
                View All Activities
              </Button>
            </Card.Content>
          </Card>
        )}
      </ScrollView>
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
    backgroundColor: '#f5f5f5',
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
    padding: 16,
    paddingTop: 40,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  date: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  avatar: {
    backgroundColor: '#007AFF',
    marginRight: 8,
  },
  logoutButton: {
    margin: 0,
  },
  scrollView: {
    flex: 1,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
  },
  summaryCard: {
    width: '48%',
    margin: '1%',
    elevation: 2,
  },
  summaryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
  },
  chartCard: {
    margin: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  card: {
    margin: 10,
    marginTop: 5,
    elevation: 2,
  },
  lastCard: {
    marginBottom: 80,
  },
  warehouseItem: {
    marginBottom: 15,
  },
  warehouseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  warehouseTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  warehouseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  warehouseName: {
    fontSize: 14,
    fontWeight: '500',
  },
  warehousePercentage: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 5,
  },
  warehouseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  warehouseStats: {
    fontSize: 11,
    color: '#666',
  },
  warehouseRemaining: {
    fontSize: 11,
    color: '#666',
  },
  alertCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  alertTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  alertTitleText: {
    fontSize: 18,
  },
  alertBadge: {
    backgroundColor: '#F44336',
  },
  expiryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  expiryInfo: {
    flex: 1,
  },
  expiryProductName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  expiryBatch: {
    fontSize: 12,
    color: '#666',
  },
  expiryDetails: {
    alignItems: 'flex-end',
  },
  daysBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginBottom: 4,
  },
  daysText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  expiryQuantity: {
    fontSize: 12,
    color: '#666',
  },
  viewAllButton: {
    marginTop: 10,
  },
  activityItem: {
    paddingVertical: 8,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityChip: {
    height: 28,
  },
});