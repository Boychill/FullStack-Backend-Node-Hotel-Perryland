const express = require('express');
const router = express.Router();
const petController = require('../controllers/petController');

router.get('/', petController.getAllPets);
router.post('/', petController.createPet);

module.exports = router;
