export class Booking {
  constructor(db) {
    this.db = db;
  }

  // Get all bookings
  getAll() {
    return new Promise((resolve, reject) => {
      // Select all columns except booking_id, alias booking_id as id to avoid duplicate columns
      const sql = "SELECT booking_id as id, mainService, dryCleaningServices, pickupDate, pickupTime, loadCount, instructions, status, rejectionReason, paymentMethod, name, contact, email, address, photos, totalPrice, serviceOption, deliveryFee, user_id, createdAt, updatedAt FROM bookings ORDER BY createdAt DESC";
      this.db.query(sql, (err, results) => {
        if (err) reject(err);
        else {
          // Parse dryCleaningServices JSON
          results.forEach(booking => {
            if (booking.dryCleaningServices) {
              booking.dryCleaningServices = JSON.parse(booking.dryCleaningServices);
            } else {
              booking.dryCleaningServices = [];
            }
          });
          resolve(results);
        }
      });
    });
  }

  // Get booking by ID
  getById(id) {
    return new Promise((resolve, reject) => {
      const sql = "SELECT booking_id as id, mainService, dryCleaningServices, pickupDate, pickupTime, loadCount, instructions, status, rejectionReason, paymentMethod, name, contact, email, address, photos, totalPrice, serviceOption, deliveryFee, user_id, createdAt, updatedAt FROM bookings WHERE booking_id = ?";
      this.db.query(sql, [id], (err, results) => {
        if (err) reject(err);
        else if (results.length > 0) {
          const booking = results[0];
          if (booking.dryCleaningServices) {
            booking.dryCleaningServices = JSON.parse(booking.dryCleaningServices);
          } else {
            booking.dryCleaningServices = [];
          }
          resolve(booking);
        } else {
          resolve(null);
        }
      });
    });
  }

  // Create new booking
  create(bookingData) {
    return new Promise((resolve, reject) => {
      const {
        mainService,
        dryCleaningServices,
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
        serviceOption,
        deliveryFee,
        user_id
      } = bookingData;

      const sql = `INSERT INTO bookings
        (mainService, dryCleaningServices, pickupDate, pickupTime, loadCount, instructions, status, paymentMethod, name, contact, email, address, photos, totalPrice, serviceOption, deliveryFee, user_id, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`;

      const photosJson = photos ? JSON.stringify(photos) : JSON.stringify([]);
      const dryCleaningJson = dryCleaningServices ? JSON.stringify(dryCleaningServices) : JSON.stringify([]);

      const values = [
        mainService,
        dryCleaningJson,
        pickupDate,
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
        serviceOption || 'pickupAndDelivery',
        deliveryFee || 0,
        user_id
      ];

      this.db.query(sql, values, (err, result) => {
        if (err) reject(err);
        else resolve(result.insertId);
      });
    });
  }

  // Update booking
  update(id, updates) {
    return new Promise((resolve, reject) => {
      if (updates.photos) {
        updates.photos = JSON.stringify(updates.photos);
      }
      if (updates.dryCleaningServices) {
        updates.dryCleaningServices = JSON.stringify(updates.dryCleaningServices);
      }

      const fields = Object.keys(updates);
      if (fields.length === 0) {
        reject(new Error('No fields to update'));
        return;
      }

      const setClause = fields.map(field => `${field} = ?`).join(', ');
      const values = fields.map(field => updates[field]);
      values.push(id);

      const sql = `UPDATE bookings SET ${setClause} WHERE booking_id = ?`;

      this.db.query(sql, values, (err, result) => {
        if (err) reject(err);
        else if (result.affectedRows === 0) reject(new Error('Booking not found'));
        else resolve(result);
      });
    });
  }

  // Delete booking
  delete(id) {
    return new Promise((resolve, reject) => {
      const sql = "DELETE FROM bookings WHERE booking_id = ?";
      this.db.query(sql, [id], (err, result) => {
        if (err) reject(err);
        else if (result.affectedRows === 0) reject(new Error('Booking not found'));
        else resolve(result);
      });
    });
  }

  // Get bookings by status
  getByStatus(status) {
    return new Promise((resolve, reject) => {
      const sql = "SELECT * FROM bookings WHERE status = ? ORDER BY createdAt DESC";
      this.db.query(sql, [status], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }

  // Get bookings by user ID
  getByUserId(user_id) {
    return new Promise((resolve, reject) => {
      const sql = "SELECT booking_id as id, mainService, dryCleaningServices, pickupDate, pickupTime, loadCount, instructions, status, rejectionReason, paymentMethod, name, contact, email, address, photos, totalPrice, serviceOption, deliveryFee, user_id, createdAt, updatedAt FROM bookings WHERE user_id = ? ORDER BY createdAt DESC";
      this.db.query(sql, [user_id], (err, results) => {
        if (err) reject(err);
        else {
          // Parse dryCleaningServices JSON
          results.forEach(booking => {
            if (booking.dryCleaningServices) {
              booking.dryCleaningServices = JSON.parse(booking.dryCleaningServices);
            } else {
              booking.dryCleaningServices = [];
            }
          });
          resolve(results);
        }
      });
    });
  }

  // History Management Methods

  // Move booking to history when completed or rejected
  async moveToHistory(bookingId, reason = 'completed') {
    const sql = `
      UPDATE bookings
      SET moved_to_history_at = NOW()
      WHERE booking_id = ? AND moved_to_history_at IS NULL
    `;

    return new Promise((resolve, reject) => {
      this.db.query(sql, [bookingId], (err, result) => {
        if (err) {
          reject(err);
        } else if (result.affectedRows === 0) {
          reject(new Error('Booking not found or not eligible for history'));
        } else {
          resolve(result.affectedRows);
        }
      });
    });
  }

  // Get all history items (completed bookings, rejected bookings, and deleted items)
  async getHistory() {
    const sql = `
      SELECT
        booking_id as id,
        'booking' as type,
        mainService,
        pickupDate,
        pickupTime,
        loadCount,
        status,
        rejectionReason,
        paymentMethod,
        name,
        contact,
        email,
        address,
        totalPrice,
        moved_to_history_at,
        is_deleted,
        deleted_at,
        createdAt,
        updatedAt
      FROM bookings
      WHERE moved_to_history_at IS NOT NULL OR is_deleted = TRUE
      ORDER BY moved_to_history_at DESC, deleted_at DESC
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

  // Get history items by type
  async getHistoryByType(type) {
    let sql;
    if (type === 'completed') {
      sql = `
        SELECT
          booking_id as id,
          'booking' as type,
          mainService,
          pickupDate,
          pickupTime,
          loadCount,
          status,
          rejectionReason,
          paymentMethod,
          name,
          contact,
          email,
          address,
          totalPrice,
          moved_to_history_at,
          is_deleted,
          deleted_at,
          createdAt,
          updatedAt
        FROM bookings
        WHERE moved_to_history_at IS NOT NULL AND is_deleted = FALSE AND status IN ('completed', 'approved')
        ORDER BY moved_to_history_at DESC
      `;
    } else if (type === 'rejected') {
      sql = `
        SELECT
          booking_id as id,
          'booking' as type,
          mainService,
          pickupDate,
          pickupTime,
          loadCount,
          status,
          rejectionReason,
          paymentMethod,
          name,
          contact,
          email,
          address,
          totalPrice,
          moved_to_history_at,
          is_deleted,
          deleted_at,
          createdAt,
          updatedAt
        FROM bookings
        WHERE moved_to_history_at IS NOT NULL AND is_deleted = FALSE AND status = 'rejected'
        ORDER BY moved_to_history_at DESC
      `;
    } else if (type === 'deleted') {
      sql = `
        SELECT
          booking_id as id,
          'booking' as type,
          mainService,
          pickupDate,
          pickupTime,
          loadCount,
          status,
          rejectionReason,
          paymentMethod,
          name,
          contact,
          email,
          address,
          totalPrice,
          moved_to_history_at,
          is_deleted,
          deleted_at,
          createdAt,
          updatedAt
        FROM bookings
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

  // Restore booking from history
  async restoreFromHistory(bookingId) {
    const sql = `
      UPDATE bookings
      SET moved_to_history_at = NULL, is_deleted = FALSE, deleted_at = NULL
      WHERE booking_id = ? AND (moved_to_history_at IS NOT NULL OR is_deleted = TRUE)
    `;

    return new Promise((resolve, reject) => {
      this.db.query(sql, [bookingId], (err, result) => {
        if (err) {
          reject(err);
        } else if (result.affectedRows === 0) {
          reject(new Error('Booking not found in history'));
        } else {
          resolve(result.affectedRows);
        }
      });
    });
  }

  // Permanently delete from history
  async deleteFromHistory(bookingId) {
    const sql = 'DELETE FROM bookings WHERE booking_id = ? AND (moved_to_history_at IS NOT NULL OR is_deleted = TRUE)';

    return new Promise((resolve, reject) => {
      this.db.query(sql, [bookingId], (err, result) => {
        if (err) {
          reject(err);
        } else if (result.affectedRows === 0) {
          reject(new Error('Booking not found in history'));
        } else {
          resolve(result.affectedRows);
        }
      });
    });
  }

  // Soft delete booking (mark as deleted)
  async softDelete(bookingId) {
    const sql = `
      UPDATE bookings
      SET is_deleted = TRUE, deleted_at = NOW()
      WHERE booking_id = ? AND is_deleted = FALSE
    `;

    return new Promise((resolve, reject) => {
      this.db.query(sql, [bookingId], (err, result) => {
        if (err) {
          reject(err);
        } else if (result.affectedRows === 0) {
          reject(new Error('Booking not found or already deleted'));
        } else {
          resolve(result.affectedRows);
        }
      });
    });
  }

  // Get active bookings (not in history and not deleted)
  async getActiveBookings() {
    const sql = `
      SELECT booking_id as id, mainService, dryCleaningServices, pickupDate, pickupTime, loadCount, instructions, status, rejectionReason, paymentMethod, name, contact, email, address, photos, totalPrice, serviceOption, deliveryFee, user_id, createdAt, updatedAt
      FROM bookings
      WHERE moved_to_history_at IS NULL AND is_deleted = FALSE
      ORDER BY createdAt DESC
    `;

    return new Promise((resolve, reject) => {
      this.db.query(sql, (err, results) => {
        if (err) {
          reject(err);
        } else {
          // Parse dryCleaningServices JSON
          results.forEach(booking => {
            if (booking.dryCleaningServices) {
              booking.dryCleaningServices = JSON.parse(booking.dryCleaningServices);
            } else {
              booking.dryCleaningServices = [];
            }
          });
          resolve(results);
        }
      });
    });
  }

  // Get booking counts for specific dates (active bookings only: not rejected or cancelled)
  getBookingCountsForDates(dates) {
    return new Promise((resolve, reject) => {
      if (!dates || dates.length === 0) {
        resolve({});
        return;
      }

      // Create placeholders for IN clause
      const placeholders = dates.map(() => '?').join(',');
      const sql = `
        SELECT pickupDate, COUNT(*) as count
        FROM bookings
        WHERE pickupDate IN (${placeholders})
        AND status NOT IN ('rejected', 'cancelled', 'completed')
        AND moved_to_history_at IS NULL
        AND is_deleted = FALSE
        GROUP BY pickupDate
      `;

      this.db.query(sql, dates, (err, results) => {
        if (err) reject(err);
        else {
          // Convert to object {date: count}
          const counts = {};
          results.forEach(row => {
            counts[row.pickupDate] = row.count;
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
