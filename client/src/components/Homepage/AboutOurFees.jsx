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
      <div className="bg-pink-300 py-12 sm:py-16 md:py-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-8 md:gap-12">
          
          {/* Left Side Image */}
          <div className="w-full lg:flex-1 flex justify-center">
            <img
              src={rack}
              alt="Hanging Clothes" 
              className="h-auto max-h-[400px] sm:max-h-[500px] md:max-h-[600px] w-full max-w-md object-contain rounded-lg md:rounded-xl shadow-lg" 
            />
          </div>

          {/* Right Side Content */}
          <div className="w-full lg:flex-1 text-center lg:text-left">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 sm:mb-4">
              Why choose us
            </h2>
            <h4 className="text-xl sm:text-2xl text-white mb-4 sm:mb-6">
              We think ahead
            </h4>
            <p className="text-white mb-6 sm:mb-8 text-sm sm:text-base">
              We provide fast, reliable pickup and delivery for your laundry needs. 
              Our team ensures high-quality service with every load, every time.
            </p>
            <button className="bg-pink-400 hover:bg-pink-600 text-white font-bold py-2 px-4 sm:py-3 sm:px-6 rounded mb-8 sm:mb-10 text-sm sm:text-base">
              Read more
            </button>

            {/* Two Icons with Text */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="bg-pink-400 p-2 sm:p-3 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h5 className="text-base sm:text-lg font-bold text-white">Faster Service</h5>
                  <p className="text-white text-xs sm:text-sm">Quick and efficient laundry handling.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 sm:gap-4">
                <div className="bg-pink-400 p-2 sm:p-3 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-1 sm:gap-2 cursor-pointer" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                    <h5 className="text-base sm:text-lg font-bold text-white">Delivery Free</h5>
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className={`h-3 w-3 sm:h-4 sm:w-4 text-pink-600 shadow-inner transition-transform duration-300 ${isDropdownOpen ? "rotate-180" : ""}`} 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  <p className="text-white text-xs sm:text-sm">Pickup and drop-off without extra cost.</p>

                  {isDropdownOpen && (
                    <ul className="mt-2 bg-white text-xs sm:text-sm text-gray-800 rounded shadow-md p-2 sm:p-3 space-y-1 w-full max-w-xs sm:max-w-sm">
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

      {/* About Our Fees Section */}
      <div className="bg-gray-50 py-8 sm:py-10 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-gray-800 mb-6 sm:mb-10">
            About Our Fees
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-24">
            
            {/* Service Fee Card */}
            <div className="transition-transform transform hover:scale-[1.02] p-6 sm:p-8 bg-white rounded-lg shadow-md flex flex-col items-center">
              <img 
                src={servicefee}
                alt="Service Fee" 
                className="mb-3 sm:mb-4 rounded-lg w-auto h-32 sm:h-36 object-cover" 
              />
              <h3 className="text-xl sm:text-2xl font-semibold mb-1 sm:mb-2 text-center">Service Fee</h3>
              <p className="text-gray-600 text-center text-sm sm:text-base">
                28 pesos per kilo for regular clothes, or 199 pesos for 7 kilos or less. Detergent and fabric conditioner are included.
              </p>
            </div>

            {/* Free Pickup & Delivery Card */}
            <div className="transition-transform transform hover:scale-[1.02] p-6 sm:p-8 bg-white rounded-lg shadow-md flex flex-col items-center">
              <img 
                src={iron} 
                alt="Free Pickup & Delivery" 
                className="mb-3 sm:mb-4 rounded-lg w-auto h-32 sm:h-36 object-cover" 
              />
              <h3 className="text-xl sm:text-2xl font-semibold mb-1 sm:mb-2 text-center">FREE Pickup & Delivery</h3>
              <p className="text-gray-600 text-center text-sm sm:text-base">
                Free pickup/delivery (2+ loads) in Calamba: 7-10 AM & 5-7 PM. Covers listed barangays & nearby areas.
              </p>
            </div>

            {/* Payment Card */}
            <div className="transition-transform transform hover:scale-[1.02] p-6 sm:p-8 bg-white rounded-lg shadow-md flex flex-col items-center">
              <img 
                src={fold}
                alt="Payment Options" 
                className="mb-3 sm:mb-4 rounded-lg w-auto h-32 sm:h-36 object-cover" 
              />
              <h3 className="text-xl sm:text-2xl font-semibold mb-1 sm:mb-2 text-center">Payment Options</h3>
              <p className="text-gray-600 text-center text-sm sm:text-base">
                Convenient payment options accepting cash and GCash, due upon pickup.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AboutOurFees;