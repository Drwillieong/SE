import mysql from "mysql2";
import dotenv from "dotenv";
import fs from "fs";

if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

console.log("🔐 Loaded DB env vars:", {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

const connectionConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
};

// In production (like on Render), Aiven requires an SSL certificate.
if (process.env.NODE_ENV === "production") {
  const caPath = "/etc/secrets/AIVEN_CA_CERT";
  console.log(`Production environment detected. Loading SSL certificate from ${caPath}`);
  if (fs.existsSync(caPath)) {
    console.log("✅ Found AIVEN_CA_CERT secret file.");
    connectionConfig.ssl = { ca: fs.readFileSync(caPath) };
  } else {
    console.error(`❌ Aiven CA certificate not found at ${caPath}. Make sure the secret file in Render is named 'AIVEN_CA_CERT'.`);
  }
}

const db = mysql.createConnection(connectionConfig);

db.connect(err => {
  if (err) {
    console.error("❌ Database connection failed:", err.message);
  } else {
    console.log("✅ Connected to Aiven MySQL successfully!");

    // ✅ Log all tables in the database
    const query = "SHOW TABLES;";
    db.query(query, (err, results) => {
      if (err) {
        console.error("❌ Error fetching tables:", err.message);
      } else {
        console.log("📋 Tables in the database:");
        results.forEach(row => {
          // MySQL returns something like { 'Tables_in_yourdbname': 'table_name' }
          console.log(" -", Object.values(row)[0]);
        });
      }
    });
  }
});

export default db;
