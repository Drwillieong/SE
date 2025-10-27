import { ServiceOrder } from '../models/ServiceOrder.js';

// Controller to get dashboard statistics
export const getDashboardStats = (db) => async (req, res) => {
  const serviceOrderModel = new ServiceOrder(db);
  try {
    const stats = await serviceOrderModel.getDashboardStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Server error fetching dashboard stats' });
  }
};

// Controller to get orders created today
export const getTodaysOrders = (db) => async (req, res) => {
  const serviceOrderModel = new ServiceOrder(db);
  try {
    const orders = await serviceOrderModel.getTodaysOrders();
    res.json(orders);
  } catch (error) {
    console.error('Error fetching today\'s orders:', error);
    res.status(500).json({ message: 'Server error fetching today\'s orders' });
  }
};

// Controller to get orders by date range
export const getOrdersByDateRange = (db) => async (req, res) => {
  const { startDate, endDate } = req.body;
  const serviceOrderModel = new ServiceOrder(db);

  if (!startDate || !endDate) {
    return res.status(400).json({ message: 'startDate and endDate are required' });
  }

  try {
    const orders = await serviceOrderModel.getOrdersByDateRange(startDate, endDate);
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
        COUNT(DISTINCT user_id) as totalCustomers,
        COUNT(DISTINCT CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN user_id END) as newCustomers30Days,
        AVG(orderCount) as avgOrdersPerCustomer
      FROM (
        SELECT
          user_id,
          COUNT(*) as orderCount
        FROM service_orders
        WHERE user_id IS NOT NULL
        AND moved_to_history_at IS NULL
        AND is_deleted = FALSE
        GROUP BY user_id
      ) as customerOrders
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
        user_id,
        name,
        email,
        COUNT(*) as totalOrders,
        SUM(total_price) as totalSpent,
        MAX(created_at) as lastOrderDate
      FROM service_orders
      WHERE user_id IS NOT NULL
      AND moved_to_history_at IS NULL
      AND is_deleted = FALSE
      GROUP BY user_id, name, email
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
