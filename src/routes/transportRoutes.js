const express = require('express');
const router = express.Router();
const transportController = require('../controllers/transportController');
const auth = require('../middleware/auth');

router.use(auth.protect);

// 1. Admin/Reception: Get Unassigned Pool
router.get('/pool', auth.restrictTo('ADMIN', 'RECEPTION', 'MANAGER'), transportController.getUnassignedBookings);

// 6. Admin: Get Routes by Date Filter
router.get('/routes', auth.restrictTo('ADMIN', 'RECEPTION', 'MANAGER'), transportController.getRoutesByDate);

// 2. Admin: Assign Routes
router.post('/route', auth.restrictTo('ADMIN', 'MANAGER'), transportController.saveRouteSheet);

// 3. Driver: Get My Route (Today)
router.get('/my-route', auth.restrictTo('DRIVER', 'ADMIN'), transportController.getMyRoute);

// 4. Driver: Update Stop (Status/Priority)
router.patch('/route/:routeId/stop/:stopId', auth.restrictTo('DRIVER', 'ADMIN'), transportController.updateStop);

// 5. System/Admin: Optimize specific route list
router.post('/optimize', auth.restrictTo('ADMIN', 'MANAGER', 'DRIVER'), transportController.optimizeRoute);

module.exports = router;
