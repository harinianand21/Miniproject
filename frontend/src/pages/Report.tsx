import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { AddDataScreen } from "../app/components/AddDataScreen";

export default function Report() {
    const navigate = useNavigate();
    const [userLocation, setUserLocation] = useState<[number, number]>([13.0827, 80.2707]);

    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition((position) => {
                setUserLocation([position.coords.latitude, position.coords.longitude]);
            });
        }
    }, []);

    const handleSubmissionComplete = () => {
        navigate("/map");
    };

    const { state } = useLocation();
    const passedLocation = state as { lat: number; lng: number; name: string } | undefined;

    return (
        <AddDataScreen
            onBack={() => navigate("/map")}
            onSubmit={handleSubmissionComplete}
            userLocation={passedLocation ? [passedLocation.lat, passedLocation.lng] : userLocation}
            initialName={passedLocation?.name}
        />
    );
}
