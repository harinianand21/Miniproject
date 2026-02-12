import MapsScreen from "../app/components/MapsScreen";

export default function Map({
    onVoiceCommand,
    onStartNavigation,
    onAddData
}: {
    onVoiceCommand: () => void;
    onStartNavigation: (dest?: {
        lat?: number;
        lng?: number;
        name?: string;
        route?: Array<{ lat: number; lng: number }>;
    }) => void;
    onAddData: (locationData?: {
        lat?: number;
        lng?: number;
        name?: string;
        featureType?: string;
    }) => void;
}) {
    return (
        <MapsScreen
            onStartNavigation={onStartNavigation}
            onAddData={onAddData}
            onVoiceCommand={onVoiceCommand}
        />
    );
}
