import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp, faClock, faDollarSign, faTruck, faShieldAlt, faCogs } from '@fortawesome/free-solid-svg-icons';

const FaqSection = () => {
  const [openIndexes, setOpenIndexes] = useState([]);
  const [showAll, setShowAll] = useState(false);

  const faqs = [
    {
      icon: faClock,
      question: "How long does the laundry service take?",
      answer: "Our standard service takes 24-48 hours from pickup to delivery. Rush services are available for an additional fee."
    },
    {
      icon: faDollarSign,
      question: "What are your pricing options?",
      answer: "We charge 28 pesos per kilo for regular laundry, or 199 pesos for 7 kilos or less. Detergent and fabric conditioner are included."
    },
    {
      icon: faTruck,
      question: "Do you offer pickup and delivery?",
      answer: "Yes, we provide free pickup and delivery in Calamba and nearby areas for loads of 2 or more."
    },
    {
      icon: faShieldAlt,
      question: "What if my clothes are damaged?",
      answer: "We take great care with your items. If any damage occurs, we will repair or replace the item at no cost to you."
    },
    {
      icon: faCogs,
      question: "What types of services do you offer?",
      answer: "We offer wash & fold, dry cleaning, and self-service laundry options to suit your needs."
    },
    {
      icon: faTruck,
      question: "What are the free delivery areas?",
      answer: "We offer free delivery in the following areas: Brgy. 1-7, Lecheria (Up to City Cemetery), San Juan, San Jose, Looc, Bañadero, Palingong, Lingga, Sampiruhan, Parian, and all nearby areas around our shop."
    },
    {
      icon: faDollarSign,
      question: "What payment options do you accept?",
      answer: "We accept cash, GCash, and card payments."
    }
  ];

  const toggleFaq = (index) => {
    setOpenIndexes(prev => prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]);
  };

  return (
    <>
      <section className="py-16 bg-gradient-to-b from-pink-50 to-white">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-12 text-black">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {faqs.slice(0, showAll ? faqs.length : 4).map((faq, index) => (
              <div key={index} className="bg-white shadow-lg rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl">
                <button
                  className="w-full text-left p-6 focus:outline-none focus:ring-2 focus:ring-pink-400 transition-colors duration-200"
                  onClick={() => toggleFaq(index)}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                        <FontAwesomeIcon icon={faq.icon} className="text-pink-500" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800 hover:text-pink-600 transition-colors duration-200">{faq.question}</h3>
                    </div>
                    <FontAwesomeIcon
                      icon={openIndexes.includes(index) ? faChevronUp : faChevronDown}
                      className="text-pink-400 transition-transform duration-200"
                    />
                  </div>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${openIndexes.includes(index) ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="px-6 pb-6 pt-2">
                    <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <button
              className="bg-pink-500 text-white px-6 py-2 rounded-full hover:bg-pink-600 transition-colors duration-200"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? 'Show Less' : 'Show All Questions'}
            </button>
          </div>
        </div>
      </section>
    </>
  );
};

export default FaqSection;

