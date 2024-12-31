// backend/src/routes/userRoutes.js
const express = require('express');
const router = express.Router();
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

// Set user's full name
router.post('/set-name', authenticateToken, async (req, res) => {
    try {
        const { name } = req.body;
        
        if (!name.trim()) {
            return res.status(400).json({ message: 'Name cannot be empty' });
        }

        await db.query(
            'UPDATE users SET full_name = $1 WHERE id = $2',
            [name, req.user.id]
        );

        res.json({ message: 'Name updated successfully' });
    } catch (error) {
        console.error('Set name error:', error);
        res.status(500).json({ message: 'Error updating name' });
    }
});

// Check if user needs to set name (need to fix)
router.get('/needs-name', authenticateToken, async (req, res) => {
    try {
        const result = await db.query(
            'SELECT netid, full_name FROM users WHERE id = $1',
            [req.user.id]
        );

        const needsName = result.rows[0].full_name === result.rows[0].netid;
        res.json({ needsName });
    } catch (error) {
        console.error('Name check error:', error);
        res.status(500).json({ message: 'Error checking name status' });
    }
});

module.exports = router;