const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

// Protect all routes after this middleware
router.use(auth.protect);

// Only Admin should manage users usually
// router.use(auth.restrictTo('ADMIN')); // Uncomment to enforce Admin only

router.route('/')
    .get(auth.restrictTo('ADMIN', 'RECEPTION', 'VET', 'TRAINER', 'MONITOR', 'DRIVER'), userController.getAllUsers)
    .post(auth.restrictTo('ADMIN'), userController.createUser);

router.route('/:id')
    .get(userController.getUser)
    .patch(userController.updateUser)
    .delete(auth.restrictTo('ADMIN'), userController.deleteUser);

module.exports = router;
