import React, { useState, useEffect } from 'react';
import { Bell, X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const RealTimeUpdates = ({ orders, onOrderUpdate }) => {
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Generate notifications based on order changes
  useEffect(() => {
    if (!orders || orders.length === 0) return;

    const handleOrderUpdate = (type, data) => {
      let notification = null;

      switch (type) {
        case 'created':
          notification = {
            id: Date.now(),
            type: 'order_created',
            title: 'Order Created',
            message: `Your order #${data.id || data.booking_id} has been created successfully.`,
            data: data,
            timestamp: new Date(),
            read: false
          };
          break;

        case 'updated':
          notification = {
            id: Date.now(),
            type: 'order_updated',
            title: 'Order Updated',
            message: `Your order #${data.id || data.booking_id} has been updated.`,
            data: data,
            timestamp: new Date(),
            read: false
          };
          break;

        case 'status_advanced':
          notification = {
            id: Date.now(),
            type: 'order_status_advanced',
            title: 'Order Status Updated',
            message: `Your order #${data.id || data.booking_id} status changed to ${data.status}.`,
            data: data,
            timestamp: new Date(),
            read: false
          };
          break;

        case 'global_status_changed':
          notification = {
            id: Date.now(),
            type: 'order_status_changed',
            title: 'Order Status Changed',
            message: `Order #${data.id || data.booking_id} status updated to ${data.status}.`,
            data: data,
            timestamp: new Date(),
            read: false
          };
          break;

        default:
          break;
      }

      if (notification) {
        setNotifications(prev => [notification, ...prev.slice(0, 9)]); // Keep only last 10 notifications
      }
    };

    // Listen for order updates
    if (onOrderUpdate) {
      // This component will receive updates through the onOrderUpdate prop
      // The actual event handling is done in the parent component (ScheduleBooking)
    }

  }, [orders, onOrderUpdate]);

  const markAsRead = (id) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'order_created':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'order_updated':
      case 'order_status_advanced':
      case 'order_status_changed':
        return <Info className="w-5 h-5 text-blue-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative p-2 text-gray-600 hover:text-gray-800 transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {showNotifications && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-2 text-sm text-gray-500">
                    ({unreadCount} unread)
                  </span>
                )}
              </h3>
              <div className="flex items-center gap-2">
                {notifications.length > 0 && (
                  <button
                    onClick={clearAllNotifications}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Clear all
                  </button>
                )}
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          {notification.timestamp.toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNotification(notification.id);
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Overlay to close dropdown when clicking outside */}
      {showNotifications && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowNotifications(false)}
        />
      )}
    </div>
  );
};

export default RealTimeUpdates;
