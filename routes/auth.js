const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.get('/login', (req, res) => {
    // Redirect to admin if already logged in
    if (req.session.user && req.session.user.isAdmin) {
        return res.redirect('/admin');
    }
    res.render('login');
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (user && user.password === password) {
            req.session.user = {
                id: user._id,
                email: user.email,
                isAdmin: user.isAdmin
            };
            // Set cookie maxAge to 30 days
            req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000;
            res.redirect('/admin');
        } else {
            res.render('login', { error: 'Invalid credentials' });
        }
    } catch (error) {
        res.render('login', { error: 'An error occurred' });
    }
});

router.get('/logout', (req, res) => {
    // Destroy the session
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
        }
        // Redirect to home page after logout
        res.redirect('/');
    });
});

module.exports = router; 