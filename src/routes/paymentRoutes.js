const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const auth = require('../middleware/auth');

// Webpay Callback (Public) - Needs to be accessed by Transbank Servers
router.get('/webpay/commit', paymentController.commitWebPayTransaction);

// Protect all following routes
router.use(auth.protect);

// 1. Client creates Webpay transaction (Online Payment)
router.post('/webpay/create', auth.restrictTo('CLIENT', 'RECEPTION', 'ADMIN'), paymentController.createWebPayTransaction);

// 2. Reception sends Charge to POS physical Terminal
router.post('/pos/charge', auth.restrictTo('RECEPTION', 'ADMIN', 'MANAGER'), paymentController.chargePosTerminal);

// 3. Reception (or POS Webhook) confirms POS payment
router.patch('/pos/complete', auth.restrictTo('RECEPTION', 'ADMIN', 'MANAGER'), paymentController.completePosTransaction);

module.exports = router;
