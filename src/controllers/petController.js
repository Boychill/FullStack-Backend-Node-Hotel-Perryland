const Pet = require('../models/Pet');
const User = require('../models/User');

exports.getAllPets = async (req, res, next) => {
    try {
        // Filter by owner if user is not admin
        let filter = { status: { $ne: 'INACTIVE' } }; // Default: not inactive (ACTIVE, BANNED, DECEASED?) - User said "not shown".
        // Actually usually we want only ACTIVE? Or excluding deleted?
        // Let's exclude 'INACTIVE' (Soft Deleted) and maybe 'DECEASED'? 
        // User said "deshabilitado". Let's assume INACTIVE is the soft delete state.

        if (req.user.role === 'CLIENT') {
            filter.owner = req.user._id;
        }

        const pets = await Pet.find(filter).populate('owner', 'name email phone');

        res.status(200).json({
            status: 'success',
            results: pets.length,
            data: { pets },
        });
    } catch (error) {
        next(error);
    }
};

exports.createPet = async (req, res, next) => {
    try {
        // If client, owner is self. If admin/staff, can specify owner.
        if (req.user.role === 'CLIENT') {
            req.body.owner = req.user._id;
        }

        const newPet = await Pet.create(req.body);

        res.status(201).json({
            status: 'success',
            data: { pet: newPet },
        });
    } catch (error) {
        next(error);
    }
};

exports.getPet = async (req, res, next) => {
    try {
        const pet = await Pet.findById(req.params.id);
        if (!pet) {
            return res.status(404).json({ message: 'No pet found with that ID' });
        }

        // Security Check
        if (req.user.role === 'CLIENT') {
            const isOwner = pet.owner.toString() === req.user._id.toString();
            const isCoOwner = pet.co_owners && pet.co_owners.some(id => id.toString() === req.user._id.toString());

            if (!isOwner && !isCoOwner) {
                return res.status(403).json({ message: 'You do not have permission to view this pet' });
            }
        }

        res.status(200).json({
            status: 'success',
            data: { pet }
        });
    } catch (error) {
        next(error);
    }
};

exports.updatePet = async (req, res, next) => {
    try {
        let pet = await Pet.findById(req.params.id);
        if (!pet) {
            return res.status(404).json({ message: 'No pet found with that ID' });
        }

        // Security Check
        if (req.user.role === 'CLIENT') {
            const isOwner = pet.owner.toString() === req.user._id.toString();
            const isCoOwner = pet.co_owners && pet.co_owners.some(id => id.toString() === req.user._id.toString());

            if (!isOwner && !isCoOwner) {
                return res.status(403).json({ message: 'You do not have permission to update this pet' });
            }
        }

        pet = await Pet.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            status: 'success',
            data: { pet }
        });
    } catch (error) {
        next(error);
    }
};

exports.deletePet = async (req, res, next) => {
    try {
        const pet = await Pet.findById(req.params.id);
        if (!pet) {
            return res.status(404).json({ message: 'No pet found with that ID' });
        }

        // Security Check
        if (req.user.role === 'CLIENT') {
            const isOwner = pet.owner.toString() === req.user._id.toString();
            // Only main owner can delete? Let's say yes for safety.
            if (!isOwner) {
                return res.status(403).json({ message: 'You do not have permission to delete this pet' });
            }
        }

        // Soft Delete
        pet.status = 'INACTIVE';
        await pet.save();

        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (error) {
        next(error);
    }
};
