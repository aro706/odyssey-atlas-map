const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
    },
    icon: { // Path to an icon image or a FontAwesome class
        type: String,
        default: 'fa-trophy',
    },
    // criteria: { // Optional: how the achievement is earned (e.g., 'walk_5_miles', 'visit_eiffel_tower')
    //     type: String,
    //     required: false,
    // },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Achievement', achievementSchema);