import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import pusa from "../assets/pusa.jpeg";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebook, faInstagram } from '@fortawesome/free-brands-svg-icons';

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [requiresEmailVerification, setRequiresEmailVerification] = useState(false);
  const [emailForVerification, setEmailForVerification] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const navigate = useNavigate();

  // Handle Google OAuth callback
  useEffect(() => {
    const handleGoogleCallback = async () => {
      try {
        // Check if token is in URL parameters (from Google OAuth redirect)
        const urlParams = new URLSearchParams(window.location.search);
        const tokenFromUrl = urlParams.get('token');

        if (tokenFromUrl) {
          console.log('LoginPage: Token found in URL from Google OAuth');

          // Store the token in localStorage
          localStorage.setItem('token', tokenFromUrl);
          axios.defaults.headers.common['Authorization'] = `Bearer ${tokenFromUrl}`;

          // Fetch user data using the token
          console.log('LoginPage: Fetching user data from /auth/me');
          const userResponse = await axios.get('http://localhost:8800/auth/me');
          console.log('LoginPage: User data received:', userResponse.data);

          // Store the user data in localStorage
          localStorage.setItem('user', JSON.stringify(userResponse.data));

          // Check if user has completed their profile setup
          const profileComplete = userResponse.data.profileComplete;
          console.log('LoginPage: Profile complete:', profileComplete);

          // Clean up URL by removing token parameter
          const newUrl = window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);

          // Redirect based on profile completion status and user role
          if (profileComplete) {
            console.log('LoginPage: Redirecting based on user role');
            const userRole = userResponse.data.role || 'user';
            if (userRole === 'admin') {
              navigate('/dashboard');
            } else if (userRole === 'user') {
              navigate('/customer-dashboard');
            }
          } else {
            console.log('LoginPage: Redirecting to new account setup');
            navigate('/newaccountsetup');
          }
        }
      } catch (error) {
        console.error('LoginPage: Error handling Google OAuth callback:', error);
        setError('Failed to complete Google authentication. Please try again.');
      }
    };

    handleGoogleCallback();
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Basic client-side validation
    if (!email || !password) {
      setError("Please fill in all fields");
      setIsLoading(false);
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post('http://localhost:8800/auth/login', {
        email,
        password
      });
      
      const { token, user } = response.data;

      // Check if user data exists in response
      if (!user || !token) {
        setError("Login failed: Invalid response from server. Please try again.");
        setIsLoading(false);
        return;
      }

      // Store token and user data
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Reset failed attempts on successful login
      setFailedAttempts(0);

      // Redirect based on user role
      if (user.role === "admin") {
        alert("Admin login successful! Redirecting to dashboard...");
        navigate("/dashboard");
      } else {
        alert("Login successful! Redirecting to your dashboard...");
        navigate("/customer-dashboard");
      }
    } catch (err) {
      // Increment failed attempts counter
      setFailedAttempts(prev => prev + 1);
      
      // User-friendly error messages
      let errorMessage = "Login failed";
      let requiresVerification = false;
      
      if (err.response && err.response.data) {
        if (err.response.data.message) {
          errorMessage = err.response.data.message;
        }
        if (err.response.data.requiresVerification) {
          requiresVerification = true;
          setEmailForVerification(email); // Store email for resend functionality
        }
      } else {
        errorMessage = `Login failed: ${err.message}`;
      }
      
      setError(errorMessage);
      setRequiresEmailVerification(requiresVerification);
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResendLoading(true);
    setResendMessage("");
    
    try {
      const response = await axios.post('http://localhost:8800/auth/resend-verification', {
        email: emailForVerification
      });
      
      setResendMessage(response.data.message || "Verification email sent. Please check your inbox.");
      setRequiresEmailVerification(false);
    } catch (error) {
      console.error("Error resending verification email:", error);
      if (error.response && error.response.data && error.response.data.message) {
        setResendMessage(`Error: ${error.response.data.message}`);
      } else {
        setResendMessage(`Error: ${error.message}`);
      }
    } finally {
      setResendLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setResetMessage("");
    
    if (!resetEmail) {
      setResetMessage("Please enter your email address");
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(resetEmail)) {
      setResetMessage("Please enter a valid email address");
      return;
    }

    try {
      // Call your backend password reset endpoint
      const response = await axios.post('http://localhost:8800/auth/forgot-password', {
        email: resetEmail
      });
      
      setResetMessage(response.data.message || "Password reset email sent. Please check your inbox.");
      setShowResetForm(false);
    } catch (error) {
      console.error("Error sending reset email:", error);
      if (error.response && error.response.data && error.response.data.message) {
        setResetMessage(`Error: ${error.response.data.message}`);
      } else {
        setResetMessage(`Error: ${error.message}`);
      }
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen h-screen font-sans">
      {/* Navbar */}
      <nav className="bg-pink-500 p-5 flex justify-between items-center text-white shadow-lg">
        <h1 className="text-4xl font-extrabold">Wash It Izzy</h1>
        <div className="space-x-6">
          <a href="/" className="hover:underline font-semibold text-lg">Home</a>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex justify-center items-center mt-12 lg:mt-16 p-6">
        {/* Left side: Image and Text */}
        <div className="flex-1 p-8 hidden lg:block">
          <img
            src={pusa}
            alt="Laundry Shop"
            className="w-[80%] h-[40vh] object-cover rounded-lg shadow-xl transition-all duration-300 hover:scale-105"
          />
          <div className="mt-6 text-center">
            <h2 className="text-3xl font-bold text-pink-500">Welcome to Wash It Izzy!</h2>
            <p className="text-gray-700 mt-3">Your trusted laundry service. Login to manage orders and services.</p>
          </div>
        </div>

        {/* Right side: Login Form */}
        <div className="w-full max-w-md bg-white p-7 rounded-xl shadow-2xl border-2 border-pink-400">
          <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-pink-500 to-pink-300 bg-clip-text text-transparent">
            Wash It Izzy
          </h2>
          <p className="text-center text-gray-500 font-semibold mb-6">Laundry shop</p>

          {!showResetForm ? (
            <form className="mt-4 space-y-4" onSubmit={handleLogin}>
              <div>
                <label className="text-gray-600">Email</label>
                <input
                  type="email"
                  placeholder="example@gmail.com"
                  className="w-full p-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-pink-500 transition-all"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                />
              </div>
              <div>
                <label className="text-gray-600">Password</label>
                <input
                  type="password"
                  placeholder="Enter password"
                  className="w-full p-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-pink-500 transition-all"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  minLength="8"
                />
              </div>
              <div className="flex justify-between text-sm">
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    id="rememberMe" 
                    className="mr-2"
                  />
                  <label htmlFor="rememberMe">Remember me</label>
                </div>
                <button 
                  type="button" 
                  className="text-gray-500 hover:underline"
                  onClick={() => setShowResetForm(true)}
                >
                  Forgot password?
                </button>
              </div>
              
              {error && (
                <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                  {error}
                  {failedAttempts >= 3 && (
                    <p className="mt-1 text-sm">For security, please try again later.</p>
                  )}
                </div>
              )}

              {/* Resend verification email section */}
              {requiresEmailVerification && (
                <div className="p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded-lg">
                  <p className="font-semibold">Email Verification Required</p>
                  <p className="text-sm mt-1">
                    Please check your email for the verification link. Didn't receive it?
                  </p>
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={resendLoading}
                    className="mt-2 bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 disabled:opacity-50"
                  >
                    {resendLoading ? 'Sending...' : 'Resend Verification Email'}
                  </button>
                  {resendMessage && (
                    <p className={`text-sm mt-2 ${resendMessage.includes("Error") ? "text-red-600" : "text-green-600"}`}>
                      {resendMessage}
                    </p>
                  )}
                </div>
              )}
              
              <div>
                <button
                  type="submit"
                  className={`w-full bg-gradient-to-r from-pink-500 to-pink-300 text-black p-3 rounded-full hover:opacity-90 transition-all ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                  disabled={isLoading}
                >
                  {isLoading ? 'Logging in...' : 'Login'}
                </button>
              </div>
              
              <div className="text-center mt-4">
                <p className="text-gray-600">
                  Don't have an account?{' '}
                  <Link to="/" className="text-pink-500 hover:underline">
                    Sign up
                  </Link>
                </p>
              </div>
              
              {/* Security tips */}
              <div className="text-xs text-gray-500 mt-4">
                <p className="font-semibold">Security Tips:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Never share your password with anyone</li>
                  <li>Use a strong, unique password</li>
                  <li>Log out after each session</li>
                </ul>
              </div>
            </form>
          ) : (
            <div className="mt-4 space-y-4">
              <h3 className="text-xl font-semibold text-center">Reset Password</h3>
              <p className="text-sm text-gray-600 text-center">
                Enter your email address and we'll send you a link to reset your password.
              </p>
              <form onSubmit={handlePasswordReset}>
                <div className="mt-4">
                  <label className="text-gray-600">Email</label>
                  <input
                    type="email"
                    placeholder="example@gmail.com"
                    className="w-full p-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-pink-500 transition-all"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>
                {resetMessage && (
                  <p className={`text-sm mt-2 p-2 rounded-lg ${resetMessage.includes("Error") ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                    {resetMessage}
                  </p>
                )}
                <div className="flex justify-between mt-4">
                  <button
                    type="button"
                    className="text-gray-500 hover:underline"
                    onClick={() => setShowResetForm(false)}
                  >
                    Back to Login
                  </button>
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-pink-500 to-pink-300 text-black px-4 py-2 rounded-full hover:opacity-90 transition-all"
                  >
                    Send Reset Link
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer id="contact" className="bg-pink-400 text-white py-12">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left items-center">
          <div className="py-4">
            <h3 className="text-xl font-bold mb-4">Socials</h3>
            <div className="flex justify-center md:justify-start space-x-6">
              <a 
                href="https://www.facebook.com/washitizzy" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-white hover:text-pink-200 transition-colors"
              >
                <FontAwesomeIcon icon={faFacebook} size="2x" />
              </a>
              <a 
                href="https://www.instagram.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-white hover:text-pink-200 transition-colors"
              >
                <FontAwesomeIcon icon={faInstagram} size="2x" />
              </a>
            </div>
          </div>

          <div className="py-4">
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <a href="#service" className="text-white hover:text-pink-200 transition-colors">
                  Services
                </a>
              </li>
              <li>
                <a href="#contact" className="text-white hover:text-pink-200 transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          <div className="py-4">
            <h4 className="text-lg font-semibold mb-4">Get in Touch</h4>
            <p className="text-white">Email: washitizzy@email.com</p>
            <p className="text-white">Phone: 123456789</p>
          </div>
        </div>

        <div className="text-center text-white text-sm mt-12 pb-4">
          &copy; {new Date().getFullYear()} Wash It Izzy - All Rights Reserved.
        </div>
      </footer>
    </div>
  );
};

export default LoginPage;