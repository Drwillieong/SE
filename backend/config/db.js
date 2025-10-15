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

if (process.env.NODE_ENV === "production") {
  // In Render, we mount the CA cert as a secret file at /etc/secrets/ca.pem
  const caPath = "/etc/secrets/ca.pem";
  if (!fs.existsSync(caPath)) {
    console.error(`❌ Aiven CA certificate not found at ${caPath}. Make sure you have added it as a Secret File in Render.`);
  } else {
    connectionConfig.ssl = { ca: fs.readFileSync(caPath) };
  }
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
