export class Timer {
  constructor(db) {
    this.db = db;
  }

  // Start timer for an order
  async startTimer(orderId, status) {
    const now = new Date();
    const timerData = {
      timer_start: now,
      current_timer_status: status,
      auto_advance_enabled: true
    };

    const sql = 'UPDATE service_orders SET timer_start = ?, current_timer_status = ?, auto_advance_enabled = ? WHERE service_orders_id = ?';

    return new Promise((resolve, reject) => {
      this.db.query(sql, [timerData.timer_start, timerData.current_timer_status, timerData.auto_advance_enabled, orderId], (err, result) => {
        if (err) {
          reject(err);
        } else if (result.affectedRows === 0) {
          reject(new Error('Service order not found'));
        } else {
          resolve(timerData);
        }
      });
    });
  }

  // Stop timer for an order
  async stopTimer(orderId) {
    const now = new Date();
    const sql = 'UPDATE service_orders SET timer_end = ?, current_timer_status = NULL WHERE service_orders_id = ?';

    return new Promise((resolve, reject) => {
      this.db.query(sql, [now, orderId], (err, result) => {
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

  // Get timer status for an order
  async getTimerStatus(orderId) {
    const sql = `
      SELECT timer_start, timer_end, current_timer_status, auto_advance_enabled
      FROM service_orders
      WHERE service_orders_id = ?
    `;

    return new Promise((resolve, reject) => {
      this.db.query(sql, [orderId], (err, results) => {
        if (err) {
          reject(err);
        } else if (results.length === 0) {
          reject(new Error('Service order not found'));
        } else {
          const timer = results[0];
          const now = new Date();
          const startTime = timer.timer_start ? new Date(timer.timer_start) : null;
          const endTime = timer.timer_end ? new Date(timer.timer_end) : null;

          let elapsedTime = 0;
          if (startTime && !endTime) {
            elapsedTime = Math.floor((now - startTime) / 1000); // seconds
          } else if (startTime && endTime) {
            elapsedTime = Math.floor((endTime - startTime) / 1000); // seconds
          }

          resolve({
            timer_start: timer.timer_start,
            timer_end: timer.timer_end,
            current_timer_status: timer.current_timer_status,
            auto_advance_enabled: timer.auto_advance_enabled,
            elapsed_time: elapsedTime,
            is_running: startTime && !endTime
          });
        }
      });
    });
  }

  // Toggle auto-advance for an order
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

  // Advance order to next status
  async advanceToNextStatus(orderId) {
    // Get current order
    const order = await this.getOrderById(orderId);
    if (!order) {
      throw new Error('Service order not found');
    }

    // Define status progression
    const statusSequence = ['pending', 'approved', 'washing', 'drying', 'folding', 'ready', 'completed'];
    const currentIndex = statusSequence.indexOf(order.status);

    if (currentIndex === -1 || currentIndex >= statusSequence.length - 1) {
      throw new Error('Cannot advance order status further');
    }

    const nextStatus = statusSequence[currentIndex + 1];

    // Update status
    const sql = 'UPDATE service_orders SET status = ?, process_stage = ? WHERE service_orders_id = ?';

    return new Promise((resolve, reject) => {
      this.db.query(sql, [nextStatus, nextStatus, orderId], (err, result) => {
        if (err) {
          reject(err);
        } else if (result.affectedRows === 0) {
          reject(new Error('Service order not found'));
        } else {
          resolve(nextStatus);
        }
      });
    });
  }

  // Get all orders with active timers
  async getOrdersWithActiveTimers() {
    const sql = `
      SELECT so.*, cp.firstName, cp.lastName, cp.name, cp.contact, cp.email, cp.address,
             u.email as user_email, u.role
      FROM service_orders so
      LEFT JOIN customers_profiles cp ON so.customer_id = cp.customer_id
      LEFT JOIN users u ON cp.user_id = u.user_id
      WHERE so.timer_start IS NOT NULL
      AND so.timer_end IS NULL
      AND so.moved_to_history_at IS NULL
      AND so.is_deleted = FALSE
      ORDER BY so.timer_start ASC
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

  // Get all orders with expired timers
  async getOrdersWithExpiredTimers() {
    const sql = `
      SELECT so.*, cp.firstName, cp.lastName, cp.name, cp.contact, cp.email, cp.address,
             u.email as user_email, u.role
      FROM service_orders so
      LEFT JOIN customers_profiles cp ON so.customer_id = cp.customer_id
      LEFT JOIN users u ON cp.user_id = u.user_id
      WHERE so.timer_start IS NOT NULL
      AND so.timer_end IS NULL
      AND so.auto_advance_enabled = TRUE
      AND TIMESTAMPDIFF(MINUTE, so.timer_start, NOW()) >= 30
      AND so.moved_to_history_at IS NULL
      AND so.is_deleted = FALSE
      ORDER BY so.timer_start ASC
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

  // Auto-advance status (called by client when timer expires OR by server cron)
  async autoAdvanceOrder(orderId) {
    // Get current order
    const order = await this.getOrderById(orderId);
    if (!order) {
      throw new Error('Service order not found');
    }

    // Determine next stage based on processStage or status
    const current = order.process_stage || order.status || 'pending';
    const seq = ['pending', 'washing', 'drying', 'folding', 'ready'];
    const idx = seq.indexOf(current);
    const next = (idx >= 0 && idx < seq.length - 1) ? seq[idx + 1] : seq[seq.length - 1];

    // Update both processStage and status to keep things consistent
    const sql = 'UPDATE service_orders SET process_stage = ?, status = ? WHERE service_orders_id = ?';

    return new Promise((resolve, reject) => {
      this.db.query(sql, [next, next, orderId], (err, result) => {
        if (err) {
          reject(err);
        } else if (result.affectedRows === 0) {
          reject(new Error('Service order not found'));
        } else {
          resolve(next);
        }
      });
    });
  }

  // Helper method to get order by ID
  async getOrderById(orderId) {
    const sql = `
      SELECT so.*, cp.firstName, cp.lastName, cp.name, cp.contact, cp.email, cp.address,
             u.email as user_email, u.role
      FROM service_orders so
      LEFT JOIN customers_profiles cp ON so.customer_id = cp.customer_id
      LEFT JOIN users u ON cp.user_id = u.user_id
      WHERE so.service_orders_id = ?
    `;

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
}
