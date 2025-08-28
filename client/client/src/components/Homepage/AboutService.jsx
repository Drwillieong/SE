import { useState } from "react";
import wash from "/src/assets/wash.png";
import dry from "/src/assets/Dry.png";
import selfService from "/src/assets/Selfservice.png";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import SignUpModal from '../../pages/SignUpModal';

const services = {
  "Wash & Fold": {
    title: "Wash & Fold",
    description: [
      "If you're tired of laundry, our Wash & Fold service is ideal. We'll pick up your clothes, wash them according to your preferences in individual machines, fold them neatly, including matching your socks, and return them to you.",
      "Enjoy clean, folded laundry delivered to your door. We take care of the washing, so you can focus on what matters."
    ],
    image: wash,
  },
  "Dry Cleaning": {
    title: "Dry Cleaning",
    description: [
      "Get your delicate items professionally cleaned, pressed, and hung, all without leaving home. We handle dry cleaning and laundering for a crisp, ready-to-wear finish.",
      "Experience top-tier cleaning delivered to your door. We'll expertly clean and press your garments, returning them on hangers, saving you trips to the dry cleaners."
    ],
    image: dry,
  },
  "Self Service": {
    title: "Self Service",
    description: [
      "Discover the freedom of affordable and flexible laundry at our self-service location! We offer a range of easy-to-operate, high-efficiency machines at prices that won't strain your wallet.",
      "Customize your wash with your preferred detergents and fabric softeners, and tackle your laundry on your own schedule. Experience laundry done exactly to your liking, without the hefty price tag."
    ],
    image: selfService,
  },
};

export default function AboutService() {
  const [selectedService, setSelectedService] = useState("Wash & Fold");
  const [showSignUpModal, setShowSignUpModal] = useState(false);

  return (
    <div className="min-h-screen bg-white px-4 py-6 sm:p-6">
      {/* Navigation - now responsive */}
      <nav className="bg-pink-100 p-2 sm:p-4 flex flex-row gap-2 sm:space-x-6 text-gray-700 font-semibold mb-6 sm:mb-10">
        {Object.keys(services).map((service) => (
          <button
            key={service}
            onClick={() => setSelectedService(service)}
            className={`px-3 py-1 sm:px-4 sm:py-2 transition duration-300 border-b-2 ${
              selectedService === service
                ? "border-pink-500 text-pink-400"
                : "border-transparent hover:border-gray-400"
            } text-sm sm:text-base`}
            aria-label={`Select ${service} service`}
          >
            {service}
          </button>
        ))}
      </nav>

      {/* Content Section - improved responsive layout */}
      <div className="flex flex-col lg:flex-row items-center max-w-6xl mx-auto p-2 sm:p-4 gap-6">
        <div className="lg:w-1/2 order-2 lg:order-1">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-5 mt-4 sm:mt-10">
            {services[selectedService].title}
          </h1>
          {services[selectedService].description.map((line, index) => (
            <p 
              key={index} 
              className="text-gray-600 mb-4 sm:mb-6 text-base sm:text-lg md:text-xl"
            >
              {line}
            </p>
          ))}
        
           
          </div>
       

        {/* Image Section */}
        <div className="lg:w-1/2 order-1 lg:order-2 lg:ml-10 mt-0 lg:mt-0 flex justify-center">
          <img
            src={services[selectedService].image}
            alt={services[selectedService].title}
            className="w-full max-w-xs sm:max-w-sm rounded-lg shadow-lg"
          />
        </div>
      </div>

      {/* Signup Modal */}
      <SignUpModal 
        showSignUpModal={showSignUpModal} 
        setShowSignUpModal={setShowSignUpModal} 
      />
    </div>
  );
}