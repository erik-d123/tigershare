// src/controllers/rideController.js
const db = require('../config/database');

const createRide = async (req, res) => {
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
};

const getRides = async (req, res) => {
    try {
        const { destination, date } = req.query;
        let query = `
            SELECT r.*, u.netid as creator_netid, u.full_name as creator_name,
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
};

const joinRide = async (req, res) => {
    try {
        const { ride_id } = req.params;
        const user_id = req.user.id;

        // Check if ride exists and has available seats
        const ride = await db.query(
            `SELECT * FROM rides WHERE id = $1 AND status = 'active'`,
            [ride_id]
        );

        if (ride.rows.length === 0) {
            return res.status(404).json({ message: 'Ride not found or inactive' });
        }

        const participants = await db.query(
            'SELECT COUNT(*) FROM ride_participants WHERE ride_id = $1',
            [ride_id]
        );

        if (participants.rows[0].count >= ride.rows[0].available_seats) {
            return res.status(400).json({ message: 'Ride is full' });
        }

        // Join the ride
        await db.query(
            'INSERT INTO ride_participants (ride_id, user_id) VALUES ($1, $2)',
            [ride_id, user_id]
        );

        res.json({ message: 'Successfully joined ride' });
    } catch (error) {
        console.error('Join ride error:', error);
        res.status(500).json({ message: 'Error joining ride' });
    }
};

module.exports = {
    createRide,
    getRides,
    joinRide
};