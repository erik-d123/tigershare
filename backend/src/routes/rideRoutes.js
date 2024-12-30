// backend/src/routes/rideRoutes.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { sendSMS } = require('../utils/twilioClient');

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
                   u.phone_number as creator_phone,
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

// Create a new ride
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { destination, departure_time, available_seats, total_fare, notes } = req.body;
        const creator_id = req.user.id;

        const result = await db.query(
            `INSERT INTO rides (creator_id, destination, departure_time, available_seats, total_fare, notes, status)
             VALUES ($1, $2, $3, $4, $5, $6, 'active')
             RETURNING *`,
            [creator_id, destination, departure_time, available_seats, total_fare, notes]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Create ride error:', error);
        res.status(500).json({ message: 'Error creating ride' });
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
                    u.phone_number as host_phone, 
                    u.full_name as host_name,
                    r2.full_name as requester_name,
                    r2.phone_number as requester_phone
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

        // Send SMS to host
        if (ride.host_phone) {
            await sendSMS(
                ride.host_phone,
                `${ride.requester_name} wants to join your ride to ${ride.destination}. ` +
                `Reply ACCEPT${rideId}-${requesterId} to approve or DENY${rideId}-${requesterId} to reject.`
            );
        }

        res.json({ message: 'Request sent to ride host' });
    } catch (error) {
        console.error('Request error:', error);
        res.status(500).json({ message: 'Error sending request' });
    }
});

// Handle SMS webhook for ride responses
router.post('/sms-webhook', async (req, res) => {
    try {
        const { Body, From } = req.body;
        const match = Body.trim().match(/^(ACCEPT|DENY)(\d+)-(\d+)$/i);
        
        if (!match) {
            return res.status(400).json({ message: 'Invalid response format' });
        }

        const [, action, rideId, requesterId] = match;
        const isApproved = action.toUpperCase() === 'ACCEPT';

        if (isApproved) {
            // Add to participants
            await db.query(
                'INSERT INTO ride_participants (ride_id, user_id) VALUES ($1, $2)',
                [rideId, requesterId]
            );

            // Send confirmation to requester
            const rideInfo = await db.query(
                `SELECT r.destination, u.phone_number as requester_phone, h.phone_number as host_phone
                 FROM rides r
                 JOIN users u ON u.id = $1
                 JOIN users h ON h.id = r.creator_id
                 WHERE r.id = $2`,
                [requesterId, rideId]
            );

            if (rideInfo.rows[0].requester_phone) {
                await sendSMS(
                    rideInfo.rows[0].requester_phone,
                    `Your ride request to ${rideInfo.rows[0].destination} was approved! ` +
                    `Contact your ride host at: ${rideInfo.rows[0].host_phone}`
                );
            }
        }

        // Update request status
        await db.query(
            'UPDATE ride_requests SET status = $1 WHERE ride_id = $2 AND requester_id = $3',
            [isApproved ? 'approved' : 'rejected', rideId, requesterId]
        );

        res.sendStatus(200);
    } catch (error) {
        console.error('SMS webhook error:', error);
        res.status(500).json({ message: 'Error processing response' });
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
             ORDER BY r.departure_time DESC`,
            [req.params.userId]
        );
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

module.exports = router;