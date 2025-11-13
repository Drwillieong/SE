export class AdminBooking {
  constructor(db) {
    this.db = db;
  }

  // Get service orders by status
  async getByStatus(status) {
    const sql = `
      SELECT so.*, cp.firstName, cp.lastName, cp.name, cp.contact, cp.email, cp.address,
             u.email as user_email, u.role,
             p.payment_method, p.payment_status, p.payment_proof, p.reference_id, p.payment_review_status
      FROM service_orders so
      LEFT JOIN customers_profiles cp ON so.customer_id = cp.customer_id
      LEFT JOIN users u ON cp.user_id = u.user_id
      LEFT JOIN payments p ON so.service_orders_id = p.service_orders_id
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

  // Approve booking and convert to order for admin
  async approveBooking(orderId) {
    const order = await this.getById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    if (order.status !== 'pending') {
      throw new Error('Only pending orders can be approved');
    }

    // Update status to approved
    const sql = 'UPDATE service_orders SET status = ? WHERE service_orders_id = ?';
    return new Promise((resolve, reject) => {
      this.db.query(sql, ['approved', orderId], (err, result) => {
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

  // Get service order by ID
  async getById(orderId) {
    const sql = `
      SELECT so.*, cp.firstName, cp.lastName, cp.name, cp.contact, cp.email, cp.address,
             u.email as user_email, u.role,
             p.payment_method, p.payment_status, p.payment_proof, p.reference_id, p.payment_review_status
      FROM service_orders so
      LEFT JOIN customers_profiles cp ON so.customer_id = cp.customer_id
      LEFT JOIN users u ON cp.user_id = u.user_id
      LEFT JOIN payments p ON so.service_orders_id = p.service_orders_id
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

  // Get booking counts for specific dates for admin
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

  // Create booking for admin (no limits)
  async createAdminBooking(orderData) {
    const sql = `
      INSERT INTO service_orders (
        customer_id, service_type, dry_cleaning_services,
        pickup_date, pickup_time, load_count, instructions,
        kilos, laundry_photos, status, rejection_reason, service_option, delivery_fee,
        total_price, timer_start, timer_end, auto_advance_enabled, current_timer_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      orderData.customer_id || null,
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
      validatedTotalPrice,
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
}
