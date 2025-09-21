import { sendPickupSMS, checkSMSBalance, validatePhoneNumber } from './utils/sms_philsms_v3.js';

// Test SMS functionality
async function testSMS() {
    try {
        // Test phone number validation
        console.log('🧪 Testing phone number validation...');
        const testNumbers = [
            '09123456789',      // Valid local number
            '+639123456789',    // Valid international number
            '639123456789',     // Valid without +
            '1234567890',       // Invalid - no country code
        ];

        testNumbers.forEach(number => {
            console.log(`📱 ${number}: ${validatePhoneNumber(number) ? '✅ Valid' : '❌ Invalid'}`);
        });

        // Test SMS balance check
        console.log('\n💰 Checking SMS balance...');
        const balance = await checkSMSBalance();
        console.log('📊 Current balance:', balance);

        // Test SMS sending (uncomment to actually send SMS)
        /*
        console.log('\n📤 Testing SMS sending...');
        const result = await sendPickupSMS(
            '09123456789',  // Replace with actual test number
            'Test Customer',
            'Test Address, Manila'
        );
        console.log('✅ SMS sent successfully:', result);
        */

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    testSMS();
}

export { testSMS };
