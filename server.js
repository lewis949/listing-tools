const express = require('express');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Admin credentials (set these in Render environment variables or use defaults)
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'ILFDpurdeys!';

// Parse incoming JSON and form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure session management
app.use(session({
    secret: process.env.SESSION_SECRET || 'listing-tools-secret-key-12345',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, // Set to true if running behind HTTPS in production
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Serve static assets from 'public'
app.use(express.static(path.join(__dirname, 'public')));

// API: Check Admin Authentication Status
app.get('/api/admin/status', (req, res) => {
    res.json({ isAdmin: !!(req.session && req.session.isAdmin) });
});

// API: Admin Login
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        req.session.isAdmin = true;
        res.json({ success: true, message: 'Authenticated successfully' });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

// API: Admin Logout
app.post('/api/admin/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Could not log out' });
        }
        res.clearCookie('connect.sid');
        res.json({ success: true });
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Listing Tools web service running on port ${PORT}`);
});