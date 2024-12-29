// src/controllers/userController.js
const db = require('../config/database');
const jwt = require('jsonwebtoken');

const loginUser = async (req, res) => {
    try {
        const { netid, email, full_name } = req.body;
        
        // Check if user exists
        let user = await db.query(
            'SELECT * FROM users WHERE netid = $1',
            [netid]
        );

        if (user.rows.length === 0) {
            // Create new user
            user = await db.query(
                'INSERT INTO users (netid, email, full_name) VALUES ($1, $2, $3) RETURNING *',
                [netid, email, full_name]
            );
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                id: user.rows[0].id,
                netid: user.rows[0].netid 
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: user.rows[0]
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Error during login process' });
    }
};

const getUserProfile = async (req, res) => {
    try {
        const user = await db.query(
            'SELECT id, netid, email, full_name, created_at FROM users WHERE id = $1',
            [req.user.id]
        );

        if (user.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user.rows[0]);
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Error fetching user profile' });
    }
};

module.exports = {
    loginUser,
    getUserProfile
};