export interface AccessibilityMarker {
    id: string;
    type: 'ramp' | 'elevator' | 'obstacle' | 'bathroom' | 'parking' | 'braille' | 'audio' | 'stairs' | 'tactile';
    lat: number;
    lng: number;
    // Enriched fields from backend
    placeName?: string;
    title?: string;
    description?: string;
    featureType?: string; // mirrors type but kept for flexibility
    upvotes?: number;
    downvotes?: number;
    // Legacy fields for compatibility
    name: string;
    details: string;
    votes: number;
}
