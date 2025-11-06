import db from '../config/db.js';

const alterQuery = `
  ALTER TABLE service_orders
  ADD INDEX idx_user_orders (user_id, moved_to_history_at, is_deleted, created_at);
`;

db.query(alterQuery, (err, results) => {
  if (err) {
    console.error('Error adding index:', err.message);
  } else {
    console.log('Index added successfully');
  }
  db.end();
});
