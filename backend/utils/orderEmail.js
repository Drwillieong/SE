import { transporter } from './email.js';

export const sendOrderReadyEmail = async (
  to,
  name,
  orderId,
  totalKilos,
  totalPrice,
  laundryPhotoUrl,
  paymentMethod,
  serviceType,
  loadCount
) => {
  // Helper to format names for display
  const formatPaymentMethod = (method) => {
    const map = {
      cash: 'Cash on pickup',
      gcash: 'GCash',
      card: 'Credit/Debit Card'
    };
    return map[method] || method;
  };

  const formatServiceType = (type) => {
    const map = {
      washDryFold: 'Wash, Dry & Fold',
      fullService: 'Full Service (Wash, Dry & Fold)'
    };
    return map[type] || type;
  };

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: `Your Laundry Order #${orderId} is Ready for Washing!`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2 style="color: #333;">Your Laundry Order #${orderId} is Ready!</h2>
        <p>Hi ${name},</p>
        <p>We have received and weighed your laundry. Here are the details of your order:</p>
        <div style="background-color: #f9f9f9; border: 1px solid #eee; padding: 15px; border-radius: 5px;">
          <p><strong>Order ID:</strong> ${orderId}</p>
          <p><strong>Total Weight:</strong> ${totalKilos} kg</p>
          <p><strong>Total Price:</strong> ₱${totalPrice.toFixed(2)}</p>
          <p><strong>Payment Method:</strong> ${formatPaymentMethod(paymentMethod)}</p>
          <p><strong>Service Type:</strong> ${formatServiceType(serviceType)} (${loadCount} load${loadCount > 1 ? 's' : ''})</p>
        </div>
        ${laundryPhotoUrl ? `
          <p>Please see the photo of your laundry below:</p>
          <img src="${laundryPhotoUrl}" alt="Laundry Photo" style="max-width: 100%; height: auto; border: 1px solid #ddd; border-radius: 4px; padding: 5px;" />
        ` : ''}
        <p>Your laundry is now in the queue for washing. We will notify you again once it's ready for delivery or pickup.</p>
        <p>Thank you for choosing our service!</p>
        <p>Best regards,<br/>The Laundry Service Team</p>
      </div>
    `,
  };

  try {
    if (!transporter) {
      throw new Error('Email transporter not configured');
    }
    await transporter.sendMail(mailOptions);
    console.log(`✅ Order ready email sent successfully to: ${to}`);
  } catch (error) {
    console.error(`❌ Error sending order ready email to ${to}:`, error.message);
    // We re-throw the error so the calling function can decide how to handle it.
    // For example, it might decide to proceed with the order creation even if the email fails.
    throw new Error(`Failed to send order ready email: ${error.message}`);
  }
};