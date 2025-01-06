// backend/src/services/emailService.js
const nodemailer = require('nodemailer');

// Create transporter for Princeton SMTP
const transporter = nodemailer.createTransport({
    host: 'smtp.princeton.edu',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER, // Your Princeton NetID
        pass: process.env.EMAIL_PASSWORD // Your Princeton password
    }
});

const sendRideRequestEmail = async (hostEmail, requesterName, destination, rideId, requesterId) => {
    try {
        const baseUrl = process.env.NODE_ENV === 'production' 
            ? process.env.FRONTEND_URL 
            : 'http://localhost:3001';

        const info = await transporter.sendMail({
            from: '"TigerShare" <tigershare.noreply@gmail.com>',
            to: hostEmail,
            subject: 'TigerShare: New Ride Request',
            html: `
                <h2>New Ride Request</h2>
                <p>${requesterName} wants to join your ride to ${destination}.</p>
                <p>To approve or deny this request, click one of these links:</p>
                <p>
                    <a href="${baseUrl}/api/rides/${rideId}/approve/${requesterId}">Approve Request</a>
                    <br/><br/>
                    <a href="${baseUrl}/api/rides/${rideId}/deny/${requesterId}">Deny Request</a>
                </p>
            `
        });
        console.log('Email sent:', info);
        return info;
    } catch (error) {
        console.error('Failed to send email:', error);
        throw error;
    }
};

module.exports = {
    sendRideJoinNotification
};