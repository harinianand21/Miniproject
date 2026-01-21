import { useState, useCallback } from 'react';

export interface RouteCoordinate {
    lat: number;
    lng: number;
}

export const useMapRouting = () => {
    const [routeCoordinates, setRouteCoordinates] = useState<RouteCoordinate[]>([]);

    /**
     * Fetches path from OSRM Public API
     * @param start [lat, lng]
     * @param end [lat, lng]
     */
    const getRoute = useCallback(async (start: [number, number], end: [number, number]) => {
        try {
            // OSRM expects lon,lat format
            const query = `${start[1]},${start[0]};${end[1]},${end[0]}`;
            const url = `https://router.project-osrm.org/route/v1/walking/${query}?geometries=geojson&overview=full`;

            const response = await fetch(url);
            const data = await response.json();

            if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
                const coords: RouteCoordinate[] = data.routes[0].geometry.coordinates.map(
                    (coord: [number, number]) => ({
                        lat: coord[1],
                        lng: coord[0],
                    })
                );

                setRouteCoordinates(coords);

                // TODO: These routeCoordinates will be reused for AR navigation later.
                // We will pass this array to the WebXR scene to render 3D waypoints/path.

                return coords;
            }
        } catch (error) {
            console.error("Routing error:", error);
        }
        return null;
    }, []);

    return {
        routeCoordinates,
        getRoute,
        clearRoute: () => setRouteCoordinates([]),
    };
};
