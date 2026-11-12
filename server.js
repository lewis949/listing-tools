require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const { Pool } = require('pg');

const app = express();
app.set('trust proxy', 1); // Render sits behind a proxy - needed for correct client IPs
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

/* ---------------------------------------------------
   CHEWBOT (OneSila help assistant)
   Set ONE of these env vars in Render (checked in this order):
     GROQ_API_KEY   - free tier, no card needed (console.groq.com)
     GEMINI_API_KEY - free tier (aistudio.google.com)
     OPENAI_API_KEY - paid
   Optional: CHEWBOT_MODEL to override the default model.
   Knowledge: any .md / .txt files in the /knowledge folder
--------------------------------------------------- */
const CHEWBOT_MOODS = ['happy', 'laughing', 'thinking', 'sad', 'angry', 'surprised', 'confused', 'neutral'];
const CHEWBOT_PROVIDERS = [
    { name: 'Groq', key: 'GROQ_API_KEY', url: 'https://api.groq.com/openai/v1/chat/completions', model: 'openai/gpt-oss-120b' },
    { name: 'Gemini', key: 'GEMINI_API_KEY', url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', model: 'gemini-2.5-flash' },
    { name: 'OpenAI', key: 'OPENAI_API_KEY', url: 'https://api.openai.com/v1/chat/completions', model: 'gpt-5-mini' }
];
const CHEWBOT_AI = CHEWBOT_PROVIDERS.find(p => process.env[p.key]);
const CHEWBOT_MODEL = process.env.CHEWBOT_MODEL || process.env.OPENAI_MODEL || (CHEWBOT_AI && CHEWBOT_AI.model);
console.log(CHEWBOT_AI ? `Chewbot: using ${CHEWBOT_AI.name} (${CHEWBOT_MODEL})` : 'Chewbot: no AI key set - chat disabled');

function loadChewbotKnowledge() {
    const dir = path.join(__dirname, 'knowledge');
    try {
        return fs.readdirSync(dir)
            .filter(f => /\.(md|txt)$/i.test(f))
            .sort()
            .map(f => `### ${f}\n${fs.readFileSync(path.join(dir, f), 'utf8').trim()}`)
            .join('\n\n');
    } catch (e) {
        console.warn('Chewbot: no knowledge folder found');
        return '';
    }
}
const CHEWBOT_KNOWLEDGE = loadChewbotKnowledge();

const CHEWBOT_SYSTEM_PROMPT = `You are Chewbot, the friendly live-chat help assistant for ILFD Group's listing team. You help colleagues with problems and questions about OneSila, the product information management (PIM) system they use to create and manage product listings across marketplaces such as Amazon, eBay, Shein, Debenhams, The Range, Tesco and B&Q.

How to answer:
- Base your answers on the OneSila knowledge base below first. Only fall back on general knowledge when you are confident it is correct, and never invent exact menu names, button labels or settings.
- If you can't find the answer or aren't confident, don't guess. Tell them to ask the real Chewis, e.g. "That one's beyond me. You'll need to ask the real Chewis!", and suggest they bring the details (screenshot, SKU, marketplace, error message). Use mood "sad" for these replies.
- If someone asks who the real Chewis is: he's Lew, the human you're modelled on.
- Be concise and practical: short paragraphs or numbered steps. Use **bold** for button and field names. No headings or tables.
- Use a warm, upbeat, slightly cheeky British tone. Keep it professional.
- If the user pastes an error message, match it to a pattern in the error-messages section of the knowledge base, even though the property names, values and SKUs will differ from the example. Give that pattern's fix with their exact property/value/SKU swapped in. Use mood "thinking" for error fixes.
- Ask one short clarifying question if the request is too vague to help with.
- Politely decline topics unrelated to OneSila, product listings or e-commerce operations.

Pick a facial expression ("mood") for your reply:
- happy: default, greetings, a clear answer
- laughing: the user is joking, thanking you or celebrating a fix
- thinking: a tricky or multi-step answer
- sad: you can't help, or the user describes something going badly wrong
- angry: playful mock-annoyance at a frustrating bug or a known OneSila quirk (never aimed at the user)
- surprised: an unusual or unexpected issue
- confused: the question is unclear and you're asking for clarification
- neutral: plain factual info

Respond ONLY with a JSON object: {"reply": "<your answer>", "mood": "<one mood from the list>"}

=== ONESILA KNOWLEDGE BASE ===
${CHEWBOT_KNOWLEDGE || '(No knowledge base documents have been added yet. Rely on general knowledge and be clear about uncertainty.)'}`;

// Simple in-memory rate limit: 30 messages per 10 minutes per IP
const chewbotHits = new Map();
function chewbotRateLimited(ip) {
    const now = Date.now();
    const windowMs = 10 * 60 * 1000;
    const hits = (chewbotHits.get(ip) || []).filter(t => now - t < windowMs);
    hits.push(now);
    chewbotHits.set(ip, hits);
    return hits.length > 30;
}

app.post('/api/chewbot', async (req, res) => {
    if (!CHEWBOT_AI) {
        return res.status(500).json({ success: false, mood: 'sad', message: "Chewbot isn't set up yet: no AI key (GROQ_API_KEY, GEMINI_API_KEY or OPENAI_API_KEY) is set on the server." });
    }
    if (chewbotRateLimited(req.ip)) {
        return res.status(429).json({ success: false, mood: 'angry', message: "Whoa, slow down! You've sent a lot of messages. Give me a few minutes and try again." });
    }

    const incoming = Array.isArray(req.body.messages) ? req.body.messages : [];
    const messages = incoming
        .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
        .slice(-20)
        .map(m => ({ role: m.role, content: m.content.slice(0, 2000) }));
    if (!messages.length || messages[messages.length - 1].role !== 'user') {
        return res.status(400).json({ success: false, mood: 'confused', message: "I didn't catch a question there." });
    }

    try {
        const callAI = (useJsonMode) => fetch(CHEWBOT_AI.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env[CHEWBOT_AI.key]}`
            },
            body: JSON.stringify({
                model: CHEWBOT_MODEL,
                messages: [{ role: 'system', content: CHEWBOT_SYSTEM_PROMPT }, ...messages],
                ...(useJsonMode ? { response_format: { type: 'json_object' } } : {})
            })
        });
        let aiRes = await callAI(true);
        // Some models don't support JSON mode - retry once without it
        if (aiRes.status === 400) {
            console.warn('Chewbot: JSON mode request rejected, retrying without it');
            aiRes = await callAI(false);
        }
        const data = await aiRes.json();
        if (!aiRes.ok) {
            console.error(`Chewbot ${CHEWBOT_AI.name} error:`, data.error || data);
            const busy = aiRes.status === 429;
            return res.status(502).json({ success: false, mood: busy ? 'angry' : 'sad', message: busy
                ? "I've hit my free usage limit for the moment. Give me a minute and try again."
                : 'My brain is having a moment. Please try again shortly.' });
        }

        const raw = data.choices?.[0]?.message?.content || '';
        let reply = raw, mood = 'happy';
        try {
            const jsonText = (raw.match(/\{[\s\S]*\}/) || [raw])[0]; // tolerate ```json fences
            const parsed = JSON.parse(jsonText);
            reply = String(parsed.reply || '').trim() || raw;
            if (CHEWBOT_MOODS.includes(parsed.mood)) mood = parsed.mood;
        } catch (e) { /* model didn't return JSON - use raw text */ }

        res.json({ success: true, reply, mood });
    } catch (err) {
        console.error('Chewbot error:', err);
        res.status(500).json({ success: false, mood: 'sad', message: "Something went wrong on my end. Please try again." });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));