import MapsScreen from "../app/components/MapsScreen";

export default function Map({
    onVoiceCommand,
    onStartNavigation,
    onAddData
}: {
    onVoiceCommand: () => void;
    onStartNavigation: (dest?: { lat: number; lng: number; name: string }) => void;
    onAddData: (data?: { lat: number; lng: number; name: string }) => void;
}) {
    return (
        <MapsScreen
            onStartNavigation={onStartNavigation}
            onAddData={onAddData}
            onVoiceCommand={onVoiceCommand}
        />
    );
}
