const Branch = require('../models/Branch');

exports.getAllBranches = async (req, res, next) => {
    try {
        const branches = await Branch.find({ status: 'ACTIVE' });

        res.status(200).json({
            status: 'success',
            results: branches.length,
            data: { branches }
        });
    } catch (error) {
        next(error);
    }
};

exports.createBranch = async (req, res, next) => {
    try {
        const newBranch = await Branch.create(req.body);

        res.status(201).json({
            status: 'success',
            data: { branch: newBranch }
        });
    } catch (error) {
        next(error);
    }
};

exports.getBranch = async (req, res, next) => {
    try {
        const branch = await Branch.findById(req.params.id).populate('managers', 'name email');
        if (!branch) {
            return res.status(404).json({ message: 'No branch found with that ID' });
        }
        res.status(200).json({
            status: 'success',
            data: { branch }
        });
    } catch (error) {
        next(error);
    }
};

exports.updateBranch = async (req, res, next) => {
    try {
        const branch = await Branch.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!branch) {
            return res.status(404).json({ message: 'No branch found with that ID' });
        }
        res.status(200).json({
            status: 'success',
            data: { branch }
        });
    } catch (error) {
        next(error);
    }
};

exports.deleteBranch = async (req, res, next) => {
    try {
        // Soft Delete
        const branch = await Branch.findByIdAndUpdate(req.params.id, { status: 'INACTIVE' }, { new: true });

        if (!branch) {
            return res.status(404).json({ message: 'No branch found with that ID' });
        }

        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (error) {
        next(error);
    }
};
