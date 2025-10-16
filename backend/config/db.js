import mysql from 'mysql2';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const db = mysql.createConnection(process.env.DATABASE_URL);

const connectWithRetry = () => {
  console.log("Attempting to connect to the database...");
  db.connect(err => {
    if (err) {
      console.error('Error connecting to database:', err.stack);
      setTimeout(connectWithRetry, 5000); // Retry after 5 seconds
    } else {
      console.log('Successfully connected to the database.');
    }
  });
};

export default { ...db, connect: connectWithRetry };