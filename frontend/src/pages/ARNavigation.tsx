import { useNavigate, useLocation } from "react-router-dom";
import { ARCameraScreen } from "../app/components/ARCameraScreen";

/**
 * AR Navigation page component
 * Receives destination and route data from map screen and renders AR camera
 */
export default function ARNavigation() {
    const navigate = useNavigate();
    const location = useLocation();

    // Extract destination and route from navigation state
    const state = location.state as {
        lat: number;
        lng: number;
        name: string;
        route?: Array<{ lat: number; lng: number }>;
    } | null;

    const destination = state ? {
        lat: state.lat,
        lng: state.lng,
        name: state.name
    } : null;

    const route = state?.route || [];

    const handleExit = () => {
        navigate("/map");
    };

    return (
        <ARCameraScreen
            onExit={handleExit}
            destination={destination}
            route={route}
        />
    );
}
