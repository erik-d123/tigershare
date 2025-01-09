// backend/src/utils/emailService.js
const sendRideRequestEmail = async (hostEmail, requesterName, destination, rideId, requesterId) => {
    try {
        // Use environment-based URL
        const baseUrl = process.env.NODE_ENV === 'production'
            ? process.env.FRONTEND_URL
            : 'http://localhost:3001';

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
                    <a href="${baseUrl}/api/rides/${rideId}/approve/${requesterId}?noauth=true">Approve Request</a>
                    <br/><br/>
                    <a href="${baseUrl}/api/rides/${rideId}/deny/${requesterId}?noauth=true">Deny Request</a>
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