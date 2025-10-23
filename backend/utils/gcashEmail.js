// Function to send GCash payment notification email to admin
import { sendEmail } from './email.js';

export const sendGcashPaymentNotificationEmail = async (order, referenceNumber, proofBase64) => {
    console.log('📤 Attempting to send GCash payment notification email to admin');

    const serviceName = order.serviceType === 'washFold' ? 'Wash & Fold' :
                       order.serviceType === 'dryCleaning' ? 'Dry Cleaning' :
                       order.serviceType === 'hangDry' ? 'Hang Dry' : 'Laundry Service';

    // Prepare attachment if proof image exists
    const attachments = [];
    if (proofBase64) {
        attachments.push({
            filename: `gcash_payment_proof_${order.order_id}.png`,
            content: proofBase64.split(';base64,').pop(), // Remove the data URI part
            encoding: 'base64',
            cid: 'payment-proof' // Content ID for inline display
        });
    }

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: 'kevincorpuz321@gmail.com',
        subject: `New GCash Payment Submitted - Ref #${order.order_id}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #007bff;">💳 New GCash Payment Submitted</h2>
                <p>A new GCash payment has been submitted and requires your review.</p>

                <div style="background-color: #f8f9fa; border: 1px solid #e9ecef; border-radius: 5px; padding: 15px; margin: 20px 0;">
                    <h3 style="color: #495057; margin-top: 0;">Payment Details:</h3>
                    <p style="margin-bottom: 5px;"><strong>Reference ID:</strong> #${order.order_id}</p>
                    <p style="margin-bottom: 5px;"><strong>Reference Number:</strong> ${referenceNumber || '<span style="color: red;">Not Provided</span>'}</p>
                    <p style="margin-bottom: 5px;"><strong>Amount:</strong> ₱${order.totalPrice?.toLocaleString() || 'N/A'}</p>
                    <p style="margin-bottom: 0;"><strong>Payment Status:</strong> Pending Review</p>
                </div>

                <div style="background-color: #e7f3ff; border: 1px solid #b3d9ff; border-radius: 5px; padding: 15px; margin: 20px 0;">
                    <h3 style="color: #004085; margin-top: 0;">Customer Details:</h3>
                    <p style="margin-bottom: 5px;"><strong>Name:</strong> ${order.name}</p>
                    <p style="margin-bottom: 5px;"><strong>Contact:</strong> ${order.contact}</p>
                    <p style="margin-bottom: 5px;"><strong>Email:</strong> ${order.email}</p>
                    <p style="margin-bottom: 0;"><strong>Address:</strong> ${order.address}</p>
                </div>

                <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0;">
                    <h3 style="color: #856404; margin-top: 0;">Service Details:</h3>
                    <p style="margin-bottom: 5px;"><strong>Service Type:</strong> ${serviceName}</p>
                    <p style="margin-bottom: 5px;"><strong>Load Count:</strong> ${order.loadCount} load${order.loadCount > 1 ? 's' : ''}</p>
                    <p style="margin-bottom: 0;"><strong>Pickup Date:</strong> ${new Date(order.pickupDate).toLocaleDateString()}</p>
                    <p style="margin-bottom: 0;"><strong>Pickup Time:</strong> ${order.pickupTime}</p>
                </div>

                ${proofBase64 ? `
                    <div style="background-color: #d1ecf1; border: 1px solid #bee5eb; border-radius: 5px; padding: 15px; margin: 20px 0;">
                        <h3 style="color: #0c5460; margin-top: 0;">📎 Payment Proof:</h3>
                        <p style="margin-bottom: 0;">Payment proof image has been attached to this email.</p>
                        <img src="cid:payment-proof" alt="Payment Proof" style="max-width: 100%; height: auto; margin-top: 10px; border: 1px solid #dee2e6; border-radius: 4px;" />
                    </div>
                ` : ''}

                ${!proofBase64 && !referenceNumber ? `
                <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 5px; padding: 15px; margin: 20px 0;">
                    <h3 style="color: #721c24; margin-top: 0;">⚠️ No Payment Details Provided:</h3>
                    <p style="margin-bottom: 0;">The customer did not provide a reference number or a payment proof image. Please follow up manually.</p>
                </div>
                ` : ''}

                <div style="text-align: center; margin: 20px 0;">
                    <p>Please review this payment in the admin dashboard and approve or reject accordingly.</p>
                </div>

                <hr style="border: none; border-top: 1px solid #e9ecef; margin: 20px 0;">
                <p style="color: #6c757d; font-size: 12px;">
                    This is an automated notification from Wash It Izzy. Please do not reply to this email.
                </p>
            </div>
        `,
        attachments: attachments
    };

    try {
        await sendEmail(mailOptions);
        console.log('✅ GCash payment notification email sent successfully');
        return { success: true };
    } catch (error) {
        console.error('❌ Error sending GCash payment notification email:', error.message);
        throw error;
    }
};
