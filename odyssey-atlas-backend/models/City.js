const mongoose = require('mongoose');

// Define the schema for a landmark within a city
const landmarkSchema = new mongoose.Schema({
    name: String,
    info: String,
    coordinates: { type: [Number], required: true },
    facts: [String],
    sound: String, // Kept for legacy/pre-recorded sounds if needed
    story: String  // The text for our new text-to-speech feature
});

// Define the main schema for a city
const citySchema = new mongoose.Schema({
    name: String,
    image: String,
    description: String,
    coordinates: { type: [Number], required: true },
    landmarks: [landmarkSchema],
    culture: [{ name: String, info: String }],
});

const City = mongoose.model('City', citySchema);

module.exports = City;