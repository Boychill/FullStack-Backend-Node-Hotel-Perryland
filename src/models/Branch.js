const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    address: {
        type: String,
        required: true,
    },
    phone: String,
    location: {
        lat: Number,
        lng: Number,
    },
    capacities: {
        daycare: { type: Number, default: 20 }, // Capacidad diaria para Jardín
        lodging: { type: Number, default: 10 }  // Capacidad diaria para Alojamiento
    },
    pricing: {
        daycare_daily_rate: { type: Number, default: 15000 },
        lodging_nightly_rate: { type: Number, default: 20000 },
        transport_base_rate: { type: Number, default: 3000 },
        transport_km_rate: { type: Number, default: 500 }
    },
    managers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    status: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE'],
        default: 'ACTIVE',
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Branch', branchSchema);
