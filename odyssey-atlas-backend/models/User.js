const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true, // Ensures no two users can have the same username
        trim: true,
    },
    password: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true, // Ensures no two users can have the same email
        trim: true,
    },
    achievements: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Achievement',
    }],
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const User = mongoose.model('User', userSchema);

module.exports = User;
