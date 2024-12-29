// src/routes/rideRoutes.js
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

        // Send email notifications (implement this later)

        res.json({ message: 'Successfully joined ride' });
    } catch (error) {
        console.error('Join ride error:', error);
        res.status(500).json({ message: 'Error joining ride' });
    }
});

module.exports = router;