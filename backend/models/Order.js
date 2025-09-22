export class Order {
  constructor(db) {
    this.db = db;
  }

  // Get all orders with pagination (optimized to avoid sort memory issues)
  async getAll(page = 1, limit = 50) {
    const offset = (page - 1) * limit;

    // Use a more efficient approach: get orders without ORDER BY first
    // We'll get a larger batch and then sort in memory
    const batchSize = limit * 2; // Get more records to ensure we have enough after filtering

    const sql = `
      SELECT * FROM orders
      WHERE order_id > 0
      LIMIT ? OFFSET ?
    `;

    return new Promise((resolve, reject) => {
      this.db.query(sql, [batchSize, offset], (err, results) => {
        if (err) {
          reject(err);
          return;
        }

        if (results.length === 0) {
          resolve([]);
          return;
        }

        // Sort the results in memory by createdAt (JavaScript sort)
        results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Take only the number we need
        const paginatedResults = results.slice(0, limit);

        resolve(paginatedResults);
      });
    });
  }

  // Get total count of orders for pagination
  async getTotalCount() {
    const sql = 'SELECT COUNT(*) as total FROM orders';
    return new Promise((resolve, reject) => {
      this.db.query(sql, (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results[0].total);
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

  // Timer Management Methods

  // Start timer for an order
  async startTimer(orderId, status) {
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + (60 * 60 * 1000)); // 1 hour from now

    const sql = `
      UPDATE orders
      SET timer_start = ?, timer_end = ?, current_timer_status = ?
      WHERE order_id = ?
    `;

    return new Promise((resolve, reject) => {
      this.db.query(sql, [startTime, endTime, status, orderId], (err, result) => {
        if (err) {
          reject(err);
        } else if (result.affectedRows === 0) {
          reject(new Error('Order not found'));
        } else {
          resolve({ startTime, endTime, status });
        }
      });
    });
  }

  // Stop timer for an order
  async stopTimer(orderId) {
    const sql = `
      UPDATE orders
      SET timer_start = NULL, timer_end = NULL, current_timer_status = NULL
      WHERE order_id = ?
    `;

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

  // Get timer status for an order
  async getTimerStatus(orderId) {
    const sql = 'SELECT timer_start, timer_end, current_timer_status, auto_advance_enabled FROM orders WHERE order_id = ?';
    return new Promise((resolve, reject) => {
      this.db.query(sql, [orderId], (err, results) => {
        if (err) {
          reject(err);
        } else {
          const timerData = results[0];
          if (!timerData) {
            resolve(null);
          } else {
            const now = new Date();
            const endTime = new Date(timerData.timer_end);
            const remaining = Math.max(0, endTime - now);

            resolve({
              isActive: timerData.timer_start !== null && remaining > 0,
              startTime: timerData.timer_start,
              endTime: timerData.timer_end,
              currentStatus: timerData.current_timer_status,
              autoAdvanceEnabled: timerData.auto_advance_enabled,
              remainingTime: remaining,
              isExpired: remaining === 0 && timerData.timer_start !== null
            });
          }
        }
      });
    });
  }

  // Toggle auto-advance for an order
  async toggleAutoAdvance(orderId, enabled) {
    const sql = 'UPDATE orders SET auto_advance_enabled = ? WHERE order_id = ?';

    return new Promise((resolve, reject) => {
      this.db.query(sql, [enabled, orderId], (err, result) => {
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

  // Get next status in the workflow
  getNextStatus(currentStatus) {
    const statusFlow = {
      'pending': 'washing',
      'washing': 'drying',
      'drying': 'folding',
      'folding': 'ready',
      'ready': 'completed',
      'completed': 'completed'
    };
    return statusFlow[currentStatus] || currentStatus;
  }

  // Advance order to next status
  async advanceToNextStatus(orderId) {
    const order = await this.getById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    const nextStatus = this.getNextStatus(order.status);
    const updates = { status: nextStatus };

    // If advancing to a new status that needs timing, start timer
    if (['washing', 'drying', 'folding'].includes(nextStatus)) {
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + (60 * 60 * 1000)); // 1 hour
      updates.timer_start = startTime;
      updates.timer_end = endTime;
      updates.current_timer_status = nextStatus;
    } else {
      // Clear timer for final statuses
      updates.timer_start = null;
      updates.timer_end = null;
      updates.current_timer_status = null;
    }

    return await this.update(orderId, updates);
  }

  // Get all orders with active timers
  async getOrdersWithActiveTimers() {
    const sql = `
      SELECT * FROM orders
      WHERE timer_end IS NOT NULL
      AND timer_end > NOW()
      ORDER BY timer_end ASC
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

  // Get orders with expired timers
  async getOrdersWithExpiredTimers() {
    const sql = `
      SELECT * FROM orders
      WHERE timer_end IS NOT NULL
      AND timer_end <= NOW()
      ORDER BY timer_end ASC
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
}
