const mongoose = require('mongoose');

const petSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    co_owners: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
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
        // Detailed evaluation by TRAINER
        evaluation_notes: String,
        restrictions: {
            separate_kennel: { type: Boolean, default: false },
            only_small_dogs: { type: Boolean, default: false },
            friendly_with_males: { type: Boolean, default: true },
            friendly_with_females: { type: Boolean, default: true },
            not_sociable: { type: Boolean, default: false }, // If true, requires isolation
        }
    },
    preferences: {
        food_brand: String,
        food_amount: Number,
        food_unit: {
            type: String,
            enum: ['GRAMOS', 'VASOS', 'PALAS', 'TAZAS'],
        },
        donate_leftovers: {
            type: Boolean,
            default: false,
        },
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Pet', petSchema);
