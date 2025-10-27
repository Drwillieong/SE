import { ServiceOrder } from '../models/ServiceOrder.js';

// Controller to get all history items (completed orders, rejected bookings, deleted items)
export const getHistory = (db) => async (req, res) => {
  const serviceOrderModel = new ServiceOrder(db);

  try {
    const history = await serviceOrderModel.getHistory();
    res.json(history);
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ message: 'Server error fetching history' });
  }
};

// Controller to get history items by type
export const getHistoryByType = (db) => async (req, res) => {
  const { type } = req.params;
  const serviceOrderModel = new ServiceOrder(db);

  try {
    const history = await serviceOrderModel.getHistoryByType(type);
    res.json(history);
  } catch (error) {
    console.error('Error fetching history by type:', error);
    res.status(500).json({ message: 'Server error fetching history' });
  }
};

// Controller to move order to history
export const moveOrderToHistory = (db) => async (req, res) => {
  const orderId = req.params.id;
  const serviceOrderModel = new ServiceOrder(db);

  try {
    await serviceOrderModel.moveToHistory(orderId);

    // Emit WebSocket notification
    if (req.io) {
      req.io.emit('order-moved-to-history', {
        order_id: orderId,
        message: 'Order moved to history',
        timestamp: new Date().toISOString()
      });
    }

    res.json({ message: 'Order moved to history successfully' });
  } catch (error) {
    console.error('Error moving order to history:', error);
    if (error.message === 'Service order not found or not eligible for history') {
      return res.status(404).json({ message: 'Order not found or not eligible for history' });
    }
    res.status(500).json({ message: 'Server error moving order to history' });
  }
};

// Controller to restore item from history
export const restoreFromHistory = (db) => async (req, res) => {
  const itemId = req.params.id;
  const { type } = req.body; // 'order' or 'booking'
  const serviceOrderModel = new ServiceOrder(db);

  try {
    await serviceOrderModel.restoreFromHistory(itemId, type);

    // Emit WebSocket notification
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
    if (error.message === 'Service order not found in history') {
      return res.status(404).json({ message: 'Item not found in history' });
    }
    res.status(500).json({ message: 'Server error restoring from history' });
  }
};

// Controller to permanently delete from history
export const deleteFromHistory = (db) => async (req, res) => {
  const itemId = req.params.id;
  const { type } = req.body; // 'order' or 'booking'
  const serviceOrderModel = new ServiceOrder(db);

  try {
    await serviceOrderModel.deleteFromHistory(itemId, type);

    // Emit WebSocket notification
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
    if (error.message === 'Service order not found in history') {
      return res.status(404).json({ message: 'Item not found in history' });
    }
    res.status(500).json({ message: 'Server error deleting from history' });
  }
};

// Controller to get welcome message (utility endpoint)
export const getWelcome = (db) => async (req, res) => {
  res.json({ message: 'Welcome to the Laundry Service API' });
};

// Controller to auto-advance status (called by client when timer expires OR by server cron)
export const autoAdvanceOrder = (db) => async (req, res) => {
  const orderId = req.params.id;
  const serviceOrderModel = new ServiceOrder(db);
  try {
    const order = await serviceOrderModel.getById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Determine next stage based on processStage or status
    const current = order.process_stage || order.status || 'pending';
    const seq = ['pending','washing','drying','folding','ready'];
    const idx = seq.indexOf(current);
    const next = (idx >= 0 && idx < seq.length - 1) ? seq[idx + 1] : seq[seq.length - 1];

    // Update both processStage and status to keep things consistent
    await serviceOrderModel.update(orderId, { process_stage: next, status: next });

    res.json({ message: 'Order advanced', next });
  } catch (error) {
    console.error('Error auto-advancing order:', error);
    res.status(500).json({ message: 'Server error auto-advancing order' });
  }
};
