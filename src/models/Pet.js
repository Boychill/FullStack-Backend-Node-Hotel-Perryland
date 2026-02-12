const mongoose = require('mongoose');

const petSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    size: {
        type: String,
        enum: ['S', 'M', 'L', 'XL'],
        required: true,
    },
    breed: String,
    status: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE', 'BANNED', 'DECEASED'],
        default: 'ACTIVE',
    },
    behavior_config: {
        admission_status: {
            type: String,
            enum: ['PENDING', 'APPROVED', 'REJECTED'],
            default: 'PENDING',
        },
        restrictions: [String],
    },
    preferences: {
        donate_leftovers: {
            type: Boolean,
            default: false,
        },
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Pet', petSchema);
