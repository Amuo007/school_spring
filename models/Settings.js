const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    notificationEmail: {
        type: String,
        required: true,
        default: 'amrinderbalhar@gmail.com'
    }
}, { timestamps: true });

// Ensure only one settings document exists
settingsSchema.pre('save', async function(next) {
    const count = await this.constructor.countDocuments();
    if (count === 0 || this._id) {
        next();
    } else {
        next(new Error('Only one settings document can exist'));
    }
});

module.exports = mongoose.model('Settings', settingsSchema); 