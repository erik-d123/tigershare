// backend/src/utils/emailService.js
const nodemailer = require('nodemailer');

// Create reusable transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD
    }
});

// Verify transporter on startup
transporter.verify(function (error, success) {
    if (error) {
        console.error('Email transporter error:', error);
    } else {
        console.log('Email server is ready');
    }
});

const sendRideRequestEmail = async (hostEmail, requesterName, destination, rideId, requesterId) => {
    try {
        console.log('Attempting to send ride request email:', {
            to: hostEmail,
            requester: requesterName,
            destination
        });

        const baseUrl = process.env.NODE_ENV === 'production'
            ? process.env.FRONTEND_URL
            : process.env.BACKEND_URL;

        const info = await transporter.sendMail({
            from: `"TigerShare" <${process.env.EMAIL_USER}>`,
            to: hostEmail,
            subject: 'TigerShare: New Ride Request',
            html: `
                <h2>New Ride Request</h2>
                <p>${requesterName} wants to join your ride to ${destination}.</p>
                <p>To approve or deny this request, click one of these links:</p>
                <p>
                    <a href="${baseUrl}/api/rides/${rideId}/approve/${requesterId}?noauth=true">Approve Request</a>
                    <br/><br/>
                    <a href="${baseUrl}/api/rides/${rideId}/deny/${requesterId}?noauth=true">Deny Request</a>
                </p>
            `
        });

        console.log('Email sent successfully:', info.messageId);
        return info;
    } catch (error) {
        console.error('Failed to send ride request email:', error);
        throw error;
    }
};

const sendRideConfirmationEmail = async (hostEmail, requesterEmail, destination) => {
    try {
        console.log('Sending confirmation emails for ride to:', destination);

        // Email to requester
        await transporter.sendMail({
            from: `"TigerShare" <${process.env.EMAIL_USER}>`,
            to: requesterEmail,
            subject: 'TigerShare: Ride Request Approved',
            html: `
                <h2>Ride Request Approved</h2>
                <p>Your request to join the ride to ${destination} has been approved!</p>
                <p>You can view the ride details in your profile.</p>
            `
        });

        // Email to host
        await transporter.sendMail({
            from: `"TigerShare" <${process.env.EMAIL_USER}>`,
            to: hostEmail,
            subject: 'TigerShare: Ride Member Confirmed',
            html: `
                <h2>New Ride Member Confirmed</h2>
                <p>A new member has been added to your ride to ${destination}.</p>
                <p>You can view the updated ride details in your profile.</p>
            `
        });

        console.log('Confirmation emails sent successfully');
    } catch (error) {
        console.error('Failed to send confirmation emails:', error);
        throw error;
    }
};

const sendRideDeniedEmail = async (requesterEmail, destination) => {
    try {
        console.log('Sending denial email for ride to:', destination);

        const info = await transporter.sendMail({
            from: `"TigerShare" <${process.env.EMAIL_USER}>`,
            to: requesterEmail,
            subject: 'TigerShare: Ride Request Update',
            html: `
                <h2>Ride Request Update</h2>
                <p>Your request to join the ride to ${destination} was not approved.</p>
                <p>You can find other available rides on the TigerShare platform.</p>
            `
        });

        console.log('Denial email sent successfully:', info.messageId);
        return info;
    } catch (error) {
        console.error('Failed to send denial email:', error);
        throw error;
    }
};

module.exports = {
    sendRideRequestEmail,
    sendRideConfirmationEmail,
    sendRideDeniedEmail
};