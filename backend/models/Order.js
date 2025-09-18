export class Order {
  constructor(db) {
    this.db = db;
  }

  // Get all orders
  getAll() {
    return new Promise((resolve, reject) => {
      const sql = "SELECT * FROM orders ORDER BY createdAt DESC LIMIT 1000";
      this.db.query(sql, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }

  // Get order by ID
  getById(id) {
    return new Promise((resolve, reject) => {
      const sql = "SELECT * FROM orders WHERE id = ?";
      this.db.query(sql, [id], (err, results) => {
        if (err) reject(err);
        else resolve(results.length > 0 ? results[0] : null);
      });
    });
  }

  // Create new order
  create(orderData) {
    return new Promise((resolve, reject) => {
      const {
        serviceType,
        pickupDate,
        pickupTime,
        loadCount,
        instructions,
        status,
        paymentMethod,
        name,
        contact,
        email,
        address,
        photos,
        totalPrice,
        userId,
        estimatedClothes,
        kilos,
        pants,
        shorts,
        tshirts,
        bedsheets,
        laundryPhoto
      } = orderData;

      const sql = `INSERT INTO orders
        (serviceType, pickupDate, pickupTime, loadCount, instructions, status, paymentMethod, name, contact, email, address, photos, totalPrice, user_id, estimatedClothes, kilos, pants, shorts, tshirts, bedsheets, laundryPhoto, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`;

      const photosJson = photos ? JSON.stringify(photos) : JSON.stringify([]);
      const laundryPhotoJson = laundryPhoto ? JSON.stringify(laundryPhoto) : JSON.stringify([]);

      // Format pickupDate to MySQL DATE format (YYYY-MM-DD)
      const formattedPickupDate = pickupDate ? new Date(pickupDate).toISOString().split('T')[0] : null;

      const values = [
        serviceType,
        formattedPickupDate,
        pickupTime,
        loadCount,
        instructions,
        status || 'pending',
        paymentMethod,
        name,
        contact,
        email,
        address,
        photosJson,
        totalPrice,
        userId,
        estimatedClothes,
        kilos,
        pants || 0,
        shorts || 0,
        tshirts || 0,
        bedsheets || 0,
        laundryPhotoJson
      ];

      this.db.query(sql, values, (err, result) => {
        if (err) reject(err);
        else resolve(result.insertId);
      });
    });
  }

  // Update order
  update(id, updates) {
    return new Promise((resolve, reject) => {
      // If photos are included, convert to JSON string
      if (updates.photos) {
        updates.photos = JSON.stringify(updates.photos);
      }

      const fields = Object.keys(updates);
      if (fields.length === 0) {
        reject(new Error('No fields to update'));
        return;
      }

      const setClause = fields.map(field => `${field} = ?`).join(', ');
      const values = fields.map(field => updates[field]);
      values.push(id);

      const sql = `UPDATE orders SET ${setClause} WHERE id = ?`;

      this.db.query(sql, values, (err, result) => {
        if (err) reject(err);
        else if (result.affectedRows === 0) reject(new Error('Order not found'));
        else resolve(result);
      });
    });
  }

  // Delete order
  delete(id) {
    return new Promise((resolve, reject) => {
      const sql = "DELETE FROM orders WHERE id = ?";
      this.db.query(sql, [id], (err, result) => {
        if (err) reject(err);
        else if (result.affectedRows === 0) reject(new Error('Order not found'));
        else resolve(result);
      });
    });
  }

  // Get orders by status
  getByStatus(status) {
    return new Promise((resolve, reject) => {
      const sql = "SELECT * FROM orders WHERE status = ? ORDER BY createdAt DESC";
      this.db.query(sql, [status], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }

  // Get orders by user ID
  getByUserId(userId) {
    return new Promise((resolve, reject) => {
      const sql = "SELECT * FROM orders WHERE user_id = ? ORDER BY createdAt DESC";
      this.db.query(sql, [userId], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }

  // Get dashboard statistics
  getDashboardStats() {
    return new Promise((resolve, reject) => {
      const queries = [
        "SELECT COUNT(*) as total FROM orders",
        "SELECT COUNT(*) as pending FROM orders WHERE status = 'pending'",
        "SELECT COUNT(*) as approved FROM orders WHERE status = 'approved'",
        "SELECT SUM(totalPrice) as revenue FROM orders WHERE status = 'approved'",
        "SELECT * FROM orders ORDER BY createdAt DESC LIMIT 10",
        `
          SELECT serviceType, COUNT(*) as count, SUM(totalPrice) as revenue
          FROM orders
          WHERE status = 'approved'
          GROUP BY serviceType
        `
      ];

      const promises = queries.map(query => {
        return new Promise((resolveQuery, rejectQuery) => {
          this.db.query(query, (err, result) => {
            if (err) rejectQuery(err);
            else resolveQuery(result);
          });
        });
      });

      Promise.all(promises)
        .then(([totalResult, pendingResult, approvedResult, revenueResult, recentResult, serviceResult]) => {
          resolve({
            totalOrders: totalResult[0].total,
            pendingOrders: pendingResult[0].pending,
            approvedOrders: approvedResult[0].approved,
            totalRevenue: revenueResult[0].revenue || 0,
            recentOrders: recentResult,
            serviceStats: serviceResult
          });
        })
        .catch(reject);
    });
  }

  // Get monthly revenue data
  getMonthlyRevenue() {
    return new Promise((resolve, reject) => {
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
      this.db.query(sql, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }

  // Get weekly orders
  getWeeklyOrders() {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT
          DATE(createdAt) as date,
          COUNT(*) as orderCount
        FROM orders
        WHERE createdAt >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        GROUP BY DATE(createdAt)
        ORDER BY date
      `;
      this.db.query(sql, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }
}
