import axios from 'axios';
import { Order } from '../models/Order.js';
import { sendPaymentConfirmationEmail } from '../utils/email.js';

export class PaymentController {
  constructor(db) {
    this.db = db;
    this.orderModel = new Order(db);
  }

  // Create Maya payment intent
  async createPaymentIntent(req, res) {
    try {
      const { orderId, amount, description } = req.body;
      const userId = req.user.user_id;

      // Verify order belongs to user and is in pending status
      const order = await this.orderModel.getById(orderId, userId);
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      if (order.status !== 'pending') {
        return res.status(400).json({ message: 'Order is not eligible for payment' });
      }

      if (order.paymentMethod !== 'gcash' && order.paymentMethod !== 'card') {
        return res.status(400).json({ message: 'Order payment method does not support online payment' });
      }

      // Maya API configuration
      const mayaConfig = {
        baseURL: process.env.MAYA_BASE_URL || 'https://pg-sandbox.paymaya.com',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${process.env.MAYA_PUBLIC_KEY}:${process.env.MAYA_SECRET_KEY}`).toString('base64')}`,
          'Content-Type': 'application/json'
        }
      };

      // Create payment payload
      const paymentPayload = {
        totalAmount: {
          value: amount,
          currency: 'PHP',
          details: {
            discount: 0,
            serviceCharge: 0,
            shippingFee: 0,
            tax: 0,
            subtotal: amount
          }
        },
        buyer: {
          contact: {
            email: order.email,
            phone: order.contact
          },
          firstName: order.name.split(' ')[0],
          lastName: order.name.split(' ').slice(1).join(' ') || order.name.split(' ')[0],
          billingAddress: {
            line1: order.address,
            line2: '',
            city: 'Manila',
            state: 'Metro Manila',
            zipCode: '1000',
            countryCode: 'PH'
          }
        },
        redirectUrl: {
          success: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/success?orderId=${orderId}`,
          failure: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/failure?orderId=${orderId}`,
          cancel: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/cancel?orderId=${orderId}`
        },
        requestReferenceNumber: `ORDER_${orderId}_${Date.now()}`,
        metadata: {
          orderId: orderId.toString(),
          description: description || `Payment for Order #${orderId}`
        }
      };

      // Create payment via Maya API
      const response = await axios.post('/checkout/v1/checkouts', paymentPayload, mayaConfig);

      // Store payment reference in database (you might want to create a payments table)
      // For now, we'll store it temporarily in the order
      await this.orderModel.update(orderId, {
        paymentReference: response.data.checkoutId,
        paymentStatus: 'pending'
      });

      res.json({
        success: true,
        checkoutUrl: response.data.redirectUrl,
        checkoutId: response.data.checkoutId,
        orderId: orderId
      });

    } catch (error) {
      console.error('Payment creation error:', error.response?.data || error.message);
      res.status(500).json({
        message: 'Failed to create payment',
        error: error.response?.data?.message || error.message
      });
    }
  }

  // Handle Maya webhook for payment completion
  async handleWebhook(req, res) {
    try {
      const { id, isPaid, paymentStatus, requestReferenceNumber } = req.body;

      // Extract order ID from reference number
      const orderId = requestReferenceNumber.split('_')[1];

      if (isPaid && paymentStatus === 'PAYMENT_SUCCESS') {
        // Update order status to paid
        await this.orderModel.update(parseInt(orderId), {
          status: 'paid',
          paymentStatus: 'completed',
          paidAt: new Date()
        });

        // Get updated order details
        const order = await this.orderModel.getById(parseInt(orderId));

        // Send payment confirmation email
        if (order && order.email) {
          try {
            await sendPaymentConfirmationEmail(order.email, order.name, order.order_id, order.totalPrice, order.serviceType);
          } catch (emailError) {
            console.error('Failed to send payment confirmation email:', emailError);
          }
        }

        // Emit real-time update
        if (req.io) {
          req.io.emit('order-status-changed', {
            orderId: parseInt(orderId),
            status: 'paid',
            userId: order.user_id
          });

          if (order.user_id) {
            req.io.to(`user_${order.user_id}`).emit('your-order-updated', {
              orderId: parseInt(orderId),
              status: 'paid'
            });
          }
        }

        res.json({ success: true, message: 'Payment processed successfully' });
      } else {
        // Payment failed
        await this.orderModel.update(parseInt(orderId), {
          paymentStatus: 'failed'
        });

        res.json({ success: false, message: 'Payment failed' });
      }

    } catch (error) {
      console.error('Webhook processing error:', error);
      res.status(500).json({ message: 'Webhook processing failed' });
    }
  }

  // Check payment status
  async checkPaymentStatus(req, res) {
    try {
      const { orderId } = req.params;
      const userId = req.user.user_id;

      const order = await this.orderModel.getById(parseInt(orderId), userId);
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      res.json({
        orderId: order.order_id,
        status: order.status,
        paymentStatus: order.paymentStatus || 'pending',
        paidAt: order.paidAt
      });

    } catch (error) {
      console.error('Payment status check error:', error);
      res.status(500).json({ message: 'Failed to check payment status' });
    }
  }

  // Get payment details for admin
  async getPaymentDetails(req, res) {
    try {
      const { orderId } = req.params;

      const order = await this.orderModel.getById(parseInt(orderId));
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      res.json({
        orderId: order.order_id,
        totalPrice: order.totalPrice,
        paymentMethod: order.paymentMethod,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentReference: order.paymentReference,
        paidAt: order.paidAt,
        createdAt: order.createdAt
      });

    } catch (error) {
      console.error('Payment details error:', error);
      res.status(500).json({ message: 'Failed to get payment details' });
    }
  }
}

// Export instance factory
export const createPaymentController = (db) => new PaymentController(db);
