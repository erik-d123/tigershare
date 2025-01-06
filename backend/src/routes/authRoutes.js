// backend/src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const axios = require('axios');
const xml2js = require('xml2js');
const db = require('../config/database');

// Princeton CAS Authentication endpoint
router.get('/cas/login', (req, res) => {
    try {
        console.log('Initiating Princeton CAS login...');
        const casLoginUrl = `${process.env.CAS_URL}/login`;
        const serviceUrl = `${process.env.BACKEND_URL}/api/auth/cas/callback`;
        
        // Log the URLs for debugging
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

        // Validate ticket with Princeton CAS
        const serviceUrl = `${process.env.BACKEND_URL}/api/auth/cas/callback`;
        const validateUrl = `${process.env.CAS_URL}/serviceValidate`;
        const validationUrl = `${validateUrl}?ticket=${ticket}&service=${encodeURIComponent(serviceUrl)}`;

        console.log('Validating ticket...');
        console.log('Validation URL:', validationUrl);

        const response = await axios.get(validationUrl);
        console.log('Received CAS validation response');

        // Parse XML response
        const parser = new xml2js.Parser({ explicitArray: false });
        const result = await parser.parseStringPromise(response.data);
        console.log('Parsed CAS response:', JSON.stringify(result, null, 2));

        if (result['cas:serviceResponse']['cas:authenticationSuccess']) {
            const netid = result['cas:serviceResponse']['cas:authenticationSuccess']['cas:user'];
            const email = `${netid}@princeton.edu`;
            console.log('Authenticated netid:', netid);

            // Find or create user
            let user = await db.query('SELECT * FROM users WHERE netid = $1', [netid]);
            
            if (user.rows.length === 0) {
                console.log('Creating new user for:', netid);
                user = await db.query(
                    'INSERT INTO users (netid, email, full_name) VALUES ($1, $2, $3) RETURNING *',
                    [netid, email, netid]
                );
            }

            // Generate JWT
            const token = jwt.sign(
                { 
                    id: user.rows[0].id, 
                    netid: user.rows[0].netid,
                    email: user.rows[0].email
                },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            console.log('Authentication successful, redirecting to frontend');
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

router.post('/test-login', async (req, res) => {
    try {
        console.log('Test login request received');
        console.log('Environment:', process.env.NODE_ENV);
        console.log('ALLOW_TEST_LOGIN:', process.env.ALLOW_TEST_LOGIN);

        let user = await db.query('SELECT * FROM users WHERE netid = $1', ['test123']);
        console.log('Existing user query result:', user.rows);
        
        if (user.rows.length === 0) {
            console.log('Creating new test user...');
            user = await db.query(
                'INSERT INTO users (netid, email, full_name) VALUES ($1, $2, $3) RETURNING *',
                ['test123', 'test123@princeton.edu', 'Test User']
            );
            console.log('New user created:', user.rows[0]);
        }

        const token = jwt.sign(
            { id: user.rows[0].id, netid: user.rows[0].netid },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        console.log('Token generated successfully');
        res.json({ token, user: user.rows[0] });
    } catch (error) {
        console.error('Test login error:', error);
        res.status(500).json({ 
            message: 'Error during login process',
            details: error.message 
        });
    }
});

// Verify token endpoint
router.get('/verify', async (req, res) => {
    try {
        console.log('Verifying token...');
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            console.log('No token provided');
            return res.status(401).json({ message: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        console.log('Token received:', token);
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Token decoded:', decoded);
        
        const user = await db.query(
            'SELECT id, netid, email, full_name FROM users WHERE id = $1',
            [decoded.id]
        );
        console.log('User found:', user.rows[0]);

        if (user.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ user: user.rows[0] });
    } catch (error) {
        console.error('Token verification error:', error);
        res.status(401).json({ message: 'Invalid token' });
    }
});

module.exports = router;