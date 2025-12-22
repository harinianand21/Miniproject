import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { api } from "../services/api";
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
