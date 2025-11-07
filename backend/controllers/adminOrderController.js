import { ServiceOrder } from '../models/ServiceOrder.js';
import { sendOrderConfirmationEmail } from '../utils/orderEmail.js';

// Controller to get all orders for admin
export const getAllOrders = (db) => async (req, res) => {
  const serviceOrderModel = new ServiceOrder(db);
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    const orders = await serviceOrderModel.getAll(page, limit);
    const totalCount = await serviceOrderModel.getTotalCount();

    const transformedOrders = orders.map(order => ({
      ...order,
      photos: typeof order.photos === 'string' ? JSON.parse(order.photos) : order.photos || [],
      laundry_photos: typeof order.laundry_photos === 'string' ? JSON.parse(order.laundry_photos) : order.laundry_photos || [],
      payment_status: order.payment_status || 'unpaid',
      service_orders_id: order.service_orders_id,
      status: order.status || 'pending',
      total_price: order.total_price || 0,
      load_count: order.load_count || 1,
      kilos: order.kilos || 0,

    }));

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
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Server error fetching orders' });
  }
};

// Controller to get order by ID for admin
export const getOrderById = (db) => async (req, res) => {
  const orderId = req.params.id;
  const serviceOrderModel = new ServiceOrder(db);
  try {
    const order = await serviceOrderModel.getById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Server error fetching order' });
  }
};

// Controller to create order for admin
export const createOrder = (db) => async (req, res) => {
  const serviceOrderModel = new ServiceOrder(db);
  try {
    const orderData = {
      ...req.body,
      service_type: req.body.service_type || req.body.serviceType
    };

    // Handle dry cleaning services with custom prices
    if (req.body.dryCleaningServices && req.body.dryCleaningPrices) {
      orderData.dry_cleaning_services = req.body.dryCleaningServices.map(id => ({
        id,
        price: req.body.dryCleaningPrices[id] || 0
      }));
    }

    const orderId = await serviceOrderModel.create(orderData);

    // Emit WebSocket notification
    if (global.io) {
      global.io.emit('order-created', {
        order_id: orderId,
        message: 'New order created',
        timestamp: new Date().toISOString()
      });

      if (req.body.user_id) {
        global.io.to(`user_${req.body.user_id}`).emit('your-order-created', {
          order_id: orderId,
          message: 'Your order has been created',
          timestamp: new Date().toISOString()
        });
      }
    }

    res.status(201).json({ message: 'Order created successfully', order_id: orderId });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Server error creating order' });
  }
};

// Controller to update order status or details for admin
export const updateOrder = (db) => async (req, res) => {
  const orderId = req.params.id;
  const updates = req.body;
  const serviceOrderModel = new ServiceOrder(db);

  // Handle dry cleaning services with custom prices
  if (updates.dryCleaningServices && updates.dryCleaningPrices) {
    updates.dry_cleaning_services = updates.dryCleaningServices.map(id => ({
      id,
      price: updates.dryCleaningPrices[id] || 0
    }));
  }

  // Transform camelCase field names to snake_case for database compatibility
  // Only include fields that are actually provided (not undefined)
  const transformedUpdates = {};

  // Helper function to add field if provided
  const addIfProvided = (snakeKey, value) => {
    if (value !== undefined) {
      transformedUpdates[snakeKey] = value;
    }
  };

  // Add provided fields
  addIfProvided('service_type', updates.service_type || updates.serviceType);
  addIfProvided('load_count', updates.load_count || updates.loadCount);
  addIfProvided('payment_method', updates.payment_method || updates.paymentMethod);
  addIfProvided('payment_status', updates.payment_status || updates.paymentStatus);
  addIfProvided('dry_cleaning_services', updates.dry_cleaning_services || updates.dryCleaningServices);
  addIfProvided('pickup_date', updates.pickup_date || updates.pickupDate);
  addIfProvided('pickup_time', updates.pickup_time || updates.pickupTime);
  addIfProvided('laundry_photos', updates.laundry_photos || updates.laundryPhoto);
  addIfProvided('rejection_reason', updates.rejection_reason || updates.rejectionReason);
  addIfProvided('service_option', updates.service_option || updates.serviceOption);
  addIfProvided('delivery_fee', updates.delivery_fee || updates.deliveryFee);
  addIfProvided('total_price', updates.total_price || updates.totalPrice);
  addIfProvided('payment_proof', updates.payment_proof || updates.paymentProof);
  addIfProvided('reference_id', updates.reference_id || updates.referenceId);
  addIfProvided('payment_review_status', updates.payment_review_status || updates.paymentReviewStatus);
  addIfProvided('timer_start', updates.timer_start || updates.timerStart);
  addIfProvided('timer_end', updates.timer_end || updates.timerEnd);
  addIfProvided('auto_advance_enabled', updates.auto_advance_enabled || updates.autoAdvanceEnabled);
  addIfProvided('current_timer_status', updates.current_timer_status || updates.currentTimerStatus);
  addIfProvided('moved_to_history_at', updates.moved_to_history_at || updates.movedToHistoryAt);
  addIfProvided('is_deleted', updates.is_deleted || updates.isDeleted);
  addIfProvided('deleted_at', updates.deleted_at || updates.deletedAt);

  // Add direct fields if provided
  Object.keys(updates).forEach(key => {
    if (!transformedUpdates[key] && updates[key] !== undefined) {
      transformedUpdates[key] = updates[key];
    }
  });

  // Remove dryCleaningPrices from updates to avoid database errors
  delete transformedUpdates.dryCleaningPrices;
  delete transformedUpdates.dry_cleaning_prices;

  // Remove the original camelCase keys to avoid conflicts
  Object.keys(transformedUpdates).forEach(key => {
    if (key.includes('_')) {
      const camelKey = key.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
      if (transformedUpdates[camelKey] !== undefined) {
        delete transformedUpdates[camelKey];
      }
    }
  });

  // Filter out undefined values to prevent setting NOT NULL columns to NULL
  const filteredUpdates = {};
  Object.keys(transformedUpdates).forEach(key => {
    if (transformedUpdates[key] !== undefined) {
      filteredUpdates[key] = transformedUpdates[key];
    }
  });

  try {
    const orderBefore = await serviceOrderModel.getById(orderId);
    if (!orderBefore) {
      return res.status(404).json({ message: 'Order not found' });
    }

    await serviceOrderModel.update(orderId, filteredUpdates);

    const orderAfter = await serviceOrderModel.getById(orderId);

    // Update booking counts if pickup_date changed and order is still active
    if (updates.pickup_date && updates.pickup_date !== orderBefore.pickup_date) {
      const activeStatuses = ['pending', 'pending_booking', 'approved', 'washing', 'drying', 'folding', 'ready'];
      if (activeStatuses.includes(orderAfter.status)) {
        try {
          // Decrement count for old date
          const decrementSql = `
            UPDATE booking_counts
            SET count = GREATEST(count - 1, 0)
            WHERE date = ?
          `;
          await db.promise().query(decrementSql, [orderBefore.pickup_date]);

          // Increment count for new date
          const incrementSql = `
            INSERT INTO booking_counts (date, count, limit_count)
            VALUES (?, 1, 3)
            ON DUPLICATE KEY UPDATE count = count + 1
          `;
          await db.promise().query(incrementSql, [updates.pickup_date]);

          console.log(`Booking count updated: moved from ${orderBefore.pickup_date} to ${updates.pickup_date}`);

          // Emit real-time updates for booking counts
          if (req.io) {
            req.io.emit('booking-counts-updated', { date: orderBefore.pickup_date, change: -1 });
            req.io.emit('booking-counts-updated', { date: updates.pickup_date, change: 1 });
          }
        } catch (countError) {
          console.error('Error updating booking counts on date change:', countError);
          // Don't fail the update if count update fails
        }
      }
    }

    // Emit WebSocket notification
    if (req.io) {
      const notificationData = {
        order_id: orderId,
        previousStatus: orderBefore.status,
        newStatus: orderAfter.status,
        updates,
        timestamp: new Date().toISOString()
      };

      req.io.emit('order-status-changed', notificationData);

      if (orderAfter.user_id) {
        req.io.to(`user_${orderAfter.user_id}`).emit('your-order-updated', {
          order_id: orderId,
          previousStatus: orderBefore.status,
          newStatus: orderAfter.status,
          message: `Your order status has been updated to ${orderAfter.status}`,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Send order confirmation email if status changed to 'pending' and laundry photos are provided
    if (orderBefore.status !== 'pending' && orderAfter.status === 'pending' && orderAfter.email && orderAfter.laundry_photos) {
      try {
        // Parse laundry photos if it's a string
        let laundryPhotos = orderAfter.laundry_photos;
        if (typeof laundryPhotos === 'string') {
          laundryPhotos = JSON.parse(laundryPhotos);
        }

        // Send email with the first laundry photo if available
        const laundryPhoto = Array.isArray(laundryPhotos) && laundryPhotos.length > 0 ? laundryPhotos[0] : null;

        await sendOrderConfirmationEmail(
          orderAfter.email,
          orderAfter.name,
          orderAfter.service_orders_id,
          orderAfter.kilos,
          orderAfter.total_price,
          laundryPhoto,
          orderAfter.payment_method,
          orderAfter.service_type,
          orderAfter.load_count
        );
        console.log('✅ Order confirmation email sent successfully to:', orderAfter.email);
      } catch (emailError) {
        console.error('❌ Error sending order confirmation email:', emailError.message);
        // Don't fail the update if email fails
      }
    }

    res.json({ message: 'Order updated successfully' });
  } catch (error) {
    console.error('Error updating order:', error);
    if (error.message === 'Service order not found') {
      return res.status(404).json({ message: 'Order not found' });
    }
    if (error.message === 'No fields to update') {
      return res.status(400).json({ message: 'No fields to update' });
    }
    res.status(500).json({ message: 'Server error updating order' });
  }
};

// Controller to delete order for admin
export const deleteOrder = (db) => async (req, res) => {
  const orderId = req.params.id;
  const serviceOrderModel = new ServiceOrder(db);
  try {
    await serviceOrderModel.delete(orderId);

    // Emit WebSocket notification
    if (req.io) {
      req.io.emit('order-deleted', {
        order_id: orderId,
        message: 'Order deleted',
        timestamp: new Date().toISOString()
      });
    }

    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    if (error.message === 'Service order not found') {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.status(500).json({ message: 'Server error deleting order' });
  }
};

// Controller to get orders by status for admin
export const getOrdersByStatus = (db) => async (req, res) => {
  const status = req.params.status;
  const serviceOrderModel = new ServiceOrder(db);
  try {
    const orders = await serviceOrderModel.getByStatus(status);
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders by status:', error);
    res.status(500).json({ message: 'Server error fetching orders' });
  }
};

// Timer Management Controllers for admin

// Start timer for an order
export const startOrderTimer = (db) => async (req, res) => {
  const orderId = req.params.id;
  const { status } = req.body;
  const serviceOrderModel = new ServiceOrder(db);

  try {
    const timerData = await serviceOrderModel.startTimer(orderId, status);

    // Emit WebSocket notification
    if (req.io) {
      req.io.emit('order-timer-started', {
        order_id: orderId,
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
    if (error.message === 'Service order not found') {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.status(500).json({ message: 'Server error starting timer' });
  }
};

// Stop timer for an order
export const stopOrderTimer = (db) => async (req, res) => {
  const orderId = req.params.id;
  const serviceOrderModel = new ServiceOrder(db);

  try {
    await serviceOrderModel.stopTimer(orderId);

    // Emit WebSocket notification
    if (req.io) {
      req.io.emit('order-timer-stopped', {
        order_id: orderId,
        message: 'Order timer stopped',
        timestamp: new Date().toISOString()
      });
    }

    res.json({ message: 'Timer stopped successfully' });
  } catch (error) {
    console.error('Error stopping timer:', error);
    if (error.message === 'Service order not found') {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.status(500).json({ message: 'Server error stopping timer' });
  }
};

// Get timer status for an order
export const getOrderTimerStatus = (db) => async (req, res) => {
  const orderId = req.params.id;
  const serviceOrderModel = new ServiceOrder(db);

  try {
    const timerStatus = await serviceOrderModel.getTimerStatus(orderId);
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
  const serviceOrderModel = new ServiceOrder(db);

  try {
    await serviceOrderModel.toggleAutoAdvance(orderId, enabled);

    // Emit WebSocket notification
    if (req.io) {
      req.io.emit('order-auto-advance-toggled', {
        order_id: orderId,
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
    if (error.message === 'Service order not found') {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.status(500).json({ message: 'Server error toggling auto-advance' });
  }
};

// Advance order to next status
export const advanceOrderToNextStatus = (db) => async (req, res) => {
  const orderId = req.params.id;
  const serviceOrderModel = new ServiceOrder(db);

  try {
    const order = await serviceOrderModel.getById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const previousStatus = order.status;
    await serviceOrderModel.advanceToNextStatus(orderId);
    const updatedOrder = await serviceOrderModel.getById(orderId);

    // Emit WebSocket notification
    if (req.io) {
      const notificationData = {
        order_id: orderId,
        previousStatus,
        newStatus: updatedOrder.status,
        message: `Order advanced from ${previousStatus} to ${updatedOrder.status}`,
        timestamp: new Date().toISOString()
      };

      req.io.emit('order-status-advanced', notificationData);

      if (updatedOrder.user_id) {
        req.io.to(`user_${updatedOrder.user_id}`).emit('your-order-status-advanced', {
          order_id: orderId,
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
        await sendReadyForPickupEmail(order.email, order.name, order.service_orders_id, order.service_type);
        console.log('✅ Ready for pickup email sent successfully to:', order.email);
      } catch (emailError) {
        console.error('❌ Error sending ready for pickup email:', emailError.message);
      }
    }

    res.json({
      message: 'Order advanced to next status successfully',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Error advancing order status:', error);
    if (error.message === 'Service order not found') {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.status(500).json({ message: 'Server error advancing order status' });
  }
};

// Get all orders with active timers
export const getOrdersWithActiveTimers = (db) => async (req, res) => {
  const serviceOrderModel = new ServiceOrder(db);

  try {
    const orders = await serviceOrderModel.getOrdersWithActiveTimers();
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders with active timers:', error);
    res.status(500).json({ message: 'Server error fetching orders with active timers' });
  }
};

// Get all orders with expired timers
export const getOrdersWithExpiredTimers = (db) => async (req, res) => {
  const serviceOrderModel = new ServiceOrder(db);

  try {
    const orders = await serviceOrderModel.getOrdersWithExpiredTimers();
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders with expired timers:', error);
    res.status(500).json({ message: 'Server error fetching orders with expired timers' });
  }
};

// Payment Management Controllers for admin

// Update payment status for an order
export const updatePaymentStatus = (db) => async (req, res) => {
  const orderId = req.params.id;
  const { payment_status } = req.body;
  const serviceOrderModel = new ServiceOrder(db);

  try {
    if (!['paid', 'unpaid'].includes(payment_status)) {
      return res.status(400).json({ message: 'Invalid payment status. Must be "paid" or "unpaid"' });
    }

    const order = await serviceOrderModel.getById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    await serviceOrderModel.updatePaymentStatus(orderId, payment_status);

    const updatedOrder = await serviceOrderModel.getById(orderId);

    // Emit WebSocket notification
    if (req.io) {
      const notificationData = {
        order_id: orderId,
        previousPaymentStatus: order.payment_status,
        newPaymentStatus: payment_status,
        message: `Payment status updated to ${payment_status}`,
        timestamp: new Date().toISOString()
      };

      req.io.emit('order-payment-status-updated', notificationData);

      if (updatedOrder.user_id) {
        req.io.to(`user_${updatedOrder.user_id}`).emit('your-order-payment-updated', {
          order_id: orderId,
          previousPaymentStatus: order.payment_status,
          newPaymentStatus: payment_status,
          message: `Your order payment status has been updated to ${payment_status}`,
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
    if (error.message === 'Service order not found') {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.status(500).json({ message: 'Server error updating payment status' });
  }
};

// Review GCash payment (admin only)
export const reviewGcashPayment = (db) => async (req, res) => {
  const orderId = req.params.id;
  const { status, admin_notes } = req.body;
  const serviceOrderModel = new ServiceOrder(db);

  try {
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be "approved" or "rejected"' });
    }

    const order = await serviceOrderModel.getById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.payment_method !== 'gcash') {
      return res.status(400).json({ message: 'Order payment method is not GCash' });
    }

    // Update payment status
    await serviceOrderModel.updateGcashPaymentStatus(orderId, status);

    // If approved, also update the general payment_status to 'paid'
    if (status === 'approved') {
      await serviceOrderModel.updatePaymentStatus(orderId, 'paid');
    }

    const updatedOrder = await serviceOrderModel.getById(orderId);

    // Emit WebSocket notification
    if (req.io) {
      const notificationData = {
        order_id: orderId,
        status,
        admin_notes,
        message: `GCash payment ${status}`,
        timestamp: new Date().toISOString()
      };

      req.io.emit('gcash-payment-reviewed', notificationData);

      if (updatedOrder.user_id) {
        req.io.to(`user_${updatedOrder.user_id}`).emit('your-gcash-payment-reviewed', {
          order_id: orderId,
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
    if (error.message === 'Service order not found or not a GCash payment') {
      return res.status(404).json({ message: 'Order not found or not a GCash payment' });
    }
    res.status(500).json({ message: 'Server error reviewing payment' });
  }
};

// Complete order and move to history
export const completeOrder = (db) => async (req, res) => {
  const orderId = req.params.id;
  const serviceOrderModel = new ServiceOrder(db);

  try {
    const order = await serviceOrderModel.getById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status === 'completed') {
      return res.status(400).json({ message: 'Order is already completed' });
    }

    // Emit WebSocket notification
    if (req.io) {
      const notificationData = {
        order_id: orderId,
        previousStatus: order.status,
        newStatus: 'completed',
        message: 'Order completed and moved to history',
        timestamp: new Date().toISOString()
      };

      req.io.emit('order-completed', notificationData);

      if (order.user_id) {
        req.io.to(`user_${order.user_id}`).emit('your-order-completed', {
          order_id: orderId,
          message: 'Your order has been completed!',
          timestamp: new Date().toISOString()
        });
      }
    }

    // Send completion email
    if (order.email) {
      try {
        const { sendCompletionEmail } = await import('../utils/email.js');
        // Transform order object to camelCase for email function
        const transformedOrder = {
          ...order,
          serviceType: order.service_type,
          order_id: order.service_orders_id,
          totalPrice: order.total_price,
          paymentStatus: order.payment_status,
          loadCount: order.load_count,
          kilos: order.kilos
        };
        await sendCompletionEmail(order.email, order.name, transformedOrder);
        console.log('✅ Order completion email sent successfully to:', order.email);
      } catch (emailError) {
        console.error('❌ Error sending completion email:', emailError.message);
      }
    }

    // Update order status to completed and move to history
    await serviceOrderModel.update(orderId, { status: 'completed' });
    await serviceOrderModel.moveToHistory(orderId);

    const updatedOrder = await serviceOrderModel.getById(orderId);

    res.json({
      message: 'Order completed and moved to history successfully',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Error completing order:', error);
    if (error.message === 'Service order not found') {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.status(500).json({ message: 'Server error completing order' });
  }
};

// Get order statistics for admin dashboard
export const getOrderStats = (db) => async (req, res) => {
  const serviceOrderModel = new ServiceOrder(db);
  try {
    const stats = await serviceOrderModel.getOrderStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching order stats:', error);
    res.status(500).json({ message: 'Server error fetching order stats' });
  }
};

// Soft delete order
export const softDeleteOrder = (db) => async (req, res) => {
  const orderId = req.params.id;
  const serviceOrderModel = new ServiceOrder(db);

  try {
    await serviceOrderModel.softDelete(orderId);

    // Emit WebSocket notification
    if (req.io) {
      req.io.emit('item-soft-deleted', {
        itemId: orderId,
        type: 'order',
        message: 'Order marked as deleted',
        timestamp: new Date().toISOString()
      });
    }

    res.json({ message: 'Order marked as deleted successfully' });
  } catch (error) {
    console.error('Error soft deleting order:', error);
    if (error.message === 'Service order not found or already deleted') {
      return res.status(404).json({ message: 'Order not found or already deleted' });
    }
    res.status(500).json({ message: 'Server error deleting order' });
  }
};
