import { sendVerificationEmail } from './utils/email.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('Testing email sending...');
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '*** (set)' : 'NOT SET');

// Test email sending
const testEmail = 'test@example.com'; // Replace with a real email for testing
const testToken = 'test-token-123';

console.log(`Sending test email to: ${testEmail}`);
sendVerificationEmail(testEmail, testToken);

// Keep the process alive for a few seconds to allow email to send
setTimeout(() => {
    console.log('Email test completed');
    process.exit(0);
}, 5000);
