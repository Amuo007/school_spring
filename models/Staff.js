const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
    role: {
        type: String,
        required: true,
        enum: ['ceo', 'director', 'principal']
    },
    name: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String,
        required: true
    }
}, { timestamps: true });

// Ensure only one entry per role
staffSchema.index({ role: 1 }, { unique: true });

module.exports = mongoose.model('Staff', staffSchema); 