// backend/src/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Reset all rides
router.post('/reset-all-rides', async (req, res) => {
    try {
        // Start a transaction
        await db.query('BEGIN');

        try {
            // Delete all ride participants
            await db.query('DELETE FROM ride_participants');
            
            // Delete all ride requests
            await db.query('DELETE FROM ride_requests');
            
            // Delete all rides
            await db.query('DELETE FROM rides');

            // Commit the transaction
            await db.query('COMMIT');

            console.log('Successfully reset all rides and related data');
            res.json({ 
                message: 'Successfully reset all rides',
                details: {
                    timestamp: new Date(),
                    status: 'success'
                }
            });
        } catch (error) {
            // If there's an error, roll back the transaction
            await db.query('ROLLBACK');
            throw error;
        }
    } catch (error) {
        console.error('Reset rides error:', error);
        res.status(500).json({ 
            message: 'Error resetting rides',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Get rides statistics
router.get('/rides-stats', async (req, res) => {
    try {
        const stats = await db.query(`
            SELECT 
                COUNT(*) as total_rides,
                COUNT(DISTINCT creator_id) as unique_creators,
                (SELECT COUNT(*) FROM ride_participants) as total_participants
            FROM rides
        `);

        res.json(stats.rows[0]);
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ message: 'Error fetching statistics' });
    }
});

module.exports = router;