// backend/src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const axios = require('axios');
const xml2js = require('xml2js');
const db = require('../config/database');

// Simple login for testing
router.post('/simple-login', async (req, res) => {
    try {
        const { email, name } = req.body;
        
        if (!email || !email.trim()) {
            return res.status(400).json({ message: 'Email is required' });
        }

        if (!name || !name.trim()) {
            return res.status(400).json({ message: 'Name is required' });
        }

        // Generate a netid for the guest user
        const netid = `guest_${email.split('@')[0]}`;

        // Find or create user
        let user = await db.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        if (user.rows.length === 0) {
            // Create new user
            user = await db.query(
                'INSERT INTO users (netid, email, full_name) VALUES ($1, $2, $3) RETURNING *',
                [netid, email, name]
            );
            console.log('Created new user:', user.rows[0]);
        } else {
            // Update existing user's name
            user = await db.query(
                'UPDATE users SET full_name = $1 WHERE email = $2 RETURNING *',
                [name, email]
            );
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                id: user.rows[0].id,
                netid: user.rows[0].netid,
                email: user.rows[0].email
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: user.rows[0]
        });
    } catch (error) {
        console.error('Simple login error:', error);
        res.status(500).json({ message: 'Error during login process' });
    }
});

// Princeton CAS Authentication endpoint
router.get('/cas/login', (req, res) => {
    try {
        console.log('Initiating Princeton CAS login...');
        const casLoginUrl = `${process.env.CAS_URL}/login`;
        const serviceUrl = `${process.env.BACKEND_URL}/api/auth/cas/callback`;
        
        console.log('CAS Login URL:', casLoginUrl);
        console.log('Service URL:', serviceUrl);
        
        res.redirect(`${casLoginUrl}?service=${encodeURIComponent(serviceUrl)}`);
    } catch (error) {
        console.error('CAS login error:', error);
        res.redirect(`${process.env.FRONTEND_URL}/login?error=cas_init_failed`);
    }
});

// CAS callback handler
router.get('/cas/callback', async (req, res) => {
    console.log('CAS callback received');
    try {
        const ticket = req.query.ticket;
        if (!ticket) {
            console.error('No ticket provided in callback');
            return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_ticket`);
        }

        const serviceUrl = `${process.env.BACKEND_URL}/api/auth/cas/callback`;
        const validateUrl = `${process.env.CAS_URL}/serviceValidate`;
        const validationUrl = `${validateUrl}?ticket=${ticket}&service=${encodeURIComponent(serviceUrl)}`;

        console.log('Validating ticket...');

        const response = await axios.get(validationUrl);
        const parser = new xml2js.Parser({ explicitArray: false });
        const result = await parser.parseStringPromise(response.data);

        if (result['cas:serviceResponse']['cas:authenticationSuccess']) {
            const netid = result['cas:serviceResponse']['cas:authenticationSuccess']['cas:user'];
            const email = `${netid}@princeton.edu`;

            let user = await db.query('SELECT * FROM users WHERE netid = $1', [netid]);
            
            if (user.rows.length === 0) {
                user = await db.query(
                    'INSERT INTO users (netid, email, full_name) VALUES ($1, $2, $3) RETURNING *',
                    [netid, email, netid]
                );
            }

            const token = jwt.sign(
                { 
                    id: user.rows[0].id, 
                    netid: user.rows[0].netid,
                    email: user.rows[0].email
                },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.redirect(`${process.env.FRONTEND_URL}/auth/success?token=${token}`);
        } else {
            console.error('CAS authentication failed');
            res.redirect(`${process.env.FRONTEND_URL}/login?error=cas_auth_failed`);
        }
    } catch (error) {
        console.error('CAS callback error:', error);
        res.redirect(`${process.env.FRONTEND_URL}/login?error=server_error`);
    }
});

// Token verification endpoint
router.get('/verify', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const result = await db.query(
            'SELECT id, netid, email, full_name, created_at FROM users WHERE id = $1',
            [decoded.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ user: result.rows[0] });
    } catch (error) {
        console.error('Token verification error:', error);
        res.status(401).json({ message: 'Invalid token' });
    }
});

module.exports = router;