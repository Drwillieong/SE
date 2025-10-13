import { Order } from '../models/Order.js';
import { Booking } from '../models/Booking.js';

// Controller to get order statistics
export const getOrderStats = (db) => async (req, res) => {
  const orderModel = new Order(db);
  try {
    const stats = await orderModel.getDashboardStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching order stats:', error);
    res.status(500).json({ message: 'Server error fetching order stats' });
  }
};

// Auto-advance status endpoint (called by client when timer expires OR by server cron)
export const autoAdvanceOrder = (db) => async (req, res) => {
  const orderId = req.params.id;
  const orderModel = new Order(db);
  try {
    const order = await orderModel.getById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Determine next stage based on processStage or status
    const current = order.processStage || order.status || 'pending';
    const seq = ['pending','washing','drying','folding','ready'];
    const idx = seq.indexOf(current);
    const next = (idx >= 0 && idx < seq.length - 1) ? seq[idx + 1] : seq[seq.length - 1];

    // Update both processStage and status to keep things consistent
    await orderModel.update(orderId, { processStage: next, status: next });

    res.json({ message: 'Order advanced', next });
  } catch (error) {
    console.error('Error auto-advancing order:', error);
    res.status(500).json({ message: 'Server error auto-advancing order' });
  }
};

// Controller to get all orders with pagination
export const getAllOrders = (db) => async (req, res) => {
  const orderModel = new Order(db);
  try {
    // Parse pagination parameters from query string
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    // Validate pagination parameters
    if (page < 1) {
      return res.status(400).json({ message: 'Page must be greater than 0' });
    }
    if (limit < 1 || limit > 100) {
      return res.status(400).json({ message: 'Limit must be between 1 and 100' });
    }

    // Get user ID from authenticated user
    const userId = req.user ? req.user.user_id : null;

    // Get paginated orders and total count
    const [orders, totalCount] = await Promise.all([
      orderModel.getAll(page, limit, userId),
      userId ? orderModel.getTotalCountByUser(userId) : orderModel.getTotalCount()
    ]);

    // Ensure photos and laundryPhoto are parsed correctly
    const transformedOrders = orders.map(order => ({
      ...order,
      photos: typeof order.photos === 'string' ? JSON.parse(order.photos) : order.photos || [],
      laundryPhoto: typeof order.laundryPhoto === 'string' ? JSON.parse(order.laundryPhoto) : order.laundryPhoto || [],
    }));

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      orders: transformedOrders, // Send the transformed orders directly
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage,
        hasPrevPage
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Server error fetching orders' });
  }
};

// Controller to get order by ID
export const getOrderById = (db) => async (req, res) => {
  const orderId = req.params.id;
  const orderModel = new Order(db);
  try {
    // Get user ID from authenticated user
    const userId = req.user ? req.user.user_id : null;

    const order = await orderModel.getById(orderId, userId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Server error fetching order' });
  }
};

// Controller to create a new order
export const createOrder = (db) => async (req, res) => {
  const orderModel = new Order(db);
  try {
    // Map frontend mainService to backend serviceType
    let mappedServiceType = req.body.mainService || req.body.serviceType;
    if (mappedServiceType === 'washDryFold') {
      mappedServiceType = 'washFold';
    } else if (mappedServiceType === 'dryCleaning') {
      mappedServiceType = 'dryCleaning';
    } else if (mappedServiceType === 'hangDry') {
      mappedServiceType = 'hangDry';
    } else {
      mappedServiceType = 'washFold'; // default fallback
    }

    // Create order data with mapped serviceType
    const orderData = {
      ...req.body,
      serviceType: mappedServiceType
    };

    const orderId = await orderModel.create(orderData);

    // Emit WebSocket notification for new order
    if (req.io) {
      req.io.emit('order-created', {
        orderId,
        message: 'New order created',
        timestamp: new Date().toISOString()
      });

      // Also send to specific user if userId is provided
      if (req.body.userId) {
        req.io.to(`user_${req.body.userId}`).emit('your-order-created', {
          orderId,
          message: 'Your order has been created',
          timestamp: new Date().toISOString()
        });
      }
    }

    res.status(201).json({ message: 'Order created successfully', orderId });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Server error creating order' });
  }
};

// Controller to update order status or details
export const updateOrder = (db) => async (req, res) => {
  const orderId = req.params.id;
  const updates = req.body;
  const orderModel = new Order(db);

  try {
    // Get order before update for comparison
    const orderBefore = await orderModel.getById(orderId);
    if (!orderBefore) {
      return res.status(404).json({ message: 'Order not found' });
    }

    await orderModel.update(orderId, updates);

    // Get updated order
    const orderAfter = await orderModel.getById(orderId);

    // Emit WebSocket notification for order update
    if (req.io) {
      const notificationData = {
        orderId,
        previousStatus: orderBefore.status,
        newStatus: orderAfter.status,
        updates,
        timestamp: new Date().toISOString()
      };

      req.io.emit('order-status-changed', notificationData);

      // Also send to specific user if userId is provided
      if (orderAfter.user_id) {
        req.io.to(`user_${orderAfter.user_id}`).emit('your-order-updated', {
          orderId,
          previousStatus: orderBefore.status,
          newStatus: orderAfter.status,
          message: `Your order status has been updated to ${orderAfter.status}`,
          timestamp: new Date().toISOString()
        });
      }
    }

    res.json({ message: 'Order updated successfully' });
  } catch (error) {
    console.error('Error updating order:', error);
    if (error.message === 'Order not found') {
      return res.status(404).json({ message: 'Order not found' });
    }
    if (error.message === 'No fields to update') {
      return res.status(400).json({ message: 'No fields to update' });
    }
    res.status(500).json({ message: 'Server error updating order' });
  }
};

// Controller to delete an order
export const deleteOrder = (db) => async (req, res) => {
  const orderId = req.params.id;
  const orderModel = new Order(db);
  try {
    await orderModel.delete(orderId);

    // Emit WebSocket notification for order deletion
    if (req.io) {
      req.io.emit('order-deleted', {
        orderId,
        message: 'Order deleted',
        timestamp: new Date().toISOString()
      });
    }

    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    if (error.message === 'Order not found') {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.status(500).json({ message: 'Server error deleting order' });
  }
};

// Controller to get orders by status
export const getOrdersByStatus = (db) => async (req, res) => {
  const status = req.params.status;
  const orderModel = new Order(db);
  try {
    const orders = await orderModel.getByStatus(status);
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders by status:', error);
    res.status(500).json({ message: 'Server error fetching orders' });
  }
};

// Controller to create order from pickup details (admin only)
export const createOrderFromPickup = (db) => async (req, res) => {
  const orderModel = new Order(db);
  const bookingModel = new Booking(db);
  try {
    // Get user ID from authenticated user (for proper user association)
    const userId = req.user ? req.user.user_id : null;

    // Ensure all required fields are present and properly formatted
    // Map frontend serviceType to backend ENUM values
    let mappedServiceType = req.body.serviceType;
    if (mappedServiceType === 'washDryFold') {
      mappedServiceType = 'washFold';
    } else if (mappedServiceType === 'dryCleaning') {
      mappedServiceType = 'dryCleaning';
    } else if (mappedServiceType === 'hangDry') {
      mappedServiceType = 'hangDry';
    } else {
      mappedServiceType = 'washFold'; // default fallback
    }

    const orderData = {
      serviceType: mappedServiceType,
      pickupDate: req.body.pickupDate,
      pickupTime: req.body.pickupTime,
      loadCount: req.body.loadCount || 1,
      instructions: req.body.instructions || '',
      status: 'pending',
      paymentMethod: req.body.paymentMethod || 'cash',
      name: req.body.name,
      contact: req.body.contact,
      email: req.body.email || '',
      address: req.body.address,
      photos: req.body.photos || [],
      totalPrice: req.body.totalPrice || 0,
      user_id: userId, // Use authenticated user ID instead of req.body.userId
      estimatedClothes: req.body.estimatedClothes || 0,
      kilos: req.body.kilos || 0,
      laundryPhoto: req.body.laundryPhoto || [],
      bookingId: req.body.bookingId || req.body.booking_id || null
    };

    console.log('Creating order with data:', orderData);
    const orderId = await orderModel.create(orderData);
    console.log('Order created successfully with ID:', orderId);

    // Emit WebSocket notification for new order from pickup
    if (req.io) {
      const notificationData = {
        orderId,
        message: 'New order created from pickup',
        serviceType: mappedServiceType,
        userId: userId,
        timestamp: new Date().toISOString()
      };

      req.io.emit('order-created-from-pickup', notificationData);

      // Send to specific user if userId is provided
      if (userId) {
        req.io.to(`user_${userId}`).emit('your-booking-converted-to-order', {
          orderId,
          bookingId: req.body.bookingId,
          message: 'Your booking has been converted to an order',
          timestamp: new Date().toISOString()
        });
      }
    }

    // Mark the booking as converted to order if bookingId is provided (handle both bookingId and booking_id)
  const bookingId = parseInt(req.body.bookingId || req.body.booking_id);
    if (bookingId) {
      try {
        console.log('Moving booking to history as converted to order for booking ID:', bookingId);
        const updateResult = await bookingModel.moveToHistory(bookingId, 'converted_to_order');
        console.log('Booking move to history result:', updateResult);

        // Verify the update worked
        const updatedBooking = await bookingModel.getById(bookingId);
        console.log('Updated booking status:', updatedBooking ? updatedBooking.status : 'NOT FOUND');
        console.log('Updated booking moved_to_history_at:', updatedBooking ? updatedBooking.moved_to_history_at : 'NOT FOUND');

        // Emit WebSocket notification for booking conversion
        if (req.io) {
          req.io.emit('booking-converted-to-order', {
            bookingId: req.body.bookingId,
            orderId,
            message: 'Booking converted to order',
            timestamp: new Date().toISOString()
          });
        }

        console.log('Booking moved to history successfully');
      } catch (bookingError) {
        console.error('Error moving booking to history:', bookingError);
        // Don't fail the entire operation if booking update fails
      }
    }

    res.status(201).json({ message: 'Order created successfully from pickup', orderId });
  } catch (error) {
    console.error('Error creating order from pickup:', error);
    console.error(error.stack);
    res.status(500).json({ message: 'Server error creating order from pickup', error: error.message });
  }
};

// Timer Management Controllers

// Start timer for an order
export const startOrderTimer = (db) => async (req, res) => {
  const orderId = req.params.id;
  const { status } = req.body;
  const orderModel = new Order(db);

  try {
    const timerData = await orderModel.startTimer(orderId, status);

    // Emit WebSocket notification for timer start
    if (req.io) {
      req.io.emit('order-timer-started', {
        orderId,
        status,
        timerData,
        message: 'Order timer started',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      message: 'Timer started successfully',
      timerData
    });
  } catch (error) {
    console.error('Error starting timer:', error);
    if (error.message === 'Order not found') {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.status(500).json({ message: 'Server error starting timer' });
  }
};

// Stop timer for an order
export const stopOrderTimer = (db) => async (req, res) => {
  const orderId = req.params.id;
  const orderModel = new Order(db);

  try {
    await orderModel.stopTimer(orderId);

    // Emit WebSocket notification for timer stop
    if (req.io) {
      req.io.emit('order-timer-stopped', {
        orderId,
        message: 'Order timer stopped',
        timestamp: new Date().toISOString()
      });
    }

    res.json({ message: 'Timer stopped successfully' });
  } catch (error) {
    console.error('Error stopping timer:', error);
    if (error.message === 'Order not found') {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.status(500).json({ message: 'Server error stopping timer' });
  }
};

// Get timer status for an order
export const getOrderTimerStatus = (db) => async (req, res) => {
  const orderId = req.params.id;
  const orderModel = new Order(db);

  try {
    const timerStatus = await orderModel.getTimerStatus(orderId);
    res.json(timerStatus);
  } catch (error) {
    console.error('Error getting timer status:', error);
    res.status(500).json({ message: 'Server error getting timer status' });
  }
};

// Toggle auto-advance for an order
export const toggleOrderAutoAdvance = (db) => async (req, res) => {
  const orderId = req.params.id;
  const { enabled } = req.body;
  const orderModel = new Order(db);

  try {
    await orderModel.toggleAutoAdvance(orderId, enabled);

    // Emit WebSocket notification for auto-advance toggle
    if (req.io) {
      req.io.emit('order-auto-advance-toggled', {
        orderId,
        enabled,
        message: `Auto-advance ${enabled ? 'enabled' : 'disabled'}`,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      message: `Auto-advance ${enabled ? 'enabled' : 'disabled'} successfully`,
      autoAdvanceEnabled: enabled
    });
  } catch (error) {
    console.error('Error toggling auto-advance:', error);
    if (error.message === 'Order not found') {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.status(500).json({ message: 'Server error toggling auto-advance' });
  }
};

// Advance order to next status
export const advanceOrderToNextStatus = (db) => async (req, res) => {
  const orderId = req.params.id;
  const orderModel = new Order(db);

  try {
    // Get user ID from authenticated user
    const userId = req.user ? req.user.user_id : null;

    // Get order details before updating to send email if needed
    const order = await orderModel.getById(orderId, userId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const previousStatus = order.status;
    await orderModel.advanceToNextStatus(orderId, userId);
    const updatedOrder = await orderModel.getById(orderId, userId);

    // Emit WebSocket notification for status advancement
    if (req.io) {
      const notificationData = {
        orderId,
        previousStatus,
        newStatus: updatedOrder.status,
        message: `Order advanced from ${previousStatus} to ${updatedOrder.status}`,
        timestamp: new Date().toISOString()
      };

      req.io.emit('order-status-advanced', notificationData);

      // Send to specific user if userId is provided
      if (updatedOrder.user_id) {
        req.io.to(`user_${updatedOrder.user_id}`).emit('your-order-status-advanced', {
          orderId,
          previousStatus,
          newStatus: updatedOrder.status,
          message: `Your order has been advanced to ${updatedOrder.status}`,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Send email notification if status changed to "ready"
    if (previousStatus !== 'ready' && updatedOrder.status === 'ready' && order.email) {
      try {
        const { sendReadyForPickupEmail } = await import('../utils/email.js');
        await sendReadyForPickupEmail(order.email, order.name, order.order_id, order.serviceType);
        console.log('✅ Ready for pickup email sent successfully to:', order.email);
      } catch (emailError) {
        console.error('❌ Error sending ready for pickup email:', emailError.message);
        // Don't fail the status update if email fails, just log the error
        console.error('💡 Order status was updated to ready but email notification failed. This is not critical but should be investigated.');
      }
    }

    res.json({
      message: 'Order advanced to next status successfully',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Error advancing order status:', error);
    if (error.message === 'Order not found') {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.status(500).json({ message: 'Server error advancing order status' });
  }
};

// Get all orders with active timers
export const getOrdersWithActiveTimers = (db) => async (req, res) => {
  const orderModel = new Order(db);

  try {
    const orders = await orderModel.getOrdersWithActiveTimers();
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders with active timers:', error);
    res.status(500).json({ message: 'Server error fetching orders with active timers' });
  }
};

// Get all orders with expired timers
export const getOrdersWithExpiredTimers = (db) => async (req, res) => {
  const orderModel = new Order(db);

  try {
    const orders = await orderModel.getOrdersWithExpiredTimers();
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders with expired timers:', error);
    res.status(500).json({ message: 'Server error fetching orders with expired timers' });
  }
};

// History Management Controllers

// Get all history items (completed orders, rejected bookings, deleted items)
export const getHistory = (db) => async (req, res) => {
  const orderModel = new Order(db);
  const bookingModel = new Booking(db);

  try {
    const [orderHistory, bookingHistory] = await Promise.all([
      orderModel.getHistory(),
      bookingModel.getHistory()
    ]);

    const allHistory = [...orderHistory, ...bookingHistory]
      .sort((a, b) => new Date(b.moved_to_history_at || b.deleted_at) - new Date(a.moved_to_history_at || a.deleted_at));

    res.json(allHistory);
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ message: 'Server error fetching history' });
  }
};

// Get history items by type
export const getHistoryByType = (db) => async (req, res) => {
  const { type } = req.params;
  const orderModel = new Order(db);
  const bookingModel = new Booking(db);

  try {
    const [orderHistory, bookingHistory] = await Promise.all([
      orderModel.getHistoryByType(type),
      bookingModel.getHistoryByType(type)
    ]);

    const allHistory = [...orderHistory, ...bookingHistory]
      .sort((a, b) => new Date(b.moved_to_history_at || b.deleted_at) - new Date(a.moved_to_history_at || a.deleted_at));

    res.json(allHistory);
  } catch (error) {
    console.error('Error fetching history by type:', error);
    res.status(500).json({ message: 'Server error fetching history' });
  }
};

// Move order to history
export const moveOrderToHistory = (db) => async (req, res) => {
  const orderId = req.params.id;
  const orderModel = new Order(db);

  try {
    await orderModel.moveToHistory(orderId);

    // Emit WebSocket notification for order moved to history
    if (req.io) {
      req.io.emit('order-moved-to-history', {
        orderId,
        message: 'Order moved to history',
        timestamp: new Date().toISOString()
      });
    }

    res.json({ message: 'Order moved to history successfully' });
  } catch (error) {
    console.error('Error moving order to history:', error);
    if (error.message === 'Order not found or not eligible for history') {
      return res.status(404).json({ message: 'Order not found or not eligible for history' });
    }
    res.status(500).json({ message: 'Server error moving order to history' });
  }
};

// Restore item from history
export const restoreFromHistory = (db) => async (req, res) => {
  const itemId = req.params.id;
  const { type } = req.body; // 'order' or 'booking'
  const orderModel = new Order(db);
  const bookingModel = new Booking(db);

  try {
    let result;
    if (type === 'order') {
      result = await orderModel.restoreFromHistory(itemId);
    } else if (type === 'booking') {
      result = await bookingModel.restoreFromHistory(itemId);
    } else {
      return res.status(400).json({ message: 'Invalid type specified' });
    }

    // Emit WebSocket notification for item restored from history
    if (req.io) {
      req.io.emit('item-restored-from-history', {
        itemId,
        type,
        message: 'Item restored from history',
        timestamp: new Date().toISOString()
      });
    }

    res.json({ message: 'Item restored from history successfully' });
  } catch (error) {
    console.error('Error restoring from history:', error);
    if (error.message === 'Order not found in history' || error.message === 'Booking not found in history') {
      return res.status(404).json({ message: 'Item not found in history' });
    }
    res.status(500).json({ message: 'Server error restoring from history' });
  }
};

// Permanently delete from history
export const deleteFromHistory = (db) => async (req, res) => {
  const itemId = req.params.id;
  const { type } = req.body; // 'order' or 'booking'
  const orderModel = new Order(db);
  const bookingModel = new Booking(db);

  try {
    let result;
    if (type === 'order') {
      result = await orderModel.deleteFromHistory(itemId);
    } else if (type === 'booking') {
      result = await bookingModel.deleteFromHistory(itemId);
    } else {
      return res.status(400).json({ message: 'Invalid type specified' });
    }

    // Emit WebSocket notification for permanent deletion
    if (req.io) {
      req.io.emit('item-permanently-deleted', {
        itemId,
        type,
        message: 'Item permanently deleted from history',
        timestamp: new Date().toISOString()
      });
    }

    res.json({ message: 'Item permanently deleted from history' });
  } catch (error) {
    console.error('Error deleting from history:', error);
    if (error.message === 'Order not found in history' || error.message === 'Booking not found in history') {
      return res.status(404).json({ message: 'Item not found in history' });
    }
    res.status(500).json({ message: 'Server error deleting from history' });
  }
};

// Complete order and move to history
export const completeOrder = (db) => async (req, res) => {
  const orderId = req.params.id;
  const orderModel = new Order(db);

  try {
    // Get order before completion
    const order = await orderModel.getById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if order is already completed
    if (order.status === 'completed') {
      return res.status(400).json({ message: 'Order is already completed' });
    }


    // Emit WebSocket notification for order completion
    if (req.io) {
      const notificationData = {
        orderId,
        previousStatus: order.status,
        newStatus: 'completed',
        message: 'Order completed and moved to history',
        timestamp: new Date().toISOString()
      };

      req.io.emit('order-completed', notificationData);

      // Send to specific user if userId is provided
      if (order.user_id) {
        req.io.to(`user_${order.user_id}`).emit('your-order-completed', {
          orderId,
          message: 'Your order has been completed!',
          timestamp: new Date().toISOString()
        });
      }
    }

    // Send completion email
    if (order.email) {
      try {
        const { sendCompletionEmail } = await import('../utils/email.js');
        await sendCompletionEmail(order.email, order.name, order);
        console.log('✅ Order completion email sent successfully to:', order.email);
      } catch (emailError) {
        console.error('❌ Error sending completion email:', emailError.message);
        // Don't fail the operation if email fails, just log it.
        console.error('💡 Order was completed but email notification failed. This is not critical but should be investigated.');
      }
    }
    
    // Update order status to completed and move to history
    await orderModel.update(orderId, { status: 'completed' });
    await orderModel.moveToHistory(orderId);

    const updatedOrder = await orderModel.getById(orderId);

    res.json({
      message: 'Order completed and moved to history successfully',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Error completing order:', error);
    if (error.message === 'Order not found') {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.status(500).json({ message: 'Server error completing order' });
  }
};

// Update payment status for an order
export const updatePaymentStatus = (db) => async (req, res) => {
  const orderId = req.params.id;
  const { paymentStatus } = req.body;
  const orderModel = new Order(db);

  try {
    // Validate payment status
    if (!['paid', 'unpaid'].includes(paymentStatus)) {
      return res.status(400).json({ message: 'Invalid payment status. Must be "paid" or "unpaid"' });
    }

    // Get order before update
    const order = await orderModel.getById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    await orderModel.updatePaymentStatus(orderId, paymentStatus);

    // Get updated order
    const updatedOrder = await orderModel.getById(orderId);

    // Emit WebSocket notification for payment status update
    if (req.io) {
      const notificationData = {
        orderId,
        previousPaymentStatus: order.paymentStatus,
        newPaymentStatus: paymentStatus,
        message: `Payment status updated to ${paymentStatus}`,
        timestamp: new Date().toISOString()
      };

      req.io.emit('order-payment-status-updated', notificationData);

      // Send to specific user if userId is provided
      if (updatedOrder.user_id) {
        req.io.to(`user_${updatedOrder.user_id}`).emit('your-order-payment-updated', {
          orderId,
          previousPaymentStatus: order.paymentStatus,
          newPaymentStatus: paymentStatus,
          message: `Your order payment status has been updated to ${paymentStatus}`,
          timestamp: new Date().toISOString()
        });
      }
    }

    res.json({
      message: 'Payment status updated successfully',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    if (error.message === 'Order not found') {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.status(500).json({ message: 'Server error updating payment status' });
  }
};

// Soft delete order or booking
export const softDeleteItem = (db) => async (req, res) => {
  const itemId = req.params.id;
  let { type } = req.body; // 'order' or 'booking'

  // If type is not specified, determine it from the route
  if (!type) {
    const route = req.originalUrl;
    if (route.includes('/orders/')) {
      type = 'order';
    } else if (route.includes('/bookings/')) {
      type = 'booking';
    } else {
      return res.status(400).json({ message: 'Type must be specified or route must indicate type' });
    }
  }

  const orderModel = new Order(db);
  const bookingModel = new Booking(db);

  try {
    let result;
    if (type === 'order') {
      result = await orderModel.softDelete(itemId);
    } else if (type === 'booking') {
      result = await bookingModel.softDelete(itemId);
    } else {
      return res.status(400).json({ message: 'Invalid type specified' });
    }

    // Emit WebSocket notification for soft deletion
    if (req.io) {
      req.io.emit('item-soft-deleted', {
        itemId,
        type,
        message: 'Item marked as deleted',
        timestamp: new Date().toISOString()
      });
    }

    res.json({ message: 'Item marked as deleted successfully' });
  } catch (error) {
    console.error('Error soft deleting item:', error);
    if (error.message === 'Order not found or already deleted' || error.message === 'Booking not found or already deleted') {
      return res.status(404).json({ message: 'Item not found or already deleted' });
    }
    res.status(500).json({ message: 'Server error deleting item' });
  }
};

// GCash Payment Controllers

// Submit GCash payment proof
export const submitGcashPayment = (db) => async (req, res) => {
  const orderId = req.params.id;
  const { referenceId } = req.body;
  const paymentProof = req.file ? req.file.filename : null;
  const orderModel = new Order(db);

  try {
    // Validate required fields
    if (!paymentProof) {
      return res.status(400).json({ message: 'Payment proof is required' });
    }

    // Get user ID from authenticated user
    const userId = req.user ? req.user.user_id : null;

    // Get order to verify ownership and payment method
    const order = await orderModel.getById(orderId, userId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.paymentMethod !== 'gcash') {
      return res.status(400).json({ message: 'Order payment method is not GCash' });
    }

    if (order.payment_status === 'approved') {
      return res.status(400).json({ message: 'Payment has already been approved' });
    }

    // Submit payment proof
    await orderModel.submitPaymentProof(orderId, paymentProof, referenceId);

    // Get updated order
    const updatedOrder = await orderModel.getById(orderId, userId);

    // Emit WebSocket notification for payment submission
    if (req.io) {
      const notificationData = {
        orderId,
        paymentProof,
        referenceId,
        message: 'GCash payment proof submitted',
        timestamp: new Date().toISOString()
      };

      req.io.emit('gcash-payment-submitted', notificationData);

      // Send to admin users
      req.io.emit('admin-notification', {
        type: 'gcash_payment_submitted',
        orderId,
        customerName: order.name,
        message: `New GCash payment submitted by ${order.name}`,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      message: 'GCash payment proof submitted successfully',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Error submitting GCash payment:', error);
    if (error.message === 'Order not found or not a GCash payment') {
      return res.status(404).json({ message: 'Order not found or not a GCash payment' });
    }
    res.status(500).json({ message: 'Server error submitting payment' });
  }
};

// Review GCash payment (admin only)
export const reviewGcashPayment = (db) => async (req, res) => {
  const orderId = req.params.id;
  const { status, adminNotes } = req.body;
  const orderModel = new Order(db);

  try {
    // Validate status
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be "approved" or "rejected"' });
    }

    // Get order
    const order = await orderModel.getById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.paymentMethod !== 'gcash') {
      return res.status(400).json({ message: 'Order payment method is not GCash' });
    }

    // Update payment status
    await orderModel.updateGcashPaymentStatus(orderId, status);

    // If approved, also update the general paymentStatus to 'paid'
    if (status === 'approved') {
      await orderModel.updatePaymentStatus(orderId, 'paid');
    }

    // Get updated order
    const updatedOrder = await orderModel.getById(orderId);

    // Emit WebSocket notification for payment review
    if (req.io) {
      const notificationData = {
        orderId,
        status,
        adminNotes,
        message: `GCash payment ${status}`,
        timestamp: new Date().toISOString()
      };

      req.io.emit('gcash-payment-reviewed', notificationData);

      // Send to specific user if userId is provided
      if (updatedOrder.user_id) {
        req.io.to(`user_${updatedOrder.user_id}`).emit('your-gcash-payment-reviewed', {
          orderId,
          status,
          message: `Your GCash payment has been ${status}`,
          timestamp: new Date().toISOString()
        });
      }
    }

    res.json({
      message: `GCash payment ${status} successfully`,
      order: updatedOrder
    });
  } catch (error) {
    console.error('Error reviewing GCash payment:', error);
    if (error.message === 'Order not found or not a GCash payment') {
      return res.status(404).json({ message: 'Order not found or not a GCash payment' });
    }
    res.status(500).json({ message: 'Server error reviewing payment' });
  }
};
