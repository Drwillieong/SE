import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const AuthSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    const userId = searchParams.get('userId');

    if (token && userId) {
      // Store the token in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('userId', userId);
      
      // Set default Authorization header for axios
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Redirect to dashboard after successful authentication
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } else {
      setError('Authentication failed. Missing token or user ID.');
      setIsLoading(false);
    }
  }, [navigate, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Authentication Failed</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-pink-500 text-white py-3 rounded-xl font-semibold hover:bg-pink-600 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center">
        <div className="text-green-500 text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Authentication Successful!</h2>
        <p className="text-gray-600 mb-6">You will be redirected to the dashboard shortly...</p>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-b-4 border-pink-500"></div>
        </div>
      </div>
    </div>
  );
};

export default AuthSuccess;
