import mysql from 'mysql2/promise';
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

async function verifyBookingCounts() {
  let connection;

  try {
    console.log('🔍 Verifying booking counts accuracy...');
    connection = await mysql.createConnection(dbConfig);

    // Get actual counts from service_orders
    const [actualResults] = await connection.execute(`
      SELECT pickup_date, COUNT(*) as actual_count
      FROM service_orders
      WHERE status NOT IN ('rejected', 'cancelled', 'completed')
      AND moved_to_history_at IS NULL
      AND is_deleted = FALSE
      GROUP BY pickup_date
      ORDER BY pickup_date
    `);

    // Get counts from booking_counts
    const [bookingCountsResults] = await connection.execute(`
      SELECT date, count
      FROM booking_counts
      ORDER BY date
    `);

    console.log('📊 Actual counts from service_orders:');
    actualResults.forEach(row => {
      console.log(`  ${row.pickup_date}: ${row.actual_count} bookings`);
    });

    console.log('📊 Counts from booking_counts table:');
    bookingCountsResults.forEach(row => {
      console.log(`  ${row.date}: ${row.count} bookings`);
    });

    // Compare
    let mismatches = 0;
    const actualMap = new Map(actualResults.map(row => [row.pickup_date.toISOString().split('T')[0], row.actual_count]));
    const bookingMap = new Map(bookingCountsResults.map(row => [row.date.toISOString().split('T')[0], row.count]));

    for (const [date, actualCount] of actualMap) {
      const bookingCount = bookingMap.get(date) || 0;
      if (actualCount !== bookingCount) {
        console.log(`❌ Mismatch on ${date}: actual=${actualCount}, booking_counts=${bookingCount}`);
        mismatches++;
      }
    }

    for (const [date, bookingCount] of bookingMap) {
      if (!actualMap.has(date)) {
        console.log(`❌ Extra entry in booking_counts on ${date}: ${bookingCount}`);
        mismatches++;
      }
    }

    if (mismatches === 0) {
      console.log('✅ All counts match!');
    } else {
      console.log(`❌ Found ${mismatches} mismatches.`);
    }

  } catch (error) {
    console.error('❌ Error verifying booking counts:', error);
  } finally {
    if (connection) {
      connection.end();
    }
  }
}

// Run the verification
verifyBookingCounts();
