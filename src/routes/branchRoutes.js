const express = require('express');
const router = express.Router();
const branchController = require('../controllers/branchController');
const auth = require('../middleware/auth');

router.use(auth.protect);

router.route('/')
    .get(branchController.getAllBranches)
    .post(auth.restrictTo('ADMIN'), branchController.createBranch);

router.route('/:id')
    .get(branchController.getBranch)
    .patch(auth.restrictTo('ADMIN', 'MANAGER'), branchController.updateBranch)
    .delete(auth.restrictTo('ADMIN'), branchController.deleteBranch);

module.exports = router;
