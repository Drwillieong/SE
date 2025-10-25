import { Booking } from '../models/Booking.js';

// Controller to get all bookings
export const getAllBookings = (db) => async (req, res) => {
  const bookingModel = new Booking(db);
  try {
    let bookings;
    if (req.user.role === 'admin') {
      bookings = await bookingModel.getActiveBookings();
    } else {
      bookings = await bookingModel.getByUserId(req.user.user_id);
    }
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ message: 'Server error fetching bookings' });
  }
};

// Controller to get booking by ID
export const getBookingById = (db) => async (req, res) => {
  const bookingId = req.params.id;
  const bookingModel = new Booking(db);
  try {
    const booking = await bookingModel.getById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.json(booking);
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ message: 'Server error fetching booking' });
  }
};

// Controller to create a new booking
export const createBooking = (db) => async (req, res) => {
  const bookingData = req.body;

  // Validate mainService
  if (!bookingData.mainService || !['fullService', 'washDryFold'].includes(bookingData.mainService)) {
    return res.status(400).json({ error: 'Invalid mainService value' });
  }

  // Validate dryCleaningServices as array
  if (bookingData.dryCleaningServices && !Array.isArray(bookingData.dryCleaningServices)) {
    return res.status(400).json({ error: 'dryCleaningServices must be an array' });
  }

  const bookingModel = new Booking(db);

  // For non-admin users, check booking limit and use a transaction to prevent race conditions.
  // This helps prevent race conditions where two users book the last slot simultaneously.
  if (req.user.role !== 'admin') {
    try {
      const countSql = `
        SELECT COUNT(*) as count
        FROM bookings
        WHERE pickupDate = ? AND status NOT IN ('rejected', 'cancelled') AND is_deleted = FALSE AND moved_to_history_at IS NULL
      `;
      const [countResults] = await db.promise().query(countSql, [bookingData.pickupDate]);
      const count = countResults[0].count;

      if (count >= 3) {
        return res.status(400).json({ message: 'This day is fully booked. Maximum 3 bookings per day allowed.' });
      }

      // Use transaction to prevent race condition
      const counts = await new Promise((resolve, reject) => {
        db.beginTransaction((err) => {
          if (err) return reject(err);

          // Lock the bookings table for the specific date
          const sql = `
            SELECT COUNT(*) as count
            FROM bookings
            WHERE pickupDate = ? AND status NOT IN ('rejected', 'cancelled')
            AND moved_to_history_at IS NULL
            AND is_deleted = FALSE
            FOR UPDATE
          `;

          db.query(sql, [bookingData.pickupDate], (err, results) => {
            if (err) {
              db.rollback(() => reject(err));
              return;
            }

            const count = results[0].count;
            if (count >= 3) {
              db.rollback(() => resolve({ [bookingData.pickupDate]: count }));
              return;
            }

            // Proceed to create booking
            const {
              mainService,
              dryCleaningServices,
              pickupDate,
              pickupTime,
              loadCount,
              instructions,
              status,
              paymentMethod,
              name,
              contact,
              email,
              address,
              photos,
              totalPrice,
              serviceOption,
              deliveryFee,
              user_id
            } = bookingData;

            const insertSql = `INSERT INTO bookings
              (mainService, dryCleaningServices, pickupDate, pickupTime, loadCount, instructions, status, paymentMethod, name, contact, email, address, photos, totalPrice, serviceOption, deliveryFee, user_id, createdAt)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`;

            const photosJson = photos ? JSON.stringify(photos) : JSON.stringify([]);
            const dryCleaningJson = dryCleaningServices ? JSON.stringify(dryCleaningServices) : JSON.stringify([]);

            const values = [
              mainService,
              dryCleaningJson,
              pickupDate,
              pickupTime,
              loadCount,
              instructions,
              status || 'pending',
              paymentMethod,
              name,
              contact,
              email,
              address,
              photosJson,
              totalPrice,
              serviceOption || 'pickupAndDelivery',
              deliveryFee || 0,
              user_id
            ];

            db.query(insertSql, values, (err, result) => {
              if (err) {
                db.rollback(() => reject(err));
                return;
              }

              db.commit((err) => {
                if (err) {
                  db.rollback(() => reject(err));
                  return;
                }

                resolve({ bookingId: result.insertId });
              });
            });
          });
        });
      });

      if (counts[bookingData.pickupDate] >= 3) {
        return res.status(400).json({ message: 'This day is fully booked. Maximum 3 bookings per day allowed.' });
      }

    // Emit real-time update for booking counts after successful creation
    if (counts.bookingId && req.io) {
        req.io.emit('booking-counts-updated', { date: bookingData.pickupDate, change: 1 });
    }

      res.status(201).json({ message: 'Booking created successfully', bookingId: counts.bookingId });
    } catch (error) {
      console.error('Error creating booking for user:', error);
      res.status(500).json({ message: 'Server error creating booking' });
    }
  } else {
    // For admin users, check booking limit as well
    try {
      const countSql = `
        SELECT COUNT(*) as count
        FROM bookings WHERE pickupDate = ? AND status NOT IN ('rejected', 'cancelled') AND is_deleted = FALSE AND moved_to_history_at IS NULL
      `;

      const count = await new Promise((resolve, reject) => {
        db.query(countSql, [bookingData.pickupDate], (err, results) => {
          if (err) return reject(err);
          resolve(results[0].count);
        });
      });

      if (count >= 3) {
        return res.status(400).json({ message: 'This day is fully booked. Maximum 3 bookings per day allowed.' });
      }

      const bookingId = await bookingModel.create(bookingData);

      // Emit real-time update for booking counts
      if (bookingId && req.io) {
        req.io.emit('booking-counts-updated', { date: bookingData.pickupDate, change: 1 });
      }

      res.status(201).json({ message: 'Booking created successfully', bookingId });
    } catch (error) {
      console.error('Error creating booking for admin:', error);
      res.status(500).json({ message: 'Server error creating booking' });
    }
  }
};

// Controller to update booking status or details
export const updateBooking = (db) => async (req, res) => {
  const bookingId = req.params.id;
  const updates = req.body;
  const bookingModel = new Booking(db);

  // Validate rejectionReason if status is rejected
  if (updates.status === 'rejected' && (!updates.rejectionReason || updates.rejectionReason.trim() === '')) {
    return res.status(400).json({ message: 'Rejection reason is required when rejecting a booking' });
  }

  // Validate mainService if present
  if (updates.mainService && !['fullService', 'washDryFold'].includes(updates.mainService)) {
    return res.status(400).json({ error: 'Invalid mainService value' });
  }

  // Validate dryCleaningServices if present
  if (updates.dryCleaningServices && !Array.isArray(updates.dryCleaningServices)) {
    return res.status(400).json({ error: 'dryCleaningServices must be an array' });
  }

  try {
    // Get booking details before updating to send rejection email if needed
    let booking = null;
    if (updates.status === 'rejected') {
      booking = await bookingModel.getById(bookingId);
    }

    // Update the booking
    await bookingModel.update(bookingId, updates);

    // Send rejection email if status is rejected and we have booking details
    if (updates.status === 'rejected' && booking && booking.email) {
      try {
        const { sendRejectionEmail } = await import('../utils/email.js');
        await sendRejectionEmail(booking.email, booking.name, updates.rejectionReason);
        console.log('✅ Rejection email sent successfully to:', booking.email);
      } catch (emailError) {
        console.error('❌ Error sending rejection email:', emailError.message);
        // Don't fail the booking update if email fails, just log the error
        console.error('💡 Booking was rejected but email notification failed. This is not critical but should be investigated.');
      }
    }

    // Emit real-time update for booking counts if status changed to rejected or cancelled
    if ((updates.status === 'rejected' || updates.status === 'cancelled') && req.io) {
      // Get the updated booking to get the pickupDate
      const updatedBooking = await bookingModel.getById(bookingId);
      if (updatedBooking) {
        req.io.emit('booking-counts-updated', { date: updatedBooking.pickupDate, change: -1 });
      }
    }

    res.json({ message: 'Booking updated successfully' });
  } catch (error) {
    console.error('Error updating booking:', error);
    if (error.message === 'Booking not found') {
      return res.status(404).json({ message: 'Booking not found' });
    }
    if (error.message === 'No fields to update') {
      return res.status(400).json({ message: 'No fields to update' });
    }
    res.status(500).json({ message: 'Server error updating booking' });
  }
};

// Controller to delete a booking
export const deleteBooking = (db) => async (req, res) => {
  const bookingId = req.params.id;
  const bookingModel = new Booking(db);
  try {
    // Get booking details before deleting to emit update
    const booking = await bookingModel.getById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    await bookingModel.delete(bookingId);

    // Emit real-time update for booking counts
    if (req.io) {
      req.io.emit('booking-counts-updated', { date: booking.pickupDate, change: -1 });
    }

    res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    console.error('Error deleting booking:', error);
    if (error.message === 'Booking not found') {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.status(500).json({ message: 'Server error deleting booking' });
  }
};

// Controller to get bookings by status
export const getBookingsByStatus = (db) => async (req, res) => {
  const status = req.params.status;
  const bookingModel = new Booking(db);
  try {
    const bookings = await bookingModel.getByStatus(status);
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings by status:', error);
    res.status(500).json({ message: 'Server error fetching bookings' });
  }
};

// Controller to send pickup notification email
export const sendPickupEmail = (db) => async (req, res) => {
  const bookingId = req.params.id;
  const bookingModel = new Booking(db);

  try {
    // Get booking details
    const booking = await bookingModel.getById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if booking is approved
    if (booking.status !== 'approved') {
      return res.status(400).json({ message: 'Can only send pickup notification for approved bookings' });
    }

    // Import email function
    const { sendPickupEmail: sendEmail } = await import('../utils/email.js');

    // Send email
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

// Controller to send pickup notification SMS
export const sendPickupSMS = (db) => async (req, res) => {
  const bookingId = req.params.id;
  const bookingModel = new Booking(db);

  try {
    // Get booking details
    const booking = await bookingModel.getById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if booking is approved
    if (booking.status !== 'approved') {
      return res.status(400).json({ message: 'Can only send pickup notification for approved bookings' });
    }

    // Validate phone number
    const { validatePhoneNumber } = await import('../utils/sms.js');
    if (!validatePhoneNumber(booking.contact)) {
      return res.status(400).json({ message: 'Invalid phone number format' });
    }

    // Import SMS function
    const { sendPickupSMS: sendSMS } = await import('../utils/sms_philsms_v3.js');

    // Send SMS
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

// Controller to send both pickup notification email and SMS
export const sendPickupNotification = (db) => async (req, res) => {
  const bookingId = req.params.id;
  const bookingModel = new Booking(db);

  try {
    // Get booking details
    const booking = await bookingModel.getById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if booking is approved
    if (booking.status !== 'approved') {
      return res.status(400).json({ message: 'Can only send pickup notification for approved bookings' });
    }

    const results = {
      emailSent: false,
      smsSent: false,
      errors: []
    };

    // Try to send email if email is available
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

    // Try to send SMS if phone number is available
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

    // Check if at least one notification was sent successfully
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

// Controller to approve booking and convert to order
export const approveBooking = (db) => async (req, res) => {
  const bookingId = req.params.id;
  const bookingModel = new Booking(db);
  const { Order } = await import('../models/Order.js');

  try {
    // Get booking details
    const booking = await bookingModel.getById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if booking is pending
    if (booking.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending bookings can be approved' });
    }

    // Update booking status to approved
    await bookingModel.update(bookingId, { status: 'approved' });

    // Create order from booking
    const orderModel = new Order(db);
    const orderData = {
      serviceType: booking.mainService === 'fullService' ? 'washFold' : 'washFold', // Map to order service types
      pickupDate: booking.pickupDate,
      pickupTime: booking.pickupTime,
      loadCount: booking.loadCount,
      instructions: booking.instructions,
      status: 'pending', // Order starts as pending, waiting for payment
      paymentMethod: booking.paymentMethod,
      name: booking.name,
      contact: booking.contact,
      email: booking.email,
      address: booking.address,
      photos: booking.photos,
      totalPrice: booking.totalPrice,
      user_id: booking.user_id, // This is the crucial field
      bookingId: bookingId, // Reference to original booking
      // Laundry details from booking
      estimatedClothes: booking.loadCount * 10, // Rough estimate
      kilos: booking.loadCount * 5, // Rough estimate
      serviceOption: booking.serviceOption,
      deliveryFee: booking.deliveryFee
    };

    const orderId = await orderModel.create(orderData);

    // Mark booking as completed since it's now converted to order
    await bookingModel.update(bookingId, { status: 'completed' });

    // Emit real-time update for booking counts (decrement since booking is completed)
    if (req.io) {
      req.io.emit('booking-counts-updated', { date: booking.pickupDate, change: -1 });
    }

    // Send approval email with payment reminder
    if (booking.email) {

      try {
        const { sendBookingApprovalEmail } = await import('../utils/email.js');

        // Prepare laundry details string
        let laundryDetails = `${booking.loadCount} load(s)`;
        if (booking.dryCleaningServices && booking.dryCleaningServices.length > 0) {
          laundryDetails += ` + ${booking.dryCleaningServices.length} dry cleaning item(s)`;
        }

        await sendBookingApprovalEmail(
          booking.email,
          booking.name,
          orderId,
          booking.totalPrice,
          orderData.serviceType,
          laundryDetails
        );
        console.log('✅ Booking approval email sent successfully to:', booking.email);
      } catch (emailError) {
        console.error('❌ Error sending approval email:', emailError.message);
        // Don't fail the approval if email fails, just log the error
      }
    }

    // Emit real-time notification
    if (req.io && booking.user_id) {
      req.io.to(`user_${booking.user_id}`).emit('booking-approved', {
        bookingId,
        orderId,
        message: 'Your booking has been approved and converted to an order. Please complete payment.',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      message: 'Booking approved and converted to order successfully',
      bookingId,
      orderId,
      totalPrice: booking.totalPrice
    });

  } catch (error) {
    console.error('Error approving booking:', error);
    res.status(500).json({ message: 'Server error approving booking' });
  }
};

// Controller to get booking counts for specific dates
export const getBookingCounts = (db) => async (req, res) => {
  const { dates } = req.body; // Expect array of date strings in YYYY-MM-DD format
  const bookingModel = new Booking(db);

  if (!dates || !Array.isArray(dates)) {
    return res.status(400).json({ message: 'Dates array is required' });
  }

  try {
    const counts = await bookingModel.getBookingCountsForDates(dates);
    res.json(counts);
  } catch (error) {
    console.error('Error fetching booking counts:', error);
    res.status(500).json({ message: 'Server error fetching booking counts' });
  }
};
