export class AdminAnalytics {
  constructor(db) {
    this.db = db;
  }

  // Get dashboard statistics
  async getDashboardStats() {
    const sql = `
      SELECT
        COUNT(*) as totalOrders,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pendingOrders,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approvedOrders,
        SUM(CASE WHEN status = 'washing' THEN 1 ELSE 0 END) as washingOrders,
        SUM(CASE WHEN status = 'drying' THEN 1 ELSE 0 END) as dryingOrders,
        SUM(CASE WHEN status = 'folding' THEN 1 ELSE 0 END) as foldingOrders,
        SUM(CASE WHEN status = 'ready' THEN 1 ELSE 0 END) as readyOrders,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completedOrders,
        SUM(CASE WHEN status = 'completed' THEN total_price ELSE 0 END) as totalRevenue
      FROM service_orders
      WHERE moved_to_history_at IS NULL
      AND is_deleted = FALSE
    `;

    return new Promise((resolve, reject) => {
      this.db.query(sql, (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results[0]);
        }
      });
    });
  }

  // Get order statistics for admin dashboard
  async getOrderStats() {
    const sql = `
      SELECT
        COUNT(*) as totalOrders,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pendingOrders,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completedOrders
      FROM service_orders
      WHERE moved_to_history_at IS NULL
      AND is_deleted = FALSE
    `;

    return new Promise((resolve, reject) => {
      this.db.query(sql, (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results[0]);
        }
      });
    });
  }

  // Get service orders created today
  async getTodaysOrders() {
    const today = new Date().toISOString().split('T')[0];
    const sql = `
      SELECT * FROM service_orders
      WHERE DATE(created_at) = ?
      AND moved_to_history_at IS NULL
      AND is_deleted = FALSE
      ORDER BY created_at DESC
    `;
    return new Promise((resolve, reject) => {
      this.db.query(sql, [today], (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });
  }

  // Get service orders by date range
  async getOrdersByDateRange(startDate, endDate) {
    const sql = `
      SELECT * FROM service_orders
      WHERE DATE(created_at) BETWEEN ? AND ?
      AND moved_to_history_at IS NULL
      AND is_deleted = FALSE
      ORDER BY created_at DESC
    `;
    return new Promise((resolve, reject) => {
      this.db.query(sql, [startDate, endDate], (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });
  }

  // Get revenue analytics
  async getRevenueAnalytics(startDate, endDate) {
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

    return new Promise((resolve, reject) => {
      this.db.query(sql, [startDate, endDate], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }

  // Get service type distribution
  async getServiceTypeDistribution() {
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

    return new Promise((resolve, reject) => {
      this.db.query(sql, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }

  // Get payment method analytics
  async getPaymentMethodAnalytics() {
    const sql = `
      SELECT
        p.payment_method,
        COUNT(*) as count,
        SUM(p.total_price) as totalRevenue
      FROM payments p
      LEFT JOIN service_orders so ON p.service_orders_id = so.service_orders_id
      WHERE so.moved_to_history_at IS NULL
      AND so.is_deleted = FALSE
      GROUP BY p.payment_method
      ORDER BY count DESC
    `;

    return new Promise((resolve, reject) => {
      this.db.query(sql, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }

  // Get status distribution
  async getStatusDistribution() {
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

    return new Promise((resolve, reject) => {
      this.db.query(sql, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }

  // Get customer analytics
  async getCustomerAnalytics() {
    const sql = `
      SELECT
        COUNT(DISTINCT so.customer_id) as totalCustomers,
        COUNT(DISTINCT CASE WHEN so.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN so.customer_id END) as newCustomers30Days,
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
      LEFT JOIN service_orders so ON so.customer_id = customerOrders.customer_id
    `;

    return new Promise((resolve, reject) => {
      this.db.query(sql, (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
    });
  }

  // Get top customers
  async getTopCustomers(limit = 10) {
    const sql = `
      SELECT
        cp.customer_id,
        cp.name,
        cp.email,
        COUNT(*) as totalOrders,
        SUM(so.total_price) as totalSpent,
        MAX(so.created_at) as lastOrderDate
      FROM service_orders so
      LEFT JOIN customers_profiles cp ON so.customer_id = cp.customer_id
      WHERE so.customer_id IS NOT NULL
      AND so.moved_to_history_at IS NULL
      AND so.is_deleted = FALSE
      GROUP BY so.customer_id, cp.name, cp.email
      ORDER BY totalSpent DESC
      LIMIT ?
    `;

    return new Promise((resolve, reject) => {
      this.db.query(sql, [limit], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }

  // Get monthly trends
  async getMonthlyTrends(months = 12) {
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

    return new Promise((resolve, reject) => {
      this.db.query(sql, [months], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }

  // Get aggregated analytics data based on range
  async getAnalyticsData(range = '7d') {
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
    const dashboardStats = await this.getDashboardStats();

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

      this.db.query(sql, [startDateStr, endDateStr], (err, results) => {
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

      this.db.query(sql, [startDateStr, endDateStr], (err, results) => {
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

      this.db.query(sql, [startDateStr, endDateStr], (err, results) => {
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

      this.db.query(sql, [startDateStr, endDateStr], (err, results) => {
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

      this.db.query(sql, [prevStartStr, prevEndStr], (err, results) => {
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
          service_orders_id as id,
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

      this.db.query(sql, [startDateStr, endDateStr], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    // Performance metrics (placeholder)
    const avgProcessingTime = '2.5';
    const onTimeDeliveryRate = 95;
    const customerSatisfaction = 4.8;

    // Get top customers
    const topCustomers = await this.getTopCustomers(5);

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

    return analyticsData;
  }
}
