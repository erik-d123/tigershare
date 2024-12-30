// backend/src/routes/userRoutes.js
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

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const user = await db.query(
            'SELECT id, netid, email, full_name, phone_number, created_at FROM users WHERE id = $1',
            [req.user.id]
        );

        if (user.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user.rows[0]);
    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({ message: 'Error fetching profile' });
    }
});

// Update phone number
router.post('/update-phone', authenticateToken, async (req, res) => {
    try {
        const { phoneNumber } = req.body;
        
        // Basic phone number validation
        const phoneRegex = /^\+?1?\d{10,15}$/;
        if (!phoneRegex.test(phoneNumber.replace(/[\s-()]/g, ''))) {
            return res.status(400).json({ message: 'Invalid phone number format' });
        }

        // Update phone number
        await db.query(
            'UPDATE users SET phone_number = $1 WHERE id = $2',
            [phoneNumber, req.user.id]
        );

        // Send verification SMS
        try {
            await sendSMS(
                phoneNumber,
                'Welcome to TigerShare! Your phone number has been successfully registered.'
            );
        } catch (smsError) {
            console.error('SMS sending failed:', smsError);
            // Don't fail the request if SMS fails
        }

        res.json({ message: 'Phone number updated successfully' });
    } catch (error) {
        console.error('Update phone error:', error);
        res.status(500).json({ message: 'Error updating phone number' });
    }
});

module.exports = router;