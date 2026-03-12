const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    branch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
        required: true,
    },
    zone: {
        type: String,
        enum: ['HOTEL_INDOOR', 'KENNEL_OUTDOOR'],
        required: true,
    },
    allowed_sizes: [{
        type: String,
        enum: ['S', 'M', 'L', 'XL'],
    }],
    base_price: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ['AVAILABLE', 'MAINTENANCE', 'OCCUPIED'],
        default: 'AVAILABLE',
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Room', roomSchema);
