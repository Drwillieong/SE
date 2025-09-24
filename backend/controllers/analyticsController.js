import { Order } from '../models/Order.js';
import { Booking } from '../models/Booking.js';

// Controller to get comprehensive analytics data
export const getAnalyticsData = (db) => async (req, res) => {
  const orderModel = new Order(db);
  const bookingModel = new Booking(db);

  try {
    const range = req.query.range || '7d';
    const days = range === '30d' ? 30 : range === '90d' ? 90 : 7;

    // Get basic stats
    const [orderStats, bookingStats] = await Promise.all([
      orderModel.getDashboardStats(),
      getBookingStats(bookingModel)
    ]);

    // Get daily revenue data
    const dailyRevenue = await getDailyRevenue(orderModel, days);

    // Get orders by status
    const ordersByStatus = await getOrdersByStatusData(orderModel);

    // Get orders by service type
    const ordersByServiceType = await getOrdersByServiceTypeData(orderModel);

    // Get bookings by status
    const bookingsByStatus = await getBookingsByStatusData(bookingModel);

    // Calculate growth metrics
    const growthMetrics = await calculateGrowthMetrics(orderModel, bookingModel, days);

    // Get top services
    const topServices = await getTopServices(orderModel);

    // Get recent activity
    const recentActivity = await getRecentActivity(orderModel, bookingModel);

    const analyticsData = {
      // Basic metrics
      totalOrders: orderStats.totalOrders,
      totalRevenue: orderStats.totalRevenue,
      activeBookings: bookingStats.activeBookings,
      avgOrderValue: orderStats.totalOrders > 0 ? orderStats.totalRevenue / orderStats.totalOrders : 0,

      // Status breakdowns
      ordersByStatus,
      ordersByServiceType,
      bookingsByStatus,

      // Time-based data
      dailyRevenue,

      // Growth metrics
      ...growthMetrics,

      // Additional insights
      topServices,
      recentActivity,

      // Calculated metrics
      avgProcessingTime: '2.5', // This would need to be calculated from timer data
      onTimeDeliveryRate: 95, // This would need to be calculated from completion data
      customerSatisfaction: 4.8, // This would need to be calculated from feedback data
    };

    res.json(analyticsData);
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    res.status(500).json({ message: 'Server error fetching analytics data' });
  }
};

// Helper function to get booking statistics
const getBookingStats = async (bookingModel) => {
  try {
    const bookings = await bookingModel.getAll();
    const activeBookings = bookings.filter(b => b.status === 'approved').length;

    return {
      totalBookings: bookings.length,
      activeBookings,
      pendingBookings: bookings.filter(b => b.status === 'pending').length,
      completedBookings: bookings.filter(b => b.status === 'completed').length,
    };
  } catch (error) {
    console.error('Error getting booking stats:', error);
    return {
      totalBookings: 0,
      activeBookings: 0,
      pendingBookings: 0,
      completedBookings: 0,
    };
  }
};

// Helper function to get daily revenue data
const getDailyRevenue = async (orderModel, days) => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const orders = await orderModel.getOrdersByDateRange(
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );

    // Group orders by date and calculate daily revenue
    const dailyData = {};
    orders.forEach(order => {
      const date = new Date(order.createdAt).toISOString().split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = { date, revenue: 0, orders: 0 };
      }
      dailyData[date].revenue += order.totalPrice || 0;
      dailyData[date].orders += 1;
    });

    return Object.values(dailyData).sort((a, b) => new Date(a.date) - new Date(b.date));
  } catch (error) {
    console.error('Error getting daily revenue:', error);
    return [];
  }
};

// Helper function to get orders by status
const getOrdersByStatusData = async (orderModel) => {
  try {
    const [pending, washing, drying, folding, ready, completed] = await Promise.all([
      orderModel.getByStatus('pending'),
      orderModel.getByStatus('washing'),
      orderModel.getByStatus('drying'),
      orderModel.getByStatus('folding'),
      orderModel.getByStatus('ready'),
      orderModel.getByStatus('completed')
    ]);

    return {
      pending: pending.length,
      washing: washing.length,
      drying: drying.length,
      folding: folding.length,
      ready: ready.length,
      completed: completed.length
    };
  } catch (error) {
    console.error('Error getting orders by status:', error);
    return { pending: 0, washing: 0, drying: 0, folding: 0, ready: 0, completed: 0 };
  }
};

// Helper function to get orders by service type
const getOrdersByServiceTypeData = async (orderModel) => {
  try {
    const orders = await orderModel.getAll(1, 1000); // Get all orders for analysis

    const serviceCounts = {};
    orders.forEach(order => {
      const serviceType = order.serviceType || 'washFold';
      serviceCounts[serviceType] = (serviceCounts[serviceType] || 0) + 1;
    });

    return serviceCounts;
  } catch (error) {
    console.error('Error getting orders by service type:', error);
    return { washFold: 0, dryCleaning: 0, hangDry: 0 };
  }
};

// Helper function to get bookings by status
const getBookingsByStatusData = async (bookingModel) => {
  try {
    const bookings = await bookingModel.getAll();

    const statusCounts = {};
    bookings.forEach(booking => {
      const status = booking.status || 'pending';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    return statusCounts;
  } catch (error) {
    console.error('Error getting bookings by status:', error);
    return { pending: 0, approved: 0, rejected: 0, completed: 0 };
  }
};

// Helper function to calculate growth metrics
const calculateGrowthMetrics = async (orderModel, bookingModel, days) => {
  try {
    const currentPeriodStart = new Date();
    currentPeriodStart.setDate(currentPeriodStart.getDate() - days);

    const previousPeriodStart = new Date(currentPeriodStart);
    previousPeriodStart.setDate(previousPeriodStart.getDate() - days);

    const [currentOrders, previousOrders, currentBookings, previousBookings] = await Promise.all([
      orderModel.getOrdersByDateRange(currentPeriodStart.toISOString().split('T')[0], new Date().toISOString().split('T')[0]),
      orderModel.getOrdersByDateRange(previousPeriodStart.toISOString().split('T')[0], currentPeriodStart.toISOString().split('T')[0]),
      getBookingsInDateRange(bookingModel, currentPeriodStart, new Date()),
      getBookingsInDateRange(bookingModel, previousPeriodStart, currentPeriodStart)
    ]);

    const currentRevenue = currentOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
    const previousRevenue = previousOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);

    const ordersGrowth = previousOrders.length > 0 ?
      ((currentOrders.length - previousOrders.length) / previousOrders.length * 100).toFixed(1) : 0;

    const revenueGrowth = previousRevenue > 0 ?
      ((currentRevenue - previousRevenue) / previousRevenue * 100).toFixed(1) : 0;

    const bookingsGrowth = previousBookings.length > 0 ?
      ((currentBookings.length - previousBookings.length) / previousBookings.length * 100).toFixed(1) : 0;

    const avgOrderValue = currentOrders.length > 0 ? currentRevenue / currentOrders.length : 0;
    const previousAvgOrderValue = previousOrders.length > 0 ? previousRevenue / previousOrders.length : 0;
    const aovGrowth = previousAvgOrderValue > 0 ?
      ((avgOrderValue - previousAvgOrderValue) / previousAvgOrderValue * 100).toFixed(1) : 0;

    return {
      ordersGrowth: parseFloat(ordersGrowth),
      revenueGrowth: parseFloat(revenueGrowth),
      bookingsGrowth: parseFloat(bookingsGrowth),
      aovGrowth: parseFloat(aovGrowth)
    };
  } catch (error) {
    console.error('Error calculating growth metrics:', error);
    return { ordersGrowth: 0, revenueGrowth: 0, bookingsGrowth: 0, aovGrowth: 0 };
  }
};

// Helper function to get bookings in date range
const getBookingsInDateRange = async (bookingModel, startDate, endDate) => {
  try {
    const bookings = await bookingModel.getAll();
    return bookings.filter(booking => {
      const bookingDate = new Date(booking.createdAt);
      return bookingDate >= startDate && bookingDate <= endDate;
    });
  } catch (error) {
    console.error('Error getting bookings in date range:', error);
    return [];
  }
};

// Helper function to get top services
const getTopServices = async (orderModel) => {
  try {
    const orders = await orderModel.getAll(1, 1000);

    const serviceCounts = {};
    orders.forEach(order => {
      const serviceType = order.serviceType || 'washFold';
      if (!serviceCounts[serviceType]) {
        serviceCounts[serviceType] = { name: serviceType, count: 0, revenue: 0 };
      }
      serviceCounts[serviceType].count += 1;
      serviceCounts[serviceType].revenue += order.totalPrice || 0;
    });

    return Object.values(serviceCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  } catch (error) {
    console.error('Error getting top services:', error);
    return [];
  }
};

// Helper function to get recent activity
const getRecentActivity = async (orderModel, bookingModel) => {
  try {
    const [recentOrders, recentBookings] = await Promise.all([
      orderModel.getAll(1, 10), // Get last 10 orders
      bookingModel.getAll() // Get all bookings
    ]);

    const activities = [];

    // Add recent orders
    recentOrders.slice(0, 5).forEach(order => {
      activities.push({
        type: 'order',
        description: `New ${order.serviceType} order received`,
        timestamp: order.createdAt,
        amount: order.totalPrice
      });
    });

    // Add recent bookings
    recentBookings.slice(0, 5).forEach(booking => {
      activities.push({
        type: 'booking',
        description: `New ${booking.mainService} booking request`,
        timestamp: booking.createdAt,
        amount: booking.totalPrice
      });
    });

    return activities
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10);
  } catch (error) {
    console.error('Error getting recent activity:', error);
    return [];
  }
};
