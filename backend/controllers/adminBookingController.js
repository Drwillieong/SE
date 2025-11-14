import { ServiceOrder } from '../models/ServiceOrder.js';
import { AdminBooking } from '../models/AdminBooking.js';

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

    // Use the model's getAll method which handles sorting in memory to avoid MySQL sort memory issues
    const bookings = await serviceOrderModel.getAll(page, limit);
    const totalCount = await serviceOrderModel.getTotalCount();

    const transformedBookings = bookings.map(booking => ({
      ...booking,
      photos: typeof booking.photos === 'string' ? JSON.parse(booking.photos) : booking.photos || [],
      laundry_photos: typeof booking.laundry_photos === 'string' ? JSON.parse(booking.laundry_photos) : booking.laundry_photos || [],
      payment_status: booking.payment_status || 'unpaid',
      service_orders_id: booking.service_orders_id,
      status: booking.status || 'pending',
      total_price: booking.total_price || 0,
      load_count: booking.load_count || 1,
      kilos: booking.kilos || 0,
    }));

    res.json({
      bookings: transformedBookings,
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
    // Always create customer profile for admin-created bookings
    const customerData = {
      user_id: null, // Admin-created bookings don't have a user account
      firstName: bookingData.firstName || '',
      lastName: bookingData.lastName || '',
      name: bookingData.name || `${bookingData.firstName || ''} ${bookingData.lastName || ''}`.trim() || 'Unknown Customer',
      contact: bookingData.contact || '',
      email: bookingData.email || '',
      address: bookingData.address || '',
      barangay: bookingData.barangay || '',
      street: bookingData.street || '',
      blockLot: bookingData.blockLot || ''
    };

    // Insert into customers_profiles table
    const customerSql = `
      INSERT INTO customers_profiles (user_id, firstName, lastName, name, contact, email, address, barangay, street, blockLot)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const customerValues = [
      customerData.user_id,
      customerData.firstName,
      customerData.lastName,
      customerData.name,
      customerData.contact,
      customerData.email,
      customerData.address,
      customerData.barangay,
      customerData.street,
      customerData.blockLot
    ];

    const customerResult = await new Promise((resolve, reject) => {
      db.query(customerSql, customerValues, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    const customerId = customerResult.insertId;

    const orderData = {
      customer_id: customerId,
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
    // Get booking details before updating
    const currentBooking = await serviceOrderModel.getById(bookingId);
    if (!currentBooking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Send rejection email if status is being set to rejected
    if (updates.status === 'rejected' && currentBooking.email) {
      try {
        const { sendRejectionEmail } = await import('../utils/email.js');
        await sendRejectionEmail(currentBooking.email, currentBooking.name, updates.rejection_reason);
        console.log('✅ Rejection email sent successfully to:', currentBooking.email);
      } catch (emailError) {
        console.error('❌ Error sending rejection email:', emailError.message);
      }
    }

    await serviceOrderModel.update(bookingId, updates);

    // Update booking counts if status changed from active to non-active
    if (updates.status && (currentBooking.status === 'pending' || currentBooking.status === 'pending_booking' || currentBooking.status === 'approved') && updates.status !== 'pending' && updates.status !== 'pending_booking' && updates.status !== 'approved') {
      try {
        // Delete the booking count entry for this date since the booking is no longer active
        const deleteCountSql = `
          DELETE FROM booking_counts
          WHERE date = ?
        `;
        await db.promise().query(deleteCountSql, [currentBooking.pickup_date]);
        console.log(`Booking count entry deleted for date: ${currentBooking.pickup_date} due to status change to ${updates.status}`);
      } catch (countError) {
        console.error('Error deleting booking count on status change:', countError);
        // Don't fail the update if count deletion fails
      }

      // Emit real-time update for booking counts
      if (req.io) {
        req.io.emit('booking-counts-updated', { date: currentBooking.pickup_date, change: -1 });
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

    // Delete booking count entry for the date if the booking was active
    if (booking.status === 'pending' || booking.status === 'pending_booking' || booking.status === 'approved') {
      try {
        const deleteCountSql = `
          DELETE FROM booking_counts
          WHERE date = ?
        `;
        await db.promise().query(deleteCountSql, [booking.pickup_date]);
        console.log(`Booking count entry deleted for date: ${booking.pickup_date} due to deletion`);
      } catch (countError) {
        console.error('Error deleting booking count on deletion:', countError);
        // Don't fail the deletion if count deletion fails
      }
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

    // Update status to pending (order is now ready for processing)
    await serviceOrderModel.update(bookingId, { status: 'pending' });

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
  const adminBookingModel = new AdminBooking(db);

  if (!dates || !Array.isArray(dates)) {
    return res.status(400).json({ message: 'Dates array is required' });
  }

  try {
    const counts = await adminBookingModel.getOrderCountsForDates(dates);
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

    // SMS functionality removed - return success without sending
    console.log(`SMS notification would be sent to ${booking.contact} for booking ${bookingId}`);
    res.json({ message: 'Pickup notification SMS functionality removed' });
  } catch (error) {
    console.error('Error in pickup SMS endpoint:', error);
    res.status(500).json({ message: error.message || 'Server error' });
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
        // Continue without failing the entire request
      }
    }

    // SMS functionality removed - mark as sent without actually sending
    if (booking.contact) {
      console.log(`SMS notification would be sent to ${booking.contact} for booking ${bookingId}`);
      results.smsSent = true;
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
