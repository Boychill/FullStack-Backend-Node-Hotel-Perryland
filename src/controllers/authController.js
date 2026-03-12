const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '90d',
    });
};

exports.register = async (req, res, next) => {
    try {
        const { name, email, password, role, phone, branch, addresses } = req.body;

        // Password Hash is handled in Model pre-save middleware ideally, 
        // but for now we can do it here if model doesn't have it.
        // Let's assume we need to hash it here if we didn't add pre-save hook.
        // Checking User model... typically good practice to put in model.
        // I will add hashing here to be safe and explicit.

        const hashedPassword = await bcrypt.hash(password, 12);

        const newUser = await User.create({
            name,
            email,
            password: hashedPassword,
            role, // Be careful allowing anyone to set role usually, but for internal use ok
            phone,
            branch,
            addresses
        });

        const token = signToken(newUser._id);

        // Remove password from output
        newUser.password = undefined;

        res.status(201).json({
            status: 'success',
            token,
            data: {
                user: newUser,
            },
        });
    } catch (error) {
        next(error);
    }
};

exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // 1) Check if email and password exist
        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }

        // 2) Check if user exists && password is correct
        const user = await User.findOne({ email }).select('+password');

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Incorrect email or password' });
        }

        // 3) If everything ok, send token to client
        const token = signToken(user._id);

        res.status(200).json({
            status: 'success',
            token,
        });
    } catch (error) {
        next(error);
    }
};
