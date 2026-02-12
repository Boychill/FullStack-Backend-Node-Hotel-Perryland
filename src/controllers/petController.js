const Pet = require('../models/Pet');

exports.getAllPets = async (req, res) => {
    try {
        // TODO: Fetch pets
        res.status(200).json({ message: 'Get all pets' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createPet = async (req, res) => {
    try {
        // TODO: Create pet
        res.status(201).json({ message: 'Pet created' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
