// Define free pickup barangays and their fees
const freePickupBarangays = [
  "Brgy. 1", "Brgy. 2", "Brgy. 3", "Brgy. 4", "Brgy. 5", "Brgy. 6", "Brgy. 7",
  "Lecheria", "San Juan", "San Jose",
  "Looc", "Bañadero",
  "Palingong", "Lingga", "Sampiruhan", "Parian"
];

// Define barangays with special pricing
const barangayPricing = {
  "Mapagong": 30,
  "Bubuyan": 30,
  "Burol": 30,
  "Bucal": 30,
  "Camaligan": 30,
  "La Mesa": 30
};

// Calculate delivery fee based on barangay and load count
export const calculateDeliveryFee = (barangay, loadCount) => {
  if (!barangay) return 0;

  // Check if barangay is in free pickup list and loadCount >= 2 for free delivery
  const isFree = freePickupBarangays.some(freeBrgy =>
    barangay.toLowerCase().includes(freeBrgy.toLowerCase().split(' ')[0])
  );

  if (isFree && loadCount >= 2) return 0;

  // Check for special pricing
  for (const [brgy, fee] of Object.entries(barangayPricing)) {
    if (barangay.toLowerCase().includes(brgy.toLowerCase())) {
      return fee;
    }
  }

  // Default fee for other areas
  return 30;
};

// Get delivery fee information for display
export const getDeliveryFeeInfo = () => {
  return {
    freePickupBarangays,
    barangayPricing,
    defaultFee: 30
  };
};
