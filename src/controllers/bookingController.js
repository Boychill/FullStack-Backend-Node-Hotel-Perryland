const Booking = require('../models/Booking');
const Pet = require('../models/Pet');
const User = require('../models/User');
const geoUtils = require('../utils/geoUtils'); // For distance calculation

exports.createBooking = async (req, res, next) => {
    try {
        // 1. Verify permissions
        // RECEPTION can create for anyone. CLIENT can create for self (or co-owned pet).
        if (req.user.role === 'CLIENT') {
            const pet = await Pet.findOne({
                _id: req.body.pet,
                $or: [{ owner: req.user._id }, { co_owners: req.user._id }]
            });

            if (!pet) {
                return res.status(400).json({ message: 'Pet not found or you are not authorized (Owner/Co-owner)' });
            }

            // Ensure the booking owner is set to the specific user making the booking (or keep main owner?)
            // Usually, the booking is linked to the person paying/booking.
            req.body.owner = req.user._id;
        }

        // 2. Check Availability (Capacity)
        const branch = await require('../models/Branch').findById(req.body.branch);
        if (!branch) {
            return res.status(404).json({ message: 'Branch not found' });
        }

        const type = req.body.type || 'LODGING';
        const capacityLimit = type === 'DAYCARE' ? branch.capacities.daycare : branch.capacities.lodging;

        // Count overlapping active bookings for this branch and type
        const start = new Date(req.body.start_date);
        const end = new Date(req.body.end_date);

        const activeBookingsCount = await Booking.countDocuments({
            branch: req.body.branch,
            type: type,
            status: { $nin: ['CANCELLED', 'CHECKED_OUT'] },
            $or: [
                { start_date: { $lt: end }, end_date: { $gt: start } } // Overlap condition
            ]
        });

        if (activeBookingsCount >= capacityLimit) {
            return res.status(400).json({
                message: `Branch capacity exceeded for ${type}. Max: ${capacityLimit}, Current: ${activeBookingsCount}`
            });
        }

        // 3. Mathematical Price Calculation
        let subtotal_service = 0;
        let subtotal_transport = 0;

        // Calculate Service Price (Days/Nights)
        const timeDiff = Math.abs(end.getTime() - start.getTime());
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) || 1; // At least 1 day

        const pricing = branch.pricing || {
            daycare_daily_rate: 15000,
            lodging_nightly_rate: 20000,
            transport_base_rate: 3000,
            transport_km_rate: 500
        };

        if (type === 'DAYCARE') {
            subtotal_service = daysDiff * pricing.daycare_daily_rate;
        } else {
            subtotal_service = daysDiff * pricing.lodging_nightly_rate;
        }

        // Calculate Transport Price based on distance limits
        if (branch.location && branch.location.lat && branch.location.lng) {
            const transport = req.body.transport || {};
            
            if (transport.pickup_required && transport.pickup_address && transport.pickup_address.geo) {
                const distanceKm = geoUtils.getDistanceFromLatLonInKm(
                    branch.location.lat, branch.location.lng,
                    transport.pickup_address.geo.lat, transport.pickup_address.geo.lng
                );
                subtotal_transport += pricing.transport_base_rate + (distanceKm * pricing.transport_km_rate);
            }

            if (transport.dropoff_required && transport.dropoff_address && transport.dropoff_address.geo) {
                const distanceKm = geoUtils.getDistanceFromLatLonInKm(
                    branch.location.lat, branch.location.lng,
                    transport.dropoff_address.geo.lat, transport.dropoff_address.geo.lng
                );
                subtotal_transport += pricing.transport_base_rate + (distanceKm * pricing.transport_km_rate);
            }
        }

        req.body.pricing_details = {
            subtotal_service: Math.round(subtotal_service),
            subtotal_transport: Math.round(subtotal_transport)
        };
        req.body.total_price = Math.round(subtotal_service + subtotal_transport);

        // 4. Create Booking
        const newBooking = await Booking.create(req.body);

        res.status(201).json({
            status: 'success',
            data: { booking: newBooking }
        });
    } catch (error) {
        next(error);
    }
};

exports.getAllBookings = async (req, res, next) => {
    try {
        let filter = {};
        if (req.user.role === 'CLIENT') {
            filter = { owner: req.user._id };
        }
        // Reception/Admin can filter by branch if needed (implemented later)

        const bookings = await Booking.find(filter)
            .populate('owner', 'name email phone')
            .populate('pet', 'name size')
            .populate('room', 'name')
            .populate('branch', 'name');

        res.status(200).json({
            status: 'success',
            results: bookings.length,
            data: { bookings }
        });
    } catch (error) {
        next(error);
    }
};

exports.updateInventory = async (req, res, next) => {
    try {
        const { id } = req.params;
        let { check_in_inventory, donation_consent } = req.body;

        const booking = await Booking.findById(id);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Only Staff/Reception should update inventory (enforced by route middleware now)

        // Process inventory objects sent as string when using multipart/form-data
        if (typeof check_in_inventory === 'string') {
            check_in_inventory = JSON.parse(check_in_inventory);
        }

        // Handle File Uploads (Photos)
        if (req.files && req.files.length > 0 && Array.isArray(check_in_inventory)) {
            const baseUrl = `${req.protocol}://${req.get('host')}/uploads/inventory/`;
            const uploadedUrls = req.files.map(file => baseUrl + file.filename);

            // Assign uploaded URLs to the inventory items.
            // A simple logic: append all new photos to the first item for now,
            // or if the client structures it predictably.
            // For a robust implementation, the client could send a fileIndex property.
            if (check_in_inventory.length > 0) {
                 if (!check_in_inventory[0].photos) check_in_inventory[0].photos = [];
                 check_in_inventory[0].photos.push(...uploadedUrls);
            }
        }

        if (check_in_inventory !== undefined) booking.check_in_inventory = check_in_inventory;
        if (donation_consent !== undefined) booking.donation_consent = donation_consent === 'true' || donation_consent === true;

        await booking.save();

        res.status(200).json({
            status: 'success',
            data: { booking }
        });
    } catch (error) {
        next(error);
    }
};

exports.getBooking = async (req, res, next) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate('owner', 'name email phone')
            .populate('pet', 'name size')
            .populate('branch', 'name');

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Security Check
        if (req.user.role === 'CLIENT') {
            // Check if booking owner is the user
            // booking.owner is populated, so it has _id
            if (booking.owner._id.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: 'You do not have permission to view this booking' });
            }
        }

        res.status(200).json({
            status: 'success',
            data: { booking }
        });
    } catch (error) {
        next(error);
    }
};

exports.createRecurringBookings = async (req, res, next) => {
    try {
        const { pet, branch, start_date, end_date, days_of_week = [], transport } = req.body;
        // days_of_week = [1, 2, 3, 4] for Mon, Tue, Wed, Thu (0 is Sunday in JS)
        
        let ownerId = req.user._id;
        if (req.user.role === 'CLIENT') {
            const petExists = await Pet.findOne({ _id: pet, $or: [{ owner: ownerId }, { co_owners: ownerId }] });
            if (!petExists) return res.status(400).json({ message: 'Pet not found or unauthorized' });
        } else {
            ownerId = req.body.owner; // Provide owner explicitly if admin
        }

        const branchObj = await require('../models/Branch').findById(branch);
        if (!branchObj) return res.status(404).json({ message: 'Branch not found' });

        // Calculate pricing once for Daycare (per day cost)
        const pricing = branchObj.pricing || {};
        let subtotal_service = pricing.daycare_daily_rate || 15000;
        let subtotal_transport = 0;

        if (branchObj.location && branchObj.location.lat && transport) {
            const geoUtils = require('../utils/geoUtils');
            if (transport.pickup_required && transport.pickup_address && transport.pickup_address.geo) {
                const distKm = geoUtils.getDistanceFromLatLonInKm(
                    branchObj.location.lat, branchObj.location.lng,
                    transport.pickup_address.geo.lat, transport.pickup_address.geo.lng
                );
                subtotal_transport += (pricing.transport_base_rate || 3000) + (distKm * (pricing.transport_km_rate || 500));
            }
            if (transport.dropoff_required && transport.dropoff_address && transport.dropoff_address.geo) {
                const distKm = geoUtils.getDistanceFromLatLonInKm(
                    branchObj.location.lat, branchObj.location.lng,
                    transport.dropoff_address.geo.lat, transport.dropoff_address.geo.lng
                );
                subtotal_transport += (pricing.transport_base_rate || 3000) + (distKm * (pricing.transport_km_rate || 500));
            }
        }

        const pricing_details = {
            subtotal_service: Math.round(subtotal_service),
            subtotal_transport: Math.round(subtotal_transport)
        };
        const total_price = Math.round(subtotal_service + subtotal_transport);

        // Generate Dates
        const start = new Date(start_date);
        const end = new Date(end_date);
        const bookingsToCreate = [];

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            if (days_of_week.includes(d.getDay())) {
                const dayStart = new Date(d.setHours(8, 0, 0, 0)); // Daycare starts 8 AM
                const dayEnd = new Date(d.setHours(18, 0, 0, 0)); // Ends 6 PM

                bookingsToCreate.push({
                    owner: ownerId, pet, branch, type: 'DAYCARE',
                    start_date: dayStart, end_date: dayEnd,
                    transport: transport || { pickup_required: false, dropoff_required: false },
                    pricing_details,
                    total_price,
                    status: 'PENDING'
                });
            }
        }

        if (bookingsToCreate.length === 0) {
            return res.status(400).json({ message: 'No matching days found in the given date range' });
        }

        const createdBookings = await Booking.insertMany(bookingsToCreate);

        res.status(201).json({
            status: 'success',
            results: createdBookings.length,
            data: { bookings: createdBookings }
        });
    } catch (error) { next(error); }
};
