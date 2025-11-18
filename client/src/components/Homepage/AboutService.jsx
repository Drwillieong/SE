import { useState } from "react";
import wash from "/src/assets/wash.png";
import dry from "/src/assets/Dry.png";
import selfService from "/src/assets/Selfservice.png";
import first from "/src/assets/Latest bg.jpg";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faCheck } from '@fortawesome/free-solid-svg-icons';
import SignUpModal from '../../pages/SignUpModal';

const services = {
  "Wash & Fold": {
    title: "Wash, Dry & Fold",
    description: [
      "Pick up, wash, dry, fold, and deliver your laundry neatly.",
      "Save time and enjoy clean clothes at your door."
    ],
    pricing: "28 pesos per kilo for regular clothes, or 199 pesos for 7 kilos or less. Detergent and fabric conditioner included.",
    image: first,
  },
  "Dry Cleaning": {
    title: "Dry Cleaning",
    description: [
      "Professional cleaning and pressing for delicate items.",
      "Delivered to your door, no trips needed."
    ],
    pricing: "Pricing varies by item. Visit us for the inspection of the item.",
    image: dry,
  },
  "Self Service": {
    title: "Self Service",
    description: [
      "Affordable self-service laundry with efficient machines.",
      "Wash on your schedule with your preferred detergents."
    ],
    pricing: [
      "Wash(38 minutes) - 65 pesos",
      "Dry(40 minutes) - 75 pesos",
      "Fold - 35 pesos (with free plastic)"
    ],
    image: selfService,
  },
  "Add-on Services": {
    title: "Add-on Services",
    description: [
      "Enhance your laundry experience with additional services.",
      "Perfect for extra care and customization."
    ],
    pricing: [
      "Extra Dry(10 minutes): 25 pesos",
      "Extra Wash(38 minutes): 75 pesos",
      "Extra Rinse & Spin(28 minutes): 45 pesos"
    ],
    image: wash, // Reuse image, or add a new one if available
  },
};

export default function AboutService() {
  const [selectedService, setSelectedService] = useState("Wash & Fold");
  const [showSignUpModal, setShowSignUpModal] = useState(false); // State to control modal visibility

  return (
    <div className="min-h-screen bg-white py-16 px-6">
      {/* Navigation */}
      <nav className="bg-pink-100 p-4 flex flex-wrap space-x-2 md:space-x-6 text-gray-700 font-semibold mb-8">
        {Object.keys(services).map((service) => (
          <button
            key={service}
            onClick={() => setSelectedService(service)}
            className={`px-2 md:px-4 py-2 transition duration-300 border-b-2 ${
              selectedService === service
                ? "border-pink-500 text-pink-400"
                : "border-transparent hover:border-gray-400"
            }`}
            aria-label={`Select ${service} service`} // Accessibility
          >
            {service}
          </button>
        ))}
      </nav>

      {/* Content Section */}
      <div className="flex flex-col md:flex-row items-center max-w-6xl mx-auto p-4">
        <div className="md:w-1/2">
          <h1 className="text-5xl font-bold mb-8">{services[selectedService].title}</h1>
          {services[selectedService].description.map((line, index) => (
            <p key={index} className="text-gray-600 mb-6 text-lg flex items-center">
              <FontAwesomeIcon icon={faCheck} className="text-pink-400 mr-2" />
              {line}
            </p>
          ))}
          <div className="mt-6 p-4 bg-pink-50 rounded-lg">
            <h3 className="text-xl font-semibold mb-2 text-pink-600">Pricing</h3>
            {Array.isArray(services[selectedService].pricing) ? (
              <ul className="text-gray-700 text-lg list-disc list-inside">
                {services[selectedService].pricing.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-700 text-lg">{services[selectedService].pricing}</p>
            )}
          </div>
          <div
          onClick={() => setShowSignUpModal(true)}
          className="mt-8 flex items-center rounded-full cursor-pointer shadow-md bg-white w-full max-w-[25rem] mx-auto hover:bg-pink-100 transition duration-300"
          >
          <div className="px-4 md:px-8 py-3 border-r text-black font-medium text-sm md:text-base">
          Pickup <br /> Now?
          </div>
          <div className="flex items-center justify-between flex-grow px-4 md:px-6 py-3">
          <div className="text-black font-semibold text-sm md:text-base">
          Where? <br /> Add address
          </div>
          <span className="ml-4 w-12 h-12 bg-pink-400 text-white flex items-center justify-center rounded-full transition-transform duration-300 transform hover:scale-110">
          <FontAwesomeIcon icon={faArrowRight} />
            </span>
          </div>
          </div>
        </div>

        {/* Signup Modal */}
      <SignUpModal
        showSignUpModal={showSignUpModal}
        setShowSignUpModal={setShowSignUpModal}
      />

        <div className="md:ml-20 md:w-1/2 mt-8 md:mt-0 flex justify-center">
          <img
            src={services[selectedService].image}
            alt={services[selectedService].title}
            className="w-full max-w-sm rounded-lg shadow-lg"
          />
        </div>
      </div>
    </div>
  );
}
