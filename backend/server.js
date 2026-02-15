const express = require('express');
const cors = require('cors');
const path = require('path');
const database = require('./database');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const fs = require('fs');
const axios = require('axios');

// --------------------------------------------------
// App Initialization
// --------------------------------------------------

const app = express();
const PORT = process.env.PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';

// --------------------------------------------------
// Ensure Upload Directory Exists
// --------------------------------------------------

const uploadsDir = path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// --------------------------------------------------
// Multer Configuration
// --------------------------------------------------

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Only images allowed'), false);
    }
});

// --------------------------------------------------
// Middleware
// --------------------------------------------------

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

// Serve frontend build (if React)
const buildPath = path.join(__dirname, '../frontend/build');
if (fs.existsSync(buildPath)) {
    app.use(express.static(buildPath));
}

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
// Groq API Configuration
// --------------------------------------------------

const GROQ_API_KEY = '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';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// --------------------------------------------------
// Utility Functions
// --------------------------------------------------

function generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function detectIntent(message) {
    const m = message.toLowerCase();

    const buying = ["buy", "purchase", "2bhk", "3bhk"];
    const selling = ["sell", "selling", "list property"];

    if (buying.some(k => m.includes(k))) return "BUYER";
    if (selling.some(k => m.includes(k))) return "SELLER";

    return "UNKNOWN";
}

function generateReply(intent) {
    switch (intent) {
        case "BUYER":
            return "Looking to buy? Tell me your budget and location.";
        case "SELLER":
            return "Selling a property? What type and where?";
        default:
            return "Are you buying or selling a property?";
    }
}

// --------------------------------------------------
// Routes
// --------------------------------------------------

app.get('/api/health', (req, res) => {
    res.json({ status: "running" });
});

// Authentication endpoints
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password, confirmPassword, role, fullName, phone, location } = req.body;

        if (!username || !email || !password || !confirmPassword) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ error: 'Passwords do not match' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // Check if user already exists
        const existingUser = await database.findUserByUsername(username);
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const existingEmail = await database.findUserByEmail(email);
        if (existingEmail) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        // Create new user
        const user = await database.createUser(username, email, password, role || 'user');
        
        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, username: user.username, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({ 
            success: true, 
            token,
            user: { 
                id: user.id, 
                username: user.username, 
                email: user.email, 
                role: user.role,
                fullName,
                phone,
                location
            }
        });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ error: 'Registration failed' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        const user = await database.findUserByUsername(username);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isPasswordValid = await database.verifyPassword(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, username: user.username, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                phone: user.phone,
                bio: user.bio,
                location: user.location,
                company: user.company
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Buyers endpoints
app.get('/api/buyers', async (req, res) => {
    try {
        const buyers = await database.getBuyers();
        res.json({ buyers });
    } catch (err) {
        console.error('Error fetching buyers:', err);
        res.status(500).json({ error: 'Failed to fetch buyers' });
    }
});
// Update buyer
app.put('/api/buyers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, budget, location, property_type, contact } = req.body;

        if (!name || !budget || !location || !property_type || !contact) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const updatedBuyer = await database.updateBuyer(id, {
            name,
            budget,
            location,
            property_type,
            contact
        });

        if (updatedBuyer.updated === 0) {
            return res.status(404).json({ error: 'Buyer not found' });
        }

        res.json({ success: true, buyer: updatedBuyer });

    } catch (err) {
        console.error('Error updating buyer:', err);
        res.status(500).json({ error: 'Failed to update buyer' });
    }
});


app.post('/api/buyers', async (req, res) => {
    try {
        const { name, budget, location, property_type, contact } = req.body;
        
        if (!name || !budget || !location || !property_type || !contact) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const buyer = {
            name,
            budget,
            location,
            property_type,
            contact
        };

        const result = await database.addBuyer(buyer);
        res.json({ success: true, buyer: result });
    } catch (err) {
        console.error('Error adding buyer:', err);
        res.status(500).json({ error: 'Failed to add buyer' });
    }
});

// Sellers endpoints
app.get('/api/sellers', async (req, res) => {
    try {
        const sellers = await database.getSellers();
        res.json({ sellers });
    } catch (err) {
        console.error('Error fetching sellers:', err);
        res.status(500).json({ error: 'Failed to fetch sellers' });
    }
});

app.post('/api/sellers', async (req, res) => {
    try {
        const { name, property_type, location, price, contact } = req.body;
        
        if (!name || !property_type || !location || !price || !contact) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const seller = {
            name,
            property_type,
            location,
            price,
            contact
        };

        const result = await database.addSeller(seller);
        res.json({ success: true, seller: result });
    } catch (err) {
        console.error('Error adding seller:', err);
        res.status(500).json({ error: 'Failed to add seller' });
    }
});

// Properties endpoints
app.get('/api/properties', async (req, res) => {
    try {
        const properties = await database.getProperties();
        res.json({ properties });
    } catch (err) {
        console.error('Error fetching properties:', err);
        res.status(500).json({ error: 'Failed to fetch properties' });
    }
});

// User profile endpoints
app.get('/api/user/profile', authenticateToken, async (req, res) => {
    try {
        const user = await database.getUserProfile(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ profile: user });
    } catch (err) {
        console.error('Error fetching profile:', err);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

app.put('/api/user/profile', authenticateToken, upload.single('profilePicture'), async (req, res) => {
    try {
        const { username, email, phone, bio, location, company } = req.body;
        
        const profileData = {
            username,
            email,
            phone: phone || '',
            bio: bio || '',
            location: location || '',
            company: company || '',
            profile_picture: req.file ? req.file.filename : null
        };

        const result = await database.updateUserProfile(req.user.id, profileData);
        
        if (result.updated === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Fetch updated user data
        const updatedUser = await database.getUserProfile(req.user.id);
        res.json({ 
            success: true, 
            user: updatedUser,
            message: 'Profile updated successfully' 
        });
    } catch (err) {
        console.error('Error updating profile:', err);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

app.post('/api/chat', async (req, res) => {
    const { message, sessionId } = req.body;

    if (!message) return res.status(400).json({ error: "Message required" });

    const sid = sessionId || generateSessionId();

    try {
        // Get buyers and sellers data for context
        const buyers = await database.getBuyers();
        const sellers = await database.getSellers();

        let botReply = '';

        // Check if message is about properties/flats
        const lowerMessage = message.toLowerCase();
        const isPropertyQuery = lowerMessage.includes('property') || lowerMessage.includes('flat') || 
                               lowerMessage.includes('bhk') || lowerMessage.includes('apartment') ||
                               lowerMessage.includes('house') || lowerMessage.includes('home') ||
                               lowerMessage.includes('buy') || lowerMessage.includes('sell') ||
                               lowerMessage.includes('budget') || lowerMessage.includes('location');

        if (isPropertyQuery) {
            // Generate response from database
            if (lowerMessage.includes('buyer')) {
                botReply = `We have ${buyers.length} active buyers:\n\n`;
                buyers.forEach((b, i) => {
                    botReply += `${i+1}. ${b.name}\n   Budget: ${b.budget}\n   Location: ${b.location}\n   Type: ${b.property_type}\n   Contact: ${b.contact}\n\n`;
                });
            } else if (lowerMessage.includes('seller')) {
                botReply = `We have ${sellers.length} active sellers:\n\n`;
                sellers.forEach((s, i) => {
                    botReply += `${i+1}. ${s.name}\n   Property: ${s.property_type}\n   Location: ${s.location}\n   Price: ${s.price}\n   Contact: ${s.contact}\n\n`;
                });
            } else {
                // General property response
                botReply = `I found relevant property information:\n\n`;
                botReply += `**Buyers:** ${buyers.length} active\n`;
                buyers.slice(0, 3).forEach(b => {
                    botReply += `• ${b.name} - ${b.budget} budget in ${b.location}\n`;
                });
                botReply += `\n**Sellers:** ${sellers.length} active\n`;
                sellers.slice(0, 3).forEach(s => {
                    botReply += `• ${s.name} - ${s.property_type} at ${s.price} in ${s.location}\n`;
                });
            }
        } else {
            // Try Groq API for general queries
            try {
                const groqResponse = await axios.post(GROQ_API_URL, {
                    model: "mixtral-8x7b-32768",
                    messages: [
                        { role: "user", content: message }
                    ],
                    max_tokens: 512
                }, {
                    headers: {
                        "Authorization": `Bearer ${GROQ_API_KEY}`,
                        "Content-Type": "application/json"
                    },
                    timeout: 10000
                });

                botReply = groqResponse.data.choices[0].message.content;
            } catch (groqErr) {
                console.error("Groq API error:", groqErr.response?.data || groqErr.message);
                // Fallback response
                botReply = `I'm here to help with real estate information! Ask me about:
• Available properties and listings
• Buyer profiles and requirements
• Seller information
• Budget and location preferences
• Property types (BHK, apartments, houses, etc.)`;
            }
        }

        // Save to database
        await database.addChatMessage(sid, 'user', message, 'PROPERTY_INQUIRY', null);
        await database.addChatMessage(sid, 'bot', botReply, 'PROPERTY_INQUIRY', null);

        res.json({ sessionId: sid, reply: botReply });

    } catch (err) {
        console.error("Chat error:", err.message);
        res.status(500).json({ error: "Failed to process chat message" });
    }
});

// Catch-all → frontend
app.get('*', (req, res) => {
    const indexPath = path.join(__dirname, '../frontend/build/index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).json({ error: 'Frontend build not found. Run: npm run build in frontend/' });
    }
});

// --------------------------------------------------
// Server Start
// --------------------------------------------------

app.listen(PORT, () => {
    console.log('----------------------------------------');
    console.log(`Server running on port ${PORT}`);
    console.log(`Health: http://localhost:${PORT}/api/health`);
    console.log('----------------------------------------');
});
