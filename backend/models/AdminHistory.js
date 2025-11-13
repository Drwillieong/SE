export class AdminHistory {
  constructor(db) {
    this.db = db;
  }

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
        so.service_orders_id as id,
        'service_order' as type,
        so.service_type,
        so.pickup_date,
        so.pickup_time,
        so.load_count,
        so.status,
        p.payment_method,
        p.payment_status,
        cp.name,
        cp.contact,
        cp.email,
        cp.address,
        so.total_price,
        so.instructions,
        so.laundry_photos,
        so.moved_to_history_at,
        so.is_deleted,
        so.deleted_at,
        so.created_at,
        so.updated_at
      FROM service_orders so
      LEFT JOIN customers_profiles cp ON so.customer_id = cp.customer_id
      LEFT JOIN payments p ON so.service_orders_id = p.service_orders_id
      WHERE so.status = 'completed' OR so.is_deleted = TRUE
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
          so.service_orders_id as id,
          'service_order' as type,
          so.service_type,
          so.pickup_date,
          so.pickup_time,
          so.load_count,
          so.status,
          p.payment_method,
          p.payment_status,
          cp.name,
          cp.contact,
          cp.email,
          cp.address,
          so.total_price,
          so.instructions,
          so.laundry_photos,
          so.moved_to_history_at,
          so.is_deleted,
          so.deleted_at,
          so.created_at,
          so.updated_at
        FROM service_orders so
        LEFT JOIN customers_profiles cp ON so.customer_id = cp.customer_id
        LEFT JOIN payments p ON so.service_orders_id = p.service_orders_id
        WHERE so.moved_to_history_at IS NOT NULL AND so.is_deleted = FALSE
        ORDER BY so.moved_to_history_at DESC
      `;
    } else if (type === 'deleted') {
      sql = `
        SELECT
          so.service_orders_id as id,
          'service_order' as type,
          so.service_type,
          so.pickup_date,
          so.pickup_time,
          so.load_count,
          so.status,
          p.payment_method,
          p.payment_status,
          cp.name,
          cp.contact,
          cp.email,
          cp.address,
          so.total_price,
          so.instructions,
          so.laundry_photos,
          so.moved_to_history_at,
          so.is_deleted,
          so.deleted_at,
          so.created_at,
          so.updated_at
        FROM service_orders so
        LEFT JOIN customers_profiles cp ON so.customer_id = cp.customer_id
        LEFT JOIN payments p ON so.service_orders_id = p.service_orders_id
        WHERE so.is_deleted = TRUE
        ORDER BY so.deleted_at DESC
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
}
