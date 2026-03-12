const { WebpayPlus } = require('transbank-sdk'); 
const { Options, IntegrationApiKeys, Environment, IntegrationCommerceCodes } = require('transbank-sdk'); 
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');

// Configuration for Transbank Testing Environment
const txOptions = new Options(IntegrationCommerceCodes.WEBPAY_PLUS, IntegrationApiKeys.WEBPAY, Environment.Integration);
const tx = new WebpayPlus.Transaction(txOptions);

// 1. Create Webpay Plus Transaction
exports.createWebPayTransaction = async (req, res, next) => {
    try {
        const { bookingId } = req.body;
        
        const booking = await Booking.findById(bookingId);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        
        // Validation: Booking must not be Paid already
        const existingPayment = await Payment.findOne({ booking: bookingId, status: 'AUTHORIZED' });
        if(existingPayment) return res.status(400).json({ message: 'Booking is already paid' });

        const amount = booking.total_price || 0;
        if(amount === 0) return res.status(400).json({ message: 'Amount cannot be zero' });

        const buyOrder = 'O-' + Math.floor(Math.random() * 100000);
        const sessionId = 'S-' + Math.floor(Math.random() * 100000);
        // Replace this with your actual frontend URL later
        const returnUrl = `http://localhost:5000/api/payments/webpay/commit`;

        const createResponse = await tx.create(buyOrder, sessionId, amount, returnUrl);

        // Save pending payment to DB
        await Payment.create({
            booking: booking._id,
            user: booking.owner, // Client
            amount,
            method: 'WEBPAY',
            status: 'PENDING',
            buy_order: buyOrder,
            session_id: sessionId,
            token: createResponse.token
        });

        // Return token and URL to redirect user to Transbank Payment page
        res.status(200).json({
            status: 'success',
            data: {
                url: createResponse.url,
                token: createResponse.token
            }
        });
    } catch (error) { next(error); }
};

// 2. Commit Webpay Plus Transaction (Return URL)
exports.commitWebPayTransaction = async (req, res, next) => {
    try {
        const { token_ws } = req.query; // Transbank sends token back in query

        if(!token_ws) {
            return res.status(400).json({ message: 'Token is required' });
        }

        const commitResponse = await tx.commit(token_ws);
        
        const payment = await Payment.findOne({ token: token_ws });
        if(!payment) return res.status(404).json({ message: 'Payment record not found' });

        if (commitResponse.response_code === 0) { // 0 = Authorized
            payment.status = 'AUTHORIZED';
            payment.authorization_code = commitResponse.authorization_code;
            payment.payment_type_code = commitResponse.payment_type_code;
            payment.response_code = commitResponse.response_code;
            await payment.save();

            // Notify Frontend or redirect to success page
            // Replace with Frontend URL
            return res.redirect(`http://localhost:5173/payment-success?booking=${payment.booking}`);
        } else {
            payment.status = 'REJECTED';
            payment.response_code = commitResponse.response_code;
            await payment.save();
            return res.redirect(`http://localhost:5173/payment-failed`);
        }
    } catch (error) { next(error); }
};

// 3. POS: Send charge request to Physical Terminal
exports.chargePosTerminal = async (req, res, next) => {
    try {
        const { bookingId, terminalId } = req.body;
        
        const booking = await Booking.findById(bookingId);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        
        const existingPayment = await Payment.findOne({ booking: bookingId, status: 'AUTHORIZED' });
        if(existingPayment) return res.status(400).json({ message: 'Booking is already paid' });

        const amount = booking.total_price || 0;
        
        // Transbank POS integration usually requires a local agent/socket or a cloud API (Depending on POS model)
        // Here we simulate the POS API Call because physical POS requires hardware network access
        
        console.log(`[POS SIMULATION] Sending $${amount} to Terminal ${terminalId} for Booking ${booking._id}`);

        // Save physical POS payment attempt
        const payment = await Payment.create({
            booking: booking._id,
            user: req.user._id, // Receptionist creating it
            amount,
            method: 'POS',
            status: 'PENDING',
            pos_terminal_id: terminalId
        });

        // Simulate that POS was pinged successfully waiting for client to tap card
        res.status(200).json({
            status: 'success',
            message: 'Charge sent to POS. Waiting for card tap...',
            data: {
                paymentId: payment._id,
                amount
            }
        });
    } catch (error) { next(error); }
};

// 4. POS Webhook / Completion update
exports.completePosTransaction = async (req, res, next) => {
    try {
        const { paymentId, status, authCode } = req.body;
        const payment = await Payment.findById(paymentId);
        if(!payment) return res.status(404).json({ message: 'Payment not found' });

        payment.status = status === 'SUCCESS' ? 'AUTHORIZED' : 'REJECTED';
        if (authCode) payment.authorization_code = authCode;
        await payment.save();

        res.status(200).json({ status: 'success', data: { payment } });
    } catch (error) { next(error); }
};
