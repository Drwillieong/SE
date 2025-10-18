import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../utils/axios";

const freePickupBarangays = [
  "Brgy. 1", "Brgy. 2", "Brgy. 3", "Brgy. 4", "Brgy. 5", "Brgy. 6", "Brgy. 7",
  "Lecheria (Up to City Cemetery)", "San Juan", "San Jose", 
  "Looc (Bukana, Mahogany, Vermont)", "Bañadero (Bukana, Bria Homes)",
  "Palingon", "Lingga", "Sampiruhan", "Parian (Bantayan/Villa Carpio)"
];

const calambaBarangays = [
  "Banlic", "Barandal", "Batino", "Bubuyan", "Bucal", "Bunggo", 
  "Burol", "Camaligan", "Canlubang", "Halang", "Hornalan", 
  "Kay-Anlog", "La Mesa", "Laguerta", "Lawa", "Lecheria", 
  "Lingga", "Looc", "Mabato", "Majada Labas", "Makiling", 
  "Mapagong", "Masili", "Maunong", "Mayapa", "Paciano Rizal", 
  "Palingon", "Palo-Alto", "Pansol", "Parian", "Prinza", 
  "Punta", "Puting Lupa", "Real", "Saimsim", "Sampiruhan", 
  "San Cristobal", "San Jose", "San Juan", "Sirang Lupa", 
  "Sucol", "Turbina", "Ulango", "Uwisan"
];

const CustomerAccountSetup = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  const [showFreeAreas, setShowFreeAreas] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    contact: "",
    email: "",
    barangay: "",
    street: "",
    blockLot: "",
    landmark: ""
  });

  useEffect(() => {
    // On component mount, check if token cookie exists and set it in localStorage if missing
    const tokenCookie = document.cookie.split('; ').find(row => row.startsWith('token='));
    if (tokenCookie) {
      const tokenValue = tokenCookie.split('=')[1];
      const localStorageToken = localStorage.getItem('token');
      if (!localStorageToken) {
        console.log('NewAccountSetup: Token cookie found, setting token in localStorage');
        localStorage.setItem('token', tokenValue);
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${tokenValue}`;
      }
    }
  }, []);

  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    contact: "",
    email: "",
    barangay: "",
    street: ""
  });

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        // First check if token is in URL parameters (from Google OAuth redirect)
        const urlParams = new URLSearchParams(window.location.search);
        const tokenFromUrl = urlParams.get('token');

        let token = localStorage.getItem('token');

        // If token is in URL but not in localStorage, store it
        if (tokenFromUrl && !token) {
          console.log('NewAccountSetup: Token found in URL, storing in localStorage');
          localStorage.setItem('token', tokenFromUrl);
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${tokenFromUrl}`;
          token = tokenFromUrl;

          // Clean up URL by removing token parameter
          const newUrl = window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
        }

        if (!token) {
          console.log('NewAccountSetup: No token found, redirecting to login');
          navigate('/login');
          return;
        }

        console.log('NewAccountSetup: Verifying token with /auth/me');
        // Verify token and get user data
        const response = await apiClient.get('/auth/me');

        console.log('NewAccountSetup: /auth/me response:', response.data);

          if (response.data) {
            setUser(response.data);

            // Check if profile is already complete
            if (response.data.profileComplete) {
              console.log('NewAccountSetup: Profile complete, redirecting based on role');
              // Profile is complete, redirect based on role
              const userRole = response.data.role || 'user';
              if (userRole === 'admin') {
                navigate('/dashboard');
              } else {
                navigate('/customer-dashboard');
              }
              return;
            }

          console.log('NewAccountSetup: Profile incomplete, loading form data');
          setFormData(prev => ({
            ...prev,
            firstName: response.data.firstName || "",
            lastName: response.data.lastName || "",
            contact: response.data.contact || "",
            email: response.data.email || "",
            barangay: response.data.barangay || "",
            street: response.data.street || "",
            blockLot: response.data.blockLot || "",
            landmark: response.data.landmark || ""
          }));
        } else {
          console.log('NewAccountSetup: No user data received, redirecting to login');
          navigate('/login');
        }
      } catch (error) {
        console.error("NewAccountSetup: Auth check error:", error);
        console.error("NewAccountSetup: Error details:", error.response?.data || error.message);
        navigate('/login');
      } finally {
        setInitialDataLoaded(true);
      }
    };

    checkAuth();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const validateStep1 = () => {
    let valid = true;
    const newErrors = { ...errors };

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
      valid = false;
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
      valid = false;
    }

    if (!formData.contact.trim()) {
      newErrors.contact = "Contact number is required";
      valid = false;
    } else if (!/^\+?\d{7,15}$/.test(formData.contact)) {
      newErrors.contact = "Invalid contact number";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const validateStep2 = () => {
    let valid = true;
    const newErrors = { ...errors };

    if (!formData.barangay) {
      newErrors.barangay = "Please select your barangay";
      valid = false;
    }

    if (!formData.street.trim()) {
      newErrors.street = "Street is required";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const sendVerificationEmail = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // Get user email from token or form data
      const userEmail = formData.email;

      await apiClient.post('/auth/resend-verification', { email: userEmail });

      setVerificationSent(true);
    } catch (error) {
      console.error("Error sending verification email:", error);
      alert("Failed to send verification email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const saveUserData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      await apiClient.put('/auth/users/profile', formData);

      // Send verification email after saving user data
      await sendVerificationEmail();

      // Redirect based on user role
      const userRole = user?.role || 'user';
      if (userRole === 'admin') {
        navigate('/dashboard');
      } else {
        navigate('/customer-dashboard');
      }
    } catch (error) {
      console.error("Error saving user data:", error);
      alert("Failed to save user data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;

    if (step === 2) {
      await saveUserData();
      return;
    }

    setStep(step + 1);
  };

  const handlePrev = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  if (!initialDataLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500 mx-auto"></div>
          <p className="mt-4 text-gray-700">Loading your information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-gray-50 flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-6xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row">
        {/* Left Side - Visual */}
        <div className="w-full md:w-2/4 bg-pink-600 p-8 flex flex-col justify-center items-center text-white">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Welcome to Wash It Izzy!</h1>
            <p className="text-pink-100">Complete your account setup in just 2 easy steps</p>
          </div>
          
          <div className="w-full max-w-xs">
            <div className="relative pt-1 mb-8">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-pink-600 bg-white">
                    Step {step} of 2
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold inline-block text-white">
                    {step === 1 ? "Personal Info" : "Address Details"}
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-pink-200">
                <div 
                  style={{ width: `${step * 50}%` }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-white transition-all duration-500"
                ></div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start">
                <div className={`flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center mr-3 ${step >= 1 ? "bg-white text-pink-600" : "bg-pink-400 text-white"}`}>
                  {step >= 1 ? (
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    "1"
                  )}
                </div>
                <div>
                  <h3 className={`text-sm font-medium ${step === 1 ? "text-white" : "text-pink-100"}`}>Personal Information</h3>
                  <p className="text-xs text-pink-200">Tell us about yourself</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className={`flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center mr-3 ${step >= 2 ? "bg-white text-pink-600" : step === 2 ? "bg-white text-pink-600" : "bg-pink-400 text-white"}`}>
                  {step >= 2 ? (
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    "2"
                  )}
                </div>
                <div>
                  <h3 className={`text-sm font-medium ${step === 2 ? "text-white" : "text-pink-100"}`}>Address Details</h3>
                  <p className="text-xs text-pink-200">Where should we pick up your laundry?</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Side - Form */}
        <div className="w-full md:w-3/5 p-8 md:p-12">
          {/* Step 1: Basic Information */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Personal Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-lg border ${errors.firstName ? "border-red-500" : "border-gray-300"} focus:ring-2 focus:ring-pink-500 focus:border-transparent`}
                    placeholder="Kevin"
                    required
                  />
                  {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-lg border ${errors.lastName ? "border-red-500" : "border-gray-300"} focus:ring-2 focus:ring-pink-500 focus:border-transparent`}
                    placeholder="Sopogi"
                    required
                  />
                  {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>}
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="contact"
                  value={formData.contact}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-lg border ${errors.contact ? "border-red-500" : "border-gray-300"} focus:ring-2 focus:ring-pink-500 focus:border-transparent`}
                  placeholder="+639123456789"
                  required
                />
                {errors.contact && <p className="mt-1 text-sm text-red-600">{errors.contact}</p>}
              </div>
              
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email (for verification)
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  disabled
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50"
                />
                <div className="mt-3 flex items-center">
                  {!verificationSent ? (
                    <button
                      type="button"
                      onClick={sendVerificationEmail}
                      disabled={loading}
                      className="flex items-center text-sm text-pink-600 hover:text-pink-700 font-medium"
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-pink-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Sending...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                          </svg>
                          Send Verification Email
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="flex items-center text-sm text-green-600">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      Verification email sent! Please check your inbox.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Step 2: Address Information */}
          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Address Details</h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">FREE LAUNDRY PICK-UP AND DELIVERY🎉</h3>
                    <div className="mt-1 text-sm text-blue-700">
                      <p className="mb-2">For barangays near our shop:</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                        {freePickupBarangays.map((barangay, index) => (
                          <div key={index} className="flex items-center">
                            <svg className="h-4 w-4 text-green-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                            <span>{barangay}</span>
                          </div>
                        ))}
                      </div>
                      <p className="mt-2 font-medium">Other areas near our shop and other areas have fees</p>
                    </div>
                    {!showFreeAreas && (
                      <button
                        onClick={() => setShowFreeAreas(true)}
                        className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Show all free areas
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              <p className="text-gray-600 mb-8">
                We currently serve only Calamba City. Please provide your complete address for laundry pickup and delivery.
              </p>
              
              <div className="grid grid-cols-1 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Barangay <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="barangay"
                    value={formData.barangay}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-lg border ${errors.barangay ? "border-red-500" : "border-gray-300"} focus:ring-2 focus:ring-pink-500 focus:border-transparent`}
                    required
                  >
                    <option value="">Select Barangay</option>
                    {calambaBarangays.map(barangay => (
                      <option key={barangay} value={barangay}>{barangay}</option>
                    ))}
                  </select>
                  {errors.barangay && <p className="mt-1 text-sm text-red-600">{errors.barangay}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Street <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="street"
                    value={formData.street}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-lg border ${errors.street ? "border-red-500" : "border-gray-300"} focus:ring-2 focus:ring-pink-500 focus:border-transparent`}
                    placeholder="e.g. Rizal Street"
                    required
                  />
                  {errors.street && <p className="mt-1 text-sm text-red-600">{errors.street}</p>}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Block/Lot Number (Optional)
                    </label>
                  <input
                    type="text"
                    name="blockLot"
                    value={formData.blockLot}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="e.g. Block 5 Lot 12"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Landmark (Optional)
                  </label>
                  <input
                    type="text"
                    name="landmark"
                    value={formData.landmark}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="e.g. Near Calamba City Hall"
                  />
                </div>
              </div>
              </div>
            </div>
          )}
          
          {/* Navigation Buttons */}
          <div className="flex justify-between gap-4 mt-8 border-t pt-6">
            {step > 1 && (
              <button
                type="button"
                onClick={handlePrev}
                className="px- py-3 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors duration-200 font-medium flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                </svg>
                Back
              </button>
            )}
            
            <button
              type="button"
              onClick={handleNext}
              disabled={loading}
              className={`px-8 py-3 rounded-lg font-medium text-white ${loading ? "bg-pink-400" : "bg-pink-600 hover:bg-pink-700"} transition-colors duration-200 ml-auto flex items-center`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  {step === 2 ? "Complete Setup" : "Continue"}
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerAccountSetup;