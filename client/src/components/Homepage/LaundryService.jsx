import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faTruck, faBoxOpen } from '@fortawesome/free-solid-svg-icons';
import SignUpModal from '../../pages/SignUpModal';

export default function LaundryService() {
  const [showSignUpModal, setShowSignUpModal] = useState(false); 

  const steps = [
    { step: "1", title: "Schedule", desc: "Select a convenient day and time any day of the week for your laundry pickup.", icon: faCalendarAlt },
    { step: "2", title: "Pickup", desc: "Set your bags of dirty laundry before your pickup time and we will pick them up right on schedule.", icon: faTruck },
    { step: "3", title: "Delivery", desc: "You can relax and take a load off! We’ll deliver your laundry expertly cleaned and folded right to your door!", icon: faBoxOpen },
  ];

  return (
    <div id="service" className="flex flex-col items-center text-center py-16 px-6 bg-white min-h-screen">
      <h2 className="text-5xl font-bold text-gray-900 mb-6">How Our Laundry Service Works</h2>
      <p className="text-gray-600 max-w-2xl mb-16 text-lg">
        Get fresh, folded laundry delivered in 3 easy steps!
      </p>

      <div className="flex flex-col md:flex-row gap-8 mt-8 w-full max-w-7xl">
        {steps.map((item, index) => (
          <div
            key={index}
            className="relative bg-white p-20 rounded-lg shadow-xl w-full md:w-1/3 flex flex-col items-center transition-transform duration-300 hover:scale-105 hover:shadow-3xl cursor-pointer"
          >
            <div className="absolute -top-16 left-4 text-pink-200 font-extrabold text-9xl select-none">
              {item.step}
            </div>
            <FontAwesomeIcon icon={item.icon} className="text-pink-400 text-6xl mb-6" />
            <h3 className="mt-4 text-3xl font-bold text-black">{item.title}</h3>
            <p className="text-gray-500 mt-2 text-lg">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Adjusted margin-top for the button */}
      <button
        className="mt-8 bg-pink-400 cursor-pointer text-white font-semibold px-8 py-4 rounded-full shadow-xl hover:from-pink-500 hover:to-pink-700 transition"
        onClick={() => setShowSignUpModal(true)}
      >
        Schedule a Pickup
      </button>

      {/* SignUpModal */}
      <SignUpModal showSignUpModal={showSignUpModal} setShowSignUpModal={setShowSignUpModal} />
    </div>
  );
}