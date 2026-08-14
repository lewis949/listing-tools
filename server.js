require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to Postgres Database
let pool;
if (process.env.DATABASE_URL) {
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
} else {
    console.error("CRITICAL ERROR: DATABASE_URL environment variable is missing!");
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: process.env.SESSION_SECRET || 'listing-tools-secret-key-12345',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// Initialize Database Tables
async function initDb() {
    if (!pool) return;
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS hex_codes (
                id SERIAL PRIMARY KEY,
                hex_code VARCHAR(7) UNIQUE NOT NULL,
                is_deleted BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS categories (
                id SERIAL PRIMARY KEY,
                product_type VARCHAR(255) UNIQUE NOT NULL,
                amazon VARCHAR(100),
                ebay VARCHAR(100),
                shein VARCHAR(100),
                debenhams VARCHAR(100),
                therange VARCHAR(100),
                tesco VARCHAR(100),
                bnq VARCHAR(100),
                is_deleted BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // FORCE FIX: Ensure the is_deleted column exists for older database instances
        try {
            await pool.query('ALTER TABLE categories ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;');
        } catch (e) { /* Ignore, column already exists */ }
        
        try {
            await pool.query('ALTER TABLE hex_codes ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;');
        } catch (e) { /* Ignore, column already exists */ }

        console.log('Database connected and initialized successfully!');
    } catch (err) {
        console.error('Error initializing database:', err);
    }
}
initDb();

/* ---------------------------------------------------
   HEX CODES API ENDPOINTS
--------------------------------------------------- */
app.get('/api/hexes', async (req, res) => {
    if (!pool) return res.status(500).json({ success: false, message: 'No DB Connection' });
    try {
        // Return ALL hexes so the frontend knows which defaults are deleted
        const result = await pool.query('SELECT hex_code, is_deleted FROM hex_codes');
        res.json({ success: true, hexes: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/hexes', async (req, res) => {
    if (!pool) return res.status(500).json({ success: false, message: 'No DB Connection' });
    const { hexCode } = req.body;
    try {
        await pool.query(
            'INSERT INTO hex_codes (hex_code, is_deleted) VALUES ($1, FALSE) ON CONFLICT (hex_code) DO UPDATE SET is_deleted = FALSE',
            [hexCode.toUpperCase()]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Changed to POST to avoid URL string formatting errors
app.post('/api/hexes/delete', async (req, res) => {
    if (!req.session || !req.session.isAdmin) return res.status(403).json({ success: false });
    const formattedHex = req.body.hex_code.toUpperCase();
    try {
        await pool.query(`
            INSERT INTO hex_codes (hex_code, is_deleted) VALUES ($1, TRUE)
            ON CONFLICT (hex_code) DO UPDATE SET is_deleted = TRUE
        `, [formattedHex]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/* ---------------------------------------------------
   CATEGORIES API ENDPOINTS
--------------------------------------------------- */
app.get('/api/categories', async (req, res) => {
    if (!pool) return res.status(500).json({ success: false, message: 'No DB Connection' });
    try {
        // Return ALL categories so frontend can filter
        const result = await pool.query('SELECT * FROM categories ORDER BY created_at ASC');
        res.json({ success: true, categories: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/categories', async (req, res) => {
    if (!pool) return res.status(500).json({ success: false, message: 'No DB Connection' });
    const { product_type, amazon, ebay, shein, debenhams, therange, tesco, bnq } = req.body;
    try {
        await pool.query(`
            INSERT INTO categories (product_type, amazon, ebay, shein, debenhams, therange, tesco, bnq, is_deleted)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, FALSE)
            ON CONFLICT (product_type) DO UPDATE SET
            amazon = $2, ebay = $3, shein = $4, debenhams = $5, therange = $6, tesco = $7, bnq = $8, is_deleted = FALSE
        `, [product_type, amazon, ebay, shein, debenhams, therange, tesco, bnq]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Changed to POST to prevent slashes/ampersands in names breaking the URL route
app.post('/api/categories/delete', async (req, res) => {
    if (!req.session || !req.session.isAdmin) return res.status(403).json({ success: false });
    try {
        await pool.query(`
            INSERT INTO categories (product_type, is_deleted) VALUES ($1, TRUE)
            ON CONFLICT (product_type) DO UPDATE SET is_deleted = TRUE
        `, [req.body.product_type]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/* ---------------------------------------------------
   ADMIN AUTH ENDPOINTS
--------------------------------------------------- */
app.get('/api/admin/status', (req, res) => {
    res.json({ isAdmin: !!(req.session && req.session.isAdmin) });
});

app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
    
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        req.session.isAdmin = true;
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

app.post('/api/admin/logout', (req, res) => {
    req.session.destroy(() => res.json({ success: true }));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));