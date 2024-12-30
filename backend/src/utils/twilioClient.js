// backend/src/utils/twilioClient.js
const isDevelopment = process.env.NODE_ENV !== 'production';

// Mock SMS function for development
const sendSMSDev = async (to, message) => {
    console.log('\n=== DEVELOPMENT SMS ===');
    console.log(`To: ${to}`);
    console.log(`Message: ${message}`);
    console.log('=====================\n');
    return { sid: 'MOCK_SID_' + Date.now() };
};

// Production SMS function using Twilio
const sendSMSProd = async (to, message) => {
    const twilio = require('twilio');
    const client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
    );

    try {
        const response = await client.messages.create({
            body: message,
            to: to,
            from: process.env.TWILIO_PHONE_NUMBER
        });
        console.log('SMS sent:', response.sid);
        return response;
    } catch (error) {
        console.error('Error sending SMS:', error);
        throw error;
    }
};

// Export the appropriate function based on environment
const sendSMS = isDevelopment ? sendSMSDev : sendSMSProd;

module.exports = {
    sendSMS
};