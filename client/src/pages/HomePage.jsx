import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebook, faInstagram } from '@fortawesome/free-brands-svg-icons';
import { faArrowRight, faArrowLeft, faStar } from '@fortawesome/free-solid-svg-icons';
import SignUpModal from './SignUpModal';
import LaundryService from '../components/Homepage/LaundryService';
import AboutService from '../components/Homepage/AboutService';
import FaqSection from '../components/Homepage/FaqSection';
import HowItWorks from '../components/Homepage/howItWorks';
import AboutOurFees from '../components/Homepage/AboutOurFees';
import backgroundImage from '../assets/Selfservice.png';
import basket from '../assets/basket.png';

const HomePage = () => {
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false); // State for navbar mobile menu
  const navigate = useNavigate();

  const reviews = [
    {
      stars: 5,
      text: "Great service! My clothes came back spotless.",
      author: "John Doe"
    },
    {
      stars: 5,
      text: "Fast and reliable. Highly recommend!",
      author: "Jane Smith"
    },
    {
      stars: 5,
      text: "Excellent quality and customer service.",
      author: "Alice Johnson"
    },
    {
      stars: 5,
      text: "Convenient and affordable. Will use again!",
      author: "Bob Wilson"
    },
    {
      stars: 5,
      text: "Outstanding experience. Top-notch laundry service.",
      author: "Carol Brown"
    },
    {
      stars: 4,
      text: "Professional staff and quick turnaround.",
      author: "David Lee"
    }
  ];

  // Calculate indexes for left, center, right reviews with wrap-around
  const leftIndex = (currentReviewIndex - 1 + reviews.length) % reviews.length;
  const rightIndex = (currentReviewIndex + 1) % reviews.length;

  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState(null);

  const nextReview = () => {
    if (isTransitioning) return;
    setTransitionDirection('next');
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentReviewIndex((prev) => (prev + 1) % reviews.length);
      setIsTransitioning(false);
      setTransitionDirection(null);
    }, 300); // duration matches CSS transition
  };

  const prevReview = () => {
    if (isTransitioning) return;
    setTransitionDirection('prev');
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentReviewIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
      setIsTransitioning(false);
      setTransitionDirection(null);
    }, 300);
  };

  const handleLoginClick = () => {
    navigate('/login'); // Navigate to the Log in component
  };

  return (
    <div className="bg-white-100 min-h-screen">
      {/* Navbar */}
      <nav className="bg-white p-5 flex justify-between items-center text-pink-400 sticky top-0 z-20 relative">
        <h1 className="text-3xl font-extrabold">Wash It Izzy</h1>
        
        {/* Desktop/Mobile Links - Visible on md and up */}
        <div className="hidden md:flex space-x-6 items-center">
          <a href="#service" className="hover:underline font-bold">Service</a>
          <a href="#contact" className="hover:underline font-bold">Contact</a>
          <button 
            onClick={handleLoginClick} 
            className="bg-pink-400 text-white px-4 py-2 rounded-lg ml-0"
          >
            Login
          </button>
        </div>
        
        {/* Hamburger Button - Visible only on mobile */}
        <button 
          className="md:hidden text-pink-400 focus:outline-none" 
          onClick={() => setIsOpen(!isOpen)}
        >
          ☰ {/* Hamburger icon */}
        </button>
        
        {/* Mobile Menu - Top dropdown with limited height */}
        <div 
          className={`md:hidden absolute top-full right-0 w-30 bg-white shadow-md transition-all duration-300 ease-in-out overflow-y-auto ${isOpen ? 'block max-h-64' : 'hidden'}`} 
          style={{ zIndex: 30 }} // Ensure it's above other elements
        >
          <div className="p-4">
           
            <a 
              href="#service" 
              className="block px-4 py-2 hover:bg-pink-100 hover:underline font-bold" 
              onClick={() => setIsOpen(false)} // Close menu on click
            >
              Service
            </a>
            <a 
              href="#contact" 
              className="block px-4 py-2 hover:bg-pink-100 hover:underline font-bold" 
              onClick={() => setIsOpen(false)} // Close menu on click
            >
              Contact
            </a>
            <button 
              onClick={() => { handleLoginClick(); setIsOpen(false); }} // Close menu on click
              className="w-full bg-pink-400 text-white px-4 py-2 rounded-lg mt-2"
            >
              Login
            </button>
          </div>
        </div>
      </nav>
      
      {/* Hero Section */}
      <div className="relative text-left h-[85vh] max-w-[95vw] mx-auto px-10 bg-cover bg-center flex items-center" style={{ backgroundImage: `url(${backgroundImage})` }}>
        {/* Overlay */}
        <div className="absolute inset-0 bg-[#d8acd7] opacity-60 mix-blend-multiply z-0"></div>

        {/* Content */}
        <div className="relative max-w-6xl z-10">
          <h1 className="text-6xl md:text-8xl font-extrabold italic text-white">EVERY LAUNDRY MAKES A DIFFERENCE</h1>
          <p className="mt-5 text-xl text-white">Drop-off, self-service, pickup & delivery, dry-cleaning. Make laundry day easier!</p>
          <div
            onClick={() => setShowSignUpModal(true)}
            className="mt-6 flex items-center rounded-full cursor-pointer bg-white w-[25rem] hover:bg-pink-100 transition duration-300"
          >
            <div className="px-8 py-3 border-r text-black font-medium">
              Pickup <br /> Now?
            </div>
            <div className="flex items-center justify-between flex-grow px-6 py-3">
              <div className="text-black font-semibold">
                Where? <br /> Add address
              </div>
              <span className="ml-4 w-12 h-12 bg-pink-400 text-white flex items-center justify-center rounded-full transition-transform duration-300 transform hover:scale-110">
                <FontAwesomeIcon icon={faArrowRight} />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Signup Modal */}
      <SignUpModal 
        showSignUpModal={showSignUpModal} 
        setShowSignUpModal={setShowSignUpModal} 
      />

      {/* Laundry Service and Sections */}
      <LaundryService />
      <AboutService />
      <HowItWorks />
      {/* <AboutOurFees /> */}

      <FaqSection />

      <footer id="contact" className="bg-pink-400 text-white relative">
        {/* Flexbox Section with Fixed Height */}
        <div className="text-white h-80">
          {/* Flexbox Container for Text and Image */}
          <div className="flex flex-col md:flex-row justify-center items-center md:items-start text-center md:text-left relative h-full">
            
            {/* Left Text Section */}
            <div className="flex-1 pr-0 px-6 md:pl-36 mt-4 md:mt-16">
              <h3 className="text-2xl md:text-5xl font-bold leading-tight">Call for a quick pickup</h3>
              <p className="text-base md:text-lg">Pick up & Delivery Free</p>
            </div>

            {/* Image */}
            <img
              src={basket}
              alt="Laundry Basket"
              className="w-100 md:max-w-[400px] h-auto object-contain my-2 md:my-0 md:-translate-y-28 overflow-hidden"
            />

            {/* Right Text Section */}
            <div className="flex-1 px-6 md:pl-4 md:pr-16 mt-4 md:mt-16">
              <h3 className="text-2xl md:text-5xl font-bold leading-tight">0968-856-3288</h3>
              <p className="text-base md:text-lg">Call Now!</p>
            </div>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left mt-4">
          {/* Socials */}
          <div>
            <h3 className="text-xl font-bold">Socials</h3>
            <div className="flex justify-center md:justify-start mt-4 space-x-4">
              <a href="https://www.facebook.com/washitizzy" target="_blank" rel="noopener noreferrer" className="text-white hover:text-pink-200">
                <FontAwesomeIcon icon={faFacebook} size="2x" />
              </a>
              <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer" className="text-white hover:text-pink-200">
                <FontAwesomeIcon icon={faInstagram} size="2x" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold">Quick Links</h4>
            <ul className="mt-2 space-y-2">
              <li><a href="#services" className="text-white hover:text-pink-200">Services</a></li>
              <li><a href="#contact" className="text-white hover:text-pink-200">Contact</a></li>
              <li><a href="#" className="text-white hover:text-pink-200">Login</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold">Get in Touch</h4>
            <p className="mt-2 text-white">Email: washitizzy@email.com</p>
            <p className="text-white">Phone: 0968-856-3288</p>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center text-white text-sm mt-8 mb-0 pb-4">
          &copy; 2025 Wash It Izzy - All Rights Reserved.
        </div>
      </footer>
    </div>
  );
}

export default HomePage;