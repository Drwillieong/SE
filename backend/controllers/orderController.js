import { Order } from '../models/Order.js';
import { Booking } from '../models/Booking.js';

// Add near the other exports in orderController.js

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

// Controller to get all orders
export const getAllOrders = (db) => async (req, res) => {
  const orderModel = new Order(db);
  try {
    const orders = await orderModel.getAll();
    res.json(orders);
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
    await orderModel.update(orderId, updates);
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

    // Mark the booking as completed if bookingId is provided
    if (req.body.bookingId) {
      try {
        console.log('Updating booking status to completed for booking ID:', req.body.bookingId);
        await bookingModel.update(req.body.bookingId, { status: 'completed' });
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
