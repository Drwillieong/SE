import fetch from 'node-fetch';

// Function to send SMS using philsms API v3
export const sendPickupSMS = async (phoneNumber, customerName, address) => {
    console.log('📱 Attempting to send pickup SMS to:', phoneNumber);

    // Check if philsms credentials are configured
    if (!process.env.PHILSMS_API_TOKEN) {
        throw new Error('SMS service not configured. Please set PHILSMS_API_TOKEN environment variable.');
    }

    // Format phone number (ensure it starts with country code)
    let formattedNumber = phoneNumber;
    if (!formattedNumber.startsWith('+63') && !formattedNumber.startsWith('63')) {
        // If it doesn't start with +63 or 63, assume it's a local number and add 63
        if (formattedNumber.startsWith('0')) {
            formattedNumber = '63' + formattedNumber.substring(1);
        } else if (!formattedNumber.startsWith('+')) {
            formattedNumber = '63' + formattedNumber;
        }
    }

    // Remove any non-digit characters except +
    formattedNumber = formattedNumber.replace(/[^\d+]/g, '');

    console.log('📱 Formatted phone number:', formattedNumber);

    // Create SMS message - Updated to match email format
    const message = `🚗 Pickup Ready! Dear ${customerName}, Great news! The rider is ready to go to your home for pickup. Address: ${address}. Please be ready for the rider's arrival. Thank you for choosing Wash It Izzy!`;

    // philsms API v3 endpoint
    const apiUrl = 'https://app.philsms.com/api/v3/sms/send';

    // Prepare request body
    const requestBody = {
        recipient: formattedNumber,
        message: message,
        sender_id: process.env.PHILSMS_SENDER_ID || 'WashItIzzy' // Optional: can be set in env
    };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${process.env.PHILSMS_API_TOKEN}`
            },
            body: JSON.stringify(requestBody)
        });

        const responseData = await response.json();
        console.log('📱 philsms API response:', responseData);

        // Check if the request was successful
        if (response.ok && responseData.success) {
            console.log('✅ SMS sent successfully to:', formattedNumber);
            return {
                success: true,
                messageId: responseData.data?.message_id || responseData.data?.id || Date.now().toString(),
                credits_used: responseData.data?.credits_used || 1,
                status: responseData.data?.status || 'sent'
            };
        } else {
            // Handle API errors
            const errorMessage = responseData.message || responseData.error || 'Unknown error occurred';
            console.error('❌ SMS sending failed:', errorMessage);

            // Map common philsms errors
            if (errorMessage.includes('Invalid token') || errorMessage.includes('Unauthorized')) {
                throw new Error('Invalid API token - please check your PHILSMS_API_TOKEN');
            } else if (errorMessage.includes('Insufficient credits') || errorMessage.includes('balance')) {
                throw new Error('Insufficient SMS credits - please top up your account');
            } else if (errorMessage.includes('Invalid recipient') || errorMessage.includes('phone')) {
                throw new Error('Invalid phone number format');
            } else if (errorMessage.includes('Message is empty') || errorMessage.includes('message')) {
                throw new Error('Message content is empty');
            } else {
                throw new Error(`SMS sending failed: ${errorMessage}`);
            }
        }
    } catch (error) {
        console.error('❌ Error sending SMS:', error.message);
        throw error;
    }
};

// Function to validate phone number format
export const validatePhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return false;

    // Remove all non-digit characters except +
    const cleanNumber = phoneNumber.replace(/[^\d+]/g, '');

    // Check if it starts with +63 or 63 and has correct length
    if (cleanNumber.startsWith('+63')) {
        return cleanNumber.length === 13; // +63 + 10 digits
    } else if (cleanNumber.startsWith('63')) {
        return cleanNumber.length === 12; // 63 + 10 digits
    } else if (cleanNumber.startsWith('0')) {
        return cleanNumber.length === 11; // 0 + 10 digits (local format)
    }

    return false;
};

// Function to check SMS balance
export const checkSMSBalance = async () => {
    console.log('📱 Checking SMS balance...');

    if (!process.env.PHILSMS_API_TOKEN) {
        throw new Error('SMS service not configured. Please set PHILSMS_API_TOKEN environment variable.');
    }

    const apiUrl = 'https://app.philsms.com/api/v3/account/balance';

    try {
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${process.env.PHILSMS_API_TOKEN}`
            }
        });

        const responseData = await response.json();
        console.log('📱 Balance check response:', responseData);

        if (response.ok && responseData.success) {
            return {
                balance: responseData.data?.balance || 0,
                credits: responseData.data?.credits || 0,
                currency: responseData.data?.currency || 'PHP'
            };
        } else {
            throw new Error(responseData.message || 'Failed to check balance');
        }
    } catch (error) {
        console.error('❌ Error checking SMS balance:', error.message);
        throw error;
    }
};

// Function to get SMS history (optional utility)
export const getSMSHistory = async (limit = 10) => {
    console.log('📱 Getting SMS history...');

    if (!process.env.PHILSMS_API_TOKEN) {
        throw new Error('SMS service not configured. Please set PHILSMS_API_TOKEN environment variable.');
    }

    const apiUrl = `https://app.philsms.com/api/v3/sms/history?limit=${limit}`;

    try {
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${process.env.PHILSMS_API_TOKEN}`
            }
        });

        const responseData = await response.json();
        console.log('📱 SMS history response:', responseData);

        if (response.ok && responseData.success) {
            return {
                messages: responseData.data || [],
                total: responseData.total || 0
            };
        } else {
            throw new Error(responseData.message || 'Failed to get SMS history');
        }
    } catch (error) {
        console.error('❌ Error getting SMS history:', error.message);
        throw error;
    }
};
