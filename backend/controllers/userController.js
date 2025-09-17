import { validationResult } from 'express-validator';

// Controller to update user profile
export const updateProfile = (db) => (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const userId = req.user.user_id; // Assuming middleware sets req.user
  const { firstName, lastName, contact, email, barangay, street, blockLot, landmark } = req.body;

  const sql = `UPDATE users SET
    firstName = ?,
    lastName = ?,
    contact = ?,
    email = ?,
    barangay = ?,
    street = ?,
    blockLot = ?,
    landmark = ?
    WHERE user_id = ?`;

  const values = [firstName, lastName, contact, email, barangay, street, blockLot, landmark, userId];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('Error updating profile:', err);
      return res.status(500).json({ success: false, message: 'Server error updating profile' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Fetch updated user data
    const selectSql = "SELECT user_id, firstName, lastName, contact, email, barangay, street, blockLot, landmark FROM users WHERE user_id = ?";
    db.query(selectSql, [userId], (err, userResult) => {
      if (err) {
        console.error('Error fetching updated user:', err);
        return res.status(500).json({ success: false, message: 'Profile updated but error fetching data' });
      }

      res.json({ success: true, user: userResult[0] });
    });
  });
};

// Controller to get user profile
export const getProfile = (db) => (req, res) => {
  const userId = req.user.user_id;

  const sql = "SELECT user_id, firstName, lastName, contact, email, barangay, street, blockLot, landmark, role FROM users WHERE user_id = ?";
  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching profile:', err);
      return res.status(500).json({ success: false, message: 'Server error fetching profile' });
    }

    if (results.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user: results[0] });
  });
};

// Controller to get all users (admin only)
export const getAllUsers = (db) => (req, res) => {
  const sql = "SELECT id, firstName, lastName, contact, email, role, createdAt FROM users ORDER BY createdAt DESC";
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching users:', err);
      return res.status(500).json({ success: false, message: 'Server error fetching users' });
    }
    res.json({ success: true, users: results });
  });
};
