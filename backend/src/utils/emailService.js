// backend/src/utils/emailService.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'tigershare.noreply@gmail.com',
        pass: process.env.EMAIL_APP_PASSWORD
    }
});

const sendRideRequestEmail = async (hostEmail, requesterName, destination, rideId, requesterId) => {
    try {
        console.log('Sending ride request email to:', hostEmail);
        const info = await transporter.sendMail({
            from: '"TigerShare" <tigershare.noreply@gmail.com>',
            to: hostEmail,
            subject: 'TigerShare: New Ride Request',
            html: `
                <h2>New Ride Request</h2>
                <p>${requesterName} wants to join your ride to ${destination}.</p>
                <p>To approve or deny this request, click one of these links:</p>
                <p>
                    <a href="http://localhost:3001/api/rides/${rideId}/approve/${requesterId}">Approve Request</a>
                    <br/><br/>
                    <a href="http://localhost:3001/api/rides/${rideId}/deny/${requesterId}">Deny Request</a>
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

const sendRideApprovalEmail = async (requesterEmail, destination, hostName) => {
    try {
        const info = await transporter.sendMail({
            from: '"TigerShare" <tigershare.noreply@gmail.com>',
            to: requesterEmail,
            subject: 'TigerShare: Ride Request Approved',
            html: `
                <h2>Ride Request Approved!</h2>
                <p>Good news! ${hostName} has approved your request to join their ride to ${destination}.</p>
                <p>You can view the ride details in your profile on TigerShare.</p>
            `
        });
        console.log('Approval email sent:', info);
        return info;
    } catch (error) {
        console.error('Failed to send approval email:', error);
        throw error;
    }
};

const sendRideDenialEmail = async (requesterEmail, destination) => {
    try {
        const info = await transporter.sendMail({
            from: '"TigerShare" <tigershare.noreply@gmail.com>',
            to: requesterEmail,
            subject: 'TigerShare: Ride Request Update',
            html: `
                <h2>Ride Request Update</h2>
                <p>Your request to join the ride to ${destination} was not approved.</p>
                <p>You can find other available rides on TigerShare.</p>
            `
        });
        console.log('Denial email sent:', info);
        return info;
    } catch (error) {
        console.error('Failed to send denial email:', error);
        throw error;
    }
};

module.exports = {
    sendRideRequestEmail,
    sendRideApprovalEmail,
    sendRideDenialEmail
};