// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Princeton CAS Authentication endpoint
router.get('/cas/login', async (req, res) => {
    // Redirect to Princeton CAS login
    const casLoginUrl = 'https://fed.princeton.edu/cas/login';
    const serviceUrl = `${process.env.FRONTEND_URL}/auth/callback`;
    res.redirect(`${casLoginUrl}?service=${encodeURIComponent(serviceUrl)}`);
});

// Callback route for CAS authentication
router.get('/cas/callback', async (req, res) => {
    const ticket = req.query.ticket;
    if (!ticket) {
        return res.status(400).json({ message: 'No ticket provided' });
    }

    try {
        // Validate ticket with Princeton CAS
        const validateUrl = 'https://fed.princeton.edu/cas/serviceValidate';
        const serviceUrl = `${process.env.FRONTEND_URL}/auth/callback`;
        const response = await axios.get(`${validateUrl}?ticket=${ticket}&service=${encodeURIComponent(serviceUrl)}`);

        // Parse CAS XML response (you'll need an XML parser here)
        // For now, we'll simulate a successful response
        const netid = 'test123'; // This would come from the CAS response
        const email = `${netid}@princeton.edu`;

        // Find or create user
        let user = await db.query('SELECT * FROM users WHERE netid = $1', [netid]);
        
        if (user.rows.length === 0) {
            // Create new user
            user = await db.query(
                'INSERT INTO users (netid, email, full_name) VALUES ($1, $2, $3) RETURNING *',
                [netid, email, netid] // You'd get the full name from CAS
            );
        }

        // Generate JWT
        const token = jwt.sign(
            { id: user.rows[0].id, netid: user.rows[0].netid },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Redirect to frontend with token
        res.redirect(`${process.env.FRONTEND_URL}/auth/success?token=${token}`);
    } catch (error) {
        console.error('CAS Authentication error:', error);
        res.redirect(`${process.env.FRONTEND_URL}/auth/error`);
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