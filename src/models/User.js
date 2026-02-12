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
    phone: String,
    status: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE', 'BANNED'],
        default: 'ACTIVE',
    },
    addresses: [{
        label: String,
        address_line: String,
        is_default: Boolean,
    }],
}, {
    timestamps: true,
});

module.exports = mongoose.model('User', userSchema);
