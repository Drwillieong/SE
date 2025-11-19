import { sendEmail } from './email.js';

// Function to send order confirmation email
export const sendOrderConfirmationEmail = async (email, name, orderId, kilos, totalPrice, laundryPhoto, paymentMethod, serviceType, loadCount, contact, address) => {
    console.log('📤 Attempting to send order confirmation email to:', email);

    // Format service type for display
    const serviceName = serviceType === 'washFold' ? 'Wash & Fold' :
                       serviceType === 'dryCleaning' ? 'Dry Cleaning' :
                       serviceType === 'hangDry' ? 'Hang Dry' : 'Laundry Service';

    // Format payment method for display
    const paymentDisplay = paymentMethod === 'cash' ? 'Cash on Delivery' :
                          paymentMethod === 'gcash' ? 'GCash' : paymentMethod;

    // Calculate estimated time
    let estimatedTime = '1-2 days'; // default
    if (kilos < 7 && (serviceType === 'washFold' || serviceType === 'hangDry')) {
        estimatedTime = '1-2 days';
    } else if (serviceType === 'dryCleaning') {
        estimatedTime = '1-2 weeks depending on size';
    }

    const mailOptions = {
        to: email,
        subject: `Order Confirmation - Wash It Izzy #${orderId}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #007bff;">🎉 Order Confirmed!</h2>
                <p>Dear ${name},</p>
                <p>Thank you for choosing Wash It Izzy! Your order has been successfully created and confirmed.</p>

                <div style="background-color: #f8f9fa; border: 1px solid #e9ecef; border-radius: 5px; padding: 15px; margin: 20px 0;">
                    <h3 style="color: #495057; margin-top: 0;">Order Details:</h3>
                    <p style="margin-bottom: 5px;"><strong>Order ID:</strong> #${orderId}</p>
                    <p style="margin-bottom: 5px;"><strong>Service:</strong> ${serviceName}</p>
                    <p style="margin-bottom: 5px;"><strong>Weight:</strong> ${kilos} kg</p>
                    <p style="margin-bottom: 5px;"><strong>Load Count:</strong> ${loadCount}</p>
                    <p style="margin-bottom: 5px;"><strong>Total Price:</strong> ₱${totalPrice?.toLocaleString()}</p>
                    <p style="margin-bottom: 0;"><strong>Payment Method:</strong> ${paymentDisplay}</p>
                </div>

                <div style="background-color: #e7f3ff; border: 1px solid #b3d9ff; border-radius: 5px; padding: 15px; margin: 20px 0;">
                    <h3 style="color: #004085; margin-top: 0;">Customer Details:</h3>
                    <p style="margin-bottom: 5px;"><strong>Name:</strong> ${name}</p>
                    <p style="margin-bottom: 5px;"><strong>Contact:</strong> ${contact}</p>
                    <p style="margin-bottom: 5px;"><strong>Email:</strong> ${email}</p>
                    <p style="margin-bottom: 0;"><strong>Address:</strong> ${address}</p>
                </div>

                <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0;">
                    <h3 style="color: #856404; margin-top: 0;">Estimated Time:</h3>
                    <p style="margin-bottom: 0;">Your order is expected to be completed in approximately <strong>${estimatedTime}</strong>.</p>
                </div>

                <p><strong>What happens next?</strong></p>
                <ul>

                    <li>🧺 Your clothes will be professionally cleaned</li>
                    <li>📱 You'll receive updates throughout the process</li>
                    <li>🚚 You'll receive updates when your laundry is done</li>
                    <li>📧 Please check your email and customer account for the latest updates on your order status</li>

                </ul>

                <p>If you have any questions or need to make changes to your order, please don't hesitate to contact us:</p>
                <ul>
                    <li>📱 Phone: 0968-856-3288</li>
                    <li>📧 Email: ${process.env.EMAIL_USER}</li>
                </ul>

                <p>Thank you for trusting Wash It Izzy with your laundry needs!</p>

                <hr style="border: none; border-top: 1px solid #e9ecef; margin: 20px 0;">
                <p style="color: #6c757d; font-size: 12px;">
                    This is an automated message from Wash It Izzy. Please do not reply to this email.
                </p>
            </div>
        `
    };

    // Add laundry photo attachment if available
    if (laundryPhoto && laundryPhoto.length > 0) {
        try {
            // If it's a base64 string, extract the base64 content
            if (laundryPhoto.startsWith('data:image')) {
                const base64Data = laundryPhoto.replace(/^data:image\/[a-z]+;base64,/, '');
                mailOptions.attachments = [{
                    filename: `laundry_photo_order_${orderId}.jpg`,
                    content: base64Data,
                    type: 'image/jpeg'
                }];
            }
        } catch (attachmentError) {
            console.warn('⚠️ Could not attach laundry photo to email:', attachmentError.message);
            // Continue without attachment
        }
    }

    try {
        await sendEmail(mailOptions);
        console.log('✅ Order confirmation email sent successfully');
        return { success: true };
    } catch (error) {
        console.error('❌ Error sending order confirmation email:', error.message);
        throw error;
    }
};
