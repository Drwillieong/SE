import { ServiceOrder } from '../models/ServiceOrder.js';

// Controller to get customer bookings (pending bookings only)
export const getCustomerBookings = (db) => async (req, res) => {
  if (!req.user || !req.user.user_id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const serviceOrderModel = new ServiceOrder(db);
  try {
    const userId = req.user.user_id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    // Get only pending bookings
    const sql = `
      SELECT so.*, cp.firstName, cp.lastName, cp.name, cp.contact, cp.email, cp.address,
             p.payment_method, p.payment_status, p.payment_proof, p.reference_id, p.payment_review_status
      FROM service_orders so
      LEFT JOIN customers_profiles cp ON so.customer_id = cp.customer_id
      LEFT JOIN payments p ON so.service_orders_id = p.service_orders_id
      WHERE cp.user_id = ? AND so.status = 'pending_booking'
      AND so.moved_to_history_at IS NULL
      AND so.is_deleted = FALSE
      ORDER BY so.created_at DESC
      LIMIT ? OFFSET ?
    `;
    const offset = (page - 1) * limit;
    const [results] = await db.promise().query(sql, [userId, limit, offset]);

    const transformedBookings = results.map(booking => {
      // Cap load_count to prevent incorrect calculations
      const loadCount = Math.min(booking.load_count || 1, 5);

      return {
        ...booking,
        photos: typeof booking.photos === 'string' ? JSON.parse(booking.photos) : booking.photos || [],
        laundry_photos: typeof booking.laundry_photos === 'string' ? JSON.parse(booking.laundry_photos) : booking.laundry_photos || [],
        dry_cleaning_services: typeof booking.dry_cleaning_services === 'string' ? JSON.parse(booking.dry_cleaning_services) : booking.dry_cleaning_services || [],
        payment_status: booking.payment_status || 'unpaid',
        service_orders_id: booking.service_orders_id,
        status: booking.status || 'pending_booking',
        totalPrice: booking.total_price || 0,
        load_count: loadCount,
        kilos: booking.kilos || 0,
        estimated_clothes: booking.estimated_clothes || 0
      };
    });

    res.json(transformedBookings);
  } catch (error) {
    console.error('Error fetching customer bookings:', error);
    res.status(500).json({ message: 'Server error fetching bookings' });
  }
};

// Controller to get all service orders for a customer
export const getCustomerOrders = (db) => async (req, res) => {
  if (!req.user || !req.user.user_id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const userId = req.user.user_id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    // Get all orders including pending bookings (use efficient approach to avoid sort memory issues)
    // Fetch more records and sort in memory
    const batchSize = limit * 2; // Get more records to ensure we have enough after filtering

    const sql = `
      SELECT so.*, cp.firstName, cp.lastName, cp.name, cp.contact, cp.email, cp.address,
             p.payment_method, p.payment_status, p.payment_proof, p.reference_id, p.payment_review_status
      FROM service_orders so
      LEFT JOIN customers_profiles cp ON so.customer_id = cp.customer_id
      LEFT JOIN payments p ON so.service_orders_id = p.service_orders_id
      WHERE cp.user_id = ? AND so.moved_to_history_at IS NULL AND so.is_deleted = FALSE
      LIMIT ? OFFSET ?
    `;
    const [results] = await db.promise().query(sql, [userId, batchSize, offset]);

    // Sort the results in memory by created_at (JavaScript sort)
    results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Take only the number we need
    const paginatedResults = results.slice(0, limit);

    // Get total count
    const countSql = `
      SELECT COUNT(*) as count FROM service_orders so
      LEFT JOIN customers_profiles cp ON so.customer_id = cp.customer_id
      WHERE cp.user_id = ? AND so.moved_to_history_at IS NULL AND so.is_deleted = FALSE
    `;
    const [countResults] = await db.promise().query(countSql, [userId]);
    const totalCount = countResults[0].count;

    const transformedOrders = paginatedResults.map(order => {
      // Cap load_count to prevent incorrect calculations
      const loadCount = Math.min(order.load_count || 1, 5);

      return {
        ...order,
        photos: (() => {
          try {
            return typeof order.photos === 'string' ? JSON.parse(order.photos) : order.photos || [];
          } catch (e) {
            console.error('Error parsing photos:', e);
            return [];
          }
        })(),
        laundryPhoto: (() => {
          try {
            return typeof order.laundry_photos === 'string' ? JSON.parse(order.laundry_photos) : order.laundry_photos || [];
          } catch (e) {
            console.error('Error parsing laundry_photos:', e);
            return [];
          }
        })(),
        dry_cleaning_services: (() => {
          try {
            return typeof order.dry_cleaning_services === 'string' ? JSON.parse(order.dry_cleaning_services) : order.dry_cleaning_services || [];
          } catch (e) {
            console.error('Error parsing dry_cleaning_services:', e);
            return [];
          }
        })(),
        paymentStatus: order.payment_status || 'unpaid',
        paymentMethod: order.payment_method || 'cash',
        serviceType: order.service_type,
        mainService: order.service_type, // For compatibility
        service_orders_id: order.service_orders_id,
        order_id: order.service_orders_id, // For compatibility
        status: order.status || 'pending',
        totalPrice: order.total_price || 0,
        load_count: loadCount,
        loadCount: loadCount, // For compatibility
        kilos: order.kilos || 0,
        estimated_clothes: order.estimated_clothes || 0,
        pickupDate: order.pickup_date,
        pickupTime: order.pickup_time,
        instructions: order.instructions || '',
        name: order.name,
        contact: order.contact,
        email: order.email || '',
        address: order.address,
        rejectionReason: order.rejection_reason,
        createdAt: order.created_at,
        updatedAt: order.updated_at
      };
    });

    res.json({
      orders: transformedOrders,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        limit,
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching customer orders:', error);
    res.status(500).json({ message: 'Server error fetching orders' });
  }
};

// Controller to get customer order by ID
export const getCustomerOrderById = (db) => async (req, res) => {
  if (!req.user || !req.user.user_id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const orderId = req.params.id;
  const serviceOrderModel = new ServiceOrder(db);
  try {
    const userId = req.user.user_id;
    const order = await serviceOrderModel.getById(orderId, userId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    console.error('Error fetching customer order:', error);
    res.status(500).json({ message: 'Server error fetching order' });
  }
};

// Controller to create a new booking/order for customer
export const createCustomerBooking = (db) => async (req, res) => {
  if (!req.user || !req.user.user_id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const bookingData = req.body;

  // Validate mainService
  if (!bookingData.service_type || !['fullService', 'washDryFold', 'washFold', 'dryCleaning', 'hangDry'].includes(bookingData.service_type)) {
    return res.status(400).json({ error: 'Invalid service_type value' });
  }

  const serviceOrderModel = new ServiceOrder(db);

  // Check booking limit for the date (3 bookings per day) using booking_counts table
  if (req.user.role !== 'admin') {
    try {
      const countSql = `
        SELECT count, limit_count
        FROM booking_counts
        WHERE date = ?
      `;
      const [countResults] = await db.promise().query(countSql, [bookingData.pickup_date]);
      const count = countResults.length > 0 ? countResults[0].count : 0;
      const limit = countResults.length > 0 ? countResults[0].limit_count : 3;

      if (count >= limit) {
        return res.status(400).json({ message: 'This day is fully booked. Maximum 3 bookings per day allowed.' });
      }
    } catch (error) {
      console.error('Error checking booking limit:', error);
      return res.status(500).json({ message: 'Server error checking booking limit' });
    }
  }

  // Check if user already has a booking for this date and time
  if (req.user.role !== 'admin') {
    try {
      const conflictSql = `
        SELECT so.service_orders_id
        FROM service_orders so
        LEFT JOIN customers_profiles cp ON so.customer_id = cp.customer_id
        WHERE cp.user_id = ? AND so.pickup_date = ? AND so.pickup_time = ?
        AND so.status NOT IN ('completed', 'cancelled', 'rejected')
        AND so.moved_to_history_at IS NULL
        AND so.is_deleted = FALSE
      `;
      const [conflictResults] = await db.promise().query(conflictSql, [
        req.user.user_id,
        bookingData.pickup_date,
        bookingData.pickup_time
      ]);

      if (conflictResults.length > 0) {
        return res.status(400).json({
          message: 'You already have a booking at this date and time. Please choose a different date or time slot.'
        });
      }
    } catch (error) {
      console.error('Error checking for booking conflicts:', error);
      return res.status(500).json({ message: 'Server error checking booking conflicts' });
    }
  }

  try {
    // Calculate total price in backend to ensure accuracy
    const loadCount = Math.min(bookingData.load_count || 1, 5);
    const mainServicePrice = bookingData.service_type === 'fullService' ? 199 :
                            bookingData.service_type === 'washDryFold' ? 179 :
                            bookingData.service_type === 'washFold' ? 150 :
                            bookingData.service_type === 'dryCleaning' ? 0 : // Inspection required
                            bookingData.service_type === 'hangDry' ? 100 : 0;
    // Note: Dry cleaning prices vary by inspection, so not included in calculation
    const calculatedTotal = mainServicePrice * loadCount + (bookingData.delivery_fee || 0);

    // First, get or create customer profile for this user
    // Construct name and address from individual fields
    const fullName = `${bookingData.firstName || ''} ${bookingData.lastName || ''}`.trim();
    const fullAddress = `${bookingData.street || ''}${bookingData.blockLot ? `, Block ${bookingData.blockLot}` : ''}, ${bookingData.barangay || ''}, Calamba City`.trim();

    const customerSql = `
      INSERT INTO customers_profiles (user_id, firstName, lastName, name, contact, email, address, barangay, street, blockLot)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        firstName = VALUES(firstName),
        lastName = VALUES(lastName),
        name = VALUES(name),
        contact = VALUES(contact),
        email = VALUES(email),
        address = VALUES(address),
        barangay = VALUES(barangay),
        street = VALUES(street),
        blockLot = VALUES(blockLot)
    `;
    const customerValues = [
      req.user.user_id,
      bookingData.firstName || '',
      bookingData.lastName || '',
      fullName,
      bookingData.contact,
      bookingData.email || '',
      fullAddress,
      bookingData.barangay || '',
      bookingData.street || '',
      bookingData.blockLot || ''
    ];
    await db.promise().query(customerSql, customerValues);

    // Get the customer_id
    const getCustomerIdSql = `SELECT customer_id FROM customers_profiles WHERE user_id = ?`;
    const [customerResult] = await db.promise().query(getCustomerIdSql, [req.user.user_id]);
    const customerId = customerResult[0].customer_id;

    const orderData = {
      customer_id: customerId,
      service_type: bookingData.service_type,
      dry_cleaning_services: bookingData.dry_cleaning_services || [],
      pickup_date: bookingData.pickup_date,
      pickup_time: bookingData.pickup_time,
      load_count: loadCount,
      instructions: bookingData.instructions || '',
      total_price: calculatedTotal,
      photos: bookingData.photos || [],
      service_option: bookingData.service_option || 'pickupAndDelivery',
      delivery_fee: bookingData.delivery_fee || 0,
      status: 'pending_booking'
    };

    const orderId = await serviceOrderModel.create(orderData);

    // Create payment record if payment method is specified
    if (bookingData.payment_method) {
      const { Payment } = await import('../models/Payment.js');
      const paymentModel = new Payment(db);
      await paymentModel.create({
        service_orders_id: orderId,
        payment_method: bookingData.payment_method,
        total_price: calculatedTotal,
        payment_status: 'unpaid',
        payment_proof: null,
        reference_id: null,
        payment_review_status: 'pending'
      });
    }

    // Increment booking count for the date
    try {
      const updateCountSql = `
        INSERT INTO booking_counts (date, count, limit_count)
        VALUES (?, 1, 3)
        ON DUPLICATE KEY UPDATE count = count + 1
      `;
      await db.promise().query(updateCountSql, [bookingData.pickup_date]);
      console.log(`Booking count incremented for date: ${bookingData.pickup_date}`);
    } catch (countError) {
      console.error('Error updating booking count:', countError);
      // Don't fail the booking if count update fails
    }

    // Emit real-time update for booking counts
    if (req.io) {
      req.io.emit('booking-counts-updated', { date: bookingData.pickup_date, change: 1 });
    }

    res.status(201).json({ message: 'Booking created successfully', orderId });
  } catch (error) {
    console.error('Error creating customer booking:', error);
    res.status(500).json({ message: 'Server error creating booking' });
  }
};

// Controller to get booking count for a specific date
export const getBookingCount = (db) => async (req, res) => {
  if (!req.user || !req.user.user_id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { date } = req.query;

  if (!date) {
    return res.status(400).json({ message: 'Date parameter is required' });
  }

  try {
    // Get or create booking count entry for the date
    const selectSql = `
      SELECT count, limit_count
      FROM booking_counts
      WHERE date = ?
    `;
    const [results] = await db.promise().query(selectSql, [date]);

    let count = 0;
    let limit = 3;

    if (results.length === 0) {
      // Create entry if it doesn't exist
      const insertSql = `
        INSERT INTO booking_counts (date, count, limit_count)
        VALUES (?, 0, 3)
      `;
      await db.promise().query(insertSql, [date]);
    } else {
      count = results[0].count;
      limit = results[0].limit_count;
    }

    res.json({ count, limit });
  } catch (error) {
    console.error('Error fetching booking count:', error);
    res.status(500).json({ message: 'Server error fetching booking count' });
  }
};

// Controller to get customer booking counts for dates
export const getCustomerBookingCounts = (db) => async (req, res) => {
  if (!req.user || !req.user.user_id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { dates } = req.query;

  // Handle dates as either array or comma-separated string
  let dateArray = [];
  if (Array.isArray(dates)) {
    dateArray = dates;
  } else if (typeof dates === 'string') {
    dateArray = dates.split(',');
  } else {
    return res.status(400).json({ message: 'Dates parameter is required' });
  }

  if (dateArray.length === 0) {
    return res.status(400).json({ message: 'At least one date is required' });
  }

  try {
    // Query the booking_counts table
    const placeholders = dateArray.map(() => '?').join(',');
    const sql = `
      SELECT DATE_FORMAT(date, '%Y-%m-%d') as date_str, count
      FROM booking_counts
      WHERE date IN (${placeholders})
    `;
    const [results] = await db.promise().query(sql, dateArray);

    // Convert to object {date: count}
    const counts = {};
    results.forEach(row => {
      counts[row.date_str] = row.count;
    });

    // Ensure all dates have a count (0 if none)
    dateArray.forEach(date => {
      if (!(date in counts)) {
        counts[date] = 0;
      }
    });

    res.json(counts);
  } catch (error) {
    console.error('Error fetching customer booking counts:', error);
    res.status(500).json({ message: 'Server error fetching booking counts' });
  }
};

// Controller to get customer history
export const getCustomerHistory = (db) => async (req, res) => {
  if (!req.user || !req.user.user_id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const serviceOrderModel = new ServiceOrder(db);
  try {
    const userId = req.user.user_id;
    // Get all history items: completed orders, moved to history, or soft deleted
    const sql = `
      SELECT so.*, cp.firstName, cp.lastName, cp.name, cp.contact, cp.email, cp.address,
             p.payment_method, p.payment_status, p.payment_proof, p.reference_id, p.payment_review_status
      FROM service_orders so
      LEFT JOIN customers_profiles cp ON so.customer_id = cp.customer_id
      LEFT JOIN payments p ON so.service_orders_id = p.service_orders_id
      WHERE cp.user_id = ? AND (so.moved_to_history_at IS NOT NULL OR so.is_deleted = TRUE OR so.status IN ('completed', 'rejected', 'cancelled'))
      ORDER BY COALESCE(so.moved_to_history_at, so.deleted_at, so.updated_at) DESC
    `;
    const [results] = await db.promise().query(sql, [userId]);

    const transformedHistory = results.map(order => {
      // Cap load_count to prevent incorrect calculations
      const loadCount = Math.min(order.load_count || 1, 5);

      return {
        ...order,
        photos: (() => {
          try {
            return typeof order.photos === 'string' ? JSON.parse(order.photos) : order.photos || [];
          } catch (e) {
            console.error('Error parsing photos:', e);
            return [];
          }
        })(),
        laundryPhoto: (() => {
          try {
            return typeof order.laundry_photos === 'string' ? JSON.parse(order.laundry_photos) : order.laundry_photos || [];
          } catch (e) {
            console.error('Error parsing laundry_photos:', e);
            return [];
          }
        })(),
        dry_cleaning_services: (() => {
          try {
            return typeof order.dry_cleaning_services === 'string' ? JSON.parse(order.dry_cleaning_services) : order.dry_cleaning_services || [];
          } catch (e) {
            console.error('Error parsing dry_cleaning_services:', e);
            return [];
          }
        })(),
        paymentStatus: order.payment_status || 'unpaid',
        paymentMethod: order.payment_method || 'cash',
        serviceType: order.service_type,
        mainService: order.service_type, // For compatibility
        service_orders_id: order.service_orders_id,
        order_id: order.service_orders_id, // For compatibility
        status: order.status || 'pending',
        totalPrice: order.total_price || 0,
        load_count: loadCount,
        loadCount: loadCount, // For compatibility
        kilos: order.kilos || 0,
        estimated_clothes: order.estimated_clothes || 0,
        pickupDate: order.pickup_date,
        pickupTime: order.pickup_time,
        instructions: order.instructions || '',
        name: order.name,
        contact: order.contact,
        email: order.email || '',
        address: order.address,
        rejectionReason: order.rejection_reason,
        createdAt: order.created_at,
        updatedAt: order.updated_at
      };
    });

    res.json(transformedHistory);
  } catch (error) {
    console.error('Error fetching customer history:', error);
    res.status(500).json({ message: 'Server error fetching history' });
  }
};

// Controller to update customer profile
export const updateCustomerProfile = (db) => async (req, res) => {
  if (!req.user || !req.user.user_id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const userId = req.user.user_id;
  const { firstName, lastName, contact, barangay, street, blockLot, landmark } = req.body;

  const sql = `UPDATE customers_profiles SET
    firstName = ?,
    lastName = ?,
    contact = ?,
    barangay = ?,
    street = ?,
    blockLot = ?,
    landmark = ?
    WHERE user_id = ?`;

  const values = [firstName, lastName, contact, barangay, street, blockLot, landmark, userId];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('Error updating profile:', err);
      return res.status(500).json({ success: false, message: 'Server error updating profile' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'User profile not found' });
    }

    // Fetch updated user data with profile join
    const selectSql = `
      SELECT u.user_id, u.email, u.role, cp.firstName, cp.lastName, cp.contact, cp.barangay, cp.street, cp.blockLot, cp.landmark
      FROM users u
      LEFT JOIN customers_profiles cp ON u.user_id = cp.user_id
      WHERE u.user_id = ?
    `;
    db.query(selectSql, [userId], (err, userResult) => {
      if (err) {
        console.error('Error fetching updated user:', err);
        return res.status(500).json({ success: false, message: 'Profile updated but error fetching data' });
      }

      res.json({ success: true, user: userResult[0] });
    });
  });
};

// Controller to get customer profile
export const getCustomerProfile = (db) => async (req, res) => {
  if (!req.user || !req.user.user_id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const userId = req.user.user_id;

  const sql = `
    SELECT u.user_id, u.email, u.role, cp.firstName, cp.lastName, cp.contact, cp.barangay, cp.street, cp.blockLot, cp.landmark
    FROM users u
    LEFT JOIN customers_profiles cp ON u.user_id = cp.user_id
    WHERE u.user_id = ?
  `;
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

// Controller to submit GCash payment proof for customer
export const submitCustomerGcashPayment = (db) => async (req, res) => {
  const orderId = req.params.id;
  const { reference_id, payment_proof } = req.body;
  const serviceOrderModel = new ServiceOrder(db);

  try {
    const userId = req.user.user_id;
    const order = await serviceOrderModel.getById(orderId, userId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.payment_method !== 'gcash') {
      return res.status(400).json({ message: 'Order payment method is not GCash' });
    }

    await serviceOrderModel.submitPaymentProof(orderId, payment_proof, reference_id);

    // Send email notification to admin
    try {
      const { sendGcashPaymentNotificationEmail } = await import('../utils/gcashEmail.js');
      await sendGcashPaymentNotificationEmail(order, reference_id, payment_proof);
      console.log('✅ GCash payment notification email sent to admin');
    } catch (emailError) {
      console.error('❌ Error sending GCash payment email:', emailError.message);
    }

    res.json({ message: 'GCash payment proof submitted successfully' });
  } catch (error) {
    console.error('Error submitting GCash payment:', error);
    res.status(500).json({ message: 'Server error submitting payment' });
  }
};

// Controller to update customer order (for editing)
export const updateCustomerOrder = (db) => async (req, res) => {
  const orderId = req.params.id;
  const updateData = req.body;
  const serviceOrderModel = new ServiceOrder(db);

  try {
    const userId = req.user.user_id;
    const order = await serviceOrderModel.getById(orderId, userId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Only allow updates for pending orders
    if (order.status !== 'pending_booking') {
      return res.status(400).json({ message: 'Only pending booking orders can be updated' });
    }

    // Filter to only allow updating order-related fields
    const allowedFields = [
      'service_type',
      'dry_cleaning_services',
      'pickup_date',
      'pickup_time',
      'load_count',
      'instructions',
      'service_option',
      'delivery_fee',
      'payment_method'
    ];

    const filteredUpdateData = {};
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        filteredUpdateData[field] = updateData[field];
      }
    }

    // Remove status from filteredUpdateData to prevent accidental status changes
    delete filteredUpdateData.status;

    // Validate service_type if provided
    if (updateData.service_type && !['fullService', 'washDryFold', 'washFold', 'dryCleaning', 'hangDry'].includes(updateData.service_type)) {
      return res.status(400).json({ error: 'Invalid service_type value' });
    }

    // Check booking limit for new date if pickup_date is being changed
    if (updateData.pickup_date && updateData.pickup_date !== order.pickup_date) {
      const countSql = `
        SELECT count, limit_count
        FROM booking_counts
        WHERE date = ?
      `;
      const [countResults] = await db.promise().query(countSql, [updateData.pickup_date]);
      const count = countResults.length > 0 ? countResults[0].count : 0;
      const limit = countResults.length > 0 ? countResults[0].limit_count : 3;

      if (count >= limit) {
        return res.status(400).json({ message: 'This day is fully booked. Maximum 3 bookings per day allowed.' });
      }
    }

    // Check if user already has a booking for the new date and time (if both are being changed)
    if ((updateData.pickup_date && updateData.pickup_date !== order.pickup_date) ||
        (updateData.pickup_time && updateData.pickup_time !== order.pickup_time)) {
      const newDate = updateData.pickup_date || order.pickup_date;
      const newTime = updateData.pickup_time || order.pickup_time;

      const conflictSql = `
        SELECT so.service_orders_id
        FROM service_orders so
        LEFT JOIN customers_profiles cp ON so.customer_id = cp.customer_id
        WHERE cp.user_id = ? AND so.pickup_date = ? AND so.pickup_time = ?
        AND so.status NOT IN ('completed', 'cancelled', 'rejected')
        AND so.moved_to_history_at IS NULL
        AND so.is_deleted = FALSE
        AND so.service_orders_id != ?
      `;
      const [conflictResults] = await db.promise().query(conflictSql, [
        userId,
        newDate,
        newTime,
        orderId
      ]);

      if (conflictResults.length > 0) {
        return res.status(400).json({
          message: 'You already have a booking at this date and time. Please choose a different date or time slot.'
        });
      }
    }

    // Recalculate total price to ensure accuracy (similar to createCustomerBooking)
    const loadCount = Math.min(updateData.load_count || order.load_count || 1, 5);
    const serviceType = updateData.service_type || order.service_type;
    const mainServicePrice = serviceType === 'fullService' ? 199 :
                            serviceType === 'washDryFold' ? 179 :
                            serviceType === 'washFold' ? 150 :
                            serviceType === 'dryCleaning' ? 0 : // Inspection required
                            serviceType === 'hangDry' ? 100 : 0;
    // Note: Dry cleaning prices vary by inspection, so not included in calculation
    const calculatedTotal = mainServicePrice * loadCount + (updateData.delivery_fee || order.delivery_fee || 0);

    const updatedOrder = await serviceOrderModel.update(orderId, {
      ...filteredUpdateData,
      total_price: calculatedTotal, // Always recalculate total_price for consistency
    });

    // Update booking counts if date changed
    if (updateData.pickup_date && updateData.pickup_date !== order.pickup_date) {
      try {
        // Decrement old date count
        const decrementSql = `
          UPDATE booking_counts
          SET count = GREATEST(count - 1, 0)
          WHERE date = ?
        `;
        await db.promise().query(decrementSql, [order.pickup_date]);

        // Increment new date count
        const incrementSql = `
          INSERT INTO booking_counts (date, count, limit_count)
          VALUES (?, 1, 3)
          ON DUPLICATE KEY UPDATE count = count + 1
        `;
        await db.promise().query(incrementSql, [updateData.pickup_date]);

        // Emit real-time updates for booking counts
        if (req.io) {
          req.io.emit('booking-counts-updated', { date: order.pickup_date, change: -1 });
          req.io.emit('booking-counts-updated', { date: updateData.pickup_date, change: 1 });
        }
      } catch (countError) {
        console.error('Error updating booking counts on date change:', countError);
        // Don't fail the update if count update fails
      }
    }

    // Emit real-time update
    if (req.io) {
      req.io.emit('order-updated', { orderId, userId, order: updatedOrder });
    }

    res.json({ message: 'Order updated successfully', order: updatedOrder });
  } catch (error) {
    console.error('Error updating customer order:', error);
    res.status(500).json({ message: 'Server error updating order' });
  }
};

// Controller to cancel customer order
export const cancelCustomerOrder = (db) => async (req, res) => {
  const orderId = req.params.id;
  const serviceOrderModel = new ServiceOrder(db);

  try {
    const userId = req.user.user_id;
    const order = await serviceOrderModel.getById(orderId, userId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Only allow cancellation for pending bookings
    if (order.status !== 'pending_booking') {
      return res.status(400).json({ message: 'Only pending bookings can be cancelled. Please contact support if you need to cancel an approved order.' });
    }

    await serviceOrderModel.update(orderId, { status: 'cancelled' });

    // Decrement booking count for the date
    try {
      const updateCountSql = `
        UPDATE booking_counts
        SET count = GREATEST(count - 1, 0)
        WHERE date = ?
      `;
      await db.promise().query(updateCountSql, [order.pickup_date]);
    } catch (countError) {
      console.error('Error updating booking count on cancellation:', countError);
      // Don't fail the cancellation if count update fails
    }

    // Emit real-time update
    if (req.io) {
      req.io.emit('order-updated', { orderId, userId, status: 'cancelled' });
      req.io.emit('booking-counts-updated', { date: order.pickup_date, change: -1 });
    }

    res.json({ message: 'Order cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling customer order:', error);
    res.status(500).json({ message: 'Server error cancelling order' });
  }
};
