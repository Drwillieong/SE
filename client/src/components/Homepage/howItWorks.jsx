import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faTshirt, faTruck } from '@fortawesome/free-solid-svg-icons';

const HowItWorks = () => {
  return (
<section className="pb-32 bg-white flex flex-col items-center justify-center">
      <h2 className="text-4xl font-bold text-center mb-8 text-main">How It Works</h2>
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        <div className="step bg-white shadow rounded-lg p-6 text-center hover:shadow-lg transition-transform transform hover:scale-105 border-2 border-pink-300">
          <div className="icon text-5xl mb-4 text-pink-400">
            <FontAwesomeIcon icon={faSearch} />
          </div>
          <h3 className="text-xl font-semibold mb-2">We Begin with a Thorough Check</h3>
          <p className="text-gray-700">
            We meticulously inspect your garments and double-check all pockets. This 'pocket patrol' ensures nothing unexpected gets washed.
          </p>
        </div>
        <div className="step bg-white shadow rounded-lg p-6 text-center hover:shadow-lg transition-transform transform hover:scale-105 border-2 border-pink-300">
          <div className="icon text-5xl mb-4 text-pink-400">
            <FontAwesomeIcon icon={faTshirt} />
          </div>
          <h3 className="text-xl font-semibold mb-2">We Follow Your Preferences</h3>
          <p className="text-gray-700">
            Tell us exactly how you want your laundry done. We'll follow your instructions precisely, ensuring your clothes are cleaned your way.
          </p>
        </div>
        <div className="step bg-white shadow rounded-lg p-6 text-center hover:shadow-lg transition-transform transform hover:scale-105 border-2 border-pink-300">
          <div className="icon text-5xl mb-4 text-pink-400">
            <FontAwesomeIcon icon={faTruck} />
          </div>
          <h3 className="text-xl font-semibold mb-2">We Deliver Perfectly Folded Laundry</h3>
          <p className="text-gray-700">
            We expertly fold each item, pair your socks, and present your laundry neatly, right to your door.
          </p>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
