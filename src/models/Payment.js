const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    method: {
        type: String,
        enum: ['WEBPAY', 'POS', 'CASH', 'TRANSFER'],
        required: true,
    },
    status: {
        type: String,
        enum: ['PENDING', 'AUTHORIZED', 'REJECTED', 'FAILED', 'REFUNDED'],
        default: 'PENDING',
    },
    // Transbank specific fields
    buy_order: String,
    session_id: String,
    token: String, // Webpay Token
    authorization_code: String,
    payment_type_code: String, // VD, VN, etc
    response_code: Number,
    // For POS Payload
    pos_terminal_id: String,
}, {
    timestamps: true,
});

module.exports = mongoose.model('Payment', paymentSchema);
