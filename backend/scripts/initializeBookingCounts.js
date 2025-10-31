import mysql from 'mysql2/promise';
import { ServiceOrder } from '../models/ServiceOrder.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Database configuration for Aiven
const dbConfig = {
  host: 'mysql-wash-kevincorpuz321-a5ef.b.aivencloud.com',
  user: 'avnadmin',
  password: 'AVNS_YI4KlWK4iTKi3ot2kXX',
  database: 'wash',
  port: 10663,
  ssl: {
    ca: `-----BEGIN CERTIFICATE-----
MIIEUDCCArigAwIBAgIUBv/iEiwnbfwAaz2Ba/kBerQtIMQwDQYJKoZIhvcNAQEM
BQAwQDE+MDwGA1UEAww1YzY5MDRmYjMtYzg3Ni00MTNmLWIwYTYtNjhhZjM0ZjUw
MTU5IEdFTiAxIFByb2plY3QgQ0EwHhcNMjUxMDE1MTcyNDIyWhcNMzUxMDEzMTcy
NDIyWjBAMT4wPAYDVQQDDDVjNjkwNGZiMy1jODc2LTQxM2YtYjBhNi02OGFmMzRm
NTAxNTkgR0VOIDEgUHJvamVjdCBDQTCCAaIwDQYJKoZIhvcNAQEBBQADggGPADCC
AYoCggGBAK9uigRlj4WjcQiMJOr7HWr/T5syoKJ6ywbgDd9GKKyxrQD3GVljE6Qf
HbnnOz3IRIAluVcfoHXoDjlklIMp1CewUf4l1l2jgJCdIfa3hrX86JD1dnlC9EdD
7vRSEgLkNsEXaNZXEUTPhLWwAK98VBDGEhRRQN3/x3V/8Dyj97z5eK7ci9Jrkqtv
KsHTUKjnjBJfu5UXOt+Q9eozPljYA2QrAgijrjJmlcKlpLe+UldttmkQAgCvZDQI
7wV+K4YOnWoq0y603vssOdZE9tKzxmh4uP4AhQj8fkrKZPPsTatkGI2k+t2hL1e7
zxP3yN8GswDIaQAuGhsb9UHEovMfuZyFfeSgyWTQ7QgoGNlBZg/RsS1IBh33oq3+
o330g69YmkWmVWppQN6aZuIbsarVmnYQNLdzkWYow4Oxyune7nlN/3noDmcmIbBL
Fnz3oEarLE0rVbrXt58AiQQJufTBxBdamRKGAY248Ve7mbp+xj8k98Xo9Hn8fUwv
Ub85AloQOwIDAQABo0IwQDAdBgNVHQ4EFgQU/9MlMvUwa52tvi9z2b2CSTvmVJsw
EgYDVR0TAQH/BAgwBgEB/wIBADALBgNVHQ8EBAMCAQYwDQYJKoZIhvcNAQEMBQAD
ggGBAGp1YnEbUiJqpcO3daBCh2+o1IAEBJqztLy7iTSYKAfxP2WPEej2cB36RNDQ
SFO7ElfVlROJK/IdZl2ki7ZhuIQS9gH3f4MZOdcbcEP6vG8ioODfYWjsWcQDYtv+
SWYaoIPtCEt9YbKEdKqGsNJUIa79Ke8yufSwcR1w2T9JCeaj8Fzf3H36oSvxB+LB
JGiqsabuaGDWfeLHA8WWuLXnqSWeBrhVn8gn0skYIkPC0xOM4PDLh8h4eSQP3ai0
/wuTN25Cgzrwi6h/6Op46eVjG0PghPvd+lBW4W3UY09rn3a8oLa88ZzNf2Ed2foN
IAysKEkoNJT8WtElAikX3kh1DpQSYFh0JbHCiC6dseguuhygHaBksac3D3AMXReW
A2WcDS+b2sbna4uNjiG/Aq/cTeZLeaMxJXU2STx2BPe06xRp5IQFS8JSUyNvZYPa
xcMnnKRxxu8Dvr16sgO+N2uyVapt8D1gKHknagzDLFQ4+M0zcRecZnP4F1HZOqnm
k0RPqQ==
-----END CERTIFICATE-----`
  }
};

async function initializeBookingCounts() {
  let connection;

  try {
    console.log('🔄 Initializing booking counts...');
    console.log('Connecting to Aiven MySQL database...');

    // Create database connection
    connection = await mysql.createConnection(dbConfig);

    console.log('✅ Connected to database successfully!');

    // Initialize ServiceOrder model
    const serviceOrderModel = new ServiceOrder(connection);

    // Run the initialization
    await serviceOrderModel.initializeBookingCounts();

    console.log('✅ Booking counts initialized successfully!');

    // Verify the counts
    const [results] = await connection.execute(`
      SELECT date, count FROM booking_counts ORDER BY date LIMIT 10
    `);

    console.log('📊 Sample booking counts:');
    results.forEach(row => {
      console.log(`  ${row.date}: ${row.count} bookings`);
    });

  } catch (error) {
    console.error('❌ Error initializing booking counts:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      connection.end();
    }
    process.exit(0);
  }
}

// Run the script
initializeBookingCounts();
