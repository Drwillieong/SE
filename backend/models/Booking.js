export class Booking {
  constructor(db) {
    this.db = db;
  }

  // Get all bookings
  getAll() {
    return new Promise((resolve, reject) => {
      // Select all columns except booking_id, alias booking_id as id to avoid duplicate columns
      const sql = "SELECT booking_id as id, serviceType, pickupDate, pickupTime, loadCount, instructions, status, rejectionReason, paymentMethod, name, contact, email, address, photos, totalPrice, user_id, createdAt, updatedAt FROM bookings ORDER BY createdAt DESC";
      this.db.query(sql, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }

  // Get booking by ID
  getById(id) {
    return new Promise((resolve, reject) => {
      const sql = "SELECT booking_id as id, * FROM bookings WHERE booking_id = ?";
      this.db.query(sql, [id], (err, results) => {
        if (err) reject(err);
        else resolve(results.length > 0 ? results[0] : null);
      });
    });
  }

  // Create new booking
  create(bookingData) {
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
        user_id
      } = bookingData;

      const sql = `INSERT INTO bookings
        (serviceType, pickupDate, pickupTime, loadCount, instructions, status, paymentMethod, name, contact, email, address, photos, totalPrice, user_id, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`;

      const photosJson = photos ? JSON.stringify(photos) : JSON.stringify([]);

      const values = [
        serviceType,
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
      const sql = "SELECT booking_id as id, serviceType, pickupDate, pickupTime, loadCount, instructions, status, rejectionReason, paymentMethod, name, contact, email, address, photos, totalPrice, user_id, createdAt, updatedAt FROM bookings WHERE user_id = ? ORDER BY createdAt DESC";
      this.db.query(sql, [user_id], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }
}
