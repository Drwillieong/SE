import mysql from "mysql2";
import dotenv from "dotenv";

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

if (process.env.NODE_ENV === "production") {
  if (!process.env.AIVEN_CA_CERT) {
    console.error("❌ AIVEN_CA_CERT environment variable is not set for production.");
  }
  connectionConfig.ssl = { ca: process.env.AIVEN_CA_CERT };
}

const db = mysql.createConnection(connectionConfig);

db.connect((err) => {
  if (err) {
    console.error("❌ Database connection failed:", err.message);
  } else {
    console.log("✅ Connected to Aiven MySQL successfully!");
  }
});

export default db;
