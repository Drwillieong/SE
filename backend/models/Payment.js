export class Payment {
  constructor(db) {
    this.db = db;
  }

  // Create a new payment record
  async create(paymentData) {
    const { service_orders_id, payment_method, total_price, payment_status = 'unpaid', payment_proof = null, reference_id = null, payment_review_status = 'pending' } = paymentData;

    const sql = `
      INSERT INTO payments (service_orders_id, payment_method, total_price, payment_status, payment_proof, reference_id, payment_review_status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    return new Promise((resolve, reject) => {
      this.db.query(sql, [service_orders_id, payment_method, total_price, payment_status, payment_proof, reference_id, payment_review_status], (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result.insertId);
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
        } else if (result.affectedRows === 0) {
          reject(new Error('Payment record not found'));
        } else {
          resolve(result.affectedRows);
        }
      });
    });
  }

  // Submit GCash payment proof
  async submitPaymentProof(orderId, paymentProof, referenceNumber) {
    const sql = 'UPDATE payments SET payment_proof = ?, reference_id = ?, payment_review_status = ? WHERE service_orders_id = ? AND payment_method = ?';

    return new Promise((resolve, reject) => {
      this.db.query(sql, [paymentProof, referenceNumber, 'pending', orderId, 'gcash'], (err, result) => {
        if (err) {
          reject(err);
        } else if (result.affectedRows === 0) {
          reject(new Error('Payment record not found or not a GCash payment'));
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

    const sql = 'UPDATE payments SET payment_review_status = ? WHERE service_orders_id = ? AND payment_method = ?';

    return new Promise((resolve, reject) => {
      this.db.query(sql, [status, orderId, 'gcash'], (err, result) => {
        if (err) {
          reject(err);
        } else if (result.affectedRows === 0) {
          reject(new Error('Payment record not found or not a GCash payment'));
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
      SELECT so.*, cp.firstName, cp.lastName, cp.name, cp.contact, cp.email, cp.address,
             u.email as user_email, u.role,
             p.payment_method, p.payment_status, p.payment_proof, p.reference_id, p.payment_review_status
      FROM service_orders so
      LEFT JOIN customers_profiles cp ON so.customer_id = cp.customer_id
      LEFT JOIN users u ON cp.user_id = u.user_id
      LEFT JOIN payments p ON so.service_orders_id = p.service_orders_id
      WHERE p.payment_method = 'gcash' AND p.payment_review_status = ?
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
}
