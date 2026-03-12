const Pet = require('../models/Pet');

exports.evaluatePet = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { admission_status, evaluation_notes, restrictions } = req.body;

        const pet = await Pet.findById(id);
        if (!pet) {
            return res.status(404).json({ message: 'No pet found with that ID' });
        }

        // Only TRAINER and ADMIN can evaluate pets
        
        pet.behavior_config.admission_status = admission_status || pet.behavior_config.admission_status;
        if (evaluation_notes !== undefined) pet.behavior_config.evaluation_notes = evaluation_notes;
        
        if (restrictions) {
            pet.behavior_config.restrictions = {
                ...pet.behavior_config.restrictions,
                ...restrictions
            };
        }

        await pet.save();

        res.status(200).json({
            status: 'success',
            data: { pet }
        });
    } catch (error) {
        next(error);
    }
};
