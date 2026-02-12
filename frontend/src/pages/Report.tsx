import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { AddDataScreen } from "../app/components/AddDataScreen";
import { DEFAULT_LOCATION } from "../config/constants";

export default function Report() {
    const navigate = useNavigate();
    const [userLocation, setUserLocation] = useState<[number, number]>([DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lng]);

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
    const passedLocation = state as {
        lat?: number;
        lng?: number;
        name?: string;
        featureType?: string;
    } | undefined;

    return (
        <AddDataScreen
            onBack={() => navigate("/map")}
            onSubmit={handleSubmissionComplete}
            userLocation={passedLocation?.lat && passedLocation?.lng ? [passedLocation.lat, passedLocation.lng] : userLocation}
            initialName={passedLocation?.name}
            initialFeatureType={passedLocation?.featureType}
        />
    );
}
