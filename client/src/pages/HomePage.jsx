import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebook, faInstagram } from '@fortawesome/free-brands-svg-icons';
import { faArrowRight, faArrowLeft, faStar } from '@fortawesome/free-solid-svg-icons';
import SignUpModal from './SignUpModal';
import LaundryService from '../components/Homepage/LaundryService';
import AboutService from '../components/Homepage/AboutService';
import FaqSection from '../components/Homepage/FaqSection';
import HowItWorks from '../components/Homepage/HowItWorks';
import AboutOurFees from '../components/Homepage/AboutOurFees';
import backgroundImage from '../assets/Selfservice.png';
import basket from '../assets/basket.png'; 

const HomePage = () => {
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
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
      <nav className="bg-white p-5 flex justify-between items-center text-pink-400 sticky top-0 z-10 ">
        <h1 className="text-3xl font-extrabold">Wash It Izzy</h1>
        <div className="space-x-6">
          <a href="#service" className="hover:underline font-bold">Service</a>
          <a href="#contact" className="hover:underline font-bold">Contact</a>
          <button onClick={handleLoginClick} className="bg-pink-400 text-white px-4 py-2 rounded-lg ml-0">Login</button>
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

      {/* Customer Reviews Section */}
      <section id="reviews" className="py-10 md:py-28 mb-10 md:mb-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-10">Customer Reviews</h2>
          <div className="flex items-center justify-center space-x-4">
            <button onClick={prevReview} className="text-pink-400 p-4 rounded-full hover:text-pink-500 transition z-10">
              <FontAwesomeIcon icon={faArrowLeft} size="lg" />
            </button>
          <div className="flex space-x-4 items-center">
              {/* Left Review - Smaller */}
              <div className="hidden md:block bg-white p-4 rounded-sm shadow-sm w-64 text-center opacity-70 transform scale-90">
                <div className="flex items-center justify-center mb-2">
                  {Array(reviews[leftIndex].stars).fill().map((_, i) => <FontAwesomeIcon key={i} icon={faStar} className="text-pink-400 text-sm" />)}
                </div>
                <p className="text-gray-700 text-sm">"{reviews[leftIndex].text}"</p>
                <p className="text-gray-500 mt-2 text-sm">- {reviews[leftIndex].author}</p>
              </div>
              {/* Center Review - Larger */}
              <div className="bg-white p-4 md:p-8 rounded-lg shadow-md w-full md:w-80 text-center transform scale-110 z-10">
                <div className="flex items-center justify-center mb-4">
                  {Array(reviews[currentReviewIndex].stars).fill().map((_, i) => <FontAwesomeIcon key={i} icon={faStar} className="text-pink-400" />)}
                </div>
                <p className="text-gray-700 text-lg">"{reviews[currentReviewIndex].text}"</p>
                <p className="text-gray-500 mt-4">- {reviews[currentReviewIndex].author}</p>
              </div>
              {/* Right Review - Smaller */}
              <div className="hidden md:block bg-white p-4 rounded-lg shadow-sm w-64 text-center opacity-70 transform scale-90">
                <div className="flex items-center justify-center mb-2">
                  {Array(reviews[rightIndex].stars).fill().map((_, i) => <FontAwesomeIcon key={i} icon={faStar} className="text-pink-400 text-sm" />)}
                </div>
                <p className="text-gray-700 text-sm">"{reviews[rightIndex].text}"</p>
                <p className="text-gray-500 mt-2 text-sm">- {reviews[rightIndex].author}</p>
              </div>
            </div>
            <button onClick={nextReview} className="text-pink-400 p-4 rounded-full hover:text-pink-500 transition z-10">
              <FontAwesomeIcon icon={faArrowRight} size="lg" />
            </button>
          </div>
        </div>
      </section>

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
