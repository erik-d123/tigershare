// backend/src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const axios = require('axios');
const db = require('../config/database');

// Test login endpoint (for development)
router.post('/test-login', async (req, res) => {
    try {
        // Create or find test user
        let user = await db.query('SELECT * FROM users WHERE netid = $1', ['test123']);
        
        if (user.rows.length === 0) {
            user = await db.query(
                'INSERT INTO users (netid, email, full_name) VALUES ($1, $2, $3) RETURNING *',
                ['test123', 'test123@princeton.edu', 'Test User']
            );
        }

        // Generate JWT
        const token = jwt.sign(
            { id: user.rows[0].id, netid: user.rows[0].netid },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ token, user: user.rows[0] });
    } catch (error) {
        console.error('Test login error:', error);
        res.status(500).json({ message: 'Error during login process' });
    }
});

// Verify token and get user info
router.get('/verify', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const user = await db.query(
            'SELECT id, netid, email, full_name FROM users WHERE id = $1',
            [decoded.id]
        );

        if (user.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ user: user.rows[0] });
    } catch (error) {
        console.error('Token verification error:', error);
        res.status(401).json({ message: 'Invalid token' });
    }
});

// Get current user profile
router.get('/profile', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await db.query(
            'SELECT id, netid, email, full_name, created_at FROM users WHERE id = $1',
            [decoded.id]
        );

        if (user.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user.rows[0]);
    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(401).json({ message: 'Invalid token' });
    }
});

module.exports = router;