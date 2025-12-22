import { Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import Map from "../pages/Map";
import AR from "../pages/AR";
import Report from "../pages/Report";

type Props = {
    onVoiceCommand: () => void;
    onStartNavigation: () => void;
    onAddData: () => void;
};

export default function AppRouter({
    onVoiceCommand,
    onStartNavigation,
    onAddData,
}: Props) {
    return (
        <Routes>
            <Route path="/" element={<Home onVoiceCommand={onVoiceCommand} />} />
            <Route
                path="/map"
                element={
                    <Map
                        onVoiceCommand={onVoiceCommand}
                        onStartNavigation={onStartNavigation}
                        onAddData={onAddData}
                    />
                }
            />
            <Route
                path="/ar"
                element={
                    <AR
                        onVoiceCommand={onVoiceCommand}
                    />
                }
            />
            <Route path="/report" element={<Report />} />
        </Routes>
    );
}
