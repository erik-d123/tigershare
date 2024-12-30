// backend/src/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Reset rides and participants
router.post('/reset-rides', async (req, res) => {
    try {
        // Delete all ride participants
        await db.query('DELETE FROM ride_participants');
        
        // Delete all rides
        await db.query('DELETE FROM rides');

        // Add sample rides back
        await db.query(`
            INSERT INTO rides (creator_id, destination, departure_time, available_seats, notes) 
            VALUES 
                (1, 'JFK Airport', '2024-12-30 10:00:00', 3, 'Terminal 4 departure'),
                (2, 'Newark Airport', '2024-12-31 14:00:00', 2, 'Direct to Terminal B')
        `);

        res.json({ message: 'Rides reset successfully' });
    } catch (error) {
        console.error('Reset rides error:', error);
        res.status(500).json({ message: 'Error resetting rides' });
    }
});

module.exports = router;