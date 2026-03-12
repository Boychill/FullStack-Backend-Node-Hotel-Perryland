const express = require('express');
const router = express.Router();
const petController = require('../controllers/petController');
const trainerController = require('../controllers/trainerController');
const auth = require('../middleware/auth');

// Protect all routes
router.use(auth.protect);

router.route('/')
    .get(petController.getAllPets)
    .post(petController.createPet);

// Especific endpoints with :id MUST go before generic /:id ones in Express
router.patch('/:id/evaluate', auth.restrictTo('ADMIN', 'TRAINER'), trainerController.evaluatePet);

router.route('/:id')
    .get(petController.getPet)
    .patch(petController.updatePet)
    .delete(petController.deletePet);

module.exports = router;
