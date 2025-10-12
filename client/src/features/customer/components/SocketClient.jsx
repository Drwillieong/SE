import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const SocketClient = ({
  userId,
  userRole,
  onOrderUpdate,
  onBookingUpdate,
  onNotification,
  onNewOrder,
  onBookingToOrder,
  onBookingCountsUpdate
}) => {
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const maxReconnectAttempts = 5;
  const reconnectDelay = 1000; // Start with 1 second

  const connectSocket = useCallback(() => {
    if (socketRef.current?.connected) {
      return; // Already connected
    }

    console.log('Attempting to connect to WebSocket server...');

    // Initialize socket connection with improved configuration
    const socket = io('http://localhost:8800', {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: reconnectDelay,
      forceNew: true,
      upgrade: true,
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    socketRef.current = socket;

    // Connection event handlers
    socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      setIsConnected(true);
      setConnectionError(null);
      setReconnectAttempts(0);

      // Authenticate with JWT token
      const token = localStorage.getItem('token');
      if (token) {
        socket.emit('authenticate', token);
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('Disconnected from WebSocket server:', reason);
      setIsConnected(false);

      // Attempt to reconnect if not manually disconnected
      if (reason !== 'io client disconnect' && reconnectAttempts < maxReconnectAttempts) {
        const delay = Math.min(reconnectDelay * Math.pow(2, reconnectAttempts), 30000);
        console.log(`Attempting to reconnect in ${delay}ms...`);

        reconnectTimeoutRef.current = setTimeout(() => {
          setReconnectAttempts(prev => prev + 1);
          connectSocket();
        }, delay);
      }
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setConnectionError(error.message);
      setIsConnected(false);
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log(`Reconnected to WebSocket server after ${attemptNumber} attempts`);
      setIsConnected(true);
      setConnectionError(null);
      setReconnectAttempts(0);
    });

    socket.on('reconnect_error', (error) => {
      console.error('WebSocket reconnection failed:', error);
      setConnectionError(error.message);
    });

    socket.on('authenticated', (data) => {
      if (data.success) {
        console.log('Socket authentication successful');
      } else {
        console.error('Socket authentication failed:', data.message);
        setConnectionError(data.message);
      }
    });

    // Order-related event handlers
    socket.on('your-order-created', (data) => {
      console.log('Your order created:', data);
      if (onOrderUpdate) {
        onOrderUpdate('created', data);
      }
      if (onNotification) {
        onNotification({
          type: 'order_created',
          title: 'Order Created',
          message: data.message,
          data: data,
          timestamp: new Date()
        });
      }
    });

    socket.on('your-order-updated', (data) => {
      console.log('Your order updated:', data);
      if (onOrderUpdate) {
        onOrderUpdate('updated', data);
      }
      if (onNotification) {
        onNotification({
          type: 'order_updated',
          title: 'Order Updated',
          message: data.message,
          data: data,
          timestamp: new Date()
        });
      }
    });

    socket.on('your-order-status-advanced', (data) => {
      console.log('Your order status advanced:', data);
      if (onOrderUpdate) {
        onOrderUpdate('status_advanced', data);
      }
      if (onNotification) {
        onNotification({
          type: 'order_status_advanced',
          title: 'Order Status Updated',
          message: data.message,
          data: data,
          timestamp: new Date()
        });
      }
    });

    socket.on('your-booking-created', (data) => {
      console.log('Your booking created:', data);
      if (onBookingUpdate) {
        onBookingUpdate('created', data);
      }
      if (onNotification) {
        onNotification({
          type: 'booking_created',
          title: 'Booking Created',
          message: data.message,
          data: data,
          timestamp: new Date()
        });
      }
    });

    socket.on('your-booking-updated', (data) => {
      console.log('Your booking updated:', data);
      if (onBookingUpdate) {
        onBookingUpdate('updated', data);
      }
      if (onNotification) {
        onNotification({
          type: 'booking_updated',
          title: 'Booking Updated',
          message: data.message,
          data: data,
          timestamp: new Date()
        });
      }
    });

    socket.on('your-booking-converted-to-order', (data) => {
      console.log('Your booking converted to order:', data);
      if (onBookingToOrder) {
        onBookingToOrder(data);
      }
      if (onNotification) {
        onNotification({
          type: 'booking_converted',
          title: 'Booking Converted',
          message: data.message,
          data: data,
          timestamp: new Date()
        });
      }
    });

    // Global order and booking events (for real-time updates)
    socket.on('order-status-changed', (data) => {
      console.log('Order status changed:', data);
      if (onOrderUpdate) {
        onOrderUpdate('global_status_changed', data);
      }
    });

    socket.on('booking-status-changed', (data) => {
      console.log('Booking status changed:', data);
      if (onBookingUpdate) {
        onBookingUpdate('global_status_changed', data);
      }
    });

    // Booking counts update event
    socket.on('booking-counts-updated', (data) => {
      console.log('Booking counts updated:', data);
      if (onBookingCountsUpdate) {
        onBookingCountsUpdate(data);
      }
    });

    // Booking count changed event (for real-time updates)
    socket.on('booking-count-changed', (data) => {
      console.log('Booking count changed:', data);
      if (onBookingCountsUpdate) {
        onBookingCountsUpdate(data);
      }
    });

    // Return cleanup function for useEffect
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [userId, userRole, onOrderUpdate, onBookingUpdate, onNotification, onNewOrder, onBookingToOrder, reconnectAttempts, maxReconnectAttempts, reconnectDelay]);

  // Initialize connection on mount
  useEffect(() => {
    const cleanup = connectSocket();

    // Cleanup function
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (cleanup) {
        cleanup();
      }
    };
  }, [connectSocket]);

  // Function to manually reconnect
  const reconnect = () => {
    setReconnectAttempts(0);
    setConnectionError(null);
    const cleanup = connectSocket();
    return cleanup;
  };

  // Function to disconnect
  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
  };

  // Return null since this is a side-effect component that doesn't render anything
  return null;
};

export default SocketClient;
