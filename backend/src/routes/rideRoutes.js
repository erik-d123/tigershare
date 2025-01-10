// backend/src/routes/rideRoutes.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { 
    sendRideRequestEmail, 
    sendRideConfirmationEmail, 
    sendRideDeniedEmail 
} = require('../services/emailService');

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
            AND departure_time > NOW()
            AND (SELECT COUNT(*) FROM ride_participants WHERE ride_id = r.id) < r.available_seats
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

// Get ride participants
router.get('/:rideId/participants', authenticateToken, async (req, res) => {
    try {
        const participants = await db.query(
            `SELECT u.netid, u.full_name, u.email
             FROM ride_participants rp
             JOIN users u ON rp.user_id = u.id
             WHERE rp.ride_id = $1
             ORDER BY rp.joined_at ASC`,
            [req.params.rideId]
        );
        
        res.json(participants.rows);
    } catch (error) {
        console.error('Get participants error:', error);
        res.status(500).json({ message: 'Error fetching participants' });
    }
});

// Get rides created by user
router.get('/created-by/:userId', authenticateToken, async (req, res) => {
    try {
        const rides = await db.query(
            `SELECT r.*, 
                    (SELECT COUNT(*) FROM ride_participants WHERE ride_id = r.id) as current_participants
             FROM rides r
             WHERE r.creator_id = $1
             AND r.status = 'active'
             ORDER BY r.departure_time DESC`,
            [req.params.userId]
        );
        res.json(rides.rows);
    } catch (error) {
        console.error('Get created rides error:', error);
        res.status(500).json({ message: 'Error fetching rides' });
    }
});

// Get rides joined by user (excluding rides created by user)
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
             WHERE rp.user_id = $1 
             AND r.creator_id != $1
             AND r.status = 'active'
             ORDER BY r.departure_time DESC`,
            [req.params.userId]
        );
        res.json(rides.rows);
    } catch (error) {
        console.error('Get joined rides error:', error);
        res.status(500).json({ message: 'Error fetching rides' });
    }
});

// Get pending requests for user's rides
router.get('/pending-requests', authenticateToken, async (req, res) => {
    try {
        const requests = await db.query(
            `SELECT rq.*, r.destination, r.departure_time,
                    u.netid as requester_netid, u.full_name as requester_name
             FROM ride_requests rq
             JOIN rides r ON rq.ride_id = r.id
             JOIN users u ON rq.requester_id = u.id
             WHERE r.creator_id = $1 
             AND rq.status = 'pending'
             AND r.status = 'active'
             ORDER BY rq.created_at DESC`,
            [req.user.id]
        );
        
        res.json(requests.rows);
    } catch (error) {
        console.error('Get pending requests error:', error);
        res.status(500).json({ message: 'Error fetching requests' });
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

        if (rideInfo.rows.length === 0) {
            return res.status(404).json({ message: 'Ride not found' });
        }

        const ride = rideInfo.rows[0];

        // Check for existing active request
        const existingRequest = await db.query(
            'SELECT * FROM ride_requests WHERE ride_id = $1 AND requester_id = $2 AND status = $3',
            [rideId, requesterId, 'pending']
        );

        if (existingRequest.rows.length > 0) {
            return res.status(400).json({ message: 'Already requested to join this ride' });
        }

        // Delete any previous denied requests
        await db.query(
            'DELETE FROM ride_requests WHERE ride_id = $1 AND requester_id = $2',
            [rideId, requesterId]
        );

        // Create new request
        await db.query(
            'INSERT INTO ride_requests (ride_id, requester_id, status) VALUES ($1, $2, $3)',
            [rideId, requesterId, 'pending']
        );

        // Send email notification
        try {
            await sendRideRequestEmail(
                ride.host_email,
                ride.requester_name,
                ride.destination,
                rideId,
                requesterId
            );
        } catch (emailError) {
            console.error('Email sending error:', emailError);
            // Continue even if email fails
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
        const { destination, departure_time, available_seats, total_fare, notes } = req.body;
        const creator_id = req.user.id;

        // Start a transaction
        await db.query('BEGIN');

        try {
            // Create the ride
            const result = await db.query(
                `INSERT INTO rides (creator_id, destination, departure_time, available_seats, total_fare, notes, status)
                 VALUES ($1, $2, $3, $4, $5, $6, 'active')
                 RETURNING *`,
                [creator_id, destination, departure_time, available_seats, total_fare, notes]
            );

            // Add creator as a participant
            await db.query(
                'INSERT INTO ride_participants (ride_id, user_id) VALUES ($1, $2)',
                [result.rows[0].id, creator_id]
            );

            // Commit transaction
            await db.query('COMMIT');

            console.log('Ride created:', result.rows[0]);
            res.status(201).json(result.rows[0]);
        } catch (error) {
            await db.query('ROLLBACK');
            throw error;
        }
    } catch (error) {
        console.error('Create ride error:', error);
        res.status(500).json({ message: 'Error creating ride' });
    }
});

// Leave ride
router.post('/:rideId/leave', authenticateToken, async (req, res) => {
    try {
        const { rideId } = req.params;
        const user_id = req.user.id;

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

// Approve ride request
router.get('/:rideId/approve/:requesterId', async (req, res) => {
    try {
        const { rideId, requesterId } = req.params;
        
        await db.query('BEGIN');

        try {
            // Get ride and request information
            const rideInfo = await db.query(
                `SELECT r.*, rq.requester_id, u.email as requester_email, 
                        u.full_name as requester_name, 
                        h.email as host_email
                 FROM rides r
                 JOIN ride_requests rq ON r.id = rq.ride_id
                 JOIN users u ON rq.requester_id = u.id
                 JOIN users h ON r.creator_id = h.id
                 WHERE r.id = $1 AND rq.requester_id = $2 AND rq.status = 'pending'`,
                [rideId, requesterId]
            );

            if (rideInfo.rows.length === 0) {
                await db.query('ROLLBACK');
                return res.status(404).send('Request not found or already processed');
            }

            const ride = rideInfo.rows[0];

            // Check if ride is full
            const participantCount = await db.query(
                'SELECT COUNT(*) FROM ride_participants WHERE ride_id = $1',
                [rideId]
            );

            if (participantCount.rows[0].count >= ride.available_seats) {
                await db.query('ROLLBACK');
                return res.status(400).send('Ride is full');
            }

            // Update request status
            await db.query(
                `UPDATE ride_requests 
                 SET status = 'approved', updated_at = CURRENT_TIMESTAMP 
                 WHERE ride_id = $1 AND requester_id = $2`,
                [rideId, requesterId]
            );

            // Add to ride participants
            await db.query(
                'INSERT INTO ride_participants (ride_id, user_id) VALUES ($1, $2)',
                [rideId, requesterId]
            );

            // Send confirmation emails
            await sendRideConfirmationEmail(
                ride.host_email,
                ride.requester_email,
                ride.destination
            );

            await db.query('COMMIT');
            res.send('Request approved successfully');
        } catch (error) {
            await db.query('ROLLBACK');
            throw error;
        }
    } catch (error) {
        console.error('Approve ride error:', error);
        res.status(500).send('Error processing request');
    }
});

// Deny ride request
router.get('/:rideId/deny/:requesterId', async (req, res) => {
    try {
        const { rideId, requesterId } = req.params;

        // Get ride and request information
        const rideInfo = await db.query(
            `SELECT r.*, u.email as requester_email
             FROM rides r
             JOIN ride_requests rq ON r.id = rq.ride_id
             JOIN users u ON rq.requester_id = u.id
             WHERE r.id = $1 AND rq.requester_id = $2 AND rq.status = 'pending'`,
            [rideId, requesterId]
        );

        if (rideInfo.rows.length === 0) {
            return res.status(404).send('Request not found or already processed');
        }

        // Update request status
        await db.query(
            `UPDATE ride_requests 
             SET status = 'denied', updated_at = CURRENT_TIMESTAMP 
             WHERE ride_id = $1 AND requester_id = $2`,
            [rideId, requesterId]
        );

        // Send denial email
        await sendRideDeniedEmail(
            rideInfo.rows[0].requester_email,
            rideInfo.rows[0].destination
        );

        res.send('Request denied successfully');
    } catch (error) {
        console.error('Deny ride error:', error);
        res.status(500).send('Error processing request');
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

        res.json({ message: 'Ride cancelled successfully' });
    } catch (error) {
        console.error('Cancel ride error:', error);
        res.status(500).json({ message: 'Error cancelling ride' });
    }
});

router.post('/:rideId/cancel-request', authenticateToken, async (req, res) => {
    try {
        const { rideId } = req.params;
        const userId = req.user.id;

        // Delete the request
        const result = await db.query(
            'DELETE FROM ride_requests WHERE ride_id = $1 AND requester_id = $2 AND status = $3',
            [rideId, userId, 'pending']
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Request not found or already processed' });
        }

        res.json({ message: 'Request cancelled successfully' });
    } catch (error) {
        console.error('Cancel request error:', error);
        res.status(500).json({ message: 'Error cancelling request' });
    }
});

module.exports = router;