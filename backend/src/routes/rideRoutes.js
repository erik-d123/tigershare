// backend/src/routes/rideRoutes.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { 
    sendRideRequestEmail, 
    sendRideApprovalEmail, 
    sendRideDenialEmail 
} = require('../utils/emailService');

// Authentication middleware
const authenticateToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(401).json({ message: 'Invalid token' });
    }
};

// Get all rides with filters
router.get('/', async (req, res) => {
    try {
        const { destination, date } = req.query;
        let query = `
            SELECT r.*, 
                   u.netid as creator_netid,
                   u.full_name as creator_name,
                   u.email as creator_email,
                   (SELECT COUNT(*) FROM ride_participants WHERE ride_id = r.id) as current_participants
            FROM rides r
            JOIN users u ON r.creator_id = u.id
            WHERE status = 'active'
            AND departure_time > NOW() - INTERVAL '1 hour'
        `;
        const queryParams = [];

        if (destination) {
            queryParams.push(`%${destination}%`);
            query += ` AND destination ILIKE $${queryParams.length}`;
        }

        if (date) {
            queryParams.push(date);
            query += ` AND DATE(departure_time) = $${queryParams.length}`;
        }

        query += ' ORDER BY departure_time ASC';

        const rides = await db.query(query, queryParams);
        res.json(rides.rows);
    } catch (error) {
        console.error('Get rides error:', error);
        res.status(500).json({ message: 'Error fetching rides' });
    }
});

// Rides created by user
router.get('/created-by/:userId', authenticateToken, async (req, res) => {
    try {
        console.log('Fetching created rides for user:', req.params.userId);
        const rides = await db.query(
            `SELECT r.*, 
                    (SELECT COUNT(*) FROM ride_participants WHERE ride_id = r.id) as current_participants
             FROM rides r
             WHERE r.creator_id = $1
             AND r.status = 'active'
             ORDER BY r.departure_time DESC`,
            [req.params.userId]
        );
        console.log('Found created rides:', rides.rows.length);
        res.json(rides.rows);
    } catch (error) {
        console.error('Get created rides error:', error);
        res.status(500).json({ message: 'Error fetching rides' });
    }
});

// Get rides joined by user
router.get('/joined-by/:userId', authenticateToken, async (req, res) => {
    try {
        const rides = await db.query(
            `SELECT r.*, 
                    u.netid as creator_netid,
                    u.full_name as creator_name,
                    (SELECT COUNT(*) FROM ride_participants WHERE ride_id = r.id) as current_participants
             FROM rides r
             JOIN users u ON r.creator_id = u.id
             JOIN ride_participants rp ON r.id = rp.ride_id
             WHERE rp.user_id = $1 AND r.status = 'active'
             ORDER BY r.departure_time DESC`,
            [req.params.userId]
        );
        res.json(rides.rows);
    } catch (error) {
        console.error('Get joined rides error:', error);
        res.status(500).json({ message: 'Error fetching rides' });
    }
});

// Get request status
router.get('/:rideId/request-status', authenticateToken, async (req, res) => {
    try {
        const result = await db.query(
            'SELECT status FROM ride_requests WHERE ride_id = $1 AND requester_id = $2',
            [req.params.rideId, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.json({ status: 'none' });
        }

        res.json({ status: result.rows[0].status });
    } catch (error) {
        console.error('Get request status error:', error);
        res.status(500).json({ message: 'Error getting request status' });
    }
});

// Request to join a ride
router.post('/:rideId/request', authenticateToken, async (req, res) => {
    try {
        const { rideId } = req.params;
        const requesterId = req.user.id;

        console.log('Processing join request:', { rideId, requesterId });

        // Get ride and participant info
        const rideInfo = await db.query(
            `SELECT r.*, 
                    u.email as host_email,
                    u.full_name as host_name,
                    r2.full_name as requester_name,
                    r2.email as requester_email
             FROM rides r
             JOIN users u ON r.creator_id = u.id
             JOIN users r2 ON r2.id = $1
             WHERE r.id = $2`,
            [requesterId, rideId]
        );

        console.log('Ride info:', rideInfo.rows[0]);

        if (rideInfo.rows.length === 0) {
            return res.status(404).json({ message: 'Ride not found' });
        }

        const ride = rideInfo.rows[0];

        // Check if already requested
        const existingRequest = await db.query(
            'SELECT * FROM ride_requests WHERE ride_id = $1 AND requester_id = $2',
            [rideId, requesterId]
        );

        if (existingRequest.rows.length > 0) {
            return res.status(400).json({ message: 'Already requested to join this ride' });
        }

        // Create request
        await db.query(
            'INSERT INTO ride_requests (ride_id, requester_id, status) VALUES ($1, $2, $3)',
            [rideId, requesterId, 'pending']
        );

        console.log('Attempting to send email to:', ride.host_email);

        // Send email notification
        try {
            await sendRideRequestEmail(
                ride.host_email,
                ride.requester_name,
                ride.destination,
                rideId,
                requesterId
            );
            console.log('Email sent successfully');
        } catch (emailError) {
            console.error('Email sending error:', emailError);
        }

        res.json({ message: 'Request sent successfully' });
    } catch (error) {
        console.error('Request error:', error);
        res.status(500).json({ message: 'Error sending request' });
    }
});

// Create a new ride
router.post('/create', authenticateToken, async (req, res) => {
    try {
        console.log('Creating new ride:', req.body);
        const { destination, departure_time, available_seats, total_fare, notes } = req.body;
        const creator_id = req.user.id;

        const result = await db.query(
            `INSERT INTO rides (creator_id, destination, departure_time, available_seats, total_fare, notes, status)
             VALUES ($1, $2, $3, $4, $5, $6, 'active')
             RETURNING *`,
            [creator_id, destination, departure_time, available_seats, total_fare, notes]
        );

        console.log('Ride created:', result.rows[0]);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Create ride error:', error);
        res.status(500).json({ message: 'Error creating ride' });
    }
});

// Approve join request
router.get('/:rideId/approve/:requesterId', async (req, res) => {
    try {
        const { rideId, requesterId } = req.params;
        console.log('Processing approval:', { rideId, requesterId });

        // Get ride and user info
        const rideInfo = await db.query(
            `SELECT r.destination, 
                    u.email as requester_email,
                    h.full_name as host_name
             FROM rides r
             JOIN users u ON u.id = $1
             JOIN users h ON h.id = r.creator_id
             WHERE r.id = $2`,
            [requesterId, rideId]
        );

        if (rideInfo.rows.length === 0) {
            return res.status(404).send('Ride not found');
        }

        // Update request status
        await db.query(
            'UPDATE ride_requests SET status = $1 WHERE ride_id = $2 AND requester_id = $3',
            ['approved', rideId, requesterId]
        );

        // Add to ride participants
        await db.query(
            'INSERT INTO ride_participants (ride_id, user_id) VALUES ($1, $2)',
            [rideId, requesterId]
        );

        // Send approval email
        try {
            await sendRideApprovalEmail(
                rideInfo.rows[0].requester_email,
                rideInfo.rows[0].destination,
                rideInfo.rows[0].host_name
            );
            console.log('Approval email sent');
        } catch (emailError) {
            console.error('Error sending approval email:', emailError);
        }

        res.send('Request approved successfully. You can close this window.');
    } catch (error) {
        console.error('Approval error:', error);
        res.status(500).send('Error processing approval');
    }
});

// Deny join request
router.get('/:rideId/deny/:requesterId', async (req, res) => {
    try {
        const { rideId, requesterId } = req.params;
        console.log('Processing denial:', { rideId, requesterId });

        // Get user email and ride info
        const requestInfo = await db.query(
            `SELECT r.destination, u.email as requester_email
             FROM rides r
             JOIN users u ON u.id = $1
             WHERE r.id = $2`,
            [requesterId, rideId]
        );

        // Update request status
        await db.query(
            'UPDATE ride_requests SET status = $1 WHERE ride_id = $2 AND requester_id = $3',
            ['denied', rideId, requesterId]
        );

        // Send denial email
        try {
            await sendRideDenialEmail(
                requestInfo.rows[0].requester_email,
                requestInfo.rows[0].destination
            );
            console.log('Denial email sent');
        } catch (emailError) {
            console.error('Error sending denial email:', emailError);
        }

        res.send('Request denied. You can close this window.');
    } catch (error) {
        console.error('Denial error:', error);
        res.status(500).send('Error processing denial');
    }
});

// Leave ride
router.post('/:rideId/leave', authenticateToken, async (req, res) => {
    try {
        const { rideId } = req.params;
        const user_id = req.user.id;

        // Begin a transaction
        await db.query('BEGIN');

        try {
            // Remove from ride_participants
            const result = await db.query(
                'DELETE FROM ride_participants WHERE ride_id = $1 AND user_id = $2',
                [rideId, user_id]
            );

            if (result.rowCount === 0) {
                await db.query('ROLLBACK');
                return res.status(400).json({ message: 'You are not in this ride' });
            }

            // Delete any existing ride requests
            await db.query(
                'DELETE FROM ride_requests WHERE ride_id = $1 AND requester_id = $2',
                [rideId, user_id]
            );

            // Commit the transaction
            await db.query('COMMIT');

            res.json({ message: 'Successfully left ride' });
        } catch (error) {
            await db.query('ROLLBACK');
            throw error;
        }
    } catch (error) {
        console.error('Leave ride error:', error);
        res.status(500).json({ message: 'Error leaving ride' });
    }
});


// Cancel a ride (only creator can cancel)
router.post('/:rideId/cancel', authenticateToken, async (req, res) => {
    try {
        const { rideId } = req.params;
        const user_id = req.user.id;

        // Check if user is ride creator
        const ride = await db.query(
            'SELECT * FROM rides WHERE id = $1 AND creator_id = $2',
            [rideId, user_id]
        );

        if (ride.rows.length === 0) {
            return res.status(403).json({ message: 'Not authorized to cancel this ride' });
        }

        // Update ride status to cancelled
        await db.query(
            "UPDATE rides SET status = 'cancelled' WHERE id = $1",
            [rideId]
        );

        // Get all participants' emails
        const participants = await db.query(
            `SELECT u.email, r.destination 
             FROM ride_participants rp
             JOIN users u ON rp.user_id = u.id
             JOIN rides r ON rp.ride_id = r.id
             WHERE rp.ride_id = $1`,
            [rideId]
        );

        // Send cancellation emails to all participants
        for (const participant of participants.rows) {
            // Send cancellation email to each participant
            // Implement email sending here
        }

        res.json({ message: 'Ride cancelled successfully' });
    } catch (error) {
        console.error('Cancel ride error:', error);
        res.status(500).json({ message: 'Error cancelling ride' });
    }
});


module.exports = router;