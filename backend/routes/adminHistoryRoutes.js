import express from 'express';
import {
  getHistory,
  getHistoryByType,
  moveOrderToHistory,
  restoreFromHistory,
  deleteFromHistory,
  getWelcome,
  autoAdvanceOrder
} from '../controllers/adminHistoryController.js';
import { verifyToken, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// This function will be called from server.js to pass the db connection
export default (db) => {
    // Get all history items
    router.get('/', verifyToken, requireAdmin, getHistory(db));

    // Get history items by type
    router.get('/type/:type', verifyToken, requireAdmin, getHistoryByType(db));

    // Move order to history
    router.post('/:id/move-to-history', verifyToken, requireAdmin, moveOrderToHistory(db));

    // Restore item from history
    router.post('/:id/restore', verifyToken, requireAdmin, restoreFromHistory(db));

    // Permanently delete from history
    router.delete('/:id', verifyToken, requireAdmin, deleteFromHistory(db));

    // Welcome endpoint
    router.get('/welcome', getWelcome(db));

    // Auto-advance order status
    router.post('/:id/auto-advance', verifyToken, requireAdmin, autoAdvanceOrder(db));

    return router;
};
