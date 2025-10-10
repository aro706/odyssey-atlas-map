require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const textToSpeech = require('@google-cloud/text-to-speech');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Import DB Models
const City = require('./models/City');
const User = require('./models/User');
const Achievement = require('./models/Achievement');

const app = express();
const PORT = process.env.PORT || 3001;

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Database Connection ---
const mongoURI = process.env.MONGO_URI;
mongoose.connect(mongoURI)
    .then(() => console.log('Successfully connected to MongoDB Atlas!'))
    .catch(err => console.error('Error connecting to MongoDB:', err));

// --- Google Cloud TTS Client ---
const ttsClient = new textToSpeech.TextToSpeechClient();

// =================================================================
// --- AUTHENTICATION & USER ROUTES ---
// =================================================================

// Auth Middleware to protect routes
const auth = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;
        next();
    } catch (e) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};

// POST /api/register - Register a new user
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'User already exists with that email' });
        }

        user = new User({ username, email, password });
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();

        const payload = { user: { id: user.id } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' }, (err, token) => {
            if (err) throw err;
            res.status(201).json({ token });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// POST /api/login - Authenticate user and get token
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }
        const payload = { user: { id: user.id } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// GET /api/auth - Get logged in user's data (protected)
app.get('/api/auth', auth, async (req, res) => {
    try {
        // Fetch user and populate their achievements
        const user = await User.findById(req.user.id).select('-password').populate('achievements');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// =================================================================
// --- ACHIEVEMENT ROUTES ---
// =================================================================

// GET /api/achievements - Get all available achievements
app.get('/api/achievements', async (req, res) => {
    try {
        const achievements = await Achievement.find();
        res.json(achievements);
    } catch (err) {
        res.status(500).json({ message: "Server error fetching achievements" });
    }
});

// POST /api/achievements - Create a new achievement (for admin/seeding)
app.post('/api/achievements', async (req, res) => {
    const { name, description, icon } = req.body;
    try {
        const newAchievement = new Achievement({ name, description, icon });
        const achievement = await newAchievement.save();
        res.status(201).json(achievement);
    } catch (err) {
        res.status(500).json({ message: "Server error creating achievement" });
    }
});

// POST /api/users/achievements - Award an achievement to the logged-in user
app.post('/api/users/achievements', auth, async (req, res) => {
    const { achievementId } = req.body;
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });
        if (user.achievements.includes(achievementId)) {
            return res.status(400).json({ msg: 'User already has this achievement' });
        }
        user.achievements.push(achievementId);
        await user.save();
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// =================================================================
// --- ORIGINAL API ROUTES ---
// =================================================================

// GET /api/cities/:cityName
app.get('/api/cities/:cityName', async (req, res) => {
    try {
        const cityName = req.params.cityName;
        const city = await City.findOne({ name: { $regex: new RegExp(cityName, "i") } });
        if (!city) return res.status(404).json({ message: "City not found" });
        res.json(city);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

// POST /api/generate-speech
app.post('/api/generate-speech', async (req, res) => {
    const { text } = req.body;
    if (!text) {
        return res.status(400).json({ error: 'Text is required' });
    }
    const request = {
        input: { text: text },
        voice: { languageCode: 'en-US', name: 'en-US-Journey-F' },
        audioConfig: { audioEncoding: 'MP3' },
    };
    try {
        const [response] = await ttsClient.synthesizeSpeech(request);
        res.setHeader('Content-Type', 'audio/mpeg');
        res.end(response.audioContent);
    } catch (error) {
        console.error('ERROR generating speech with Google TTS:', error);
        res.status(500).json({ error: 'Failed to generate speech' });
    }
});

// --- Server Start ---
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});