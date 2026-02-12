/**
 * Application Configuration Constants
 * 
 * Centralized configuration for the Accessibility Navigation Platform.
 * Update these values to change app-wide defaults.
 */

/**
 * Default location used as fallback when GPS is unavailable
 * Currently set to Chennai, India
 */
export const DEFAULT_LOCATION = {
    lat: 13.0827,
    lng: 80.2707,
    name: "Chennai, India"
} as const;

/**
 * Map configuration settings
 */
export const MAP_CONFIG = {
    /** Default zoom level when map first loads */
    ZOOM_DEFAULT: 15,

    /** Zoom level when focusing on a destination */
    ZOOM_DESTINATION: 16,

    /** Maximum zoom level allowed */
    ZOOM_MAX: 19,

    /** Minimum zoom level allowed */
    ZOOM_MIN: 10
} as const;

/**
 * GPS/Geolocation settings
 */
export const GPS_CONFIG = {
    /** Enable high accuracy GPS (uses more battery but more precise) */
    HIGH_ACCURACY: true,

    /** Timeout for GPS position request (milliseconds) */
    TIMEOUT: 10000,

    /** Maximum age of cached position (milliseconds) */
    MAX_AGE: 0
} as const;

/**
 * AR Navigation settings
 */
export const AR_CONFIG = {
    /** Distance threshold for proximity alerts (meters) */
    PROXIMITY_ALERT_DISTANCE: 20,

    /** Arrow distance from camera in AR scene (meters) */
    ARROW_DISTANCE: 2,

    /** Arrow vertical offset from eye level (meters) */
    ARROW_VERTICAL_OFFSET: -0.5
} as const;


/**
 * Feature flags for enabling/disabling features
 */
export const FEATURES = {
    /** Enable voice commands */
    VOICE_COMMANDS: true,

    /** Enable AR navigation */
    AR_NAVIGATION: true,

    /** Enable offline mode (future feature) */
    OFFLINE_MODE: false,

    /** Enable user authentication (future feature) */
    AUTHENTICATION: false
} as const;
