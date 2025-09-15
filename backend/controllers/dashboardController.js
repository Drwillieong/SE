// Controller for admin dashboard statistics and overview
export const getDashboardStats = (db) => (req, res) => {
  // Get total orders count
  const totalOrdersSql = "SELECT COUNT(*) as total FROM orders";

  // Get pending orders count
  const pendingOrdersSql = "SELECT COUNT(*) as pending FROM orders WHERE status = 'pending'";

  // Get approved orders count
  const approvedOrdersSql = "SELECT COUNT(*) as approved FROM orders WHERE status = 'approved'";

  // Get total revenue
  const totalRevenueSql = "SELECT SUM(totalPrice) as revenue FROM orders WHERE status = 'approved'";

  // Get recent orders (last 10)
  const recentOrdersSql = "SELECT * FROM orders ORDER BY createdAt DESC LIMIT 10";

  // Get orders by service type
  const serviceStatsSql = `
    SELECT serviceType, COUNT(*) as count, SUM(totalPrice) as revenue
    FROM orders
    WHERE status = 'approved'
    GROUP BY serviceType
  `;

  // Execute all queries in parallel
  Promise.all([
    new Promise((resolve, reject) => {
      db.query(totalOrdersSql, (err, result) => {
        if (err) reject(err);
        else resolve(result[0].total);
      });
    }),
    new Promise((resolve, reject) => {
      db.query(pendingOrdersSql, (err, result) => {
        if (err) reject(err);
        else resolve(result[0].pending);
      });
    }),
    new Promise((resolve, reject) => {
      db.query(approvedOrdersSql, (err, result) => {
        if (err) reject(err);
        else resolve(result[0].approved);
      });
    }),
    new Promise((resolve, reject) => {
      db.query(totalRevenueSql, (err, result) => {
        if (err) reject(err);
        else resolve(result[0].revenue || 0);
      });
    }),
    new Promise((resolve, reject) => {
      db.query(recentOrdersSql, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    }),
    new Promise((resolve, reject) => {
      db.query(serviceStatsSql, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    })
  ])
  .then(([totalOrders, pendingOrders, approvedOrders, totalRevenue, recentOrders, serviceStats]) => {
    res.json({
      totalOrders,
      pendingOrders,
      approvedOrders,
      totalRevenue,
      recentOrders,
      serviceStats
    });
  })
  .catch(err => {
    console.error('Error fetching dashboard stats:', err);
    res.status(500).json({ message: 'Server error fetching dashboard statistics' });
  });
};

// Controller to get monthly revenue data for charts
export const getMonthlyRevenue = (db) => (req, res) => {
  const sql = `
    SELECT
      DATE_FORMAT(createdAt, '%Y-%m') as month,
      SUM(totalPrice) as revenue,
      COUNT(*) as orderCount
    FROM orders
    WHERE status = 'approved'
    GROUP BY DATE_FORMAT(createdAt, '%Y-%m')
    ORDER BY month DESC
    LIMIT 12
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching monthly revenue:', err);
      return res.status(500).json({ message: 'Server error fetching monthly revenue' });
    }
    res.json(results);
  });
};

// Controller to get daily orders for the current week
export const getWeeklyOrders = (db) => (req, res) => {
  const sql = `
    SELECT
      DATE(createdAt) as date,
      COUNT(*) as orderCount
    FROM orders
    WHERE createdAt >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
    GROUP BY DATE(createdAt)
    ORDER BY date
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching weekly orders:', err);
      return res.status(500).json({ message: 'Server error fetching weekly orders' });
    }
    res.json(results);
  });
};
