const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(auth.protect);

router.post('/', bookingController.createBooking);
router.get('/', bookingController.getAllBookings);
router.get('/:id', bookingController.getBooking);

// Reception/Admin updates inventory and uploads photos (up to 10 photos)
router.patch('/:id/inventory', auth.restrictTo('ADMIN', 'RECEPTION'), upload.array('photos', 10), bookingController.updateInventory);

module.exports = router;
