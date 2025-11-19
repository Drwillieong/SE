import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../utils/axios'; // Import the centralized client

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";

const SignUpModal = ({ showSignUpModal, setShowSignUpModal }) => {
  const navigate = useNavigate();
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [formData, setFormData] = useState({
    successMessage: "", // New state for success message
    firstName: "",
    lastName: "",
    contact: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  });
  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);


  // Password strength calculator
  useEffect(() => {
    if (formData.password) {
      let strength = 0;
      // Length check
      if (formData.password.length >= 8) strength += 1;
      if (formData.password.length >= 12) strength += 1;
      // Complexity checks
      if (/[A-Z]/.test(formData.password)) strength += 1;
      if (/[0-9]/.test(formData.password)) strength += 1;
      if (/[^A-Za-z0-9]/.test(formData.password)) strength += 1;
      setPasswordStrength(strength);
    } else {
      setPasswordStrength(0);
    }
  }, [formData.password]);

  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{10,15}$/;

    if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.contact.trim()) newErrors.contact = "Phone number is required";
    else if (!phoneRegex.test(formData.contact)) newErrors.contact = "Invalid phone number";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!emailRegex.test(formData.email)) newErrors.email = "Invalid email format";
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 8) newErrors.password = "Password must be at least 8 characters";
    if (!formData.confirmPassword) newErrors.confirmPassword = "Please confirm your password";
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    if (!formData.agreeToTerms) newErrors.agreeToTerms = "You must accept the terms";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const LoadingSpinner = () => {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-[1000]">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-pink-500 mb-4"></div>
          <p className="text-white font-medium">Creating your account...</p>
        </div>
      </div>
    );
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({...prev, [name]: ''}));
    }
  };

  const handleEmailSignUp = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!validateForm()) {
      setIsLoading(false);
      return;
    }

    try {
      // Clear any existing localStorage data to avoid stale data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      console.log('SignUpModal: Cleared localStorage before signup');

      // Prepare data for API (exclude confirmPassword and agreeToTerms)
      const { confirmPassword, agreeToTerms, ...userData } = formData;

      const response = await apiClient.post('/auth/signup', userData);

      console.log('SignUpModal: Signup response:', response.data);

      // Check if signup was successful and token is provided
      if (response.data.token) {
        const token = response.data.token;

        // Store the token in localStorage
        localStorage.setItem('token', token);
        console.log('SignUpModal: Token stored in localStorage');

        // Fetch user data using the token to check profileComplete
        const userResponse = await apiClient.get('/auth/me');
        console.log('SignUpModal: User data received:', userResponse.data);

        // Store the user data in localStorage
        localStorage.setItem('user', JSON.stringify(userResponse.data));
        console.log('SignUpModal: User data stored in localStorage');

        // Check if user has completed their profile setup
        const profileComplete = userResponse.data.profileComplete;
        console.log('SignUpModal: Profile complete:', profileComplete);

        setShowSignUpModal(false);
        await new Promise(resolve => setTimeout(resolve, 500));

        // Redirect based on profile completion status and user role
        if (profileComplete) {
          console.log('SignUpModal: Redirecting based on user role');
          const userRole = userResponse.data.role || 'customer';
          if (userRole === 'admin') {
            navigate('/dashboard');
          } else if(userRole === 'customer') {
            navigate('/customer-dashboard');
          }
        } else {
          console.log('SignUpModal: Redirecting to new account setup');
          navigate('/newaccountsetup');
        }
      } else {
        // Fallback to direct navigation if no token (shouldn't happen with our changes)
        setShowSignUpModal(false);
        await new Promise(resolve => setTimeout(resolve, 500));
        navigate("/newaccountsetup");
      }
    } catch (error) {
      console.error("Error signing up:", error);
      let errorMessage = "Failed to sign up. Please try again.";

      if (error.response) {
        // Server responded with error status
        const errorData = error.response.data;

        if (error.response.status === 409) {
          // Handle duplicate email errors
          if (errorData.authProvider === 'google') {
            errorMessage = "This email is already registered with Google. Please use 'Continue with Google' to sign in.";
          } else if (errorData.requiresVerification) {
            errorMessage = "This email is already registered but not verified. Please check your email for verification instructions.";
          } else {
            errorMessage = "This email is already registered. Please try logging in instead.";
          }
        } else {
          errorMessage = errorData.Error || errorData.message || errorMessage;
        }
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = "Network error. Please check your connection.";
      }

      setErrors(prev => ({...prev, form: errorMessage}));
    } finally {
      setIsLoading(false);
    }
  };

  // Google OAuth sign-up
  const handleGoogleSignUp = () => {
    setIsLoading(true);
    try {
      // Clear any existing localStorage data to avoid stale data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      console.log('SignUpModal: Cleared localStorage before Google OAuth');

      // Redirect to Google OAuth endpoint
      window.location.href = `${apiClient.defaults.baseURL}/auth/google`;
    } catch (error) {
      console.error('Error initiating Google sign-up:', error);
      setErrors(prev => ({...prev, form: 'Failed to initiate Google sign-up. Please try again.'}));
      setIsLoading(false);
    }
  };

  

  const TermsOfServiceModal = () => (
    <div className="fixed inset-0  bg-opacity-50 flex justify-center items-center z-[100] p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Terms of Service and Privacy</h2>
            <button 
              onClick={() => setShowTermsModal(false)} 
              className="text-gray-500 hover:text-gray-700"
              aria-label="Close terms modal"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="prose">
            <h3>Terms of Service</h3>
            <p>By creating an account, you agree to our Terms of Service...</p>
            
            <h3>Privacy Policy</h3>
            <p>We respect your privacy and are committed to protecting your personal data...</p>
            
            <h3>Security Measures</h3>
            <ul>
              <li>We use industry-standard encryption to protect your data</li>
              <li>Passwords are securely hashed and never stored in plain text</li>
              <li>We implement rate limiting to prevent brute force attacks</li>
              <li>All sensitive communications are encrypted</li>
            </ul>
          </div>
          
          <div className="mt-6 text-center">
            <button
              onClick={() => setShowTermsModal(false)}
              className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
            >
              I Understand
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const PrivacyPolicyModal = () => (
    <div className="fixed inset-0 bg-opacity-50 flex justify-center items-center z-[100] p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Privacy Policy</h2>
            <button 
              onClick={() => setShowPrivacyModal(false)} 
              className="text-gray-500 hover:text-gray-700"
              aria-label="Close privacy modal"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="prose">
            <h3>Data Collection</h3>
            <p>We collect only the necessary information to provide our services...</p>
            
            <h3>Data Protection</h3>
            <p>Your data is protected using industry-standard security measures...</p>
            
            <h3>Third-Party Services</h3>
            <p>We use trusted third-party services for authentication...</p>
          </div>
          
          <div className="mt-6 text-center">
            <button
              onClick={() => setShowPrivacyModal(false)}
              className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
            >
              I Understand
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const PasswordStrengthIndicator = () => {
    const strengthColors = [
      'bg-red-500', 
      'bg-orange-500', 
      'bg-yellow-500', 
      'bg-blue-500', 
      'bg-green-500'
    ];
    
    return (
      <div className="mt-2">
        <div className="flex gap-1 h-1">
          {[0, 1, 2, 3, 4].map((level) => (
            <div 
              key={level}
              className={`flex-1 rounded-full ${passwordStrength > level ? strengthColors[level] : 'bg-gray-200'}`}
            ></div>
          ))}
        </div>
        <p className="text-xs mt-1 text-gray-600">
          {passwordStrength < 2 ? 'Weak' : 
           passwordStrength < 4 ? 'Moderate' : 'Strong'} password
        </p>
      </div>
    );
  };

  return (
  <>
    {/* Loading Spinner - highest z-index */}
    {isLoading && <LoadingSpinner />}

    {/* Terms and Privacy Modals - higher than signup modal */}
    {showTermsModal && <TermsOfServiceModal />}
    {showPrivacyModal && <PrivacyPolicyModal />}

    {/* Main Sign-Up Modal - lower z-index */}
    {showSignUpModal && !showEmailForm && !isLoading && (
      <div className="fixed inset-0 bg-opacity-30 backdrop-blur-sm flex justify-center items-center z-50 animate-fadeIn">
        <div className="bg-gradient-to-br from-white to-gray-50 p-8 rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-y-auto text-center border border-gray-200 transform transition-all duration-300 hover:shadow-lg">
          <div className="mb-6">
            <h2 className="text-3xl font-extrabold mb-2">Join Us</h2>
            <p className="text-xl">Create your account </p>
          </div>
          
          {errors.form && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {errors.form}
            </div>
          )}
          
          <div className="space-y-4">
            {/* Google Sign-Up Button */}
           

          

            <button
              onClick={() => setShowEmailForm(true)}
              className="w-full bg-pink-500 text-white py-3 rounded-xl font-semibold shadow-lg transition-all duration-200 hover:shadow-xl hover:opacity-90 active:scale-95"
            >
              Sign up with Email
            </button>
        </div>
        
        <p className="mt-6 text-gray-600">
          Already have an account?{" "}
          <button
            className="text-pink-500 font-medium hover:text-pink-600 hover:underline focus:outline-none"
            onClick={() => navigate("/login")}
          >
            Log in
          </button>
        </p>
        
        <button
          onClick={() => setShowSignUpModal(false)}
          className="mt-4 text-gray-500 hover:text-gray-700 transition-colors duration-200 focus:outline-none"
          aria-label="Close sign up modal"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )}

  {/* Email Sign-Up Modal - lower z-index */}
  {showEmailForm && !isLoading && (
    <div className="fixed inset-0 bg-opacity-30 backdrop-blur-sm flex justify-center items-center z-50 animate-fadeIn">
      <div className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-y-auto border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Create Account</h2>
          <button
            onClick={() => setShowEmailForm(false)}
            className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
            aria-label="Back to sign up options"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
        </div>

        {errors.form && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {errors.form}
          </div>
        )}

        <form onSubmit={handleEmailSignUp} className="space-y-4">
          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                placeholder="first name"
                className={`w-full border ${errors.firstName ? 'border-red-500' : 'border-gray-300'} rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all`}
                onChange={handleChange}
                value={formData.firstName}
                required
              />
              {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                placeholder="last name"
                className={`w-full border ${errors.lastName ? 'border-red-500' : 'border-gray-300'} rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all`}
                onChange={handleChange}
                value={formData.lastName}
                required
              />
              {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label htmlFor="contact" className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              id="contact"
              name="contact"
              placeholder="09XXXXXXXXX"
              pattern="^09[0-9]{9}$"  // must start with 09 and have 11 digits total (strict Philippine mobile format)
              inputMode="numeric"
              maxLength="11"
              title="Phone number must be 11 digits starting with 09 (e.g., 09954859170)"
              className={`w-full border ${errors.contact ? 'border-red-500' : 'border-gray-300'} rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all`}
              onChange={(e) => {
                // Strictly restrict to numeric, starting with 09, max 11 digits
                let value = e.target.value.replace(/[^0-9]/g, '');
                if (value.length > 11) value = value.slice(0, 11);
                handleChange({ target: { name: 'contact', value } });
              }}
              value={formData.contact}
              required
            />
            {errors.contact && <p className="text-red-500 text-xs mt-1">{errors.contact}</p>}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Enter your email"
              pattern="[^@]+@[^@]+\.[^@]+"
              title="Please enter a valid email address (e.g., user@example.com)"
              className={`w-full border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all`}
              onChange={handleChange}
              value={formData.email}
              required
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

         {/* Password with Show/Hide */}
<div className="relative">
  <label
    htmlFor="password"
    className="block text-sm font-medium text-gray-700 mb-1"
  >
    Password
  </label>

  <div className="relative">
    <input
      type={showPassword ? "text" : "password"}
      id="password"
      name="password"
      placeholder="At least 8 characters"
      className={`w-full pr-12 border ${
        errors.password ? "border-red-500" : "border-gray-300"
      } rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all`}
      onChange={handleChange}
      value={formData.password}
      required
      minLength="8"
    />

    {/* Eye toggle button */}
    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-pink-500 focus:outline-none"
      style={{ padding: "4px" }}
    >
      <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} size="lg" />
    </button>
  </div>

  {/* Optional Password Strength Indicator */}
  {formData.password && <PasswordStrengthIndicator />}

  {/* Error Message */}
  {errors.password && (
    <p className="text-red-500 text-xs mt-1">{errors.password}</p>
  )}
</div>


          {/* Confirm Password with Show/Hide */}
<div className="relative">
  <label
    htmlFor="confirmPassword"
    className="block text-sm font-medium text-gray-700 mb-1"
  >
    Confirm Password
  </label>
  <div className="relative">
    <input
      type={showConfirmPassword ? "text" : "password"}
      id="confirmPassword"
      name="confirmPassword"
      placeholder="Re-enter your password"
      className={`w-full pr-12 border ${
        errors.confirmPassword ? "border-red-500" : "border-gray-300"
      } rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all`}
      onChange={handleChange}
      value={formData.confirmPassword}
      required
    />
    <button
      type="button"
      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-pink-500 focus:outline-none"
      style={{ padding: "4px" }}
    >
      <FontAwesomeIcon
        icon={showConfirmPassword ? faEyeSlash : faEye}
        size="lg"
      />
    </button>
  </div>

  {errors.confirmPassword && (
    <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
  )}
</div>


          {/* Terms */}
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                type="checkbox"
                name="agreeToTerms"
                className={`w-4 h-4 text-pink-600 ${errors.agreeToTerms ? 'border-red-500' : 'border-gray-300'} rounded focus:ring-pink-500`}
                onChange={handleChange}
                checked={formData.agreeToTerms}
                required
              />
            </div>
            <div className="ml-3 text-sm">
              <label className="text-gray-600">
                I agree to the{" "}
                <button
                  type="button"
                  onClick={() => setShowTermsModal(true)}
                  className="text-pink-600 hover:text-pink-700 font-medium hover:underline"
                >
                  Terms of Service
                </button>{" "}
                and{" "}
                <button
                  type="button"
                  onClick={() => setShowPrivacyModal(true)}
                  className="text-pink-600 hover:text-pink-700 font-medium hover:underline"
                >
                  Privacy Policy
                </button>
              </label>
              {errors.agreeToTerms && <p className="text-red-500 text-xs mt-1">{errors.agreeToTerms}</p>}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-pink-500 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:opacity-90 transition-all duration-200 active:scale-95"
          >
            Create Account
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setShowEmailForm(false)}
            className="text-gray-600 hover:text-gray-800 font-medium transition-colors duration-200"
          >
            ← Back to sign up options
          </button>
        </div>
      </div>
    </div>

 
)}

    </> 
  );
};

export default SignUpModal;