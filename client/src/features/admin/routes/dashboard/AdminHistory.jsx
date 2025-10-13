import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Modal from 'react-modal';
import BookingDetailsModal from '../../../../shared/components/BookingDetailsModal';

// Initialize modal
Modal.setAppElement('#root');

// History type options for filtering
const historyTypeOptions = [
  { value: 'all', label: 'All History' },
  { value: 'completed', label: 'Completed' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'deleted', label: 'Deleted' }
];

// Status color mapping
const getStatusColor = (status) => {
  switch (status) {
    case 'completed':
    case 'approved':
      return 'bg-green-100 text-green-800';
    case 'rejected':
      return 'bg-red-100 text-red-800';
    case 'deleted':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-blue-100 text-blue-800';
  }
};

// Type icon mapping
const getTypeIcon = (type) => {
  switch (type) {
    case 'order':
      return '📦';
    case 'booking':
      return '📅';
    default:
      return '📋';
  }
};

const AdminHistory = () => {
  const navigate = useNavigate();
  const [historyItems, setHistoryItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    console.log('AdminHistory component mounted/updated');
    fetchHistory();

    // Set up periodic refresh every 60 seconds
    const intervalId = setInterval(() => {
      fetchHistory();
    }, 60000);

    return () => clearInterval(intervalId);
  }, []);

  // Filter and sort items when dependencies change
  useEffect(() => {
    let filtered = [...historyItems];

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(item => item.status === typeFilter || item.type === typeFilter);
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.contact?.includes(searchTerm) ||
        item.mainService?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id?.toString().includes(searchTerm)
      );
    }

    // Apply sorting
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.moved_to_history_at || b.deleted_at || b.createdAt) - new Date(a.moved_to_history_at || a.deleted_at || a.createdAt));
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.moved_to_history_at || a.deleted_at || a.createdAt) - new Date(b.moved_to_history_at || b.deleted_at || b.createdAt));
        break;
      case 'name':
        filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      case 'type':
        filtered.sort((a, b) => (a.type || '').localeCompare(b.type || ''));
        break;
      default:
        break;
    }

    setFilteredItems(filtered);
  }, [historyItems, typeFilter, searchTerm, sortBy]);

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found. Please log in again.');
        navigate('/login');
        return;
      }

      console.log('Fetching history from API...');
      const response = await fetch('http://localhost:8800/api/admin/history', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const historyData = await response.json();
        console.log('Fetched history from API:', historyData);

        // Transform the data to match frontend expectations
        const transformedHistory = historyData.map(item => ({
          ...item,
          // Format dates
          createdAt: new Date(item.createdAt),
          moved_to_history_at: item.moved_to_history_at ? new Date(item.moved_to_history_at) : null,
          deleted_at: item.deleted_at ? new Date(item.deleted_at) : null,
          // Ensure consistent field names
          mainService: item.mainService || item.serviceType,
          totalPrice: item.totalPrice || item.amount,
          pickupDate: item.pickupDate || item.date,
          pickupTime: item.pickupTime || item.time
        }));

        setHistoryItems(transformedHistory);
        setError(null);
      } else {
        if (response.status === 403) {
          setError('Admin access required. Please log in as an administrator.');
          navigate('/login');
        } else if (response.status === 401) {
          setError('Session expired. Please log in again.');
          navigate('/login');
        } else {
          setError('Failed to load history. Please try again later.');
        }
      }
    } catch (error) {
      console.error('Error fetching history:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistoryByType = async (type) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`http://localhost:8800/api/admin/history/type/${type}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const historyData = await response.json();
        return historyData;
      }
    } catch (error) {
      console.error('Error fetching history by type:', error);
    }
    return [];
  };

  const restoreFromHistory = async (itemId, type) => {
    try {
      setActionLoading(prev => ({ ...prev, [itemId]: 'restoring' }));
      const token = localStorage.getItem('token');

      const response = await fetch(`http://localhost:8800/api/admin/history/${itemId}/restore`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ type })
      });

      if (response.ok) {
        // Remove from history and refresh
        setHistoryItems(prev => prev.filter(item => item.id !== itemId));
        alert('Item restored successfully!');
      } else {
        const errorData = await response.json();
        alert(`Failed to restore item: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error restoring from history:', error);
      alert('Failed to restore item');
    } finally {
      setActionLoading(prev => ({ ...prev, [itemId]: null }));
    }
  };

  const deleteFromHistory = async (itemId, type) => {
    if (!window.confirm('Are you sure you want to permanently delete this item? This action cannot be undone.')) {
      return;
    }

    try {
      setActionLoading(prev => ({ ...prev, [itemId]: 'deleting' }));
      const token = localStorage.getItem('token');

      const response = await fetch(`http://localhost:8800/api/admin/history/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ type })
      });

      if (response.ok) {
        // Remove from history
        setHistoryItems(prev => prev.filter(item => item.id !== itemId));
        alert('Item permanently deleted!');
      } else {
        const errorData = await response.json();
        alert(`Failed to delete item: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting from history:', error);
      alert('Failed to delete item');
    } finally {
      setActionLoading(prev => ({ ...prev, [itemId]: null }));
    }
  };

  const handleItemClick = (item) => {
    setSelectedItem(item);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price) => {
    if (price === null || price === undefined) return 'N/A';
    return `₱${Number(price).toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
            </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-red-600">
          <p className="text-lg font-semibold mb-4">Error loading history</p>
          <p>{error}</p>
          <button
            onClick={fetchHistory}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Admin History</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full lg:w-auto">
          <div className="bg-white p-4 rounded-lg shadow-md border">
            <div className="text-2xl font-bold text-blue-600">{historyItems.length}</div>
            <div className="text-sm text-gray-600">Total History</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md border">
            <div className="text-2xl font-bold text-green-600">
              {historyItems.filter(item => item.status === 'completed' || item.status === 'approved').length}
            </div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md border">
            <div className="text-2xl font-bold text-red-600">
              {historyItems.filter(item => item.status === 'rejected').length}
            </div>
            <div className="text-sm text-gray-600">Rejected</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md border">
            <div className="text-2xl font-bold text-gray-600">
              {historyItems.filter(item => item.is_deleted).length}
            </div>
            <div className="text-sm text-gray-600">Deleted</div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by customer name, service, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Type Filter */}
          <div className="md:w-48">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {historyTypeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="md:w-48">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">By Name</option>
              <option value="type">By Type</option>
            </select>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="text-lg">No history items found</p>
            <p className="text-sm">Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Moved to History
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredItems.map((item) => (
                  <tr key={`${item.type}-${item.id}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <button
                          onClick={() => handleItemClick(item)}
                          className="text-sm font-medium text-blue-600 hover:text-blue-900 hover:underline cursor-pointer flex items-center gap-2"
                        >
                          <span>{getTypeIcon(item.type)}</span>
                          {item.type === 'order' ? 'Order' : 'Booking'} #{item.id}
                        </button>
                        <div className="text-sm text-gray-500">
                          Created: {formatDate(item.createdAt)}
                        </div>
                        {item.pickupDate && (
                          <div className="text-sm text-gray-500">
                            Pickup: {item.pickupDate} at {item.pickupTime}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {item.name || 'N/A'}
                        </div>
                        {item.contact && (
                          <div className="text-sm text-gray-500">
                            {item.contact}
                          </div>
                        )}
                        {item.email && (
                          <div className="text-sm text-gray-500">
                            {item.email}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {item.mainService || item.serviceType || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        Load: {item.loadCount || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {item.status?.charAt(0).toUpperCase() + item.status?.slice(1) || 'Unknown'}
                      </span>
                      {item.rejectionReason && (
                        <div className="text-xs text-red-600 mt-1">
                          Reason: {item.rejectionReason}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatPrice(item.totalPrice)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(item.moved_to_history_at || item.deleted_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => restoreFromHistory(item.id, item.type)}
                          disabled={actionLoading[item.id] === 'restoring'}
                          className="text-green-600 hover:text-green-900 text-xs disabled:opacity-50"
                        >
                          {actionLoading[item.id] === 'restoring' ? 'Restoring...' : 'Restore'}
                        </button>
                       
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Booking Details Modal */}
      <BookingDetailsModal
        selectedItem={selectedItem}
        setSelectedItem={setSelectedItem}
        onRestore={restoreFromHistory}
        onDelete={deleteFromHistory}
        loading={actionLoading[selectedItem?.id]}
      />
    </div>
  );
};

export default AdminHistory;
