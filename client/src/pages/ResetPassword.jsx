import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faArrowLeft, faStar, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons'; // Added faEye and faEyeSlash

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState("");
  const [showPassword, setShowPassword] = useState(false); // State for toggling new password visibility
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // State for toggling confirm password visibility
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const tokenFromUrl = searchParams.get("token");
    if (!tokenFromUrl) {
      setError("Invalid reset link. No token provided.");
      return;
    }
    setToken(tokenFromUrl);
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (!password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post('http://localhost:8800/auth/reset-password', {
        token,
        password
      });

      setSuccess(response.data.message || "Password reset successfully!");
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      console.error("Reset password error:", err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError("Failed to reset password. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!token && !error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500 mx-auto"></div>
          <p className="mt-4 text-gray-700">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      {/* Navbar */}
      <nav className="bg-pink-500 p-5 flex justify-between items-center text-white shadow-lg">
        <h1 className="text-4xl font-extrabold">Wash It Izzy</h1>
        <div className="space-x-6">
          <a href="/" className="hover:underline font-semibold text-lg">Home</a>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex justify-center items-center mt-12 lg:mt-16 p-6">
        <div className="w-full max-w-md bg-white p-7 rounded-xl shadow-2xl border-2 border-pink-400">
          <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-pink-500 to-pink-300 bg-clip-text text-transparent">
            Reset Password
          </h2>
          <p className="text-center text-gray-500 font-semibold mb-6">Wash It Izzy</p>

          <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
            <div className="relative"> {/* Wrapper for positioning the toggle button */}
              <label className="text-gray-600">New Password</label>
              <input
                type={showPassword ? "text" : "password"}  // Toggle type
                placeholder="Enter new password"
                className="w-full p-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-pink-500 transition-all pl-4 pr-12"  // Added padding for the icon
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength="8"
              />
              <button
                type="button"  // Not a submit button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-11 right-3 flex items-center text-gray-500 hover:text-pink-500 focus:outline-none"
              >
                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />  {/* Toggle icon */}
              </button>
            </div>

            <div className="relative"> {/* Wrapper for positioning the toggle button */}
              <label className="text-gray-600">Confirm New Password</label>
              <input
                type={showConfirmPassword ? "text" : "password"}  // Toggle type
                placeholder="Confirm new password"
                className="w-full p-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-pink-500 transition-all pl-4 pr-12"  // Added padding for the icon
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength="8"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-11 right-3 flex items-center text-gray-500 hover:text-pink-500 focus:outline-none"
              >
                <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} />  {/* Toggle icon */}
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                {success}
              </div>
            )}

            <div>
              <button
                type="submit"
                className={`w-full bg-gradient-to-r from-pink-500 to-pink-300 text-black p-3 rounded-full hover:opacity-90 transition-all ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                disabled={isLoading}
              >
                {isLoading ? 'Resetting Password...' : 'Reset Password'}
              </button>
            </div>

            <div className="text-center mt-4">
              <p className="text-gray-600">
                Remember your password?{' '}
                <a href="/login" className="text-pink-500 hover:underline">
                  Back to Login
                </a>
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-pink-400 text-white py-12 mt-12">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-white text-sm">
            &copy; {new Date().getFullYear()} Wash It Izzy - All Rights Reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default ResetPassword;