import React, { useState } from "react";
import rack from '../../assets/rack.jpg';
import servicefee from '../../assets/servicefee.jpeg';
import iron from '../../assets/iron.jpeg';
import fold from '../../assets/fold.jpeg'; 

const AboutOurFees = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const deliveryAreas = [
    "Brgy. 1-7",
    "Lecheria (Up to City Cemetery)",
    "San Juan",
    "San Jose",
    "Looc",
    "Bañadero",
    "Palingong",
    "Lingga",
    "Sampiruhan",
    "Parian",
    "All nearby areas around our shop"
  ];

  return (
    <div>
      {/* Why Choose Us Section */}
      <div className="bg-pink-300 py-16">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center px-6 gap-12">
          
          {/* Left Side Image */}
          <div className="flex-1 flex justify-center items-center">
            <img
              src={rack}
              alt="Hanging Clothes" 
              className="h-[600px] w-auto object-contain rounded-xl shadow-lg" 
            />
          </div>

          {/* Right Side Content */}
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-5xl font-bold text-white mb-4">Why choose us</h2>
            <h4 className="text-2xl text-white mb-6">We think ahead</h4>
            <p className="text-white mb-8 text-lg">
              Fast, reliable pickup and delivery. High-quality service guaranteed.
            </p>
            <button
              className="bg-pink-400 hover:bg-pink-600 text-white font-bold py-3 px-6 rounded mb-10"
              onClick={() => document.getElementById('reviews').scrollIntoView({ behavior: 'smooth' })}
            >
              Read more
            </button>

            {/* Two Icons with Text */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="flex items-start gap-4">
                <div className="bg-pink-400 p-3 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h5 className="text-lg font-bold text-white">Faster Service</h5>
                  <p className="text-white text-sm">Quick and efficient laundry handling.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-pink-400 p-3 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2 cursor-pointer" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                    <h5 className="text-lg font-bold text-white">Delivery Free</h5>
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className={`h-4 w-4 text-pink-600 shadow-inner transition-transform duration-300 ${isDropdownOpen ? "rotate-180" : ""}`} 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  <p className="text-white text-sm">Pickup and drop-off without extra cost.</p>

                  {isDropdownOpen && (
                    <ul className="mt-2 bg-white text-sm text-gray-800 rounded shadow-md p-3 space-y-1 w-fit">
                      {deliveryAreas.map((area, idx) => (
                        <li key={idx} className="whitespace-nowrap">{area}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>



      {/* Self-Service and Add-On Services Pricing */}
      <div className="bg-light-gray py-16">
        <div className="max-w-6xl mx-auto p-6">
          <h2 className="text-4xl font-bold text-center text-dark-gray mb-8">About Our Fees</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">

            {/* Service Fee Card */}
            <div className="transition-transform transform hover:scale-105 p-8 bg-white rounded-lg shadow-md flex flex-col items-center">
              <img 
                src={servicefee}
                alt="Service Fee" 
                className="mb-4 rounded w-45 h-36 object-cover" 
              />
              <h3 className="text-2xl font-semibold mb-2 text-center">Service Fee</h3>
              <p className="text-gray-600 text-center">
                28 pesos per kilo for regular clothes, or 199 pesos for 7 kilos or less. Detergent and fabric conditioner are included.
              </p>
            </div>

            {/* Free Pickup & Delivery Card */}
            <div className="transition-transform transform hover:scale-105 p-8 bg-white rounded-lg shadow-md flex flex-col items-center">
              <img 
                src={iron} 
                alt="Free Pickup & Delivery" 
                className="mb-4 rounded w-45 h-36 object-cover" 
              />
              <h3 className="text-2xl font-semibold mb-2 text-center">FREE Pickup & Delivery</h3>
              <p className="text-gray-600 text-center">
                Free pickup/delivery (2+ loads) in Calamba: 7-10 AM & 5-7 PM. Covers listed barangays & nearby areas.
              </p>
            </div>

            {/* Payment Card */}
            <div className="transition-transform transform hover:scale-105 p-8 bg-white rounded-lg shadow-md flex flex-col items-center">
              <img 
                src={fold}
                alt="Payment Options" 
                className="mb-4 rounded w-45 h-40 object-cover" 
              />
              <h3 className="text-2xl font-semibold mb-2 text-center">Payment Options</h3>
              <p className="text-gray-600 text-center">
                Convenient payment options accepting cash and GCash, due upon pickup.
              </p>
            </div>

            {/* Wash */}
            <div className="transition-transform transform hover:scale-105 p-8 bg-gray-50 rounded-lg shadow-md flex flex-col items-center">
              <h3 className="text-2xl font-semibold mb-2 text-center">Wash</h3>
              <p className="text-gray-600 text-center">38 minutes - 65 pesos</p>
            </div>

            {/* Dry */}
            <div className="transition-transform transform hover:scale-105 p-8 bg-gray-50 rounded-lg shadow-md flex flex-col items-center">
              <h3 className="text-2xl font-semibold mb-2 text-center">Dry</h3>
              <p className="text-gray-600 text-center">40 minutes - 75 pesos</p>
            </div>

            {/* Fold */}
            <div className="transition-transform transform hover:scale-105 p-8 bg-gray-50 rounded-lg shadow-md flex flex-col items-center">
              <h3 className="text-2xl font-semibold mb-2 text-center">Fold</h3>
              <p className="text-gray-600 text-center">With free plastic - 35 pesos</p>
            </div>

            {/* Extra Dry */}
            <div className="transition-transform transform hover:scale-105 p-8 bg-gray-50 rounded-lg shadow-md flex flex-col items-center">
              <h3 className="text-2xl font-semibold mb-2 text-center">Extra Dry</h3>
              <p className="text-gray-600 text-center">10 minutes - 25 pesos</p>
            </div>

            {/* Extra Wash with Detergent */}
            <div className="transition-transform transform hover:scale-105 p-8 bg-gray-50 rounded-lg shadow-md flex flex-col items-center">
              <h3 className="text-2xl font-semibold mb-2 text-center">Extra Wash with Detergent</h3>
              <p className="text-gray-600 text-center">38 minutes - 75 pesos</p>
            </div>

            {/* Extra Rinse & Spin */}
            <div className="transition-transform transform hover:scale-105 p-8 bg-gray-50 rounded-lg shadow-md flex flex-col items-center">
              <h3 className="text-2xl font-semibold mb-2 text-center">Extra Rinse & Spin</h3>
              <p className="text-gray-600 text-center">28 minutes - 45 pesos</p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default AboutOurFees;
