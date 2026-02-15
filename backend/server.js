const express = require('express');
const cors = require('cors');
const path = require('path');
const database = require('./database');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const fs = require('fs');
const axios = require('axios');

require('dotenv').config();
const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';
const GROQ_API_KEY = process.env.GROQ_API_KEY || null;

// --------------------------------------------------
// Ensure Upload Directory Exists
// --------------------------------------------------

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// --------------------------------------------------
// Multer Setup
// --------------------------------------------------

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ storage });

// --------------------------------------------------
// Middleware
// --------------------------------------------------

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

// --------------------------------------------------
// Auth Middleware
// --------------------------------------------------

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Token missing' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });
        req.user = user;
        next();
    });
}

// --------------------------------------------------
// Routes
// --------------------------------------------------

app.get('/api/health', (req, res) => {
    res.json({ status: "running" });
});

// ---------------- BUYERS ----------------

app.get('/api/buyers', async (req, res) => {
    try {
        const buyers = await database.getBuyers();
        res.json({ buyers });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch buyers' });
    }
});

app.post('/api/buyers', async (req, res) => {
    try {
        const result = await database.addBuyer(req.body);
        res.json({ success: true, buyer: result });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to add buyer' });
    }
});

// ---------------- SELLERS ----------------

app.get('/api/sellers', async (req, res) => {
    try {
        const sellers = await database.getSellers();
        res.json({ sellers });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch sellers' });
    }
});

app.post('/api/sellers', async (req, res) => {
    try {
        const result = await database.addSeller(req.body);
        res.json({ success: true, seller: result });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to add seller' });
    }
});

// ---------------- PROPERTIES ----------------

app.get('/api/properties', async (req, res) => {
    try {
        const properties = await database.getProperties();
        res.json({ properties });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch properties' });
    }
});

// ---------------- CHAT ----------------

app.post('/api/chat', async (req, res) => {
    const { message, sessionId } = req.body;
    if (!message) return res.status(400).json({ error: "Message required" });

    const sid = sessionId || `session_${Date.now()}`;

    try {
        const buyers = await database.getBuyers();
        const sellers = await database.getSellers();

        // Basic context for the model
        const context = `There are ${buyers.length} active buyers and ${sellers.length} active sellers.`;

        // If GROQ API key is available, try to call the model; otherwise, return a safe fallback reply.
        let reply = `Active Buyers: ${buyers.length}\nActive Sellers: ${sellers.length}`;

        if (GROQ_API_KEY) {
            try {
                const payload = {
                    // This is a generic request shape. If your Groq API expects a different shape, adjust accordingly.
                    prompt: `${context}\nUser: ${message}\nAssistant:`,
                    max_tokens: 512,
                    temperature: 0.2
                };

                const groqRes = await axios.post(
                    'https://api.groq.ai/v1/models/mixtral-8x7b-32768/completions',
                    payload,
                    {
                        headers: {
                            'Authorization': `Bearer ${GROQ_API_KEY}`,
                            'Content-Type': 'application/json'
                        },
                        timeout: 20000
                    }
                );

                // Attempt to read a completion result from the response
                if (groqRes?.data) {
                    // Support multiple possible response shapes
                    if (groqRes.data.choices && groqRes.data.choices[0] && groqRes.data.choices[0].text) {
                        reply = groqRes.data.choices[0].text.trim();
                    } else if (typeof groqRes.data.output === 'string') {
                        reply = groqRes.data.output.trim();
                    } else if (Array.isArray(groqRes.data.output) && groqRes.data.output[0] && groqRes.data.output[0].content) {
                        reply = String(groqRes.data.output[0].content).trim();
                    } else {
                        // as a final fallback use a safe generated reply
                        reply = `I see ${buyers.length} active buyers and ${sellers.length} active sellers. How can I help you further?`;
                    }
                }
            } catch (err) {
                console.error('Groq API call failed, falling back to default reply:', err && err.message ? err.message : err);
                reply = `I see ${buyers.length} active buyers and ${sellers.length} active sellers. How can I help you further?`;
            }
        }

        await database.addChatMessage(sid, 'user', message, 'PROPERTY', null);
        await database.addChatMessage(sid, 'bot', reply, 'PROPERTY', null);

        res.json({ sessionId: sid, reply });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Chat failed" });
    }
});

// --------------------------------------------------
// Server Start (ONLY ONE LISTEN)
// --------------------------------------------------

app.listen(PORT, () => {
    console.log('----------------------------------------');
    console.log(`Server running on port ${PORT}`);
    console.log(`Health: http://localhost:${PORT}/api/health`);
    console.log('----------------------------------------');
});
