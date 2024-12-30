// backend/src/utils/emailUtils.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD
    }
});

const sendRideJoinNotification = async (ride, joiningUserId) => {
    try {
        // Get user details
        const joiningUser = await db.query(
            'SELECT * FROM users WHERE id = $1',
            [joiningUserId]
        );

        const rideCreator = await db.query(
            'SELECT * FROM users WHERE id = $1',
            [ride.creator_id]
        );

        // Send email to ride creator
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: rideCreator.rows[0].email,
            subject: 'Someone joined your ride!',
            html: `
                <h2>New Ride Participant</h2>
                <p>${joiningUser.rows[0].full_name} (${joiningUser.rows[0].netid}) has joined your ride to ${ride.destination}.</p>
                <p><strong>Departure:</strong> ${new Date(ride.departure_time).toLocaleString()}</p>
                <p>You can contact them at: ${joiningUser.rows[0].email}</p>
            `
        });

        // Send confirmation email to joining user
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: joiningUser.rows[0].email,
            subject: 'You joined a ride!',
            html: `
                <h2>Ride Confirmation</h2>
                <p>You have successfully joined a ride to ${ride.destination}.</p>
                <p><strong>Departure:</strong> ${new Date(ride.departure_time).toLocaleString()}</p>
                <p>Ride posted by: ${rideCreator.rows[0].full_name} (${rideCreator.rows[0].netid})</p>
                <p>You can contact them at: ${rideCreator.rows[0].email}</p>
            `
        });
    } catch (error) {
        console.error('Email notification error:', error);
        // Don't throw the error - we don't want to break the ride joining process
    }
};

module.exports = {
    sendRideJoinNotification
};