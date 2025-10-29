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
      SELECT * FROM service_orders
      WHERE user_id = ? AND status = 'pending_booking'
      AND moved_to_history_at IS NULL
      AND is_deleted = FALSE
      ORDER BY created_at DESC
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

    // Get all orders including pending bookings
    const sql = `
      SELECT * FROM service_orders
      WHERE user_id = ? AND moved_to_history_at IS NULL AND is_deleted = FALSE
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    const [results] = await db.promise().query(sql, [userId, limit, offset]);

    // Get total count
    const countSql = `
      SELECT COUNT(*) as count FROM service_orders
      WHERE user_id = ? AND moved_to_history_at IS NULL AND is_deleted = FALSE
    `;
    const [countResults] = await db.promise().query(countSql, [userId]);
    const totalCount = countResults[0].count;

    const transformedOrders = results.map(order => {
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
        laundry_photos: (() => {
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
        payment_status: order.payment_status || 'unpaid',
        service_orders_id: order.service_orders_id,
        status: order.status || 'pending',
        totalPrice: order.total_price || 0,
        load_count: loadCount,
        kilos: order.kilos || 0,
        estimated_clothes: order.estimated_clothes || 0
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

  // Check booking limit for the date (3 bookings per day)
  if (req.user.role !== 'admin') {
    try {
      const countSql = `
        SELECT COUNT(*) as count
        FROM service_orders
        WHERE pickup_date = ? AND status NOT IN ('rejected', 'cancelled', 'completed')
        AND moved_to_history_at IS NULL
        AND is_deleted = FALSE
      `;
      const [countResults] = await db.promise().query(countSql, [bookingData.pickup_date]);
      const count = countResults[0].count;

      if (count >= 3) {
        return res.status(400).json({ message: 'This day is fully booked. Maximum 3 bookings per day allowed.' });
      }
    } catch (error) {
      console.error('Error checking booking limit:', error);
      return res.status(500).json({ message: 'Server error checking booking limit' });
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

    const orderData = {
      user_id: req.user.user_id,
      name: bookingData.name,
      contact: bookingData.contact,
      email: bookingData.email || '',
      address: bookingData.address,
      service_type: bookingData.service_type,
      dry_cleaning_services: bookingData.dry_cleaning_services || [],
      pickup_date: bookingData.pickup_date,
      pickup_time: bookingData.pickup_time,
      load_count: loadCount,
      instructions: bookingData.instructions || '',
      total_price: calculatedTotal,
      payment_method: bookingData.payment_method || 'cash',
      photos: bookingData.photos || [],
      service_option: bookingData.service_option || 'pickupAndDelivery',
      delivery_fee: bookingData.delivery_fee || 0,
      status: 'pending_booking'
    };

    const orderId = await serviceOrderModel.create(orderData);

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

// Controller to get customer booking counts for dates
export const getCustomerBookingCounts = (db) => async (req, res) => {
  if (!req.user || !req.user.user_id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { dates } = req.query;
  const serviceOrderModel = new ServiceOrder(db);

  if (!dates || !Array.isArray(dates)) {
    return res.status(400).json({ message: 'Dates array is required' });
  }

  try {
    const counts = await serviceOrderModel.getOrderCountsForDates(dates);
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
    // Get completed, rejected, or cancelled orders for this user
    const sql = `
      SELECT * FROM service_orders
      WHERE user_id = ? AND status IN ('completed', 'rejected', 'cancelled')
      ORDER BY updated_at DESC
    `;
    const history = await new Promise((resolve, reject) => {
      db.query(sql, [userId], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    res.json(history);
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

// Controller to get customer profile
export const getCustomerProfile = (db) => async (req, res) => {
  if (!req.user || !req.user.user_id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

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

    // Remove status from updateData to prevent accidental status changes
    delete updateData.status;

    // Validate service_type if provided
    if (updateData.service_type && !['fullService', 'washDryFold', 'washFold', 'dryCleaning', 'hangDry'].includes(updateData.service_type)) {
      return res.status(400).json({ error: 'Invalid service_type value' });
    }

    // Check booking limit for new date if pickup_date is being changed
    if (updateData.pickup_date && updateData.pickup_date !== order.pickup_date) {
      const countSql = `
        SELECT COUNT(*) as count
        FROM service_orders
        WHERE pickup_date = ? AND status NOT IN ('rejected', 'cancelled', 'completed')
        AND moved_to_history_at IS NULL
        AND is_deleted = FALSE
        AND service_orders_id != ?
      `;
      const [countResults] = await db.promise().query(countSql, [updateData.pickup_date, orderId]);
      const count = countResults[0].count;

      if (count >= 3) {
        return res.status(400).json({ message: 'This day is fully booked. Maximum 3 bookings per day allowed.' });
      }
    }

    const updatedOrder = await serviceOrderModel.update(orderId, {
      ...updateData,
      total_price: updateData.total_price, // Ensure total_price is passed correctly
    });

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

    // Emit real-time update
    if (req.io) {
      req.io.emit('order-updated', { orderId, userId, status: 'cancelled' });
    }

    res.json({ message: 'Order cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling customer order:', error);
    res.status(500).json({ message: 'Server error cancelling order' });
  }
};
