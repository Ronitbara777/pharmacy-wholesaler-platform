import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  Alert,
  TouchableOpacity,
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


const screenWidth = Dimensions.get('window').width;

export default function DashboardScreen({ navigation }) {

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: 'Dashboard',
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 15 }}>
          <Avatar.Icon 
            size={35} 
            icon="account" 
            style={{ backgroundColor: '#0F172A', marginRight: 10 }}
            color="#fff"
          />
          <TouchableOpacity onPress={() => setLogoutDialogVisible(true)}>
            <Ionicons name="log-out-outline" size={28} color="#DC2626" />
          </TouchableOpacity>
        </View>
      ),
    });
  });
  
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
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`, // Vibrant Blue (#3B82F6)
    strokeWidth: 2,
    barPercentage: 0.5,
    decimalPlaces: 0,
    style: {
      borderRadius: 16,
    },
  };

  // Real sales data state
  const [salesData, setSalesData] = useState({
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      data: [0, 0, 0, 0, 0, 0, 0],
      color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
      strokeWidth: 2,
    }],
  });

  // Load all dashboard data
  const loadDashboardData = async () => {
    try {
      
      // Fetch all data in parallel
      const [statsResponse, productsResponse, activitiesResponse, warehousesResponse, salesResponse] = await Promise.all([
        DashboardService.getStats(),
        DashboardService.getExpiringProducts(),
        DashboardService.getRecentActivities(),
        DashboardService.getWarehouses(),
        DashboardService.getSalesData(),
      ]);


      // Update stats
      if (statsResponse?.success) {
        setStats(statsResponse.data);
      }

      // Update sales data
      if (salesResponse?.success && salesResponse.data) {
        setSalesData({
          labels: salesResponse.data.labels || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [{
            data: salesResponse.data.datasets?.[0]?.data || [0, 0, 0, 0, 0, 0, 0],
            color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
            strokeWidth: 2,
          }]
        });
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
      case 'CREATE': return '#16A34A'; // Emerald
      case 'UPDATE': return '#D97706'; // Amber
      case 'DELETE': return '#DC2626'; // Crimson
      case 'LOGIN': return '#3B82F6'; // Blue
      case 'STOCK_IN': return '#16A34A';
      case 'STOCK_OUT': return '#DC2626';
      default: return '#64748B'; // Slate
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
        <View style={styles.statsRow}>
          <TouchableOpacity style={styles.statBox} onPress={() => navigation.navigate('Inventory')}>
            <Text style={[styles.statValue, { color: '#3B82F6' }]}>{stats.totalProducts || 0}</Text>
            <Text style={styles.statLabel}>Products</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.statBox} onPress={() => navigation.navigate('Inventory')}>
            <Text style={[styles.statValue, { color: '#16A34A' }]}>{formatCurrency(stats.totalValue)}</Text>
            <Text style={styles.statLabel}>Value</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.statBox} onPress={() => navigation.navigate('Alerts')}>
            <Text style={[styles.statValue, { color: '#D97706' }]}>{stats.lowStock || 0}</Text>
            <Text style={styles.statLabel}>Low Stock</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.statBox} onPress={() => navigation.navigate('Alerts')}>
            <Text style={[styles.statValue, { color: '#DC2626' }]}>{stats.expiringSoon || 0}</Text>
            <Text style={styles.statLabel}>Expiring</Text>
          </TouchableOpacity>
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
                      color={usedPercent > 80 ? '#DC2626' : '#16A34A'}
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
  scrollView: {
    flex: 1,
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