import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory for proper path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure nodemailer for email sending
const createTransporter = () => {
    // Check if environment variables are set
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error('❌ Email configuration error: EMAIL_USER and EMAIL_PASS environment variables are required');
        console.error('Please set these variables in your .env file:');
        console.error('EMAIL_USER=your-email@gmail.com');
        console.error('EMAIL_PASS=your-app-password');
        return null;
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    return transporter;
};

// Function to verify transporter configuration
export const verifyEmailConfig = async () => {
    const transporter = createTransporter();
    if (!transporter) return false;

    try {
        await transporter.verify();
        console.log('✅ Email transporter is ready to send messages');
        console.log('📧 Using email:', process.env.EMAIL_USER);
        return true;
    } catch (error) {
        console.error('❌ Email transporter verification failed:', error.message);
        console.error('💡 Please check:');
        console.error('1. Your Gmail account has 2-factor authentication enabled');
        console.error('2. You have generated an App Password (not your regular password)');
        console.error('3. The App Password is correctly set in EMAIL_PASS environment variable');
        console.error('4. Less secure apps access is enabled (if not using App Password)');
        return false;
    }
};

// Function to send verification email (returns a promise)
export const sendVerificationEmail = async (email, token) => {
    console.log('📤 Attempting to send verification email to:', email);

    const transporter = createTransporter();
    if (!transporter) {
        throw new Error('Email transporter not configured');
    }

    const verificationLink = `http://localhost:8800/verify-email?token=${token}`;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Verify Your Email Address - Wash It Izzy',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #007bff;">Email Verification</h2>
                  <p>Jackie Chan</p>
                    <p>kakaltukan ko tong mga nasa harap natin pag dipa tumigil</p>
                 <p>TITIGL NAKO</p>
                 <p>TITIGL NAKO</p>
                 <p>TITIGL NAKO</p>
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

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Verification email sent successfully:', info.response);
        console.log('📧 Message ID:', info.messageId);
        return info;
    } catch (error) {
        console.error('❌ Error sending verification email:', error.message);
        console.error('🔧 Error details:', error.response || error);
        throw error;
    }
};

// Function to send password reset email (returns a promise)
export const sendPasswordResetEmail = async (email, token) => {
    console.log('📤 Attempting to send password reset email to:', email);

    const transporter = createTransporter();
    if (!transporter) {
        throw new Error('Email transporter not configured');
    }

    const resetLink = `http://localhost:5173/reset-password?token=${token}`;

    const mailOptions = {
        from: process.env.EMAIL_USER,
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

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Password reset email sent successfully:', info.response);
        console.log('📧 Message ID:', info.messageId);
        return info;
    } catch (error) {
        console.error('❌ Error sending password reset email:', error.message);
        console.error('🔧 Error details:', error.response || error);
        throw error;
    }
};

// Function to send pickup notification email (returns a promise)
export const sendPickupEmail = async (email, name, address) => {
    console.log('📤 Attempting to send pickup notification email to:', email);

    const transporter = createTransporter();
    if (!transporter) {
        throw new Error('Email transporter not configured');
    }

    const mailOptions = {
        from: process.env.EMAIL_USER,
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

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Pickup notification email sent successfully:', info.response);
        console.log('📧 Message ID:', info.messageId);
        return info;
    } catch (error) {
        console.error('❌ Error sending pickup notification email:', error.message);
        console.error('🔧 Error details:', error.response || error);
        throw error;
    }
};
