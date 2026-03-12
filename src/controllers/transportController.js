const Booking = require('../models/Booking');
const Branch = require('../models/Branch');
const TransportRoute = require('../models/TransportRoute');
const User = require('../models/User');

// 1. Get Unassigned Bookings (Pool)
exports.getUnassignedBookings = async (req, res, next) => {
    try {
        const { date, startDate, endDate, branchId } = req.query;
        
        // Define date range based on input (single date vs range)
        let startOfDay, endOfDay;
        if (startDate && endDate) {
            startOfDay = new Date(new Date(startDate).setHours(0, 0, 0, 0));
            endOfDay = new Date(new Date(endDate).setHours(23, 59, 59, 999));
        } else if (date) {
            const queryDate = new Date(date);
            startOfDay = new Date(queryDate.setHours(0, 0, 0, 0));
            endOfDay = new Date(queryDate.setHours(23, 59, 59, 999));
        } else {
             return res.status(400).json({ message: 'Must provide either date or a range (startDate & endDate)' });
        }

        // Find bookings that need transport
        const bookings = await Booking.find({
            branch: branchId,
            status: { $nin: ['CANCELLED', 'CHECKED_OUT'] },
            $or: [
                { start_date: { $gte: startOfDay, $lte: endOfDay }, 'transport.pickup_required': true },
                { end_date: { $gte: startOfDay, $lte: endOfDay }, 'transport.dropoff_required': true }
            ]
        })
            .populate('pet', 'name size')
            .populate('owner', 'name address');

        // Filter out those already assigned to a TransportRoute
        const existingRoutes = await TransportRoute.find({
            date: { $gte: startOfDay, $lte: endOfDay },
            branch: branchId
        });

        // Collect all assigned booking IDs 
        const assignedIds = new Set();
        existingRoutes.forEach(route => {
            route.stops.forEach(stop => assignedIds.add(stop.booking.toString() + '_' + stop.type));
        });

        const pool = [];
        bookings.forEach(b => {
            // Pickup Logic
            if (b.transport.pickup_required && new Date(b.start_date) >= startOfDay && !assignedIds.has(b._id.toString() + '_PICKUP')) {
                pool.push({ booking: b, type: 'PICKUP', address: b.transport.pickup_address });
            }
            // Dropoff Logic
            if (b.transport.dropoff_required && new Date(b.end_date) >= startOfDay && !assignedIds.has(b._id.toString() + '_DROPOFF')) {
                pool.push({ booking: b, type: 'DROPOFF', address: b.transport.dropoff_address });
            }
        });

        res.status(200).json({ status: 'success', results: pool.length, data: { pool } });
    } catch (error) { next(error); }
};

// 2. Create/Update Route Sheet (Admin assigns stops)
exports.saveRouteSheet = async (req, res, next) => {
    try {
        const { branch, driver, date, stops, shift } = req.body;

        let route = await TransportRoute.findOne({
            driver,
            date: {
                $gte: new Date(new Date(date).setHours(0, 0, 0, 0)),
                $lte: new Date(new Date(date).setHours(23, 59, 59, 999))
            }
        });

        if (route) {
            // Update existing
            route.stops = stops;
            route.status = 'ASSIGNED';
            await route.save();
        } else {
            // Create new
            route = await TransportRoute.create({ branch, driver, date, stops, shift, status: 'ASSIGNED' });
        }

        res.status(200).json({ status: 'success', data: { route } });
    } catch (error) { next(error); }
};

// 3. Driver: Get My Route
exports.getMyRoute = async (req, res, next) => {
    try {
        const today = new Date();
        const start = new Date(today.setHours(0, 0, 0, 0));
        const end = new Date(today.setHours(23, 59, 59, 999));

        const route = await TransportRoute.findOne({
            driver: req.user._id,
            date: { $gte: start, $lte: end }
        }).populate({
            path: 'stops.booking',
            populate: { path: 'pet owner' } // Deep populate
        });

        if (!route) return res.status(404).json({ message: 'No route assigned for today' });

        res.status(200).json({ status: 'success', data: { route } });
    } catch (error) { next(error); }
};

// 4. Driver: Update Stop (Priority or Status)
exports.updateStop = async (req, res, next) => {
    try {
        const { routeId, stopId } = req.params;
        const { status, is_priority, notes } = req.body;

        const route = await TransportRoute.findById(routeId);
        if (!route) return res.status(404).json({ message: 'Route not found' });

        // Verify driver owns route
        if (route.driver.toString() !== req.user._id.toString() && req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const stop = route.stops.id(stopId);
        if (!stop) return res.status(404).json({ message: 'Stop not found' });

        if (status) stop.status = status;
        if (is_priority !== undefined) stop.is_priority = is_priority;
        if (notes) stop.notes = notes;

        // Re-ordering logic could go here if sending full list, but simple update for now

        await route.save();
        res.status(200).json({ status: 'success', data: { route } });

    } catch (error) { next(error); }
};

const geoUtils = require('../utils/geoUtils');

// 5. Optimize Route (Nearest Neighbor)
exports.optimizeRoute = async (req, res, next) => {
    try {
        const { startLocation, stops } = req.body; // startLocation: { lat, lng }, stops: [stopObjects]

        if (!startLocation || !stops || !Array.isArray(stops)) {
            return res.status(400).json({ message: 'Invalid data for optimization' });
        }

        const optimizedStops = geoUtils.sortStopsByProximity(startLocation, stops);

        // Assign numeric order
        const orderedStops = optimizedStops.map((stop, index) => ({
            ...stop,
            order: index + 1
        }));

        res.status(200).json({ status: 'success', data: { stops: orderedStops } });
    } catch (error) { next(error); }
};

// 6. Admin: Get Routes by Date Filter
exports.getRoutesByDate = async (req, res, next) => {
    try {
        const { date, startDate, endDate, branchId } = req.query;
        
        let startOfDay, endOfDay;
        if (startDate && endDate) {
            startOfDay = new Date(new Date(startDate).setHours(0, 0, 0, 0));
            endOfDay = new Date(new Date(endDate).setHours(23, 59, 59, 999));
        } else if (date) {
            const queryDate = new Date(date);
            startOfDay = new Date(queryDate.setHours(0, 0, 0, 0));
            endOfDay = new Date(queryDate.setHours(23, 59, 59, 999));
        } else {
             return res.status(400).json({ message: 'Must provide either date or a range (startDate & endDate)' });
        }

        const query = {
            date: { $gte: startOfDay, $lte: endOfDay }
        };
        
        if (branchId) query.branch = branchId;

        const routes = await TransportRoute.find(query)
            .populate('driver', 'name email phone')
            .populate('branch', 'name')
            .populate({
                path: 'stops.booking',
                populate: { path: 'pet owner', select: 'name size phone' }
            });

        res.status(200).json({ status: 'success', results: routes.length, data: { routes } });
    } catch (error) { next(error); }
};
