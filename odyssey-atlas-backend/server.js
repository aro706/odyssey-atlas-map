require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
// 👇 IMPORT the Google Cloud library from the 'audio' branch
const textToSpeech = require('@google-cloud/text-to-speech');

const app = express();
const PORT = 3001;

// 👇 INSTANTIATE the Google Cloud client
const client = new textToSpeech.TextToSpeechClient();

app.use(cors());
app.use(express.json());

// --- Database Connection ---
const mongoURI = process.env.MONGO_URI;
mongoose.connect(mongoURI)
    .then(() => console.log('Successfully connected to MongoDB Atlas!'))
    .catch(err => console.error('Error connecting to MongoDB:', err));

// --- MERGED Schema with the new 'story' field ---
const landmarkSchema = new mongoose.Schema({
    name: String,
    info: String,
    coordinates: { type: [Number], required: true },
    facts: [String],
    sound: String, // Kept for legacy/pre-recorded sounds if needed
    story: String  // The text for our new text-to-speech feature
});

const citySchema = new mongoose.Schema({
    name: String,
    image: String,
    description: String,
    coordinates: { type: [Number], required: true },
    landmarks: [landmarkSchema],
    culture: [{ name: String, info: String }],
});

const City = mongoose.model('City', citySchema);

// --- API Routes ---
app.get('/api/cities/:cityName', async (req, res) => {
    // ... (no changes in this route)
    try {
        const cityName = req.params.cityName;
        console.log(`Request received for ${cityName} data!`);
        const city = await City.findOne({ name: { $regex: new RegExp(cityName, "i") } });
        if (!city) return res.status(404).json({ message: "City not found" });
        res.json(city);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

// 👇 NEW Text-to-Speech API Endpoint from the 'audio' branch
app.post('/api/generate-speech', async (req, res) => {
    const { text } = req.body;
    if (!text) {
        return res.status(400).json({ error: 'Text is required' });
    }

    const request = {
        input: { text: text },
        // A pleasant, story-like voice. Many other options are available.
        voice: { languageCode: 'en-US', name: 'en-US-Journey-F' },
        audioConfig: { audioEncoding: 'MP3' },
    };

    try {
        const [response] = await client.synthesizeSpeech(request);
        res.setHeader('Content-Type', 'audio/mpeg');
        res.end(response.audioContent);
    } catch (error) {
        console.error('ERROR generating speech with Google TTS:', error);
        res.status(500).json({ error: 'Failed to generate speech' });
    }
});


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

