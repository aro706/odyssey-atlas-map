require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const mongoURI = process.env.MONGO_URI;
mongoose.connect(mongoURI)
    .then(() => console.log('Successfully connected to MongoDB Atlas!'))
    .catch(err => console.error('Error connecting to MongoDB:', err));

// --- Updated Schemas ---
// This new schema includes coordinates and the new fields for landmarks.
const landmarkSchema = new mongoose.Schema({
    name: String,
    info: String,
    coordinates: { type: [Number], required: true },
    facts: [String],
    sound: String
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

// API Route remains the same, but will now return the richer data.
app.get('/api/cities/:cityName', async (req, res) => {
    try {
        const cityName = req.params.cityName;
        console.log(`Request received for ${cityName} data!`);
        
        const city = await City.findOne({ name: { $regex: new RegExp(cityName, "i") } });

        if (!city) {
            return res.status(404).json({ message: "City not found" });
        }
        
        res.json(city);
    } catch (error) {
        console.error("Database query failed:", error);
        res.status(500).json({ message: "Server error" });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});