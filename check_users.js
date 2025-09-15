const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'washitizzy'
});

db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
    return;
  }
  console.log('Connected to database');

  db.query('SELECT id, email, firstName, lastName, barangay, street, blockLot, landmark FROM users LIMIT 5', (err, results) => {
    if (err) {
      console.error('Query failed:', err);
      return;
    }

    console.log('Users in database:');
    console.log(JSON.stringify(results, null, 2));

    db.end();
  });
});
