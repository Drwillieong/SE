import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const salt = 10;

export class User {
  constructor(db) {
    this.db = db;
  }

  // Generate verification token
  generateVerificationToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  // Hash password
  async hashPassword(password) {
    return await bcrypt.hash(password.toString(), salt);
  }

  // Compare password
  async comparePassword(password, hash) {
    return await bcrypt.compare(password.toString(), hash);
  }

  // Generate JWT token
  generateToken(user) {
    return jwt.sign({
      user_id: user.user_id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role || 'customer'
    }, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '1h' });
  }

  // Find user by email with profile data for customers
  findByEmail(email) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT u.*, cp.firstName, cp.lastName, cp.contact, cp.address
        FROM users u
        LEFT JOIN customers_profiles cp ON u.user_id = cp.user_id
        WHERE u.email = ?
      `;
      this.db.query(sql, [email], (err, data) => {
        if (err) reject(err);
        else resolve(data.length > 0 ? data[0] : null);
      });
    });
  }

  // Find user by ID with profile data for customers
  findById(user_id) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT u.*, cp.firstName, cp.lastName, cp.contact, cp.address
        FROM users u
        LEFT JOIN customers_profiles cp ON u.user_id = cp.user_id
        WHERE u.user_id = ?
      `;
      this.db.query(sql, [user_id], (err, data) => {
        if (err) reject(err);
        else resolve(data.length > 0 ? data[0] : null);
      });
    });
  }

  // Create new user (only core auth fields)
  create(userData) {
    return new Promise(async (resolve, reject) => {
      try {
        const verificationToken = this.generateVerificationToken();
        const hashedPassword = await this.hashPassword(userData.password);

        const sql = "INSERT INTO users (email, password, verificationToken, authProvider) VALUES (?)";
        const values = [
          userData.email,
          hashedPassword,
          verificationToken,
          'email'
        ];

        this.db.query(sql, [values], (err, result) => {
          if (err) reject(err);
          else resolve({ user_id: result.insertId, verificationToken });
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  // Create customer profile (for customers only)
  createCustomerProfile(user_id, profileData) {
    return new Promise((resolve, reject) => {
      const sql = "INSERT INTO customers_profiles (user_id, firstName, lastName, name, contact, email, address) VALUES (?)";
      const values = [
        user_id,
        profileData.firstName,
        profileData.lastName,
        `${profileData.firstName} ${profileData.lastName}`,
        profileData.contact,
        profileData.email || null,
        `${profileData.barangay || ''} ${profileData.street || ''} ${profileData.blockLot || ''} ${profileData.landmark || ''}`.trim()
      ];

      this.db.query(sql, [values], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  // Update customer profile
  updateCustomerProfile(user_id, profileData) {
    return new Promise((resolve, reject) => {
      const sql = "UPDATE customers_profiles SET firstName = ?, lastName = ?, name = ?, contact = ?, email = ?, address = ? WHERE user_id = ?";
      const values = [
        profileData.firstName,
        profileData.lastName,
        `${profileData.firstName} ${profileData.lastName}`,
        profileData.contact,
        profileData.email || null,
        `${profileData.barangay || ''} ${profileData.street || ''} ${profileData.blockLot || ''} ${profileData.landmark || ''}`.trim(),
        user_id
      ];

      this.db.query(sql, values, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  // Update user
  update(user_id, updateData) {
    return new Promise((resolve, reject) => {
      const sql = "UPDATE users SET ? WHERE user_id = ?";
      this.db.query(sql, [updateData, user_id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  // Verify email
  verifyEmail(token) {
    return new Promise((resolve, reject) => {
      const sql = "SELECT * FROM users WHERE verificationToken = ?";
      this.db.query(sql, [token], (err, data) => {
        if (err) reject(err);
        else if (data.length === 0) reject(new Error('Invalid token'));
        else {
          const user = data[0];
          const updateSql = "UPDATE users SET isVerified = TRUE, verificationToken = NULL WHERE user_id = ?";
          this.db.query(updateSql, [user.user_id], (err) => {
            if (err) reject(err);
            else resolve(user);
          });
        }
      });
    });
  }

  // Update reset token
  updateResetToken(email, token) {
    return new Promise((resolve, reject) => {
      const sql = "UPDATE users SET resetToken = ?, resetTokenExpiry = DATE_ADD(NOW(), INTERVAL 1 HOUR) WHERE email = ?";
      this.db.query(sql, [token, email], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  // Find user by reset token
  findByResetToken(token) {
    return new Promise((resolve, reject) => {
      const sql = "SELECT user_id, email FROM users WHERE resetToken = ? AND resetTokenExpiry > NOW()";
      this.db.query(sql, [token], (err, data) => {
        if (err) reject(err);
        else resolve(data.length > 0 ? data[0] : null);
      });
    });
  }

  // Update password
  updatePassword(user_id, hashedPassword) {
    return new Promise((resolve, reject) => {
      const sql = "UPDATE users SET password = ?, resetToken = NULL, resetTokenExpiry = NULL WHERE user_id = ?";
      this.db.query(sql, [hashedPassword, user_id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }
}
