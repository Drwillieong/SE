import express from 'express';
import {
  getDashboardStats,
  getTodaysOrders,
  getOrdersByDateRange,
  getRevenueAnalytics,
  getServiceTypeDistribution,
  getPaymentMethodAnalytics,
  getStatusDistribution,
  getCustomerAnalytics,
  getTopCustomers,
  getMonthlyTrends
} from '../controllers/adminAnalyticsController.js';
import { verifyToken, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// This function will be called from server.js to pass the db connection
export default (db) => {
    // Get dashboard statistics
    router.get('/dashboard', verifyToken, requireAdmin, getDashboardStats(db));

    // Get today's orders
    router.get('/today', verifyToken, requireAdmin, getTodaysOrders(db));

    // Get orders by date range
    router.post('/date-range', verifyToken, requireAdmin, getOrdersByDateRange(db));

    // Get revenue analytics
    router.post('/revenue', verifyToken, requireAdmin, getRevenueAnalytics(db));

    // Get service type distribution
    router.get('/service-types', verifyToken, requireAdmin, getServiceTypeDistribution(db));

    // Get payment method analytics
    router.get('/payment-methods', verifyToken, requireAdmin, getPaymentMethodAnalytics(db));

    // Get status distribution
    router.get('/status-distribution', verifyToken, requireAdmin, getStatusDistribution(db));

    // Get customer analytics
    router.get('/customers', verifyToken, requireAdmin, getCustomerAnalytics(db));

    // Get top customers
    router.get('/top-customers', verifyToken, requireAdmin, getTopCustomers(db));

    // Get monthly trends
    router.get('/monthly-trends', verifyToken, requireAdmin, getMonthlyTrends(db));

    return router;
};
