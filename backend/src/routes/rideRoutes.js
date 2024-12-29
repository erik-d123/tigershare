// backend/src/routes/rideRoutes.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../config/database');

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
                   (SELECT COUNT(*) FROM ride_participants WHERE ride_id = r.id) as current_participants
            FROM rides r
            JOIN users u ON r.creator_id = u.id
            WHERE status = 'active'
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

// Get a specific ride by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const ride = await db.query(
            `SELECT r.*, 
                    u.netid as creator_netid,
                    u.full_name as creator_name,
                    (SELECT COUNT(*) FROM ride_participants WHERE ride_id = r.id) as current_participants
             FROM rides r
             JOIN users u ON r.creator_id = u.id
             WHERE r.id = $1`,
            [id]
        );

        if (ride.rows.length === 0) {
            return res.status(404).json({ message: 'Ride not found' });
        }

        res.json(ride.rows[0]);
    } catch (error) {
        console.error('Get ride error:', error);
        res.status(500).json({ message: 'Error fetching ride' });
    }
});

// Create a new ride
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { destination, departure_time, available_seats, notes } = req.body;
        const creator_id = req.user.id;

        const result = await db.query(
            `INSERT INTO rides (creator_id, destination, departure_time, available_seats, notes)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [creator_id, destination, departure_time, available_seats, notes]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Create ride error:', error);
        res.status(500).json({ message: 'Error creating ride' });
    }
});

// Join a ride
router.post('/:rideId/join', authenticateToken, async (req, res) => {
    try {
        const { rideId } = req.params;
        const user_id = req.user.id;

        // Check if ride exists and has available seats
        const ride = await db.query(
            `SELECT r.*, 
                    (SELECT COUNT(*) FROM ride_participants WHERE ride_id = r.id) as current_participants
             FROM rides r
             WHERE r.id = $1 AND r.status = 'active'`,
            [rideId]
        );

        if (ride.rows.length === 0) {
            return res.status(404).json({ message: 'Ride not found or inactive' });
        }

        if (ride.rows[0].current_participants >= ride.rows[0].available_seats) {
            return res.status(400).json({ message: 'Ride is full' });
        }

        // Check if user is already in the ride
        const existingParticipant = await db.query(
            'SELECT * FROM ride_participants WHERE ride_id = $1 AND user_id = $2',
            [rideId, user_id]
        );

        if (existingParticipant.rows.length > 0) {
            return res.status(400).json({ message: 'You are already in this ride' });
        }

        // Join the ride
        await db.query(
            'INSERT INTO ride_participants (ride_id, user_id) VALUES ($1, $2)',
            [rideId, user_id]
        );

        res.json({ message: 'Successfully joined ride' });
    } catch (error) {
        console.error('Join ride error:', error);
        res.status(500).json({ message: 'Error joining ride' });
    }
});

// Leave a ride
router.post('/:rideId/leave', authenticateToken, async (req, res) => {
    try {
        const { rideId } = req.params;
        const user_id = req.user.id;

        const result = await db.query(
            'DELETE FROM ride_participants WHERE ride_id = $1 AND user_id = $2',
            [rideId, user_id]
        );

        if (result.rowCount === 0) {
            return res.status(400).json({ message: 'You are not in this ride' });
        }

        res.json({ message: 'Successfully left ride' });
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

        // Check if user is the creator
        const ride = await db.query(
            'SELECT * FROM rides WHERE id = $1 AND creator_id = $2',
            [rideId, user_id]
        );

        if (ride.rows.length === 0) {
            return res.status(403).json({ message: 'Not authorized to cancel this ride' });
        }

        // Cancel the ride
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

module.exports = router;