import MapsScreen from "../app/components/MapsScreen";

export default function Map({
    onVoiceCommand,
    onStartNavigation,
    onAddData
}: {
    onVoiceCommand: () => void;
    onStartNavigation: () => void;
    onAddData: () => void;
}) {
    return (
        <MapsScreen
            onStartNavigation={onStartNavigation}
            onAddData={onAddData}
            onVoiceCommand={onVoiceCommand}
        />
    );
}
