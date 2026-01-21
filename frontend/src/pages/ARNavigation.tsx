import { useNavigate, useLocation } from "react-router-dom";
import { ARCameraScreen } from "../app/components/ARCameraScreen";

export default function ARNavigation() {
    const navigate = useNavigate();
    const location = useLocation();
    const destination = location.state as { lat: number; lng: number; name: string } | null;

    const handleExit = () => {
        navigate("/map");
    };

    return (
        <ARCameraScreen onExit={handleExit} destination={destination} />
    );
}
