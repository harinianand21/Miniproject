export interface AccessibilityMarker {
    id: string;
    type: 'ramp' | 'elevator' | 'obstacle' | 'bathroom' | 'parking' | 'braille' | 'audio' | 'stairs' | 'tactile';
    lat: number;
    lng: number;
    name: string;
    details: string;
    votes: number;
}
