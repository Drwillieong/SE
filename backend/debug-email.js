import { sendVerificationEmail, verifyEmailConfig } from './utils/email.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const testEmail = 'test@example.com'; // Replace with a real email for testing
const testToken = 'test-token-123';

async function testEmailSending() {
    console.log('🧪 Testing email configuration...');
    console.log('📧 EMAIL_USER:', process.env.EMAIL_USER || 'NOT SET');
    console.log('🔑 EMAIL_PASS:', process.env.EMAIL_PASS ? '*** (set)' : 'NOT SET');
    
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error('❌ Error: EMAIL_USER and EMAIL_PASS environment variables are required');
        console.log('\n💡 Please create a .env file in the backend directory with:');
        console.log('EMAIL_USER=your-email@gmail.com');
        console.log('EMAIL_PASS=your-app-password');
        console.log('\n📖 How to get App Password:');
        console.log('1. Enable 2-factor authentication on your Gmail account');
        console.log('2. Go to Google Account Settings > Security > App passwords');
        console.log('3. Generate a new app password for "Mail"');
        console.log('4. Use that password in EMAIL_PASS');
        process.exit(1);
    }
    
    // Test email configuration
    console.log('\n🔧 Verifying email configuration...');
    const configValid = await verifyEmailConfig();
    
    if (!configValid) {
        console.error('❌ Email configuration failed');
        process.exit(1);
    }
    
    // Test email sending
    console.log('\n📤 Testing email sending...');
    console.log(`Sending test email to: ${testEmail}`);
    
    try {
        const info = await sendVerificationEmail(testEmail, testToken);
        console.log('✅ Email test completed successfully!');
        console.log('📧 Message ID:', info.messageId);
        console.log('\n💡 Check your email inbox (and spam folder) for the test email.');
    } catch (error) {
        console.error('❌ Email sending failed:', error.message);
        console.error('\n🔧 Troubleshooting tips:');
        console.error('1. Ensure 2-factor authentication is enabled on your Gmail');
        console.error('2. Use an App Password (not your regular password)');
        console.error('3. Check if "Less secure app access" is enabled if not using App Password');
        console.error('4. Verify the email address exists and is correct');
        process.exit(1);
    }
}

// Run the test
testEmailSending().catch(console.error);
