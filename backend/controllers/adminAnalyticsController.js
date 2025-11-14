import { AdminAnalytics } from '../models/AdminAnalytics.js';

// Controller to get dashboard statistics
export const getDashboardStats = (db) => async (req, res) => {
  const adminAnalyticsModel = new AdminAnalytics(db);
  try {
    const stats = await adminAnalyticsModel.getDashboardStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Server error fetching dashboard stats' });
  }
};

// Controller to get orders created today
export const getTodaysOrders = (db) => async (req, res) => {
  const adminAnalyticsModel = new AdminAnalytics(db);
  try {
    const orders = await adminAnalyticsModel.getTodaysOrders();
    res.json(orders);
  } catch (error) {
    console.error('Error fetching today\'s orders:', error);
    res.status(500).json({ message: 'Server error fetching today\'s orders' });
  }
};

// Controller to get orders by date range
export const getOrdersByDateRange = (db) => async (req, res) => {
  const { startDate, endDate } = req.body;
  const adminAnalyticsModel = new AdminAnalytics(db);

  if (!startDate || !endDate) {
    return res.status(400).json({ message: 'startDate and endDate are required' });
  }

  try {
    const orders = await adminAnalyticsModel.getOrdersByDateRange(startDate, endDate);
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders by date range:', error);
    res.status(500).json({ message: 'Server error fetching orders by date range' });
  }
};

// Controller to get revenue analytics
export const getRevenueAnalytics = (db) => async (req, res) => {
  const { startDate, endDate } = req.body;

  if (!startDate || !endDate) {
    return res.status(400).json({ message: 'startDate and endDate are required' });
  }

  try {
    const sql = `
      SELECT
        DATE(created_at) as date,
        COUNT(*) as orderCount,
        SUM(total_price) as dailyRevenue,
        AVG(total_price) as avgOrderValue
      FROM service_orders
      WHERE DATE(created_at) BETWEEN ? AND ?
      AND moved_to_history_at IS NULL
      AND is_deleted = FALSE
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;

    const analytics = await new Promise((resolve, reject) => {
      db.query(sql, [startDate, endDate], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    res.json(analytics);
  } catch (error) {
    console.error('Error fetching revenue analytics:', error);
    res.status(500).json({ message: 'Server error fetching revenue analytics' });
  }
};

// Controller to get service type distribution
export const getServiceTypeDistribution = (db) => async (req, res) => {
  try {
    const sql = `
      SELECT
        service_type,
        COUNT(*) as count,
        SUM(total_price) as totalRevenue
      FROM service_orders
      WHERE moved_to_history_at IS NULL
      AND is_deleted = FALSE
      GROUP BY service_type
      ORDER BY count DESC
    `;

    const distribution = await new Promise((resolve, reject) => {
      db.query(sql, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    res.json(distribution);
  } catch (error) {
    console.error('Error fetching service type distribution:', error);
    res.status(500).json({ message: 'Server error fetching service type distribution' });
  }
};

// Controller to get payment method analytics
export const getPaymentMethodAnalytics = (db) => async (req, res) => {
  try {
    const sql = `
      SELECT
        payment_method,
        COUNT(*) as count,
        SUM(total_price) as totalRevenue
      FROM service_orders
      WHERE moved_to_history_at IS NULL
      AND is_deleted = FALSE
      GROUP BY payment_method
      ORDER BY count DESC
    `;

    const analytics = await new Promise((resolve, reject) => {
      db.query(sql, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    res.json(analytics);
  } catch (error) {
    console.error('Error fetching payment method analytics:', error);
    res.status(500).json({ message: 'Server error fetching payment method analytics' });
  }
};

// Controller to get status distribution
export const getStatusDistribution = (db) => async (req, res) => {
  try {
    const sql = `
      SELECT
        status,
        COUNT(*) as count
      FROM service_orders
      WHERE moved_to_history_at IS NULL
      AND is_deleted = FALSE
      GROUP BY status
      ORDER BY count DESC
    `;

    const distribution = await new Promise((resolve, reject) => {
      db.query(sql, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    res.json(distribution);
  } catch (error) {
    console.error('Error fetching status distribution:', error);
    res.status(500).json({ message: 'Server error fetching status distribution' });
  }
};

// Controller to get customer analytics
export const getCustomerAnalytics = (db) => async (req, res) => {
  try {
    const sql = `
      SELECT
        COUNT(DISTINCT cp.user_id) as totalCustomers,
        COUNT(DISTINCT CASE WHEN so.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN cp.user_id END) as newCustomers30Days,
        AVG(orderCount) as avgOrdersPerCustomer
      FROM (
        SELECT
          customer_id,
          COUNT(*) as orderCount
        FROM service_orders
        WHERE customer_id IS NOT NULL
        AND moved_to_history_at IS NULL
        AND is_deleted = FALSE
        GROUP BY customer_id
      ) as customerOrders
      LEFT JOIN customers_profiles cp ON customerOrders.customer_id = cp.customer_id
      WHERE cp.user_id IS NOT NULL
    `;

    const analytics = await new Promise((resolve, reject) => {
      db.query(sql, (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
    });

    res.json(analytics);
  } catch (error) {
    console.error('Error fetching customer analytics:', error);
    res.status(500).json({ message: 'Server error fetching customer analytics' });
  }
};

// Controller to get top customers
export const getTopCustomers = (db) => async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;

  try {
    const sql = `
      SELECT
        cp.user_id,
        cp.name,
        cp.email,
        COUNT(*) as totalOrders,
        SUM(so.total_price) as totalSpent,
        MAX(so.created_at) as lastOrderDate
      FROM service_orders so
      LEFT JOIN customers_profiles cp ON so.customer_id = cp.customer_id
      WHERE cp.user_id IS NOT NULL
      AND so.moved_to_history_at IS NULL
      AND so.is_deleted = FALSE
      GROUP BY cp.user_id, cp.name, cp.email
      ORDER BY totalSpent DESC
      LIMIT ?
    `;

    const customers = await new Promise((resolve, reject) => {
      db.query(sql, [limit], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    res.json(customers);
  } catch (error) {
    console.error('Error fetching top customers:', error);
    res.status(500).json({ message: 'Server error fetching top customers' });
  }
};

// Controller to get monthly trends
export const getMonthlyTrends = (db) => async (req, res) => {
  const { months = 12 } = req.query;

  try {
    const sql = `
      SELECT
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as orderCount,
        SUM(total_price) as monthlyRevenue,
        AVG(total_price) as avgOrderValue
      FROM service_orders
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? MONTH)
      AND moved_to_history_at IS NULL
      AND is_deleted = FALSE
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month DESC
    `;

    const trends = await new Promise((resolve, reject) => {
      db.query(sql, [months], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    res.json(trends);
  } catch (error) {
    console.error('Error fetching monthly trends:', error);
    res.status(500).json({ message: 'Server error fetching monthly trends' });
  }
};

// Controller to get aggregated analytics data based on range
export const getAnalyticsData = (db) => async (req, res) => {
  const { range = '7d' } = req.query;
  const adminAnalyticsModel = new AdminAnalytics(db);

  try {
    // Calculate date range based on range parameter
    const now = new Date();
    let startDate, endDate;

    switch (range) {
      case '1d':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        endDate = now;
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        endDate = now;
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        endDate = now;
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        endDate = now;
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        endDate = now;
    }

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Get dashboard stats (filtered by active orders)
    const dashboardStats = await adminAnalyticsModel.getDashboardStats();

    // Get revenue analytics (filtered by completed orders)
    const revenueAnalytics = await new Promise((resolve, reject) => {
      const sql = `
        SELECT
          DATE(created_at) as date,
          COUNT(*) as orderCount,
          SUM(total_price) as dailyRevenue,
          AVG(total_price) as avgOrderValue
        FROM service_orders
        WHERE DATE(created_at) BETWEEN ? AND ?
        AND status = 'completed'
        AND moved_to_history_at IS NULL
        AND is_deleted = FALSE
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `;

      db.query(sql, [startDateStr, endDateStr], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    // Get status distribution
    const statusDistribution = await new Promise((resolve, reject) => {
      const sql = `
        SELECT
          status,
          COUNT(*) as count
        FROM service_orders
        WHERE DATE(created_at) BETWEEN ? AND ?
        AND moved_to_history_at IS NULL
        AND is_deleted = FALSE
        GROUP BY status
        ORDER BY count DESC
      `;

      db.query(sql, [startDateStr, endDateStr], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    // Get service type distribution
    const serviceTypeDistribution = await new Promise((resolve, reject) => {
      const sql = `
        SELECT
          service_type,
          COUNT(*) as count,
          SUM(total_price) as totalRevenue
        FROM service_orders
        WHERE DATE(created_at) BETWEEN ? AND ?
        AND moved_to_history_at IS NULL
        AND is_deleted = FALSE
        GROUP BY service_type
        ORDER BY count DESC
      `;

      db.query(sql, [startDateStr, endDateStr], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    // Get booking status distribution from service_orders table
    // Map service order statuses to booking statuses
    const bookingStatusDistribution = await new Promise((resolve, reject) => {
      const sql = `
        SELECT
          CASE
            WHEN status = 'pending' THEN 'pending'
            WHEN status = 'approved' THEN 'approved'
            WHEN status IN ('washing', 'drying', 'folding', 'ready') THEN 'approved'
            WHEN status = 'completed' THEN 'completed'
            WHEN status = 'rejected' THEN 'rejected'
            ELSE 'pending'
          END as status,
          COUNT(*) as count
        FROM service_orders
        WHERE DATE(created_at) BETWEEN ? AND ?
        AND moved_to_history_at IS NULL
        AND is_deleted = FALSE
        GROUP BY
          CASE
            WHEN status = 'pending' THEN 'pending'
            WHEN status = 'approved' THEN 'approved'
            WHEN status IN ('washing', 'drying', 'folding', 'ready') THEN 'approved'
            WHEN status = 'completed' THEN 'completed'
            WHEN status = 'rejected' THEN 'rejected'
            ELSE 'pending'
          END
      `;

      db.query(sql, [startDateStr, endDateStr], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    // Calculate growth metrics (compare with previous period)
    const previousPeriodStart = new Date(startDate.getTime() - (endDate.getTime() - startDate.getTime()));
    const previousPeriodEnd = startDate;
    const prevStartStr = previousPeriodStart.toISOString().split('T')[0];
    const prevEndStr = previousPeriodEnd.toISOString().split('T')[0];

    const previousRevenue = await new Promise((resolve, reject) => {
      const sql = `
        SELECT SUM(total_price) as totalRevenue, COUNT(*) as totalOrders
        FROM service_orders
        WHERE DATE(created_at) BETWEEN ? AND ?
        AND status = 'completed'
        AND moved_to_history_at IS NULL
        AND is_deleted = FALSE
      `;

      db.query(sql, [prevStartStr, prevEndStr], (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
    });

    const currentRevenue = revenueAnalytics.reduce((sum, day) => sum + parseFloat(day.dailyRevenue || 0), 0);
    const currentOrders = revenueAnalytics.reduce((sum, day) => sum + parseInt(day.orderCount || 0), 0);

    const previousRevenueTotal = parseFloat(previousRevenue.totalRevenue || 0);
    const previousOrdersTotal = parseInt(previousRevenue.totalOrders || 0);

    const revenueGrowth = previousRevenueTotal > 0 ? ((currentRevenue - previousRevenueTotal) / previousRevenueTotal) * 100 : 0;
    const ordersGrowth = previousOrdersTotal > 0 ? ((currentOrders - previousOrdersTotal) / previousOrdersTotal) * 100 : 0;

    // Calculate average order value
    const avgOrderValue = currentOrders > 0 ? currentRevenue / currentOrders : 0;

    // Calculate active bookings (placeholder - would need booking model)
    const activeBookings = 0;

    // Calculate bookings growth (placeholder)
    const bookingsGrowth = 0;

    // Calculate AOV growth
    const previousAOV = previousOrdersTotal > 0 ? previousRevenueTotal / previousOrdersTotal : 0;
    const aovGrowth = previousAOV > 0 ? ((avgOrderValue - previousAOV) / previousAOV) * 100 : 0;

    // Format status distribution for frontend
    const ordersByStatus = {};
    statusDistribution.forEach(item => {
      ordersByStatus[item.status] = item.count;
    });

    // Format service type distribution for frontend
    const ordersByServiceType = {};
    serviceTypeDistribution.forEach(item => {
      if (item.service_type === 'washDryFold') {
        ordersByServiceType.washFold = item.count;
      } else if (item.service_type === 'dryCleaning') {
        ordersByServiceType.dryCleaning = item.count;
      } else if (item.service_type === 'hangDry') {
        ordersByServiceType.hangDry = item.count;
      }
    });

    // Format booking status distribution for frontend
    const bookingsByStatus = {};
    bookingStatusDistribution.forEach(item => {
      bookingsByStatus[item.status] = item.count;
    });

    // Get top services (placeholder data)
    const topServices = [
      { name: 'Wash & Fold', count: ordersByServiceType.washFold || 0 },
      { name: 'Dry Cleaning', count: ordersByServiceType.dryCleaning || 0 },
      { name: 'Hang Dry', count: ordersByServiceType.hangDry || 0 }
    ].sort((a, b) => b.count - a.count);

    // Get recent activity from service_orders
    const recentActivity = await new Promise((resolve, reject) => {
      const sql = `
        SELECT
          so.service_orders_id as id,
          'order' as type,
          CONCAT('New order received from ', cp.name) as description,
          so.created_at as timestamp,
          so.status
        FROM service_orders so
        LEFT JOIN customers_profiles cp ON so.customer_id = cp.customer_id
        WHERE DATE(so.created_at) BETWEEN ? AND ?
        AND so.moved_to_history_at IS NULL
        AND so.is_deleted = FALSE
        ORDER BY so.created_at DESC
        LIMIT 10
      `;

      db.query(sql, [startDateStr, endDateStr], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    // Performance metrics (placeholder)
    const avgProcessingTime = '2.5';
    const onTimeDeliveryRate = 95;
    const customerSatisfaction = 4.8;

    // Get top customers
    const topCustomers = await new Promise((resolve, reject) => {
      const sql = `
        SELECT
          cp.user_id,
          cp.name,
          cp.email,
          COUNT(*) as totalOrders,
          SUM(so.total_price) as totalSpent,
          MAX(so.created_at) as lastOrderDate
        FROM service_orders so
        LEFT JOIN customers_profiles cp ON so.customer_id = cp.customer_id
        WHERE cp.user_id IS NOT NULL
        AND so.moved_to_history_at IS NULL
        AND so.is_deleted = FALSE
        GROUP BY cp.user_id, cp.name, cp.email
        ORDER BY totalSpent DESC
        LIMIT 5
      `;

      db.query(sql, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    // Compile final response
    const analyticsData = {
      totalOrders: dashboardStats.totalOrders || 0,
      totalRevenue: currentRevenue,
      ordersGrowth: Math.round(ordersGrowth * 100) / 100,
      revenueGrowth: Math.round(revenueGrowth * 100) / 100,
      activeBookings,
      bookingsGrowth,
      avgOrderValue,
      aovGrowth: Math.round(aovGrowth * 100) / 100,
      ordersByStatus,
      dailyRevenue: revenueAnalytics,
      ordersByServiceType,
      bookingsByStatus,
      topServices,
      topCustomers,
      recentActivity,
      avgProcessingTime,
      onTimeDeliveryRate,
      customerSatisfaction
    };

    res.json(analyticsData);
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    res.status(500).json({ message: 'Server error fetching analytics data' });
  }
};
