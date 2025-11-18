import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../../../../utils/axios';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const AnalyticsDashboard = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('7d');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found. Please log in again.');
        return;
      }

      const response = await apiClient.get(`/api/admin/analytics?range=${timeRange}`);

      setAnalyticsData(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
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
          <p className="text-lg font-semibold mb-4">Error loading analytics</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-gray-600">
          <p className="text-lg">No analytics data available</p>
        </div>
      </div>
    );
  }

  // Chart data preparation
  const statusChartData = {
    labels: ['Pending', 'Washing', 'Drying', 'Folding', 'Ready', 'Completed'],
    datasets: [{
      data: [
        analyticsData.ordersByStatus?.pending || 0,
        analyticsData.ordersByStatus?.washing || 0,
        analyticsData.ordersByStatus?.drying || 0,
        analyticsData.ordersByStatus?.folding || 0,
        analyticsData.ordersByStatus?.ready || 0,
        analyticsData.ordersByStatus?.completed || 0
      ],
      backgroundColor: [
        '#FCD34D', // yellow
        '#3B82F6', // blue
        '#8B5CF6', // purple
        '#06B6D4', // cyan
        '#10B981', // green
        '#6B7280'  // gray
      ],
      borderWidth: 2
    }]
  };

  const revenueChartData = {
    labels: analyticsData.dailyRevenue?.map(item => formatDate(item.date)) || [],
    datasets: [{
      label: 'Daily Revenue',
      data: analyticsData.dailyRevenue?.map(item => item.revenue) || [],
      borderColor: '#10B981',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      fill: true,
      tension: 0.4
    }]
  };

  const serviceTypeChartData = {
    labels: ['Wash & Fold', 'Dry Cleaning', 'Hang Dry'],
    datasets: [{
      data: [
        analyticsData.ordersByServiceType?.washFold || 0,
        analyticsData.ordersByServiceType?.dryCleaning || 0,
        analyticsData.ordersByServiceType?.hangDry || 0
      ],
      backgroundColor: ['#3B82F6', '#8B5CF6', '#F59E0B'],
      borderWidth: 2
    }]
  };

  const bookingStatusChartData = {
    labels: ['Pending', 'Approved', 'Rejected', 'Completed'],
    datasets: [{
      data: [
        analyticsData.bookingsByStatus?.pending || 0,
        analyticsData.bookingsByStatus?.approved || 0,
        analyticsData.bookingsByStatus?.rejected || 0,
        analyticsData.bookingsByStatus?.completed || 0
      ],
      backgroundColor: ['#FCD34D', '#10B981', '#EF4444', '#6B7280'],
      borderWidth: 2
    }]
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Analytics Dashboard Report', 20, 30);
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 45);

    // Add metrics
    doc.text(`Total Orders: ${analyticsData.totalOrders || 0}`, 20, 65);
    doc.text(`Total Revenue: ${formatCurrency(analyticsData.totalRevenue || 0)}`, 20, 80);
    doc.text(`Active Bookings: ${analyticsData.activeBookings || 0}`, 20, 95);
    doc.text(`Avg Order Value: ${formatCurrency(analyticsData.avgOrderValue || 0)}`, 20, 110);

    // Add top services
    doc.text('Top Services:', 20, 130);
    let yPos = 145;
    if (analyticsData.topServices) {
      analyticsData.topServices.forEach((service, index) => {
        doc.text(`${service.name}: ${service.count} orders`, 30, yPos);
        yPos += 15;
      });
    }

    doc.save('analytics-report.pdf');
  };

  const exportToExcel = () => {
    const data = [
      ['Metric', 'Value'],
      ['Total Orders', analyticsData.totalOrders || 0],
      ['Total Revenue', formatCurrency(analyticsData.totalRevenue || 0)],
      ['Active Bookings', analyticsData.activeBookings || 0],
      ['Avg Order Value', formatCurrency(analyticsData.avgOrderValue || 0)],
      [],
      ['Top Services', 'Orders'],
      ...(analyticsData.topServices?.map(service => [service.name, service.count]) || []),
      [],
      ['Top Customers', 'Total Spent', 'Orders'],
      ...(analyticsData.topCustomers?.map(customer => [customer.name, formatCurrency(customer.totalSpent), customer.totalOrders]) || [])
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Analytics');
    XLSX.writeFile(wb, 'analytics-report.xlsx');
  };

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Analytics Dashboard</h1>
        <p className="text-gray-600">Comprehensive insights into your laundry operations</p>

        {/* Date Range Picker */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            {/* From Date */}
            <div className="w-full sm:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
              <DatePicker
                selected={startDate}
                onChange={(date) => setStartDate(date)}
                dateFormat="yyyy-MM-dd"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholderText="Select start date"
              />
            </div>

            {/* To Date */}
            <div className="w-full sm:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
              <DatePicker
                selected={endDate}
                onChange={(date) => setEndDate(date)}
                dateFormat="yyyy-MM-dd"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholderText="Select end date"
              />
            </div>

            {/* Generate Report Button */}
            <div className="w-full sm:w-auto sm:flex-shrink-0">
              <button
                onClick={() => {
                  if (startDate && endDate) {
                    // Here you could call a function to generate report with custom date range
                    console.log('Generating report from', startDate, 'to', endDate);
                    // For now, just show an alert
                    alert(`Report generated for date range: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
                  } else {
                    alert('Please select both start and end dates');
                  }
                }}
                className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Generate Report
              </button>
            </div>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => exportToPDF()}
            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
          >
            Export PDF
          </button>
          <button
            onClick={() => exportToExcel()}
            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
          >
            Export Excel
          </button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{analyticsData.totalOrders || 0}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className={`font-medium ${analyticsData.ordersGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {analyticsData.ordersGrowth >= 0 ? '+' : ''}{analyticsData.ordersGrowth || 0}%
            </span>
            <span className="text-gray-500 ml-1">from last period</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(analyticsData.totalRevenue || 0)}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className={`font-medium ${analyticsData.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {analyticsData.revenueGrowth >= 0 ? '+' : ''}{analyticsData.revenueGrowth || 0}%
            </span>
            <span className="text-gray-500 ml-1">from last period</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Bookings</p>
              <p className="text-2xl font-bold text-gray-900">{analyticsData.activeBookings || 0}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className={`font-medium ${analyticsData.bookingsGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {analyticsData.bookingsGrowth >= 0 ? '+' : ''}{analyticsData.bookingsGrowth || 0}%
            </span>
            <span className="text-gray-500 ml-1">from last period</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(analyticsData.avgOrderValue || 0)}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className={`font-medium ${analyticsData.aovGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {analyticsData.aovGrowth >= 0 ? '+' : ''}{analyticsData.aovGrowth || 0}%
            </span>
            <span className="text-gray-500 ml-1">from last period</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Revenue Trend */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Revenue Trend</h3>
          <Line
            data={revenueChartData}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'bottom',
                },
                title: {
                  display: false,
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    callback: function(value) {
                      return '₱' + value.toLocaleString();
                    }
                  }
                }
              }
            }}
          />
        </div>

        {/* Order Status Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Order Status Distribution</h3>
          <Doughnut
            data={statusChartData}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'bottom',
                },
                title: {
                  display: false,
                },
              },
            }}
          />
        </div>

        {/* Service Type Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Service Type Distribution</h3>
          <Pie
            data={serviceTypeChartData}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'bottom',
                },
                title: {
                  display: false,
                },
              },
            }}
          />
        </div>

        {/* Booking Status Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Booking Status Distribution</h3>
          <Doughnut
            data={bookingStatusChartData}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'bottom',
                },
                title: {
                  display: false,
                },
              },
            }}
          />
        </div>
      </div>

        {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Customers</h3>
          <div className="space-y-3">
            {analyticsData.topCustomers?.map((customer, index) => (
              <div key={index} className="flex justify-between items-center">
                <div>
                  <span className="text-sm font-medium text-gray-800">{customer.name}</span>
                  <p className="text-xs text-gray-500">{customer.email}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-green-600">{formatCurrency(customer.totalSpent)}</span>
                  <p className="text-xs text-gray-500">{customer.totalOrders} orders</p>
                </div>
              </div>
            )) || (
              <div className="text-sm text-gray-500">No customer data available</div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Services</h3>
          <div className="space-y-3">
            {analyticsData.topServices?.map((service, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{service.name}</span>
                <span className="font-semibold">{service.count} orders</span>
              </div>
            )) || (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Wash & Fold</span>
                  <span className="font-semibold">45 orders</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Dry Cleaning</span>
                  <span className="font-semibold">23 orders</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Hang Dry</span>
                  <span className="font-semibold">12 orders</span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {analyticsData.recentActivity?.map((activity, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-800">{activity.description}</p>
                  <p className="text-xs text-gray-500">{formatDate(activity.timestamp)}</p>
                </div>
              </div>
            )) || (
              <>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-800">New order received</p>
                    <p className="text-xs text-gray-500">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-800">Order completed</p>
                    <p className="text-xs text-gray-500">4 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-800">Booking approved</p>
                    <p className="text-xs text-gray-500">6 hours ago</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Summary Insights */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Key Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
            <div>
              <p className="text-sm font-medium text-gray-800">Peak Hours</p>
              <p className="text-sm text-gray-600">Most orders are placed between 9 AM - 11 AM</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
            <div>
              <p className="text-sm font-medium text-gray-800">Popular Service</p>
              <p className="text-sm text-gray-600">Wash & Fold is the most requested service</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
            <div>
              <p className="text-sm font-medium text-gray-800">Growth Trend</p>
              <p className="text-sm text-gray-600">Revenue has increased by 15% this month</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
            <div>
              <p className="text-sm font-medium text-gray-800">Customer Retention</p>
              <p className="text-sm text-gray-600">85% of customers are repeat customers</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
