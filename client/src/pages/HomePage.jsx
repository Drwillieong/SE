import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faTimes, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { faFacebook, faInstagram } from '@fortawesome/free-brands-svg-icons';
import SignUpModal from './SignUpModal';
import LaundryService from '../components/Homepage/LaundryService';
import AboutService from '../components/Homepage/AboutService';
import HowItWorks from '../components/Homepage/HowItWorks';
import AboutOurFees from '../components/Homepage/AboutOurFees';
import backgroundImage from '../assets/laundrytub.jpg';
import basket from '../assets/basket.png'; 

const HomePage = () => {
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 500);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 500);
      if (!(window.innerWidth < 500)) setMobileMenuOpen(false);
    };

    const handleScroll = () => {
      const isScrolled = window.scrollY > 100;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [scrolled]);

  const handleLoginClick = () => navigate('/login');
  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  return (
    <div className="bg-white-100 min-h-screen h-screen">
      {/* Navbar */}
      <nav className="bg-pink-500 p-4 sm:p-5 flex justify-between items-center text-white shadow-lg sticky top-0 z-50">
        <h1 className="text-2xl sm:text-3xl font-extrabold">Wash It Izzy</h1>
        
        {/* Desktop Navigation */}
        <div className="hidden sm:flex space-x-6 items-center">
          <a href="#service" className="hover:underline font-bold">Service</a>
          <a href="#contact" className="hover:underline font-bold">Contact</a>
          <button onClick={handleLoginClick} className="bg-white text-pink-400 px-4 py-2 rounded-lg ml-0">
            Login
          </button>
        </div>
        
        {/* Mobile Menu Button */}
        <button 
          className="sm:hidden text-white focus:outline-none relative z-50"
          onClick={toggleMobileMenu}
        >
          <FontAwesomeIcon icon={mobileMenuOpen ? faTimes : faBars} size="lg" />
        </button>
      </nav>
      
      {/* Mobile Menu Dropdown (Right Side) */}
      {mobileMenuOpen && (
        <div className="sm:hidden fixed top-16 right-0 w-32 rounded-sm bg-pink-500 shadow-lg z-40 transition-all duration-300 transform translate-x-0">
          <div className="flex flex-col space-y-4 p-4">
            <a 
              href="#service" 
              className="hover:underline font-bold text-white"
              onClick={() => setMobileMenuOpen(false)}
            >
              Service
            </a>
            <a 
              href="#contact" 
              className="hover:underline font-bold text-white"
              onClick={() => setMobileMenuOpen(false)}
            >
              Contact
            </a>
            <button 
              onClick={() => {
                handleLoginClick();
                setMobileMenuOpen(false);
              }} 
              className="bg-white text-pink-400 px-1 py-2 rounded-lg w-16"
            >
              Login
            </button>
          </div>
        </div>
      )}
     
      {/* Hero Section */}
      <div
        className="items-center bg-cover bg-center py-24 px-4 sm:px-8 md:px-16 min-h-[100vh]"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      >
        <div className="max-w-6xl">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold italic text-white leading-tight">
            EVERY LAUNDRY MAKES A DIFFERENCE
          </h1>
          <p className="mt-4 text-base sm:text-lg md:text-xl text-white">
            We offer drop-off, self-service, pick-up & delivery, and dry-cleaning services to make laundry day Izzy-ier for you.
          </p>
      
          {/* Original CTA Button (hidden when scrolled) */}
          <div
            onClick={() => setShowSignUpModal(true)}
            className={`mt-6 flex rounded-full cursor-pointer bg-amber-50 w-full max-w-xs sm:max-w-sm md:max-w-md lg:w-[20rem] ${
              scrolled ? 'hidden' : 'block'
            }`}
          >
            <div className="px-6 sm:px-8 py-3 border-r text-black font-medium text-sm sm:text-base">
              Pickup <br /> Now?
            </div>
            <div className="px-4 sm:px-6 py-3 flex items-center text-black font-semibold text-sm sm:text-base">
              Where? <br /> Add address
              <span className="ml-2 w-10 h-10 sm:w-12 sm:h-12 bg-pink-500 text-white flex items-center justify-center rounded-full">
                <FontAwesomeIcon icon={faArrowRight} />
              </span>
            </div>
          </div>  
        </div>
      </div>

      {/* Sticky CTA Button (appears when scrolled) */}
      <div
        className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40 transition-all duration-300 ${
          scrolled ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
        }`}
      >
        <div
          onClick={() => setShowSignUpModal(true)}
          className="flex rounded-full cursor-pointer bg-amber-50 w-[18rem] sm:w-[20rem] shadow-lg hover:shadow-xl transition-shadow"
        >
          <div className="px-6 sm:px-8 py-3 border-r text-black font-medium text-sm sm:text-base">
            Pickup <br /> Now?
          </div>
          <div className="px-4 sm:px-6 py-3 flex items-center text-black font-semibold text-sm sm:text-base">
            Where? <br /> Add address
            <span className="ml-2 w-10 h-10 sm:w-12 sm:h-12 bg-pink-500 hover:bg-pink-600 text-white flex items-center justify-center rounded-full transition-colors">
              <FontAwesomeIcon icon={faArrowRight} />
            </span>
          </div>
        </div>
      </div>

      {/* Rest of your components */}
      <SignUpModal 
        showSignUpModal={showSignUpModal} 
        setShowSignUpModal={setShowSignUpModal} 
      />
      
      <LaundryService />
      <AboutService />
      <HowItWorks />
      <AboutOurFees />

      <footer id="contact" className="bg-pink-400 text-white relative">
        {/* Flexbox Section with Fixed Height */}
        <div className="text-white h-auto md:h-80">
          {/* Flexbox Container for Text and Image */}
          <div className="flex flex-col md:flex-row justify-center items-center md:items-start text-center md:text-left relative h-full">
            
            {/* Left Text Section */}
            <div className="flex-1 pr-0 px-6 md:pl-36 mt-8 md:mt-16">
              <h3 className="text-2xl md:text-4xl lg:text-5xl font-bold leading-tight">Call for a quick pickup</h3>
              <p className="text-base md:text-lg">Pick up & Delivery Free</p>
            </div>

            {/* Image - Adjusted for mobile */}
            <img
              src={basket}
              alt="Laundry Basket"
              className="w-64 md:w-80 lg:w-96 h-auto object-contain my-4 md:my-0 md:-translate-y-28"
            />

            {/* Right Text Section */}
            <div className="flex-1 px-6 md:pl-4 md:pr-16 mt-4 md:mt-16 mb-8 md:mb-0">
              <h3 className="text-2xl md:text-4xl lg:text-5xl font-bold leading-tight">555-080-201</h3>
              <p className="text-base md:text-lg">Call Now!</p>
            </div>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left mt-4 pb-8">
          {/* Socials */}
          <div>
            <h3 className="text-xl font-bold">Socials</h3>
            <div className="flex justify-center md:justify-start mt-4 space-x-4">
              <a href="https://www.facebook.com/washitizzy" target="_blank" rel="noopener noreferrer" className="text-white hover:text-pink-200 transition-colors">
                <FontAwesomeIcon icon={faFacebook} size="2x" />
              </a>
              <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer" className="text-white hover:text-pink-200 transition-colors">
                <FontAwesomeIcon icon={faInstagram} size="2x" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold">Quick Links</h4>
            <ul className="mt-2 space-y-2">
              <li><a href="#service" className="text-white hover:text-pink-200 transition-colors">Services</a></li>
              <li><a href="#contact" className="text-white hover:text-pink-200 transition-colors">Contact</a></li>
              <li><button onClick={handleLoginClick} className="text-white hover:text-pink-200 transition-colors">Login</button></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold">Get in Touch</h4>
            <p className="mt-2 text-white">Email: washitizzy@email.com</p>
            <p className="text-white">Phone: 123456789</p>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center text-white text-sm mt-8 mb-0 pb-4">
          &copy; {new Date().getFullYear()} Wash It Izzy - All Rights Reserved.
        </div>
      </footer>
    </div>
  );
};

export default HomePage;