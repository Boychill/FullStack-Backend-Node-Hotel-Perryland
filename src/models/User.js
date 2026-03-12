const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
        select: false,
    },
    role: {
        type: String,
        enum: ['ADMIN', 'RECEPTION', 'CLIENT', 'VET', 'TRAINER', 'MONITOR', 'DRIVER'],
        default: 'CLIENT',
    },
    branch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
    },
    phone: String,
    status: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE', 'BANNED'],
        default: 'ACTIVE',
    },
    addresses: [{
        label: String,
        address_line: String,
        geo: { lat: Number, lng: Number },
        is_default: { type: Boolean, default: false }
    }],
    // Configuration specifically for DRIVER role
    driver_config: {
        vehicle_capacity: { type: Number, default: 5 }, // Pets per trip
        shift: {
            type: String,
            enum: ['MORNING', 'AFTERNOON', 'FULL_DAY'],
            default: 'FULL_DAY'
        },
        max_stops: { type: Number, default: 15 } // Workload limit
    },
    push_token: String,
}, {
    timestamps: true,
});

module.exports = mongoose.model('User', userSchema);
