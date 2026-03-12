const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    pet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pet',
        required: true,
    },
    room: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
    },
    branch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
        required: true,
    },
    start_date: {
        type: Date,
        required: true,
    },
    end_date: {
        type: Date,
        required: true,
    },
    check_in_inventory: [{
        item: String,
        photos: [String],
        quantity_received: Number,
        quantity_remaining: Number,
        status: {
            type: String,
            enum: ['RECEIVED', 'DONATED', 'RETURNED', 'CONSUMED'],
            default: 'RECEIVED'
        },
        donatable: { // Explicit flag for this item
            type: Boolean,
            default: false
        }
    }],
    donation_consent: {
        type: Boolean,
        default: false
    },
    transport: {
        pickup_required: { type: Boolean, default: false },
        pickup_address: {
            address_line: String,
            geo: { lat: Number, lng: Number },
            reference_contact: String // Name/Phone of who delivers (e.g. Mom/Dad)
        },
        dropoff_required: { type: Boolean, default: false },
        dropoff_address: {
            address_line: String,
            geo: { lat: Number, lng: Number },
            reference_contact: String
        },
        notes: String
    },
    status: {
        type: String,
        enum: ['PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED'],
        default: 'PENDING',
    },
    type: {
        type: String,
        enum: ['LODGING', 'DAYCARE'], // Alojamiento vs Jardín
        default: 'LODGING'
    },
    pricing_details: {
        subtotal_service: { type: Number, default: 0 },
        subtotal_transport: { type: Number, default: 0 }
    },
    total_price: {
        type: Number,
        default: 0
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Booking', bookingSchema);
