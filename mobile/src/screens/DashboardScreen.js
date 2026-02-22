import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
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
  useTheme,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import {
  LineChart,
  BarChart,
  PieChart,
  ProgressChart,
} from 'react-native-chart-kit';

console.log('📊 DashboardScreen loaded');

// Mock data for the dashboard
const mockData = {
  // Summary stats
  summary: {
    totalProducts: 1250,
    totalValue: 45890.50,
    lowStockItems: 23,
    expiringSoon: 15,
    expiredItems: 3,
    totalSales: 12890.00,
    todaySales: 2340.50,
    pendingOrders: 8,
  },

  // Warehouse space utilization
  warehouses: [
    { id: 1, name: 'Main Warehouse', used: 78, total: 100, color: '#4CAF50', products: 450 },
    { id: 2, name: 'Cold Storage', used: 45, total: 60, color: '#2196F3', products: 120 },
    { id: 3, name: 'Bulk Storage', used: 92, total: 150, color: '#FF9800', products: 680 },
  ],

  // Expiring products
  expiringProducts: [
    { id: 1, name: 'Paracetamol 500mg', batch: 'B2024-001', expiry: '2024-12-15', quantity: 500, daysLeft: 25 },
    { id: 2, name: 'Amoxicillin 250mg', batch: 'B2024-002', expiry: '2024-11-30', quantity: 300, daysLeft: 18 },
    { id: 3, name: 'Vitamin C 1000mg', batch: 'B2024-003', expiry: '2024-10-20', quantity: 150, daysLeft: 12 },
    { id: 4, name: 'Cetirizine 10mg', batch: 'B2024-004', expiry: '2024-09-05', quantity: 200, daysLeft: 5 },
    { id: 5, name: 'Ibuprofen 400mg', batch: 'B2024-005', expiry: '2024-08-15', quantity: 75, daysLeft: 2 },
  ],

  // Recent activities
  recentActivities: [
    { id: 1, type: 'stock_in', product: 'Paracetamol', quantity: 500, user: 'John', time: '10:30 AM', date: '2024-02-22' },
    { id: 2, type: 'stock_out', product: 'Amoxicillin', quantity: 50, user: 'Sarah', time: '09:15 AM', date: '2024-02-22' },
    { id: 3, type: 'view', product: 'Vitamin C', user: 'Mike', time: '08:45 AM', date: '2024-02-22' },
    { id: 4, type: 'stock_in', product: 'Cetirizine', quantity: 200, user: 'John', time: '04:30 PM', date: '2024-02-21' },
    { id: 5, type: 'print', product: 'Inventory Report', user: 'Sarah', time: '02:15 PM', date: '2024-02-21' },
    { id: 6, type: 'alert', product: 'Expiry Warning', user: 'System', time: '11:00 AM', date: '2024-02-21' },
  ],

  // Sales data for chart
  salesData: {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        data: [4500, 5200, 4800, 6100, 5900, 8200, 7400],
        color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  },

  // Category distribution
  categoryData: [
    { name: 'Analgesics', population: 350, color: '#FF6384', legendFontColor: '#7F7F7F' },
    { name: 'Antibiotics', population: 280, color: '#36A2EB', legendFontColor: '#7F7F7F' },
    { name: 'Vitamins', population: 220, color: '#FFCE56', legendFontColor: '#7F7F7F' },
    { name: 'Antihistamines', population: 190, color: '#4BC0C0', legendFontColor: '#7F7F7F' },
    { name: 'Others', population: 210, color: '#9966FF', legendFontColor: '#7F7F7F' },
  ],

  // Top selling products
  topSelling: [
    { id: 1, name: 'Paracetamol 500mg', sold: 1250, revenue: 3125.00, trend: '+15%' },
    { id: 2, name: 'Vitamin C 1000mg', sold: 980, revenue: 7840.00, trend: '+8%' },
    { id: 3, name: 'Amoxicillin 250mg', sold: 750, revenue: 3750.00, trend: '+12%' },
    { id: 4, name: 'Cetirizine 10mg', sold: 620, revenue: 1116.00, trend: '-2%' },
    { id: 5, name: 'Omeprazole 20mg', sold: 580, revenue: 2610.00, trend: '+5%' },
  ],

  // Stock alerts
  stockAlerts: [
    { id: 1, product: 'Ibuprofen 400mg', quantity: 45, threshold: 100, status: 'low' },
    { id: 2, product: 'Metformin 500mg', quantity: 30, threshold: 100, status: 'critical' },
    { id: 3, product: 'Aspirin 75mg', quantity: 12, threshold: 50, status: 'critical' },
    { id: 4, product: 'Lisinopril 10mg', quantity: 85, threshold: 100, status: 'low' },
  ],
};

const screenWidth = Dimensions.get('window').width;

export default function DashboardScreen({ navigation }) {
  console.log('📊 DashboardScreen rendering');
  
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState(mockData);
  const [selectedTimeRange, setSelectedTimeRange] = useState('week'); // day, week, month
  const [showAllExpiring, setShowAllExpiring] = useState(false);

  const theme = useTheme();

  // Chart configuration
  const chartConfig = {
    backgroundGradientFrom: '#fff',
    backgroundGradientTo: '#fff',
    color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
    style: {
      borderRadius: 16,
    },
  };

  const onRefresh = () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  };

  // Get icon for activity type
  const getActivityIcon = (type) => {
    switch(type) {
      case 'stock_in': return 'arrow-down-circle';
      case 'stock_out': return 'arrow-up-circle';
      case 'view': return 'eye';
      case 'print': return 'print';
      case 'alert': return 'alert-circle';
      default: return 'help-circle';
    }
  };

  // Get color for activity type
  const getActivityColor = (type) => {
    switch(type) {
      case 'stock_in': return '#4CAF50';
      case 'stock_out': return '#F44336';
      case 'view': return '#2196F3';
      case 'print': return '#9C27B0';
      case 'alert': return '#FF9800';
      default: return '#999';
    }
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#007AFF']} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header with Greeting */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good morning, John! 👋</Text>
          <Text style={styles.date}>{new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</Text>
        </View>
        <Avatar.Icon 
          size={50} 
          icon="account" 
          style={styles.avatar}
          color="#fff"
        />
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryGrid}>
        <Card style={styles.summaryCard} onPress={() => navigation.navigate('Inventory')}>
          <Card.Content>
            <View style={styles.summaryIconContainer}>
              <Ionicons name="cube-outline" size={24} color="#007AFF" />
            </View>
            <Text style={styles.summaryValue}>{data.summary.totalProducts}</Text>
            <Text style={styles.summaryLabel}>Total Products</Text>
          </Card.Content>
        </Card>

        <Card style={styles.summaryCard} onPress={() => navigation.navigate('Inventory')}>
          <Card.Content>
            <View style={[styles.summaryIconContainer, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="cash-outline" size={24} color="#4CAF50" />
            </View>
            <Text style={styles.summaryValue}>₹{data.summary.totalValue.toLocaleString()}</Text>
            <Text style={styles.summaryLabel}>Inventory Value</Text>
          </Card.Content>
        </Card>

        <Card style={styles.summaryCard} onPress={() => navigation.navigate('Inventory')}>
          <Card.Content>
            <View style={[styles.summaryIconContainer, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="warning-outline" size={24} color="#FF9800" />
            </View>
            <Text style={styles.summaryValue}>{data.summary.lowStockItems}</Text>
            <Text style={styles.summaryLabel}>Low Stock</Text>
          </Card.Content>
        </Card>

        <Card style={styles.summaryCard} onPress={() => navigation.navigate('Inventory')}>
          <Card.Content>
            <View style={[styles.summaryIconContainer, { backgroundColor: '#FFEBEE' }]}>
              <Ionicons name="alert-circle-outline" size={24} color="#F44336" />
            </View>
            <Text style={styles.summaryValue}>{data.summary.expiringSoon}</Text>
            <Text style={styles.summaryLabel}>Expiring Soon</Text>
          </Card.Content>
        </Card>
      </View>

      {/* Sales Overview Card */}
      <Card style={styles.chartCard}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <Title>Sales Overview</Title>
            <View style={styles.timeRangeSelector}>
              <Chip 
                selected={selectedTimeRange === 'week'} 
                onPress={() => setSelectedTimeRange('week')}
                style={styles.timeChip}
                mode={selectedTimeRange === 'week' ? 'flat' : 'outlined'}
              >
                Week
              </Chip>
              <Chip 
                selected={selectedTimeRange === 'month'} 
                onPress={() => setSelectedTimeRange('month')}
                style={styles.timeChip}
                mode={selectedTimeRange === 'month' ? 'flat' : 'outlined'}
              >
                Month
              </Chip>
            </View>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <LineChart
              data={data.salesData}
              width={Math.max(screenWidth - 40, data.salesData.labels.length * 60)}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
              formatYLabel={(value) => `₹${value}`}
            />
          </ScrollView>

          <View style={styles.salesStats}>
            <View style={styles.salesStat}>
              <Text style={styles.salesStatLabel}>Today's Sales</Text>
              <Text style={styles.salesStatValue}>₹{data.summary.todaySales}</Text>
            </View>
            <View style={styles.salesStat}>
              <Text style={styles.salesStatLabel}>This Week</Text>
              <Text style={styles.salesStatValue}>₹{data.summary.totalSales}</Text>
            </View>
            <View style={styles.salesStat}>
              <Text style={styles.salesStatLabel}>Pending Orders</Text>
              <Text style={styles.salesStatValue}>{data.summary.pendingOrders}</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Warehouse Space Utilization */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <Title>Warehouse Space</Title>
            <Chip icon="information" mode="outlined">Total: 310 units</Chip>
          </View>

          {data.warehouses.map(warehouse => (
            <View key={warehouse.id} style={styles.warehouseItem}>
              <View style={styles.warehouseHeader}>
                <View style={styles.warehouseTitle}>
                  <View style={[styles.warehouseDot, { backgroundColor: warehouse.color }]} />
                  <Text style={styles.warehouseName}>{warehouse.name}</Text>
                </View>
                <Text style={styles.warehousePercentage}>{warehouse.used}%</Text>
              </View>
              <ProgressBar 
                progress={warehouse.used / warehouse.total} 
                color={warehouse.color}
                style={styles.progressBar}
              />
              <View style={styles.warehouseFooter}>
                <Text style={styles.warehouseStats}>
                  Used: {warehouse.used} units • Products: {warehouse.products}
                </Text>
                <Text style={styles.warehouseRemaining}>
                  Free: {warehouse.total - warehouse.used} units
                </Text>
              </View>
            </View>
          ))}
        </Card.Content>
      </Card>

      {/* Category Distribution */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Inventory by Category</Title>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <PieChart
              data={data.categoryData}
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

      {/* Expiring Products Alert */}
      <Card style={[styles.card, styles.alertCard]}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={styles.alertTitle}>
              <Ionicons name="alert-circle" size={24} color="#F44336" />
              <Title style={styles.alertTitleText}>Products Near Expiry</Title>
            </View>
            <Badge style={styles.alertBadge}>{data.expiringProducts.length}</Badge>
          </View>

          {(showAllExpiring ? data.expiringProducts : data.expiringProducts.slice(0, 3)).map(product => (
            <TouchableOpacity 
              key={product.id} 
              style={styles.expiryItem}
              onPress={() => navigation.navigate('Inventory')}
            >
              <View style={styles.expiryInfo}>
                <Text style={styles.expiryProductName}>{product.name}</Text>
                <Text style={styles.expiryBatch}>Batch: {product.batch}</Text>
              </View>
              <View style={styles.expiryDetails}>
                <View style={[
                  styles.daysBadge,
                  { backgroundColor: product.daysLeft < 10 ? '#F44336' : '#FF9800' }
                ]}>
                  <Text style={styles.daysText}>{product.daysLeft} days</Text>
                </View>
                <Text style={styles.expiryQuantity}>Qty: {product.quantity}</Text>
              </View>
            </TouchableOpacity>
          ))}

          {data.expiringProducts.length > 3 && (
            <Button 
              mode="text" 
              onPress={() => setShowAllExpiring(!showAllExpiring)}
              style={styles.viewAllButton}
            >
              {showAllExpiring ? 'Show Less' : `View All (${data.expiringProducts.length})`}
            </Button>
          )}
        </Card.Content>
      </Card>

      {/* Top Selling Products */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Top Selling Products</Title>
          {data.topSelling.map((item, index) => (
            <View key={item.id} style={styles.topSellingItem}>
              <View style={styles.topSellingRank}>
                <Text style={styles.rankText}>{index + 1}</Text>
              </View>
              <View style={styles.topSellingInfo}>
                <Text style={styles.topSellingName}>{item.name}</Text>
                <Text style={styles.topSellingStats}>
                  Sold: {item.sold} units • Revenue: ₹{item.revenue}
                </Text>
              </View>
              <Chip 
                mode="outlined"
                style={[
                  styles.trendChip,
                  { borderColor: item.trend.includes('+') ? '#4CAF50' : '#F44336' }
                ]}
                textStyle={{ 
                  color: item.trend.includes('+') ? '#4CAF50' : '#F44336',
                  fontSize: 12
                }}
              >
                {item.trend}
              </Chip>
            </View>
          ))}
        </Card.Content>
      </Card>

      {/* Stock Alerts */}
      <Card style={[styles.card, styles.alertCard]}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={styles.alertTitle}>
              <Ionicons name="warning" size={24} color="#FF9800" />
              <Title style={styles.alertTitleText}>Stock Alerts</Title>
            </View>
          </View>

          {data.stockAlerts.map(alert => (
            <View key={alert.id} style={styles.alertItem}>
              <View style={styles.alertInfo}>
                <Text style={styles.alertProductName}>{alert.product}</Text>
                <Text style={styles.alertThreshold}>Threshold: {alert.threshold} units</Text>
              </View>
              <View style={styles.alertStatus}>
                <Badge 
                  style={[
                    styles.alertStatusBadge,
                    { backgroundColor: alert.status === 'critical' ? '#F44336' : '#FF9800' }
                  ]}
                >
                  {alert.quantity}
                </Badge>
                <Text style={styles.alertStatusText}>{alert.status}</Text>
              </View>
            </View>
          ))}

          <Button 
            mode="contained" 
            onPress={() => navigation.navigate('Inventory')}
            style={styles.reorderButton}
          >
            View & Reorder
          </Button>
        </Card.Content>
      </Card>

      {/* Recent Activities */}
      <Card style={[styles.card, styles.lastCard]}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <Title>Recent Activities</Title>
            <Chip icon="clock-outline" mode="outlined">Last 24h</Chip>
          </View>

          {data.recentActivities.map(activity => (
            <List.Item
              key={activity.id}
              title={activity.product}
              description={`${activity.user} • ${activity.time}`}
              left={props => (
                <View style={[styles.activityIcon, { backgroundColor: getActivityColor(activity.type) + '20' }]}>
                  <Ionicons 
                    name={getActivityIcon(activity.type)} 
                    size={24} 
                    color={getActivityColor(activity.type)} 
                  />
                </View>
              )}
              right={props => (
                <View style={styles.activityRight}>
                  {activity.quantity && (
                    <Chip mode="outlined" style={styles.activityChip}>
                      {activity.quantity} units
                    </Chip>
                  )}
                </View>
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
    </ScrollView>
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
    padding: 20,
    paddingTop: 40,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  greeting: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: '#666',
  },
  avatar: {
    backgroundColor: '#007AFF',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    backgroundColor: '#fff',
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
    marginBottom: 10,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
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
  timeRangeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  timeChip: {
    height: 36,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  salesStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
  },
  salesStat: {
    alignItems: 'center',
  },
  salesStatLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  salesStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
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
  topSellingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  topSellingRank: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  topSellingInfo: {
    flex: 1,
  },
  topSellingName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  topSellingStats: {
    fontSize: 11,
    color: '#666',
  },
  trendChip: {
    height: 28,
  },
  alertItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  alertInfo: {
    flex: 1,
  },
  alertProductName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  alertThreshold: {
    fontSize: 11,
    color: '#666',
  },
  alertStatus: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  alertStatusBadge: {
    fontSize: 12,
  },
  alertStatusText: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
  reorderButton: {
    marginTop: 15,
    borderRadius: 8,
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
  activityRight: {
    justifyContent: 'center',
  },
  activityChip: {
    height: 28,
  },
});