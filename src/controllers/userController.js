const User = require('../models/User');

const bcrypt = require('bcryptjs');

// Admin: Create any user (Staff, Monitor, etc.)
exports.createUser = async (req, res, next) => {
    try {
        const { name, email, password, role, phone, branch, addresses, driver_config } = req.body;

        const hashedPassword = await bcrypt.hash(password, 12);

        const newUser = await User.create({
            name,
            email,
            password: hashedPassword,
            role,
            phone,
            branch,
            addresses,
            driver_config
        });
        
        newUser.password = undefined; // Don't leak

        res.status(201).json({
            status: 'success',
            data: { user: newUser }
        });
    } catch (error) {
        next(error);
    }
};

exports.getAllUsers = async (req, res, next) => {
    try {
        // Filter inactive users by default.
        // If query param ?all=true is present (and user is Admin), show all.
        let filter = { status: { $ne: 'INACTIVE' } };

        if (req.query.all === 'true' && req.user.role === 'ADMIN') {
            filter = {};
        }

        const users = await User.find(filter);
        res.status(200).json({
            status: 'success',
            results: users.length,
            data: { users }
        });
    } catch (error) {
        next(error);
    }
};

exports.getUser = async (req, res, next) => {
    try {
        // Security Check
        if (req.user.role === 'CLIENT' && req.params.id !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You do not have permission to view this user' });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'No user found with that ID' });
        }
        res.status(200).json({
            status: 'success',
            data: { user }
        });
    } catch (error) {
        next(error);
    }
};

exports.updateUser = async (req, res, next) => {
    try {
        // Security Check
        if (req.user.role === 'CLIENT') {
            if (req.params.id !== req.user._id.toString()) {
                return res.status(403).json({ message: 'You do not have permission to update this user' });
            }
            // Prevent Privilege Escalation
            if (req.body.role || req.body.status || req.body.branch) {
                return res.status(400).json({ message: 'You cannot update role, status, or branch' });
            }
        }

        const user = await User.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!user) {
            return res.status(404).json({ message: 'No user found with that ID' });
        }
        res.status(200).json({
            status: 'success',
            data: { user }
        });
    } catch (error) {
        next(error);
    }
};

exports.deleteUser = async (req, res, next) => {
    try {
        // Soft delete implementation: status = INACTIVE
        // Or hard delete:
        // await User.findByIdAndDelete(req.params.id);

        // Let's do Soft Delete for now as per requirements
        const user = await User.findByIdAndUpdate(req.params.id, { status: 'INACTIVE' }, { new: true });

        if (!user) {
            return res.status(404).json({ message: 'No user found with that ID' });
        }

        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (error) {
        next(error);
    }
};
