const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Subscription = new Schema({
    username:
    {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    isActive: {
        type: Boolean,
        default: true
    }
});

// Export the model
module.exports.Subscription = mongoose.model('Subscription', Subscription);
