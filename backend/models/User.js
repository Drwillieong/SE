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
      role: user.role || 'user'
    }, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '1h' });
  }

  // Find user by email
  findByEmail(email) {
    return new Promise((resolve, reject) => {
      const sql = "SELECT * FROM users WHERE email = ?";
      this.db.query(sql, [email], (err, data) => {
        if (err) reject(err);
        else resolve(data.length > 0 ? data[0] : null);
      });
    });
  }

  // Find user by ID
  findById(user_id) {
    return new Promise((resolve, reject) => {
      const sql = "SELECT * FROM users WHERE user_id = ?";
      this.db.query(sql, [user_id], (err, data) => {
        if (err) reject(err);
        else resolve(data.length > 0 ? data[0] : null);
      });
    });
  }

  // Create new user
  create(userData) {
    return new Promise(async (resolve, reject) => {
      try {
        const verificationToken = this.generateVerificationToken();
        const hashedPassword = await this.hashPassword(userData.password);

        const sql = "INSERT INTO users (`firstName`, `lastName`, `contact`, `email`, `password`, `barangay`, `street`, `blockLot`, `landmark`, `verificationToken`, `authProvider`) VALUES (?)";
        const values = [
          userData.firstName,
          userData.lastName,
          userData.contact,
          userData.email,
          hashedPassword,
          null, // barangay
          null, // street
          null, // blockLot
          null, // landmark
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
