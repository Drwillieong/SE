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

    // Get paginated orders and total count
    const [orders, totalCount] = await Promise.all([
      orderModel.getAll(page, limit),
      orderModel.getTotalCount()
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      orders,
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
    const order = await orderModel.getById(orderId);
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
    const orderId = await orderModel.create(req.body);

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
      userId: req.body.userId || null,
      estimatedClothes: req.body.estimatedClothes || 0,
      kilos: req.body.kilos || 0,
      pants: req.body.pants || 0,
      shorts: req.body.shorts || 0,
      tshirts: req.body.tshirts || 0,
      bedsheets: req.body.bedsheets || 0,
      laundryPhoto: req.body.laundryPhoto || []
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
        userId: req.body.userId,
        timestamp: new Date().toISOString()
      };

      req.io.emit('order-created-from-pickup', notificationData);

      // Send to specific user if userId is provided
      if (req.body.userId) {
        req.io.to(`user_${req.body.userId}`).emit('your-booking-converted-to-order', {
          orderId,
          bookingId: req.body.bookingId,
          message: 'Your booking has been converted to an order',
          timestamp: new Date().toISOString()
        });
      }
    }

    // Mark the booking as completed if bookingId is provided
    if (req.body.bookingId) {
      try {
        console.log('Updating booking status to completed for booking ID:', req.body.bookingId);
        await bookingModel.update(req.body.bookingId, { status: 'completed' });

        // Emit WebSocket notification for booking completion
        if (req.io) {
          req.io.emit('booking-completed', {
            bookingId: req.body.bookingId,
            orderId,
            message: 'Booking converted to order',
            timestamp: new Date().toISOString()
          });
        }

        console.log('Booking status updated successfully');
      } catch (bookingError) {
        console.error('Error updating booking status:', bookingError);
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
    // Get order details before updating to send email if needed
    const order = await orderModel.getById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const previousStatus = order.status;
    await orderModel.advanceToNextStatus(orderId);
    const updatedOrder = await orderModel.getById(orderId);

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
