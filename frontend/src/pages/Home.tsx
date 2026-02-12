import { useNavigate } from "react-router-dom";
import { HomeScreen } from "../app/components/HomeScreen";

export default function Home({
    onVoiceCommand,
}: {
    onVoiceCommand: () => void;
}) {
    const navigate = useNavigate();

    return (
        <HomeScreen
            onStart={() => navigate("/map")}
            onVoiceCommand={onVoiceCommand}
        />
    );
}
