import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppRouter from "../router/AppRouter";
import { VoiceCommandOverlay } from "./components/VoiceCommandOverlay";

export default function App() {
  const [showVoiceOverlay, setShowVoiceOverlay] = useState(false);
  const navigate = useNavigate();

  const handleStartNavigation = (location?: { lat: number; lng: number; name: string }) => {
    if (!location) {
      console.warn("No location provided for navigation");
      return;
    }
    navigate("/ar-navigation", { state: location });
  };

  const handleAddData = (locationData?: { lat: number; lng: number; name: string }) => {
    navigate("/report", { state: locationData });
  };

  const handleStopNavigation = () => {
    navigate("/map");
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-white">
      <AppRouter
        onVoiceCommand={() => setShowVoiceOverlay(true)}
        onStartNavigation={handleStartNavigation}
        onAddData={handleAddData}
      />

      {showVoiceOverlay && (
        <VoiceCommandOverlay
          onClose={() => setShowVoiceOverlay(false)}
          onStartNavigation={handleStartNavigation}
          onAddData={handleAddData}
          onStopNavigation={handleStopNavigation}
        />
      )}
    </div>
  );
}
