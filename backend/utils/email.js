import nodemailer from 'nodemailer';

// Configure nodemailer for email sending
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'nyak123457@gmail.com',
        pass: process.env.EMAIL_PASS || 'fpyttvnkvpdnabjx' // Replace with your app password
    }
});

// Verify transporter configuration
transporter.verify(function(error, success) {
    if (error) {
        console.error('Email transporter verification failed:', error);
    } else {
        console.log('Email transporter is ready to send messages');
        console.log('Using email:', process.env.EMAIL_USER || 'kvnbolado@gmail.com');
    }
});

// Function to send verification email
export const sendVerificationEmail = (email, token) => {
    console.log('Attempting to send verification email to:', email);
    
    const verificationLink = `http://localhost:8800/verify-email?token=${token}`;
    
    const mailOptions = {
        from: process.env.EMAIL_USER || 'your-email@gmail.com',
        to: email,
        subject: 'Verify Your Email Address - Wash It Izzy',
        html: `
            <h2>Email Verification</h2>
            <p>Please verify your email address by clicking the button below:</p>
            <a href="${verificationLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                Verify Email
            </a>
            <p>Or copy and paste this link in your browser:</p>
            <p>${verificationLink}</p>
            <p>If you did not create an account, please ignore this email.</p>
        `
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending verification email:', error);
            console.error('Error details:', error.response);
        } else {
            console.log('Verification email sent successfully:', info.response);
            console.log('Message ID:', info.messageId);
        }
    });
};
