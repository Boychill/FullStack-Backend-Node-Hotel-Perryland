const mongoose = require('mongoose');

const transportRouteSchema = new mongoose.Schema({
    branch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
        required: true
    },
    driver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['DRAFT', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED'],
        default: 'DRAFT'
    },
    shift: {
        type: String,
        enum: ['MORNING', 'AFTERNOON', 'FULL_DAY'],
        default: 'FULL_DAY'
    },
    stops: [{
        booking: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Booking'
        },
        type: { // PICKUP or DROPOFF
            type: String,
            required: true
        },
        address: {
            address_line: String,
            geo: { lat: Number, lng: Number }
        },
        order: { type: Number, default: 0 },
        is_priority: { type: Boolean, default: false }, // Driver flagged priority
        status: {
            type: String,
            enum: ['PENDING', 'COMPLETED', 'SKIPPED', 'FAILED'],
            default: 'PENDING'
        },
        notes: String
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('TransportRoute', transportRouteSchema);
