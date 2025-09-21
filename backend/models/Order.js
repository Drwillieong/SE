export class Order {
  constructor(db) {
    this.db = db;
  }

  // Get all orders
  async getAll() {
    const sql = `
      SELECT * FROM orders
      ORDER BY createdAt DESC
    `;
    return new Promise((resolve, reject) => {
      this.db.query(sql, (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });
  }

  // Get order by ID
  async getById(orderId) {
    const sql = 'SELECT * FROM orders WHERE order_id = ?';
    return new Promise((resolve, reject) => {
      this.db.query(sql, [orderId], (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results[0] || null);
        }
      });
    });
  }

  // Get orders by status
  async getByStatus(status) {
    const sql = 'SELECT * FROM orders WHERE status = ? ORDER BY createdAt DESC';
    return new Promise((resolve, reject) => {
      this.db.query(sql, [status], (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });
  }

  // Create new order
  async create(orderData) {
    const sql = `
      INSERT INTO orders (
        serviceType, pickupDate, pickupTime, loadCount, instructions, status,
        paymentMethod, name, contact, email, address, photos, totalPrice,
        user_id, estimatedClothes, kilos, pants, shorts, tshirts, bedsheets,
        laundryPhoto, booking_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      orderData.serviceType,
      orderData.pickupDate,
      orderData.pickupTime,
      orderData.loadCount || 1,
      orderData.instructions || '',
      orderData.status || 'pending',
      orderData.paymentMethod || 'cash',
      orderData.name,
      orderData.contact,
      orderData.email || '',
      orderData.address,
      JSON.stringify(orderData.photos || []),
      orderData.totalPrice || 0,
      orderData.user_id || null,
      orderData.estimatedClothes || 0,
      orderData.kilos || 0,
      orderData.pants || 0,
      orderData.shorts || 0,
      orderData.tshirts || 0,
      orderData.bedsheets || 0,
      JSON.stringify(orderData.laundryPhoto || []),
      orderData.booking_id || null
    ];

    return new Promise((resolve, reject) => {
      this.db.query(sql, values, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result.insertId);
        }
      });
    });
  }

  // Update order
  async update(orderId, updates) {
    if (Object.keys(updates).length === 0) {
      throw new Error('No fields to update');
    }

    const fields = Object.keys(updates);
    const values = Object.values(updates);

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const sql = `UPDATE orders SET ${setClause} WHERE order_id = ?`;

    return new Promise((resolve, reject) => {
      this.db.query(sql, [...values, orderId], (err, result) => {
        if (err) {
          reject(err);
        } else if (result.affectedRows === 0) {
          reject(new Error('Order not found'));
        } else {
          resolve(result.affectedRows);
        }
      });
    });
  }

  // Delete order
  async delete(orderId) {
    const sql = 'DELETE FROM orders WHERE order_id = ?';
    return new Promise((resolve, reject) => {
      this.db.query(sql, [orderId], (err, result) => {
        if (err) {
          reject(err);
        } else if (result.affectedRows === 0) {
          reject(new Error('Order not found'));
        } else {
          resolve(result.affectedRows);
        }
      });
    });
  }

  // Get dashboard statistics
  async getDashboardStats() {
    const sql = `
      SELECT
        COUNT(*) as totalOrders,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pendingOrders,
        SUM(CASE WHEN status = 'washing' THEN 1 ELSE 0 END) as washingOrders,
        SUM(CASE WHEN status = 'drying' THEN 1 ELSE 0 END) as dryingOrders,
        SUM(CASE WHEN status = 'folding' THEN 1 ELSE 0 END) as foldingOrders,
        SUM(CASE WHEN status = 'ready' THEN 1 ELSE 0 END) as readyOrders,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completedOrders,
        SUM(totalPrice) as totalRevenue
      FROM orders
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

  // Get orders created today
  async getTodaysOrders() {
    const today = new Date().toISOString().split('T')[0];
    const sql = `
      SELECT * FROM orders
      WHERE DATE(createdAt) = ?
      ORDER BY createdAt DESC
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

  // Get orders by date range
  async getOrdersByDateRange(startDate, endDate) {
    const sql = `
      SELECT * FROM orders
      WHERE DATE(createdAt) BETWEEN ? AND ?
      ORDER BY createdAt DESC
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
}
