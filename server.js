require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to Neon Postgres Database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

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
    if (!process.env.DATABASE_URL) {
        console.warn("WARNING: No DATABASE_URL found. Database will not connect.");
        return;
    }
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
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Neon database initialized successfully!');
    } catch (err) {
        console.error('Error initializing database:', err);
    }
}
initDb();

/* ---------------------------------------------------
   HEX CODES API ENDPOINTS
--------------------------------------------------- */
app.get('/api/hexes', async (req, res) => {
    try {
        const result = await pool.query('SELECT hex_code FROM hex_codes WHERE is_deleted = FALSE ORDER BY created_at ASC');
        res.json({ success: true, hexes: result.rows.map(r => r.hex_code) });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch hexes' });
    }
});

app.post('/api/hexes', async (req, res) => {
    const { hexCode } = req.body;
    try {
        await pool.query(
            'INSERT INTO hex_codes (hex_code, is_deleted) VALUES ($1, FALSE) ON CONFLICT (hex_code) DO UPDATE SET is_deleted = FALSE',
            [hexCode.toUpperCase()]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

app.delete('/api/hexes/:hex', async (req, res) => {
    if (!req.session || !req.session.isAdmin) return res.status(403).json({ success: false });
    const formattedHex = '#' + req.params.hex.toUpperCase();
    try {
        await pool.query('UPDATE hex_codes SET is_deleted = TRUE WHERE hex_code = $1', [formattedHex]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

/* ---------------------------------------------------
   CATEGORIES API ENDPOINTS
--------------------------------------------------- */
app.get('/api/categories', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM categories ORDER BY created_at ASC');
        res.json({ success: true, categories: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Database query failed' });
    }
});

app.post('/api/categories', async (req, res) => {
    const { product_type, amazon, ebay, shein, debenhams, therange, tesco, bnq } = req.body;
    try {
        await pool.query(`
            INSERT INTO categories (product_type, amazon, ebay, shein, debenhams, therange, tesco, bnq)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (product_type) DO UPDATE SET
            amazon = $2, ebay = $3, shein = $4, debenhams = $5, therange = $6, tesco = $7, bnq = $8
        `, [product_type, amazon, ebay, shein, debenhams, therange, tesco, bnq]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

app.delete('/api/categories/:id', async (req, res) => {
    if (!req.session || !req.session.isAdmin) return res.status(403).json({ success: false });
    try {
        await pool.query('DELETE FROM categories WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false });
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