import { Order } from '../models/Order.js';

// Controller for admin dashboard statistics and overview
export const getDashboardStats = (db) => async (req, res) => {
  const orderModel = new Order(db);
  try {
    const stats = await orderModel.getDashboardStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Server error fetching dashboard statistics' });
  }
};

// Controller to get monthly revenue data for charts
export const getMonthlyRevenue = (db) => async (req, res) => {
  const orderModel = new Order(db);
  try {
    const revenue = await orderModel.getMonthlyRevenue();
    res.json(revenue);
  } catch (error) {
    console.error('Error fetching monthly revenue:', error);
    res.status(500).json({ message: 'Server error fetching monthly revenue' });
  }
};

// Controller to get daily orders for the current week
export const getWeeklyOrders = (db) => async (req, res) => {
  const orderModel = new Order(db);
  try {
    const orders = await orderModel.getWeeklyOrders();
    res.json(orders);
  } catch (error) {
    console.error('Error fetching weekly orders:', error);
    res.status(500).json({ message: 'Server error fetching weekly orders' });
  }
};
