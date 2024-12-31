// backend/src/utils/emailUtils.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD // This should be an app-specific password
    }
});

const sendRideRequestEmail = async (hostEmail, requesterName, destination, rideId, requesterId) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: hostEmail,
        subject: 'TigerShare: New Ride Request',
        html: `
            <h2>New Ride Request</h2>
            <p>${requesterName} wants to join your ride to ${destination}.</p>
            <p>To approve or deny this request, click one of these links:</p>
            <p>
                <a href="http://localhost:3001/api/rides/${rideId}/approve/${requesterId}">Approve Request</a>
                <br/>
                <a href="http://localhost:3001/api/rides/${rideId}/deny/${requesterId}">Deny Request</a>
            </p>
        `
    };

    return transporter.sendMail(mailOptions);
};

const sendRideConfirmationEmail = async (hostEmail, requesterEmail, destination) => {
    // Email to requester
    const requesterMailOptions = {
        from: process.env.EMAIL_USER,
        to: requesterEmail,
        subject: 'TigerShare: Ride Request Approved',
        html: `
            <h2>Ride Request Approved</h2>
            <p>Your request to join the ride to ${destination} has been approved!</p>
            <p>You can view the ride details in your profile.</p>
        `
    };

    // Email to host
    const hostMailOptions = {
        from: process.env.EMAIL_USER,
        to: hostEmail,
        subject: 'TigerShare: Ride Member Confirmed',
        html: `
            <h2>New Ride Member Confirmed</h2>
            <p>A new member has been added to your ride to ${destination}.</p>
            <p>You can view the updated ride details in your profile.</p>
        `
    };

    await transporter.sendMail(requesterMailOptions);
    await transporter.sendMail(hostMailOptions);
};

const sendRideDeniedEmail = async (requesterEmail, destination) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: requesterEmail,
        subject: 'TigerShare: Ride Request Update',
        html: `
            <h2>Ride Request Update</h2>
            <p>Your request to join the ride to ${destination} was not approved.</p>
            <p>You can find other available rides on the TigerShare platform.</p>
        `
    };

    return transporter.sendMail(mailOptions);
};

module.exports = {
    sendRideRequestEmail,
    sendRideConfirmationEmail,
    sendRideDeniedEmail
};