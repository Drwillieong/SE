import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, requiredRole }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole && !(requiredRole === 'user' && user.role === 'customer')) {
    // If role doesn't match, redirect to appropriate dashboard or login
    return <Navigate to={user.role === 'admin' ? '/dashboard' : '/customer-dashboard'} replace />;
  }

  return children;
};

export default ProtectedRoute;
