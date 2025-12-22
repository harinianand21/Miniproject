import { useNavigate } from "react-router-dom";
import { ARNavigationScreen } from "../app/components/ARNavigationScreen";

export default function AR({
    onVoiceCommand,
}: {
    onVoiceCommand: () => void;
}) {
    const navigate = useNavigate();

    const handleStopNavigation = () => {
        navigate("/map");
    };

    return (
        <ARNavigationScreen
            onStop={handleStopNavigation}
            onVoiceCommand={onVoiceCommand}
        />
    );
}
