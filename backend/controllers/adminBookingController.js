import { ServiceOrder } from '../models/ServiceOrder.js';

// Controller to get a welcome message for the bookings API
export const getWelcomeMessage = (db) => async (req, res) => {
  try {
    // Log request metadata
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - Welcome endpoint accessed`);

    res.json({ message: 'Welcome to the Bookings API' });
  } catch (error) {
    console.error('Error in welcome endpoint:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Controller to get all bookings for admin
export const getAllBookings = (db) => async (req, res) => {
  const serviceOrderModel = new ServiceOrder(db);
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    // Get all active bookings (including customer bookings)
    const sql = `
      SELECT * FROM service_orders
      WHERE is_deleted = FALSE
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    const offset = (page - 1) * limit;
    const bookings = await new Promise((resolve, reject) => {
      db.query(sql, [limit, offset], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    const totalCount = await new Promise((resolve, reject) => {
      db.query('SELECT COUNT(*) as total FROM service_orders WHERE is_deleted = FALSE', (err, results) => {
        if (err) reject(err);
        else resolve(results[0].total);
      });
    });

    res.json({
      bookings,
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
    console.error('Error fetching bookings:', error);
    res.status(500).json({ message: 'Server error fetching bookings' });
  }
};

// Controller to get booking by ID for admin
export const getBookingById = (db) => async (req, res) => {
  const bookingId = req.params.id;
  const serviceOrderModel = new ServiceOrder(db);
  try {
    const booking = await serviceOrderModel.getById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.json(booking);
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ message: 'Server error fetching booking' });
  }
};

// Controller to create booking for admin (no limits)
export const createAdminBooking = (db) => async (req, res) => {
  const bookingData = req.body;

  // Validate service_type
  if (!bookingData.service_type || !['fullService', 'washDryFold', 'washFold', 'dryCleaning', 'hangDry'].includes(bookingData.service_type)) {
    return res.status(400).json({ error: 'Invalid service_type value' });
  }

  const serviceOrderModel = new ServiceOrder(db);

  try {
    const orderData = {
      user_id: bookingData.user_id || null,
      name: bookingData.name,
      contact: bookingData.contact,
      email: bookingData.email || '',
      address: bookingData.address,
      service_type: bookingData.service_type,
      dry_cleaning_services: bookingData.dry_cleaning_services || [],
      pickup_date: bookingData.pickup_date,
      pickup_time: bookingData.pickup_time,
      load_count: bookingData.load_count || 1,
      instructions: bookingData.instructions || '',
      total_price: bookingData.total_price || 0,
      payment_method: bookingData.payment_method || 'cash',
      photos: bookingData.photos || [],
      status: bookingData.status || 'pending'
    };

    const orderId = await serviceOrderModel.create(orderData);

    // Emit real-time update for booking counts
    if (req.io) {
      req.io.emit('booking-counts-updated', { date: bookingData.pickup_date, change: 1 });
    }

    res.status(201).json({ message: 'Booking created successfully', orderId });
  } catch (error) {
    console.error('Error creating admin booking:', error);
    res.status(500).json({ message: 'Server error creating booking' });
  }
};

// Controller to update booking status or details for admin
export const updateBooking = (db) => async (req, res) => {
  const bookingId = req.params.id;
  const updates = req.body;
  const serviceOrderModel = new ServiceOrder(db);

  // Validate rejectionReason if status is rejected
  if (updates.status === 'rejected' && (!updates.rejection_reason || updates.rejection_reason.trim() === '')) {
    return res.status(400).json({ message: 'Rejection reason is required when rejecting a booking' });
  }

  // Validate service_type if present
  if (updates.service_type && !['fullService', 'washDryFold', 'washFold', 'dryCleaning', 'hangDry'].includes(updates.service_type)) {
    return res.status(400).json({ error: 'Invalid service_type value' });
  }

  try {
    // Get booking details before updating to send rejection email if needed
    let booking = null;
    if (updates.status === 'rejected') {
      booking = await serviceOrderModel.getById(bookingId);
    }

    await serviceOrderModel.update(bookingId, updates);

    // Send rejection email if status is rejected and we have booking details
    if (updates.status === 'rejected' && booking && booking.email) {
      try {
        const { sendRejectionEmail } = await import('../utils/email.js');
        await sendRejectionEmail(booking.email, booking.name, updates.rejection_reason);
        console.log('✅ Rejection email sent successfully to:', booking.email);
      } catch (emailError) {
        console.error('❌ Error sending rejection email:', emailError.message);
      }
    }

    // Emit real-time update for booking counts if status changed to rejected or cancelled
    if ((updates.status === 'rejected' || updates.status === 'cancelled') && req.io) {
      const updatedBooking = await serviceOrderModel.getById(bookingId);
      if (updatedBooking) {
        req.io.emit('booking-counts-updated', { date: updatedBooking.pickup_date, change: -1 });
      }
    }

    res.json({ message: 'Booking updated successfully' });
  } catch (error) {
    console.error('Error updating booking:', error);
    if (error.message === 'Service order not found') {
      return res.status(404).json({ message: 'Booking not found' });
    }
    if (error.message === 'No fields to update') {
      return res.status(400).json({ message: 'No fields to update' });
    }
    res.status(500).json({ message: 'Server error updating booking' });
  }
};

// Controller to delete booking for admin
export const deleteBooking = (db) => async (req, res) => {
  const bookingId = req.params.id;
  const serviceOrderModel = new ServiceOrder(db);
  try {
    const booking = await serviceOrderModel.getById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    await serviceOrderModel.delete(bookingId);

    // Emit real-time update for booking counts
    if (req.io) {
      req.io.emit('booking-counts-updated', { date: booking.pickup_date, change: -1 });
    }

    res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    console.error('Error deleting booking:', error);
    if (error.message === 'Service order not found') {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.status(500).json({ message: 'Server error deleting booking' });
  }
};

// Controller to get bookings by status for admin
export const getBookingsByStatus = (db) => async (req, res) => {
  const status = req.params.status;
  const serviceOrderModel = new ServiceOrder(db);
  try {
    const bookings = await serviceOrderModel.getByStatus(status);
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings by status:', error);
    res.status(500).json({ message: 'Server error fetching bookings' });
  }
};

// Controller to approve booking and convert to order for admin
export const approveBooking = (db) => async (req, res) => {
  const bookingId = req.params.id;
  const serviceOrderModel = new ServiceOrder(db);

  try {
    const booking = await serviceOrderModel.getById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending bookings can be approved' });
    }

    // Update status to approved
    await serviceOrderModel.update(bookingId, { status: 'approved' });

    // Send approval email with payment reminder
    if (booking.email) {
      try {
        const { sendBookingApprovalEmail } = await import('../utils/email.js');

        let laundryDetails = `${booking.load_count} load(s)`;
        if (booking.dry_cleaning_services && booking.dry_cleaning_services.length > 0) {
          laundryDetails += ` + ${booking.dry_cleaning_services.length} dry cleaning item(s)`;
        }

        await sendBookingApprovalEmail(
          booking.email,
          booking.name,
          bookingId,
          booking.total_price,
          booking.service_type,
          laundryDetails
        );
        console.log('✅ Booking approval email sent successfully to:', booking.email);
      } catch (emailError) {
        console.error('❌ Error sending approval email:', emailError.message);
      }
    }

    // Emit real-time notification
    if (req.io && booking.user_id) {
      req.io.to(`user_${booking.user_id}`).emit('booking-approved', {
        bookingId,
        orderId: bookingId,
        message: 'Your booking has been approved and converted to an order. Please complete payment.',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      message: 'Booking approved successfully',
      bookingId,
      totalPrice: booking.total_price
    });

  } catch (error) {
    console.error('Error approving booking:', error);
    res.status(500).json({ message: 'Server error approving booking' });
  }
};

// Controller to get booking counts for specific dates for admin
export const getBookingCounts = (db) => async (req, res) => {
  const { dates } = req.body;
  const serviceOrderModel = new ServiceOrder(db);

  if (!dates || !Array.isArray(dates)) {
    return res.status(400).json({ message: 'Dates array is required' });
  }

  try {
    const counts = await serviceOrderModel.getOrderCountsForDates(dates);
    res.json(counts);
  } catch (error) {
    console.error('Error fetching booking counts:', error);
    res.status(500).json({ message: 'Server error fetching booking counts' });
  }
};

// Controller to send pickup notification email for admin
export const sendPickupEmail = (db) => async (req, res) => {
  const bookingId = req.params.id;
  const serviceOrderModel = new ServiceOrder(db);

  try {
    const booking = await serviceOrderModel.getById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.status !== 'approved') {
      return res.status(400).json({ message: 'Can only send pickup notification for approved bookings' });
    }

    const { sendPickupEmail: sendEmail } = await import('../utils/email.js');
    await sendEmail(booking.email, booking.name, booking.address);

    res.json({ message: 'Pickup notification email sent successfully' });
  } catch (error) {
    console.error('Error sending pickup email:', error);
    if (error.message === 'Email transporter not configured') {
      return res.status(500).json({ message: 'Email service not configured' });
    }
    res.status(500).json({ message: error.message || 'Server error sending pickup email' });
  }
};

// Controller to send pickup notification SMS for admin
export const sendPickupSMS = (db) => async (req, res) => {
  const bookingId = req.params.id;
  const serviceOrderModel = new ServiceOrder(db);

  try {
    const booking = await serviceOrderModel.getById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.status !== 'approved') {
      return res.status(400).json({ message: 'Can only send pickup notification for approved bookings' });
    }

    const { validatePhoneNumber } = await import('../utils/sms.js');
    if (!validatePhoneNumber(booking.contact)) {
      return res.status(400).json({ message: 'Invalid phone number format' });
    }

    const { sendPickupSMS: sendSMS } = await import('../utils/sms_philsms_v3.js');
    await sendSMS(booking.contact, booking.name, booking.address);

    res.json({ message: 'Pickup notification SMS sent successfully' });
  } catch (error) {
    console.error('Error sending pickup SMS:', error);
    if (error.message === 'SMS service not configured') {
      return res.status(500).json({ message: 'SMS service not configured' });
    }
    res.status(500).json({ message: error.message || 'Server error sending pickup SMS' });
  }
};

// Controller to send both pickup notification email and SMS for admin
export const sendPickupNotification = (db) => async (req, res) => {
  const bookingId = req.params.id;
  const serviceOrderModel = new ServiceOrder(db);

  try {
    const booking = await serviceOrderModel.getById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.status !== 'approved') {
      return res.status(400).json({ message: 'Can only send pickup notification for approved bookings' });
    }

    const results = {
      emailSent: false,
      smsSent: false,
      errors: []
    };

    // Try to send email
    if (booking.email) {
      try {
        const { sendPickupEmail: sendEmail } = await import('../utils/email.js');
        await sendEmail(booking.email, booking.name, booking.address);
        results.emailSent = true;
      } catch (emailError) {
        console.error('Email sending failed:', emailError.message);
        results.errors.push(`Email: ${emailError.message}`);
      }
    }

    // Try to send SMS
    if (booking.contact) {
      try {
        const { validatePhoneNumber, sendPickupSMS: sendSMS } = await import('../utils/sms_philsms_v3.js');

        if (validatePhoneNumber(booking.contact)) {
          await sendSMS(booking.contact, booking.name, booking.address);
          results.smsSent = true;
        } else {
          results.errors.push('SMS: Invalid phone number format');
        }
      } catch (smsError) {
        console.error('SMS sending failed:', smsError.message);
        results.errors.push(`SMS: ${smsError.message}`);
      }
    }

    if (results.emailSent || results.smsSent) {
      const successMessage = [];
      if (results.emailSent) successMessage.push('email');
      if (results.smsSent) successMessage.push('SMS');

      res.json({
        message: `Pickup notification sent successfully via ${successMessage.join(' and ')}`,
        results: results
      });
    } else {
      res.status(500).json({
        message: 'Failed to send any pickup notifications',
        results: results
      });
    }
  } catch (error) {
    console.error('Error sending pickup notifications:', error);
    res.status(500).json({ message: error.message || 'Server error sending pickup notifications' });
  }
};
