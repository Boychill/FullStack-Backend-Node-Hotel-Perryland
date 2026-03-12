// Haversine formula to calculate distance between two points in km
exports.getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat1)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
};

// Simple Nearest Neighbor sort
exports.sortStopsByProximity = (startLocation, stops) => {
    let currentLoc = startLocation;
    const sortedStops = [];
    const remainingStops = [...stops];

    while (remainingStops.length > 0) {
        let nearestIndex = -1;
        let minDistance = Infinity;

        for (let i = 0; i < remainingStops.length; i++) {
            const stop = remainingStops[i];
            // Access lat/lng safely (handling booking populated data or direct address object)
            // Assuming stop structure matches TransportRoute stop schema or pool item
            const lat = stop.address?.geo?.lat || 0;
            const lng = stop.address?.geo?.lng || 0;

            const dist = exports.getDistanceFromLatLonInKm(
                currentLoc.lat, currentLoc.lng,
                lat, lng
            );

            if (dist < minDistance) {
                minDistance = dist;
                nearestIndex = i;
            }
        }

        if (nearestIndex !== -1) {
            const nearestStop = remainingStops.splice(nearestIndex, 1)[0];
            sortedStops.push(nearestStop);
            // Update current location to this stop's location
            currentLoc = nearestStop.address.geo;
        } else {
            // Should not happen if list not empty, but break to avoid infinite loop
            break;
        }
    }

    return sortedStops;
};

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}
