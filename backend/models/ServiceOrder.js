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
      // Filter by user_id for customer requests - join with customers_profiles, payments, and order_timers
      sql = `
        SELECT so.*, cp.firstName, cp.lastName, cp.name, cp.contact, cp.email, cp.address,
               u.email as user_email, u.role,
               p.payment_method, p.payment_status, p.payment_proof, p.reference_id, p.payment_review_status,
               ot.timer_start, ot.timer_end, ot.auto_advance_enabled, ot.current_timer_status
        FROM service_orders so
        LEFT JOIN customers_profiles cp ON so.customer_id = cp.customer_id
        LEFT JOIN users u ON cp.user_id = u.user_id
        LEFT JOIN payments p ON so.service_orders_id = p.service_orders_id
        LEFT JOIN order_timers ot ON so.service_orders_id = ot.service_orders_id
        WHERE u.user_id = ? AND so.service_orders_id > 0
        AND so.moved_to_history_at IS NULL
        AND so.is_deleted = FALSE
        LIMIT ? OFFSET ?
      `;
      params = [userId, batchSize, offset];
    } else {
      // Admin request - get all active orders (not deleted, not in history)
      sql = `
        SELECT so.*, cp.firstName, cp.lastName, cp.name, cp.contact, cp.email, cp.address,
               u.email as user_email, u.role,
               p.payment_method, p.payment_status, p.payment_proof, p.reference_id, p.payment_review_status,
               ot.timer_start, ot.timer_end, ot.auto_advance_enabled, ot.current_timer_status
        FROM service_orders so
        LEFT JOIN customers_profiles cp ON so.customer_id = cp.customer_id
        LEFT JOIN users u ON cp.user_id = u.user_id
        LEFT JOIN payments p ON so.service_orders_id = p.service_orders_id
        LEFT JOIN order_timers ot ON so.service_orders_id = ot.service_orders_id
        WHERE so.service_orders_id > 0
        AND so.moved_to_history_at IS NULL
        AND so.is_deleted = FALSE
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
    const sql = `
      SELECT COUNT(*) as total FROM service_orders so
      LEFT JOIN customers_profiles cp ON so.customer_id = cp.customer_id
      WHERE cp.user_id = ?
    `;
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
      // Filter by user_id for customer requests - join with customers_profiles, payments, and order_timers
      sql = `
        SELECT so.*, cp.firstName, cp.lastName, cp.name, cp.contact, cp.email, cp.address,
               u.email as user_email, u.role,
               p.payment_method, p.payment_status, p.payment_proof, p.reference_id, p.payment_review_status,
               ot.timer_start, ot.timer_end, ot.auto_advance_enabled, ot.current_timer_status
        FROM service_orders so
        LEFT JOIN customers_profiles cp ON so.customer_id = cp.customer_id
        LEFT JOIN users u ON cp.user_id = u.user_id
        LEFT JOIN payments p ON so.service_orders_id = p.service_orders_id
        LEFT JOIN order_timers ot ON so.service_orders_id = ot.service_orders_id
        WHERE so.service_orders_id = ? AND u.user_id = ?
      `;
      params = [orderId, userId];
    } else {
      // Admin request - get any order with customer profile data and payment info
      sql = `
        SELECT so.*, cp.firstName, cp.lastName, cp.name, cp.contact, cp.email, cp.address,
               u.email as user_email, u.role,
               p.payment_method, p.payment_status, p.payment_proof, p.reference_id, p.payment_review_status,
               ot.timer_start, ot.timer_end, ot.auto_advance_enabled, ot.current_timer_status
        FROM service_orders so
        LEFT JOIN customers_profiles cp ON so.customer_id = cp.customer_id
        LEFT JOIN users u ON cp.user_id = u.user_id
        LEFT JOIN payments p ON so.service_orders_id = p.service_orders_id
        LEFT JOIN order_timers ot ON so.service_orders_id = ot.service_orders_id
        WHERE so.service_orders_id = ?
      `;
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
      SELECT so.*, cp.firstName, cp.lastName, cp.name, cp.contact, cp.email, cp.address,
             u.email as user_email, u.role,
             p.payment_method, p.payment_status, p.payment_proof, p.reference_id, p.payment_review_status,
             ot.timer_start, ot.timer_end, ot.auto_advance_enabled, ot.current_timer_status
      FROM service_orders so
      LEFT JOIN customers_profiles cp ON so.customer_id = cp.customer_id
      LEFT JOIN users u ON cp.user_id = u.user_id
      LEFT JOIN payments p ON so.service_orders_id = p.service_orders_id
      LEFT JOIN order_timers ot ON so.service_orders_id = ot.service_orders_id
      WHERE so.status = ?
      AND so.moved_to_history_at IS NULL
      AND so.is_deleted = FALSE
      ORDER BY so.created_at DESC
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
        customer_id, service_type, dry_cleaning_services,
        pickup_date, pickup_time, load_count, instructions,
        kilos, laundry_photos, status, rejection_reason, service_option, delivery_fee,
        total_price
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      orderData.customer_id || null, // Changed from user_id
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
      orderData.service_option || 'pickupAndDelivery',
      orderData.delivery_fee || 0,
      validatedTotalPrice
    ];

    return new Promise((resolve, reject) => {
      this.db.query(sql, values, (err, result) => {
        if (err) {
          reject(err);
        } else {
          // Insert timer data into order_timers if provided
          const orderId = result.insertId;
          if (orderData.timer_start || orderData.timer_end || orderData.auto_advance_enabled || orderData.current_timer_status) {
            const timerSql = `
              INSERT INTO order_timers (service_orders_id, timer_start, timer_end, auto_advance_enabled, current_timer_status)
              VALUES (?, ?, ?, ?, ?)
            `;
            const timerValues = [
              orderId,
              orderData.timer_start || null,
              orderData.timer_end || null,
              orderData.auto_advance_enabled || false,
              orderData.current_timer_status || null
            ];
            this.db.query(timerSql, timerValues, (timerErr) => {
              if (timerErr) {
                console.error('Error inserting timer data:', timerErr);
                // Note: Order is created, but timer insertion failed - could handle rollback if needed
              }
            });
          }
          resolve(orderId);
        }
      });
    });
  }

  // Update service order
  async update(orderId, updates) {
    if (Object.keys(updates).length === 0) {
      throw new Error('No fields to update');
    }

    // Separate timer fields from order updates
    const timerFields = ['timer_start', 'timer_end', 'auto_advance_enabled', 'current_timer_status'];
    const timerUpdates = {};
    timerFields.forEach(field => {
      if (updates[field] !== undefined) {
        timerUpdates[field] = updates[field];
        delete updates[field];
      }
    });

    // Remove payment-related fields from updates since they're now in payments table
    const paymentFields = ['payment_method', 'payment_status', 'payment_proof', 'reference_id', 'payment_review_status'];
    paymentFields.forEach(field => {
      if (updates[field] !== undefined) {
        delete updates[field];
      }
    });

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

    return new Promise((resolve, reject) => {
      // Update service_orders table if there are non-timer updates
      if (Object.keys(updates).length > 0) {
        const fields = Object.keys(updates);
        const values = Object.values(updates);
        const setClause = fields.map(field => `${field} = ?`).join(', ');
        const sql = `UPDATE service_orders SET ${setClause} WHERE service_orders_id = ?`;

        this.db.query(sql, [...values, orderId], (err, result) => {
          if (err) {
            reject(err);
            return;
          }
          if (result.affectedRows === 0) {
            reject(new Error('Service order not found'));
            return;
          }

          // Handle timer updates
          this.handleTimerUpdate(orderId, timerUpdates, resolve, reject);
        });
      } else {
        // Only timer updates
        this.handleTimerUpdate(orderId, timerUpdates, resolve, reject);
      }
    });
  }

  // Helper method to handle timer updates
  handleTimerUpdate(orderId, timerUpdates, resolve, reject) {
    if (Object.keys(timerUpdates).length === 0) {
      resolve(1); // No timer updates, resolve successfully
      return;
    }

    // Check if timer record exists
    const checkSql = 'SELECT timer_id FROM order_timers WHERE service_orders_id = ?';
    this.db.query(checkSql, [orderId], (checkErr, checkResults) => {
      if (checkErr) {
        reject(checkErr);
        return;
      }

      const timerExists = checkResults.length > 0;

      if (timerExists) {
        // Update existing timer record
        const fields = Object.keys(timerUpdates);
        const values = Object.values(timerUpdates);
        const setClause = fields.map(field => `${field} = ?`).join(', ');
        const updateSql = `UPDATE order_timers SET ${setClause} WHERE service_orders_id = ?`;

        this.db.query(updateSql, [...values, orderId], (updateErr, updateResult) => {
          if (updateErr) {
            reject(updateErr);
          } else {
            resolve(updateResult.affectedRows);
          }
        });
      } else {
        // Insert new timer record
        const insertSql = `
          INSERT INTO order_timers (service_orders_id, timer_start, timer_end, auto_advance_enabled, current_timer_status)
          VALUES (?, ?, ?, ?, ?)
        `;
        const insertValues = [
          orderId,
          timerUpdates.timer_start || null,
          timerUpdates.timer_end || null,
          timerUpdates.auto_advance_enabled || false,
          timerUpdates.current_timer_status || null
        ];

        this.db.query(insertSql, insertValues, (insertErr, insertResult) => {
          if (insertErr) {
            reject(insertErr);
          } else {
            resolve(insertResult.affectedRows);
          }
        });
      }
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

  // Get orders with active timers
  async getOrdersWithActiveTimers() {
    const sql = `
      SELECT so.*, cp.firstName, cp.lastName, cp.name, cp.contact, cp.email, cp.address,
             u.email as user_email, u.role,
             p.payment_method, p.payment_status, p.payment_proof, p.reference_id, p.payment_review_status,
             ot.timer_start, ot.timer_end, ot.auto_advance_enabled, ot.current_timer_status
      FROM service_orders so
      LEFT JOIN customers_profiles cp ON so.customer_id = cp.customer_id
      LEFT JOIN users u ON cp.user_id = u.user_id
      LEFT JOIN payments p ON so.service_orders_id = p.service_orders_id
      LEFT JOIN order_timers ot ON so.service_orders_id = ot.service_orders_id
      WHERE ot.timer_start IS NOT NULL
      AND (ot.timer_end > NOW() OR (ot.timer_end IS NULL AND ot.timer_start > DATE_SUB(NOW(), INTERVAL 2 HOUR)))
      AND so.moved_to_history_at IS NULL
      AND so.is_deleted = FALSE
      ORDER BY ot.timer_start DESC
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
      SELECT so.*, cp.firstName, cp.lastName, cp.name, cp.contact, cp.email, cp.address,
             u.email as user_email, u.role,
             p.payment_method, p.payment_status, p.payment_proof, p.reference_id, p.payment_review_status,
             ot.timer_start, ot.timer_end, ot.auto_advance_enabled, ot.current_timer_status
      FROM service_orders so
      LEFT JOIN customers_profiles cp ON so.customer_id = cp.customer_id
      LEFT JOIN users u ON cp.user_id = u.user_id
      LEFT JOIN payments p ON so.service_orders_id = p.service_orders_id
      LEFT JOIN order_timers ot ON so.service_orders_id = ot.service_orders_id
      WHERE ot.timer_start IS NOT NULL AND ot.timer_end IS NULL
      AND ot.timer_start < DATE_SUB(NOW(), INTERVAL 1 HOUR)
      AND so.moved_to_history_at IS NULL
      AND so.is_deleted = FALSE
      ORDER BY ot.timer_start ASC
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

  // Advance order to next status
  async advanceToNextStatus(orderId) {
    return new Promise((resolve, reject) => {
      // First get current status
      const getStatusSql = 'SELECT status FROM service_orders WHERE service_orders_id = ?';
      this.db.query(getStatusSql, [orderId], (err, results) => {
        if (err) {
          reject(err);
          return;
        }
        if (results.length === 0) {
          reject(new Error('Service order not found'));
          return;
        }

        const currentStatus = results[0].status;
        let nextStatus;

        // Define status progression
        const statusFlow = {
          'pending': 'washing',
          'pending_booking': 'approved',
          'approved': 'washing',
          'washing': 'drying',
          'drying': 'folding',
          'folding': 'ready',
          'ready': 'completed'
        };

        nextStatus = statusFlow[currentStatus];

        if (!nextStatus) {
          reject(new Error(`Cannot advance from status: ${currentStatus}`));
          return;
        }

        // Update to next status
        const updateSql = 'UPDATE service_orders SET status = ? WHERE service_orders_id = ?';
        this.db.query(updateSql, [nextStatus, orderId], (updateErr, updateResult) => {
          if (updateErr) {
            reject(updateErr);
          } else if (updateResult.affectedRows === 0) {
            reject(new Error('Service order not found'));
          } else {
            resolve(nextStatus);
          }
        });
      });
    });
  }

  // Start timer for an order
  async startTimer(orderId, status) {
    return new Promise((resolve, reject) => {
      const now = new Date();

      // Define durations for each status (in milliseconds)
      const statusDurations = {
        washing: 30 * 60 * 1000, // 30 minutes
        drying: 45 * 60 * 1000,  // 45 minutes
        folding: 15 * 60 * 1000  // 15 minutes
      };

      const duration = statusDurations[status] || 30 * 60 * 1000; // default 30 minutes
      const timer_end = new Date(now.getTime() + duration);

      const timerData = {
        timer_start: now,
        timer_end: timer_end,
        current_timer_status: status,
        auto_advance_enabled: 1
      };

      // Check if timer record exists
      const checkSql = 'SELECT timer_id FROM order_timers WHERE service_orders_id = ?';
      this.db.query(checkSql, [orderId], (checkErr, checkResults) => {
        if (checkErr) {
          reject(checkErr);
          return;
        }

        const timerExists = checkResults.length > 0;

        if (timerExists) {
          // Update existing timer record
          const updateSql = 'UPDATE order_timers SET timer_start = ?, timer_end = ?, current_timer_status = ?, auto_advance_enabled = ? WHERE service_orders_id = ?';
          this.db.query(updateSql, [timerData.timer_start, timerData.timer_end, timerData.current_timer_status, timerData.auto_advance_enabled, orderId], (updateErr, updateResult) => {
            if (updateErr) {
              reject(updateErr);
            } else {
              resolve(timerData);
            }
          });
        } else {
          // Insert new timer record
          const insertSql = 'INSERT INTO order_timers (service_orders_id, timer_start, timer_end, current_timer_status, auto_advance_enabled) VALUES (?, ?, ?, ?, ?)';
          this.db.query(insertSql, [orderId, timerData.timer_start, timerData.timer_end, timerData.current_timer_status, timerData.auto_advance_enabled], (insertErr, insertResult) => {
            if (insertErr) {
              reject(insertErr);
            } else {
              resolve(timerData);
            }
          });
        }
      });
    });
  }

  // Stop timer for an order
  async stopTimer(orderId) {
    return new Promise((resolve, reject) => {
      const now = new Date();
      const updateSql = 'UPDATE order_timers SET timer_end = ? WHERE service_orders_id = ? AND timer_end IS NULL';
      this.db.query(updateSql, [now, orderId], (err, result) => {
        if (err) {
          reject(err);
        } else if (result.affectedRows === 0) {
          reject(new Error('No active timer found for this order'));
        } else {
          resolve(result.affectedRows);
        }
      });
    });
  }

  // Get timer status for an order
  async getTimerStatus(orderId) {
    const sql = 'SELECT * FROM order_timers WHERE service_orders_id = ?';
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

  // Toggle auto-advance for an order
  async toggleAutoAdvance(orderId, enabled) {
    return new Promise((resolve, reject) => {
      const updateSql = 'UPDATE order_timers SET auto_advance_enabled = ? WHERE service_orders_id = ?';
      this.db.query(updateSql, [enabled ? 1 : 0, orderId], (err, result) => {
        if (err) {
          reject(err);
        } else if (result.affectedRows === 0) {
          reject(new Error('Timer record not found for this order'));
        } else {
          resolve(result.affectedRows);
        }
      });
    });
  }

  // Update payment status
  async updatePaymentStatus(orderId, paymentStatus) {
    const sql = 'UPDATE payments SET payment_status = ? WHERE service_orders_id = ?';
    return new Promise((resolve, reject) => {
      this.db.query(sql, [paymentStatus, orderId], (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result.affectedRows);
        }
      });
    });
  }

  // Update GCash payment status
  async updateGcashPaymentStatus(orderId, status) {
    const sql = 'UPDATE payments SET payment_review_status = ? WHERE service_orders_id = ? AND payment_method = "gcash"';
    return new Promise((resolve, reject) => {
      this.db.query(sql, [status, orderId], (err, result) => {
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

  // Move order to history
  async moveToHistory(orderId) {
    const now = new Date();
    const sql = 'UPDATE service_orders SET moved_to_history_at = ? WHERE service_orders_id = ?';
    return new Promise((resolve, reject) => {
      this.db.query(sql, [now, orderId], (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result.affectedRows);
        }
      });
    });
  }

  // Get order statistics
  async getOrderStats() {
    const sql = `
      SELECT
        COUNT(*) as total_orders,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_orders,
        SUM(CASE WHEN status = 'washing' THEN 1 ELSE 0 END) as washing_orders,
        SUM(CASE WHEN status = 'drying' THEN 1 ELSE 0 END) as drying_orders,
        SUM(CASE WHEN status = 'folding' THEN 1 ELSE 0 END) as folding_orders,
        SUM(CASE WHEN status = 'ready' THEN 1 ELSE 0 END) as ready_orders,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_orders,
        SUM(total_price) as total_revenue
      FROM service_orders
      WHERE moved_to_history_at IS NULL AND is_deleted = FALSE
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

  // Soft delete order
  async softDelete(orderId) {
    const now = new Date();
    const sql = 'UPDATE service_orders SET is_deleted = TRUE, deleted_at = ? WHERE service_orders_id = ?';
    return new Promise((resolve, reject) => {
      this.db.query(sql, [now, orderId], (err, result) => {
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


}
