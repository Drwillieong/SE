import React from 'react';

const HowItWorks = () => {
  return (
    <section className="py-10 sm:py-16 bg-white px-4 sm:px-6">
      <h2 className="text-3xl sm:text-4xl font-bold text-center mb-8 sm:mb-10 text-main">
        How It Works
      </h2>
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
        {[
          {
            icon: "🔍",
            title: "We Begin with a Thorough Check",
            description: "We meticulously inspect your garments and double-check all pockets. This 'pocket patrol' ensures nothing unexpected gets washed."
          },
          {
            icon: "🧺",
            title: "We Wash with Personalized Care",
            description: "We carefully separate your lights and darks, using cold water for every wash to maintain color vibrancy and efficiency."
          },
          {
            icon: "🧼",
            title: "We Follow Your Preferences",
            description: "Tell us exactly how you want your laundry done. We'll follow your instructions precisely, ensuring your clothes are cleaned your way."
          },
          {
            icon: "📦",
            title: "We Deliver Perfectly Folded Laundry",
            description: "We expertly fold each item, pair your socks, and present your laundry neatly, right to your door."
          }
        ].map((step, index) => (
          <div 
            key={index}
            className="step bg-white shadow-md sm:shadow rounded-lg p-5 sm:p-6 text-center hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] border-2 border-pink-200 sm:border-pink-300"
          >
            <div className="icon text-4xl sm:text-5xl mb-3 sm:mb-4 text-main">
              {step.icon}
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">
              {step.title}
            </h3>
            <p className="text-gray-600 sm:text-gray-700 text-sm sm:text-base">
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default HowItWorks;