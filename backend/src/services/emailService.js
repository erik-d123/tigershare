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

const sendRideJoinNotification = async (ride, joiningUser, creatorUser) => {
    try {
        // Email to ride creator
        await transporter.sendMail({
            from: `"TigerShare" <${process.env.EMAIL_USER}@princeton.edu>`,
            to: `${creatorUser.netid}@princeton.edu`,
            subject: 'Someone joined your ride!',
            html: `
                <h2>New Ride Participant</h2>
                <p>${joiningUser.full_name} (${joiningUser.netid}) has joined your ride to ${ride.destination}.</p>
                <p><strong>Departure:</strong> ${new Date(ride.departure_time).toLocaleString()}</p>
                <p>Contact them at: ${joiningUser.netid}@princeton.edu</p>
            `
        });

        // Email to person who joined
        await transporter.sendMail({
            from: `"TigerShare" <${process.env.EMAIL_USER}@princeton.edu>`,
            to: `${joiningUser.netid}@princeton.edu`,
            subject: 'Ride Confirmation',
            html: `
                <h2>Ride Confirmation</h2>
                <p>You've successfully joined a ride to ${ride.destination}.</p>
                <p><strong>Departure:</strong> ${new Date(ride.departure_time).toLocaleString()}</p>
                <p>Ride posted by: ${creatorUser.full_name} (${creatorUser.netid})</p>
                <p>Contact them at: ${creatorUser.netid}@princeton.edu</p>
            `
        });
    } catch (error) {
        console.error('Email notification error:', error);
    }
};

module.exports = {
    sendRideJoinNotification
};