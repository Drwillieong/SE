import React, { useState } from 'react';
import SignUpModal from '../../pages/SignUpModal'; 

export default function LaundryService() {
  const [showSignUpModal, setShowSignUpModal] = useState(false); 

  return (
    <div id="service" className="flex flex-col items-center text-center py-8 sm:py-12 px-4 sm:px-6 bg-white min-h-screen">
      <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mt-8 sm:mt-14">
        How Our Laundry Service Works
      </h2>
      <p className="text-gray-600 max-w-md sm:max-w-xl md:max-w-2xl mt-3 mb-5 text-sm sm:text-base">
        Having fresh, neatly folded laundry delivered right to your doorstep is as simple as 1-2-3!
      </p>
      
      <div className="flex flex-col md:flex-row gap-6 sm:gap-8 md:gap-12 mt-7 w-full max-w-4xl md:max-w-7xl px-4">
        {[
          { step: "1", title: "Schedule", desc: "Select a convenient day and time any day of the week for your laundry pickup." },
          { step: "2", title: "Pickup", desc: "Set your bags of dirty laundry before your pickup time and we will pick them up right on schedule." },
          { step: "3", title: "Delivery", desc: "You can relax and take a load off! We'll deliver your laundry expertly cleaned and folded right to your door!" },
        ].map((item, index) => (
          <div 
            key={index} 
            className="relative bg-pink-300 p-8 sm:p-12 md:p-20 rounded-lg shadow-lg w-full md:w-1/3 flex flex-col items-center"
          >
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-white text-pink-400 font-bold w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 flex items-center justify-center rounded-full text-xl sm:text-2xl shadow-lg border-2 border-pink-500">
              {item.step}
            </div>
            <h3 className="mt-8 sm:mt-12 text-xl sm:text-2xl md:text-3xl font-bold text-white">
              {item.title}
            </h3>
            <p className="text-white mt-2 text-sm sm:text-base md:text-lg">
              {item.desc}
            </p>
          </div>
        ))}
      </div>

      <button 
        className="mt-10 sm:mt-14 bg-pink-400 cursor-pointer text-white font-semibold px-6 py-3 sm:px-8 sm:py-4 rounded-full shadow-lg hover:bg-pink-500 transition text-sm sm:text-base"
        onClick={() => setShowSignUpModal(true)} 
      >
        Schedule a Pickup
      </button>

      <SignUpModal showSignUpModal={showSignUpModal} setShowSignUpModal={setShowSignUpModal} />
    </div>
  );
}