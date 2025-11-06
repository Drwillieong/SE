export class ServiceOrder {
  constructor(db) {
    this.db = db;
  }

  // Get all service orders with pagination (optimized to avoid sort memory issues)
  async getAll(page = 1, limit = 50, userId = null) {
    const offset = (page - 1) * limit;

    // Use a more efficient approach: get orders without ORDER BY first
    // We'll get a larger batch and then sort in memory
    const batchSize = limit * 2; // Get more records to ensure we have enough after filtering

    let sql;
    let params;

    if (userId) {
      // Filter by user_id for customer requests
      sql = `
        SELECT * FROM service_orders
        WHERE user_id = ? AND service_orders_id > 0
        AND moved_to_history_at IS NULL
        AND is_deleted = FALSE
        LIMIT ? OFFSET ?
      `;
      params = [userId, batchSize, offset];
    } else {
      // Admin request - get all active orders (not deleted, not in history)
      sql = `
        SELECT * FROM service_orders
        WHERE service_orders_id > 0
        AND moved_to_history_at IS NULL
        AND is_deleted = FALSE
        LIMIT ? OFFSET ?
      `;
      params = [batchSize, offset];
    }

    return new Promise((resolve, reject) => {
      this.db.query(sql, params, (err, results) => {
        if (err) {
          reject(err);
          return;
        }

        if (results.length === 0) {
          resolve([]);
          return;
        }

        // Sort the results in memory by created_at (JavaScript sort)
        results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        // Take only the number we need
        const paginatedResults = results.slice(0, limit);

        resolve(paginatedResults);
      });
    });
  }

  // Get total count of service orders for pagination
  async getTotalCount() {
    const sql = 'SELECT COUNT(*) as total FROM service_orders';
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

  // Get total count of service orders for a specific user
  async getTotalCountByUser(userId) {
    const sql = 'SELECT COUNT(*) as total FROM service_orders WHERE user_id = ?';
    return new Promise((resolve, reject) => {
      this.db.query(sql, [userId], (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results[0].total);
        }
      });
    });
  }

  // Get service order by ID
  async getById(orderId, userId = null) {
    let sql;
    let params;

    if (userId) {
      // Filter by user_id for customer requests
      sql = 'SELECT * FROM service_orders WHERE service_orders_id = ? AND user_id = ?';
      params = [orderId, userId];
    } else {
      // Admin request - get any order
      sql = 'SELECT * FROM service_orders WHERE service_orders_id = ?';
      params = [orderId];
    }

    return new Promise((resolve, reject) => {
      this.db.query(sql, params, (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results[0] || null);
        }
      });
    });
  }

  // Get service orders by status
  async getByStatus(status) {
    const sql = `
      SELECT * FROM service_orders
      WHERE status = ?
      AND moved_to_history_at IS NULL
      AND is_deleted = FALSE
      ORDER BY created_at DESC
    `;
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

  // Create new service order
  async create(orderData) {
    const sql = `
      INSERT INTO service_orders (
        user_id, name, contact, email, address, service_type, dry_cleaning_services,
        pickup_date, pickup_time, load_count, instructions,
        kilos, laundry_photos, status, rejection_reason, payment_method, service_option, delivery_fee,
        total_price, payment_status, payment_proof, reference_id, payment_review_status,
        timer_start, timer_end, auto_advance_enabled, current_timer_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // Calculate total price from services
    let calculatedTotalPrice = 0;

    // Main service price
    if (orderData.service_type === 'washDryFold') {
      calculatedTotalPrice += 179 * (orderData.load_count || 1);
    } else if (orderData.service_type === 'fullService') {
      calculatedTotalPrice += 199 * (orderData.load_count || 1);
    }

    // Dry cleaning price
    if (orderData.dry_cleaning_services && Array.isArray(orderData.dry_cleaning_services)) {
      calculatedTotalPrice += orderData.dry_cleaning_services.reduce((sum, service) => sum + (service.price || 0), 0);
    }

    // Delivery fee
    calculatedTotalPrice += orderData.delivery_fee || 0;

    // Validate and cap totalPrice to prevent database range errors
    // DECIMAL(10,2) max is 99999999.99
    const maxTotalPrice = 99999999.99;
    const validatedTotalPrice = Math.min(Math.max(calculatedTotalPrice, 0), maxTotalPrice);

    const values = [
      orderData.user_id || null,
      orderData.name,
      orderData.contact,
      orderData.email || '',
      orderData.address,
      orderData.service_type || orderData.serviceType,
      JSON.stringify(orderData.dry_cleaning_services || orderData.dryCleaningServices || []),
      orderData.pickup_date || orderData.pickupDate,
      orderData.pickup_time || orderData.pickupTime,
      orderData.load_count || orderData.loadCount || 1,
      orderData.instructions || '',
      orderData.kilos || null,
      JSON.stringify(orderData.laundry_photos || orderData.laundryPhoto || []),
      orderData.status || 'pending',
      orderData.rejection_reason || orderData.rejectionReason || null,
      orderData.payment_method || orderData.paymentMethod || 'cash',
      orderData.service_option || 'pickupAndDelivery',
      orderData.delivery_fee || 0,
      validatedTotalPrice,
      orderData.payment_status || orderData.paymentStatus || 'unpaid',
      orderData.payment_proof || null,
      orderData.reference_id || orderData.referenceNumber || null,
      orderData.payment_review_status || 'pending',
      orderData.timer_start || null,
      orderData.timer_end || null,
      orderData.auto_advance_enabled || false,
      orderData.current_timer_status || null
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

  // Update service order
  async update(orderId, updates) {
    if (Object.keys(updates).length === 0) {
      throw new Error('No fields to update');
    }

    // Map 'photos' to 'laundry_photos' for consistency
    if (updates.photos !== undefined) {
      updates.laundry_photos = updates.photos;
      delete updates.photos;
    }

    // Handle JSON fields
    const jsonFields = ['dry_cleaning_services', 'laundry_photos'];
    jsonFields.forEach(field => {
      if (updates[field] !== undefined) {
        updates[field] = JSON.stringify(updates[field] || []);
      }
    });

    const fields = Object.keys(updates);
    const values = Object.values(updates);

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const sql = `UPDATE service_orders SET ${setClause} WHERE service_orders_id = ?`;

    return new Promise((resolve, reject) => {
      this.db.query(sql, [...values, orderId], (err, result) => {
        if (err) {
          reject(err);
        } else if (result.affectedRows === 0) {
          reject(new Error('Service order not found'));
        } else {
          resolve(result.affectedRows);
        }
      });
    });
  }

  // Delete service order
  async delete(orderId) {
    const sql = 'DELETE FROM service_orders WHERE service_orders_id = ?';
    return new Promise((resolve, reject) => {
      this.db.query(sql, [orderId], (err, result) => {
        if (err) {
          reject(err);
        } else if (result.affectedRows === 0) {
          reject(new Error('Service order not found'));
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

  // Timer Management Methods

  // Start timer for a service order
  async startTimer(orderId, status) {
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + (60 * 60 * 1000)); // 1 hour from now

    const sql = `
      UPDATE service_orders
      SET timer_start = ?, timer_end = ?, current_timer_status = ?
      WHERE service_orders_id = ?
    `;

    return new Promise((resolve, reject) => {
      this.db.query(sql, [startTime, endTime, status, orderId], (err, result) => {
        if (err) {
          reject(err);
        } else if (result.affectedRows === 0) {
          reject(new Error('Service order not found'));
        } else {
          resolve({ startTime, endTime, status });
        }
      });
    });
  }

  // Stop timer for a service order
  async stopTimer(orderId) {
    const sql = `
      UPDATE service_orders
      SET timer_start = NULL, timer_end = NULL, current_timer_status = NULL
      WHERE service_orders_id = ?
    `;

    return new Promise((resolve, reject) => {
      this.db.query(sql, [orderId], (err, result) => {
        if (err) {
          reject(err);
        } else if (result.affectedRows === 0) {
          reject(new Error('Service order not found'));
        } else {
          resolve(result.affectedRows);
        }
      });
    });
  }

  // Get timer status for a service order
  async getTimerStatus(orderId) {
    const sql = 'SELECT timer_start, timer_end, current_timer_status, auto_advance_enabled FROM service_orders WHERE service_orders_id = ?';
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

  // Toggle auto-advance for a service order
  async toggleAutoAdvance(orderId, enabled) {
    const sql = 'UPDATE service_orders SET auto_advance_enabled = ? WHERE service_orders_id = ?';

    return new Promise((resolve, reject) => {
      this.db.query(sql, [enabled, orderId], (err, result) => {
        if (err) {
          reject(err);
        } else if (result.affectedRows === 0) {
          reject(new Error('Service order not found'));
        } else {
          resolve(result.affectedRows);
        }
      });
    });
  }

  // Get next status in the workflow
  getNextStatus(currentStatus) {
    const statusFlow = {
      'pending': 'approved',
      'approved': 'washing',
      'washing': 'drying',
      'drying': 'folding',
      'folding': 'ready',
      'ready': 'completed',
      'completed': 'completed'
    };
    return statusFlow[currentStatus] || currentStatus;
  }

  // Advance service order to next status
  async advanceToNextStatus(orderId, userId = null) {
    const order = await this.getById(orderId, userId);
    if (!order) {
      throw new Error('Service order not found');
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

  // Get all service orders with active timers
  async getOrdersWithActiveTimers() {
    const sql = `
      SELECT * FROM service_orders
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

  // Get service orders with expired timers
  async getOrdersWithExpiredTimers() {
    const sql = `
      SELECT * FROM service_orders
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

  // History Management Methods

  // Move service order to history when completed
  async moveToHistory(orderId) {
    const sql = `
      UPDATE service_orders
      SET moved_to_history_at = NOW(), status = 'completed'
      WHERE service_orders_id = ? AND status = 'completed' AND moved_to_history_at IS NULL
    `;

    return new Promise((resolve, reject) => {
      this.db.query(sql, [orderId], (err, result) => {
        if (err) {
          reject(err);
        } else if (result.affectedRows === 0) {
          reject(new Error('Service order not found or not eligible for history'));
        } else {
          resolve(result.affectedRows);
        }
      });
    });
  }

  // Get all history items (completed service orders and deleted items)
  async getHistory() {
    const sql = `
      SELECT
        service_orders_id as id,
        'service_order' as type,
        service_type,
        pickup_date,
        pickup_time,
        load_count,
        status,
        payment_method,
        payment_status,
        name,
        contact,
        email,
        address,
        total_price,
        instructions,
        laundry_photos,
        moved_to_history_at,
        is_deleted,
        deleted_at,
        created_at,
        updated_at
      FROM service_orders
      WHERE status = 'completed' OR is_deleted = TRUE
    `;

    return new Promise((resolve, reject) => {
      this.db.query(sql, (err, results) => {
        if (err) {
          reject(err);
          return;
        }

        // Sort in memory to avoid server sort memory issues
        results.sort((a, b) => {
          const aTime = a.moved_to_history_at || a.deleted_at || a.updated_at;
          const bTime = b.moved_to_history_at || b.deleted_at || b.updated_at;
          return new Date(bTime) - new Date(aTime);
        });

        resolve(results);
      });
    });
  }

  // Get history items by type
  async getHistoryByType(type) {
    let sql;
    if (type === 'completed') {
      sql = `
        SELECT
          service_orders_id as id,
          'service_order' as type,
          service_type,
          pickup_date,
          pickup_time,
          load_count,
          status,
          payment_method,
          payment_status,
          name,
          contact,
          email,
          address,
          total_price,
          instructions,
          laundry_photos,
          moved_to_history_at,
          is_deleted,
          deleted_at,
          created_at,
          updated_at
        FROM service_orders
        WHERE moved_to_history_at IS NOT NULL AND is_deleted = FALSE
        ORDER BY moved_to_history_at DESC
      `;
    } else if (type === 'deleted') {
      sql = `
        SELECT
          service_orders_id as id,
          'service_order' as type,
          service_type,
          pickup_date,
          pickup_time,
          load_count,
          status,
          payment_method,
          payment_status,
          name,
          contact,
          email,
          address,
          total_price,
          instructions,
          laundry_photos,
          moved_to_history_at,
          is_deleted,
          deleted_at,
          created_at,
          updated_at
        FROM service_orders
        WHERE is_deleted = TRUE
        ORDER BY deleted_at DESC
      `;
    }

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

  // Restore service order from history
  async restoreFromHistory(orderId) {
    const sql = `
      UPDATE service_orders
      SET moved_to_history_at = NULL, is_deleted = FALSE, deleted_at = NULL
      WHERE service_orders_id = ? AND (moved_to_history_at IS NOT NULL OR is_deleted = TRUE)
    `;

    return new Promise((resolve, reject) => {
      this.db.query(sql, [orderId], (err, result) => {
        if (err) {
          reject(err);
        } else if (result.affectedRows === 0) {
          reject(new Error('Service order not found in history'));
        } else {
          resolve(result.affectedRows);
        }
      });
    });
  }

  // Permanently delete from history
  async deleteFromHistory(orderId) {
    const sql = 'DELETE FROM service_orders WHERE service_orders_id = ? AND (moved_to_history_at IS NOT NULL OR is_deleted = TRUE)';

    return new Promise((resolve, reject) => {
      this.db.query(sql, [orderId], (err, result) => {
        if (err) {
          reject(err);
        } else if (result.affectedRows === 0) {
          reject(new Error('Service order not found in history'));
        } else {
          resolve(result.affectedRows);
        }
      });
    });
  }

  // Soft delete service order (mark as deleted)
  async softDelete(orderId) {
    const sql = `
      UPDATE service_orders
      SET is_deleted = TRUE, deleted_at = NOW()
      WHERE service_orders_id = ? AND is_deleted = FALSE
    `;

    return new Promise((resolve, reject) => {
      this.db.query(sql, [orderId], (err, result) => {
        if (err) {
          reject(err);
        } else if (result.affectedRows === 0) {
          reject(new Error('Service order not found or already deleted'));
        } else {
          resolve(result.affectedRows);
        }
      });
    });
  }

  // Update payment status
  async updatePaymentStatus(orderId, paymentStatus) {
    const sql = 'UPDATE service_orders SET payment_status = ? WHERE service_orders_id = ?';

    return new Promise((resolve, reject) => {
      this.db.query(sql, [paymentStatus, orderId], (err, result) => {
        if (err) {
          reject(err);
        } else if (result.affectedRows === 0) {
          reject(new Error('Service order not found'));
        } else {
          resolve(result.affectedRows);
        }
      });
    });
  }

  // Submit GCash payment proof
  async submitPaymentProof(orderId, paymentProof, referenceNumber) {
    const sql = 'UPDATE service_orders SET payment_proof = ?, reference_id = ?, payment_review_status = ? WHERE service_orders_id = ? AND payment_method = ?';

    return new Promise((resolve, reject) => {
      this.db.query(sql, [paymentProof, referenceNumber, 'pending', orderId, 'gcash'], (err, result) => {
        if (err) {
          reject(err);
        } else if (result.affectedRows === 0) {
          reject(new Error('Service order not found or not a GCash payment'));
        } else {
          resolve(result.affectedRows);
        }
      });
    });
  }

  // Update GCash payment status (admin approval/rejection)
  async updateGcashPaymentStatus(orderId, status) {
    const validStatuses = ['pending', 'approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid payment status');
    }

    const sql = 'UPDATE service_orders SET payment_review_status = ? WHERE service_orders_id = ? AND payment_method = ?';

    return new Promise((resolve, reject) => {
      this.db.query(sql, [status, orderId, 'gcash'], (err, result) => {
        if (err) {
          reject(err);
        } else if (result.affectedRows === 0) {
          reject(new Error('Service order not found or not a GCash payment'));
        } else {
          resolve(result.affectedRows);
        }
      });
    });
  }

  // Get service orders by GCash payment status
  async getOrdersByGcashPaymentStatus(status) {
    const validStatuses = ['pending', 'approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid payment status');
    }

    const sql = `
      SELECT * FROM service_orders
      WHERE payment_method = 'gcash' AND payment_review_status = ?
      AND moved_to_history_at IS NULL
      AND is_deleted = FALSE
      ORDER BY created_at DESC
    `;

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

  // Get active service orders (not in history and not deleted)
  async getActiveOrders(page = 1, limit = 50) {
    const offset = (page - 1) * limit;

    const batchSize = limit * 2;

    const sql = `
      SELECT * FROM service_orders
      WHERE service_orders_id > 0
      AND moved_to_history_at IS NULL
      AND is_deleted = FALSE
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

        // Sort the results in memory by created_at (JavaScript sort)
        results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        // Take only the number we need
        const paginatedResults = results.slice(0, limit);

        resolve(paginatedResults);
      });
    });
  }

  // Get service order counts for specific dates (active orders only)
  getOrderCountsForDates(dates) {
    return new Promise((resolve, reject) => {
      if (!dates || dates.length === 0) {
        resolve({});
        return;
      }

      // Create placeholders for IN clause
      const placeholders = dates.map(() => '?').join(',');
      const sql = `
        SELECT pickup_date, COUNT(*) as count
        FROM service_orders
        WHERE pickup_date IN (${placeholders})
        AND status NOT IN ('rejected', 'cancelled', 'completed')
        AND moved_to_history_at IS NULL
        AND is_deleted = FALSE
        GROUP BY pickup_date
      `;

      this.db.query(sql, dates, (err, results) => {
        if (err) reject(err);
        else {
          // Convert to object {date: count}
          const counts = {};
          results.forEach(row => {
            counts[row.pickup_date] = row.count;
          });
          // Ensure all dates have a count (0 if none)
          dates.forEach(date => {
            if (!(date in counts)) {
              counts[date] = 0;
            }
          });
          resolve(counts);
        }
      });
    });
  }
}
