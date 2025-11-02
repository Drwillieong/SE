import nodemailer from 'nodemailer';
import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';

dotenv.config();

// --- SendGrid Configuration ---
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  console.log('✅ SendGrid API key configured.');
} else {
  console.warn('⚠️ SENDGRID_API_KEY not found. Falling back to Nodemailer for local development.');
}

// IMPORTANT: Replace this with an email address you have verified on SendGrid.
const VERIFIED_SENDER = process.env.VERIFIED_SENDER;

if (!VERIFIED_SENDER && process.env.SENDGRID_API_KEY) {
  throw new Error('VERIFIED_SENDER environment variable must be set to a verified email address in SendGrid when using SendGrid.');
}

// --- Nodemailer (Gmail) Configuration ---
let nodemailerTransporter;
if (!process.env.SENDGRID_API_KEY && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  nodemailerTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  console.log('✅ Nodemailer (Gmail) transporter configured for local development.');
}

/**
 * A generic email sending function that uses SendGrid if available,
 * otherwise falls back to Nodemailer.
 * @param {object} mailOptions - { to, subject, html }
 */
export const sendEmail = async (mailOptions) => {
  if (process.env.SENDGRID_API_KEY) {
    // --- Use SendGrid (for production on Render) ---
    const msg = {
      to: mailOptions.to,
      from: {
        name: 'Wash It Izzy',
        email: VERIFIED_SENDER,
      },
      subject: mailOptions.subject,
      html: mailOptions.html,
      attachments: [],
    };

    // Handle attachments for SendGrid
    if (mailOptions.attachments && mailOptions.attachments.length > 0) {
      msg.attachments = mailOptions.attachments.map(att => {
        // If path is a data URI, extract the base64 content
        if (att.path && att.path.startsWith('data:')) {
          const base64Content = att.path.split(';base64,').pop();
          return {
            content: base64Content,
            filename: att.filename,
            type: att.type || att.contentType || 'application/octet-stream',
            disposition: att.disposition || 'attachment',
            contentId: att.contentId || att.cid
          };
        }
        // Fallback for other attachment formats if needed
        return {
          content: att.content,
          filename: att.filename,
          type: att.type || att.contentType || 'application/octet-stream',
          disposition: att.disposition || 'attachment',
          contentId: att.contentId || att.cid
        };
      });
    }

    try {
      await sgMail.send(msg);
      console.log(`✅ [SendGrid] Email sent successfully to ${mailOptions.to}`);
    } catch (error) {
      console.error(`❌ [SendGrid] Error sending email:`, error.response?.body || error);
      throw new Error('Failed to send email via SendGrid.');
    }
  } else if (nodemailerTransporter) {
    // --- Use Nodemailer (for local development) ---
    const optionsWithFrom = {
      ...mailOptions,
      from: `"Wash It Izzy" <${process.env.EMAIL_USER}>`,
      // Nodemailer handles the attachments object as-is
    };
    try {
      const info = await nodemailerTransporter.sendMail(optionsWithFrom);
      console.log(`✅ [Nodemailer] Email sent successfully to ${mailOptions.to}: ${info.response}`);
    } catch (error) {
      console.error('❌ [Nodemailer] Error sending email:', error);
      throw new Error('Failed to send email via Nodemailer.');
    }
  } else {
    // --- No email service configured ---
    console.error('❌ Cannot send email. No email service is configured (SendGrid or Nodemailer).');
    throw new Error('Email service is not configured on the server.');
  }
};

// Function to verify transporter configuration
export const verifyEmailConfig = async () => {
  if (process.env.SENDGRID_API_KEY) {
    console.log('✅ SendGrid is configured.');
    return true;
  }
  if (nodemailerTransporter) {
    try {
      await nodemailerTransporter.verify();
      console.log('✅ Nodemailer transporter is ready to send messages.');
      return true;
    } catch (error) {
      console.error('❌ Nodemailer transporter verification failed:', error.message);
      return false;
    }
  }
  console.error('❌ No email service is configured.');
  return false;
};

// Function to send verification email (returns a promise)
export const sendVerificationEmail = async (email, token) => {
    console.log('📤 Attempting to send verification email to:', email);

    const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${token}`;

    const mailOptions = {
        to: email,
        subject: 'Verify Your Email Address - Wash It Izzy',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #007bff;">Email Verification</h2>
                <p>Welcome to Wash It Izzy! Please verify your email address to complete your account setup.</p>
                <div style="text-align: center; margin: 20px 0;">
                    <a href="${verificationLink}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                        Verify Email
                    </a>
                </div>
                <p>Or copy and paste this link in your browser:</p>
                <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 4px;">
                    ${verificationLink}
                </p>
                <p style="color: #6c757d; font-size: 14px;">
                    If you did not create an account, please ignore this email.
                </p>
                <hr style="border: none; border-top: 1px solid #e9ecef; margin: 20px 0;">
                <p style="color: #6c757d; font-size: 12px;">
                    This is an automated message from Wash It Izzy. Please do not reply to this email.
                </p>
            </div>
        `
    };

    await sendEmail(mailOptions);
};

// Function to send password reset email (returns a promise)
export const sendPasswordResetEmail = async (email, token) => {
    console.log('📤 Attempting to send password reset email to:', email);

    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;

    const mailOptions = {
        to: email,
        subject: 'Reset Your Password - Wash It Izzy',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #dc3545;">Password Reset Request</h2>
                <p>You have requested to reset your password for your Wash It Izzy account.</p>
                <p>Please click the button below to reset your password:</p>
                <div style="text-align: center; margin: 20px 0;">
                    <a href="${resetLink}" style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                        Reset Password
                    </a>
                </div>
                <p>Or copy and paste this link in your browser:</p>
                <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 4px;">
                    ${resetLink}
                </p>
                <p style="color: #6c757d; font-size: 14px;">
                    This link will expire in 1 hour. If you did not request a password reset, please ignore this email.
                </p>
                <hr style="border: none; border-top: 1px solid #e9ecef; margin: 20px 0;">
                <p style="color: #6c757d; font-size: 12px;">
                    This is an automated message from Wash It Izzy. Please do not reply to this email.
                </p>
            </div>
        `
    };

    await sendEmail(mailOptions);
};

// Function to send pickup notification email (returns a promise)
export const sendPickupEmail = async (email, name, address) => {
    console.log('📤 Attempting to send pickup notification email to:', email);

    const mailOptions = {
        to: email,
        subject: 'Pickup Notification - Wash It Izzy',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #28a745;">Pickup Ready!</h2>
                <p>Dear ${name},</p>
                <p>Great news! The rider is ready to go to your home for pickup.</p>
                <p><strong>Pickup Address:</strong> ${address}</p>
                <p>Please be ready for the rider's arrival. If you have any questions or need to reschedule, please contact us.</p>
                <p>Thank you for choosing Wash It Izzy!</p>
                <hr style="border: none; border-top: 1px solid #e9ecef; margin: 20px 0;">
                <p style="color: #6c757d; font-size: 12px;">
                    This is an automated message from Wash It Izzy. Please do not reply to this email.
                </p>
            </div>
        `
    };

    await sendEmail(mailOptions);
};

// Function to send booking rejection email (returns a promise)
export const sendRejectionEmail = async (email, name, rejectionReason) => {
    console.log('📤 Attempting to send booking rejection email to:', email);

    const mailOptions = {
        to: email,
        subject: 'Booking Update - Wash It Izzy',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #dc3545;">Booking Update</h2>
                <p>Dear ${name},</p>
                <p>We regret to inform you that your laundry booking request has been <strong>rejected</strong>.</p>

                <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 5px; padding: 15px; margin: 20px 0;">
                    <h3 style="color: #721c24; margin-top: 0;">Reason for Rejection:</h3>
                    <p style="color: #721c24; margin-bottom: 0; font-weight: 500;">${rejectionReason}</p>
                </div>

                <p>If you have any questions about this rejection or would like to submit a new booking with different details, please don't hesitate to contact us:</p>
                <ul>
                    <li>Phone: 0968-856-3288</li>
                    <li>Email: ${process.env.EMAIL_USER}</li>
                </ul>

                <p>Thank you for considering Wash It Izzy for your laundry needs.</p>

                <hr style="border: none; border-top: 1px solid #e9ecef; margin: 20px 0;">
                <p style="color: #6c757d; font-size: 12px;">
                    This is an automated message from Wash It Izzy. Please do not reply to this email.
                </p>
            </div>
        `
    };

    await sendEmail(mailOptions);
};

// Function to send "ready for pickup" notification email (returns a promise)
export const sendReadyForPickupEmail = async (email, name, orderId, serviceType) => {
    console.log('📤 Attempting to send ready for pickup email to:', email);

    const serviceName = serviceType === 'washFold' ? 'Wash & Fold' :
                       serviceType === 'dryCleaning' ? 'Dry Cleaning' :
                       serviceType === 'hangDry' ? 'Hang Dry' : 'Laundry Service';

    const mailOptions = {
        to: email,
        subject: 'Your Laundry is Ready for Pickup! - Wash It Izzy',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #28a745;">🎉 Your Laundry is Ready!</h2>
                <p>Dear ${name},</p>
                <p>Great news! Your laundry has been completed and is ready for pickup or delivery.</p>

                <div style="background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 5px; padding: 15px; margin: 20px 0;">
                    <h3 style="color: #155724; margin-top: 0;">Order Details:</h3>
                    <p style="color: #155724; margin-bottom: 5px;"><strong>Order ID:</strong> #${orderId}</p>
                    <p style="color: #155724; margin-bottom: 0;"><strong>Service:</strong> ${serviceName}</p>
                </div>

                <p><strong>What happens next?</strong></p>
                <ul>
                    <li>📞 Our team will contact you shortly to arrange pickup/delivery</li>
                    <li>⏰ Please be available during your scheduled pickup time</li>
                    <li>💳 Have your payment ready (if not already paid online)</li>
                </ul>

                <p>If you have any questions or need to reschedule your pickup, please don't hesitate to contact us:</p>
                <ul>
                    <li>📱 Phone: 0968-856-3288</li>
                    <li>📧 Email: ${process.env.EMAIL_USER}</li>
                </ul>

                <p>Thank you for choosing Wash It Izzy! We hope to serve you again soon.</p>

                <hr style="border: none; border-top: 1px solid #e9ecef; margin: 20px 0;">
                <p style="color: #6c757d; font-size: 12px;">
                    This is an automated message from Wash It Izzy. Please do not reply to this email.
                </p>
            </div>
        `
    };

    await sendEmail(mailOptions);
};

// Function to send order completion/receipt email
export const sendCompletionEmail = async (email, name, order) => {
    console.log('📤 Attempting to send completion email to:', email);

    const serviceName = order.serviceType === 'washFold' ? 'Wash & Fold' :
                       order.serviceType === 'dryCleaning' ? 'Dry Cleaning' :
                       order.serviceType === 'hangDry' ? 'Hang Dry' : 'Laundry Service';

    const mailOptions = {
        to: email,
        subject: `Your Wash It Izzy Order #${order.order_id} is Complete!`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #007bff;">🎉 Your Order is Complete!</h2>
                <p>Dear ${name},</p>
                <p>Thank you for using Wash It Izzy! Your order has been completed. Here is your receipt:</p>

                <div style="background-color: #f8f9fa; border: 1px solid #e9ecef; border-radius: 5px; padding: 15px; margin: 20px 0;">
                    <h3 style="color: #495057; margin-top: 0;">Order Summary:</h3>
                    <p style="margin-bottom: 5px;"><strong>Order ID:</strong> #${order.order_id}</p>
                    <p style="margin-bottom: 5px;"><strong>Service:</strong> ${serviceName}</p>
                    <p style="margin-bottom: 5px;"><strong>Total Price:</strong> ₱${order.totalPrice?.toLocaleString()}</p>
                    <p style="margin-bottom: 0;"><strong>Payment Status:</strong> ${order.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}</p>
                </div>

                <p>We hope you enjoyed our service. We look forward to serving you again soon!</p>

                <hr style="border: none; border-top: 1px solid #e9ecef; margin: 20px 0;">
                <p style="color: #6c757d; font-size: 12px;">
                    This is an automated message from Wash It Izzy. Please do not reply to this email.
                </p>
            </div>
        `
    };

    await sendEmail(mailOptions);
};
