import { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { XCircle, Crosshair, Volume2, VolumeX, Info } from 'lucide-react';
import { api } from '../../services/api';

interface ARCameraScreenProps {
    onExit: () => void;
    destination: { lat: number; lng: number; name: string } | null;
}

export function ARCameraScreen({ onExit, destination }: ARCameraScreenProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [status, setStatus] = useState<string>('Initializing...');
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [distance, setDistance] = useState<number | null>(null);
    const [bearing, setBearing] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [sessionActive, setSessionActive] = useState(false);
    const [heading, setHeading] = useState<number | null>(null);
    const headingRef = useRef<number>(0);
    const bearingRef = useRef<number>(0);
    const arrowRef = useRef<THREE.Group | null>(null);

    // Accessibility Guidance States
    const [accPoints, setAccPoints] = useState<any[]>([]);
    const [announcedIds] = useState<Set<string>>(new Set());
    const [activeAlert, setActiveAlert] = useState<{ message: string; type: string; name: string } | null>(null);
    const [voiceEnabled, setVoiceEnabled] = useState(true);

    // Three.js refs
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const xrSessionRef = useRef<any>(null);

    // Helper: Calculate Great Circle Bearing
    const calculateBearing = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const toRad = (n: number) => (n * Math.PI) / 180;
        const toDeg = (n: number) => (n * 180) / Math.PI;

        const phi1 = toRad(lat1);
        const phi2 = toRad(lat2);
        const deltaLambda = toRad(lon2 - lon1);

        const y = Math.sin(deltaLambda) * Math.cos(phi2);
        const x = Math.cos(phi1) * Math.sin(phi2) -
            Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);

        let b = toDeg(Math.atan2(y, x));
        return (b + 360) % 360;
    };

    // Helper: Calculate Haversine Distance in meters
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371e3; // Earth radius in meters
        const toRad = (n: number) => (n * Math.PI) / 180;

        const phi1 = toRad(lat1);
        const phi2 = toRad(lat2);
        const deltaPhi = toRad(lat2 - lat1);
        const deltaLambda = toRad(lon2 - lon1);

        const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    // Helper: Contextual Guidance Message
    const getGuidanceMessage = (type: string, name: string) => {
        const messages: Record<string, string> = {
            ramp: `Wheelchair ramp ahead at ${name}.`,
            tactile: `Tactile paving starts ahead.`,
            elevator: `Elevator access available at ${name}.`,
            bathroom: `Accessible restroom nearby.`,
            parking: `Disabled parking area at ${name}.`,
            braille: `Braille signage available.`,
            audio: `Audio guidance beacon active.`,
            stairs: `Caution: steep stairs ahead.`,
            obstacle: `Caution: obstacle on your path.`
        };
        return messages[type] || `Accessibility feature: ${type} at ${name}.`;
    };

    // Trigger Guidance (Voice + UI)
    const triggerGuidance = (point: any) => {
        if (announcedIds.has(point._id || point.id)) return;

        const type = point.featureType || point.type;
        const name = point.placeName || point.name || "this location";
        const message = getGuidanceMessage(type, name);

        // Mark as announced
        announcedIds.add(point._id || point.id);

        // UI Alert
        setActiveAlert({ message, type, name });
        setTimeout(() => setActiveAlert(null), 5000);

        // Voice Alert
        if (voiceEnabled && window.speechSynthesis) {
            // Cancel any current speech
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(message);
            utterance.rate = 0.9;
            window.speechSynthesis.speak(utterance);
        }
    };

    // Fetch nearby points on mount
    useEffect(() => {
        const fetchPoints = async () => {
            try {
                const response = await api.get('/points');
                setAccPoints(response.data);
            } catch (err) {
                console.error("Failed to fetch accessibility points:", err);
            }
        };
        fetchPoints();
    }, []);

    // GPS Tracking
    useEffect(() => {
        if (!("geolocation" in navigator)) {
            setError("Geolocation is not supported by your browser");
            return;
        }

        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                const userLat = position.coords.latitude;
                const userLng = position.coords.longitude;

                setCoords({ lat: userLat, lng: userLng });

                if (destination) {
                    const dist = calculateDistance(userLat, userLng, destination.lat, destination.lng);
                    const brng = calculateBearing(userLat, userLng, destination.lat, destination.lng);

                    setDistance(Math.round(dist));
                    setBearing(Math.round(brng));
                    bearingRef.current = brng;
                }

                // Check proximity to ALL accessibility points
                accPoints.forEach(point => {
                    const pLat = point.latitude || point.lat;
                    const pLng = point.longitude || point.lng;
                    if (pLat && pLng) {
                        const d = calculateDistance(userLat, userLng, pLat, pLng);
                        if (d <= 20) { // 20 meters proximity trigger
                            triggerGuidance(point);
                        }
                    }
                });
            },
            (err) => {
                console.error("GPS Error:", err);
                setError(`GPS Error: ${err.message}`);
            },
            { enableHighAccuracy: true }
        );

        // Device Orientation Tracking
        const handleOrientation = (e: DeviceOrientationEvent) => {
            let h: number | null = null;

            // Handle cross-browser heading
            if ((e as any).webkitCompassHeading !== undefined) {
                h = (e as any).webkitCompassHeading;
            } else if (e.alpha !== null) {
                // alpha starts at 0 and increases CCW. Compass is CW from North.
                // This is a simplified fallback for non-iOS
                h = (360 - e.alpha) % 360;
            }

            if (h !== null) {
                setHeading(Math.round(h));
                headingRef.current = h;
            }
        };

        window.addEventListener('deviceorientation', handleOrientation);
        // some browsers prefer absolute
        window.addEventListener('deviceorientationabsolute', handleOrientation);

        return () => {
            navigator.geolocation.clearWatch(watchId);
            window.removeEventListener('deviceorientation', handleOrientation);
            window.removeEventListener('deviceorientationabsolute', handleOrientation);
        };
    }, []);

    // Three.js & WebXR Setup
    const startAR = async () => {
        if (!containerRef.current) return;

        try {
            setStatus('Checking WebXR support...');
            if (!(navigator as any).xr) {
                throw new Error('WebXR not supported on this browser');
            }

            const isSupported = await (navigator as any).xr.isSessionSupported('immersive-ar');
            if (!isSupported) {
                throw new Error('Immersive AR not supported on this device');
            }

            setStatus('Setting up Three.js...');

            // 1. Scene setup
            const scene = new THREE.Scene();
            sceneRef.current = scene;

            // 2. Camera setup
            const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);
            cameraRef.current = camera;

            // 3. Renderer setup
            const renderer = new THREE.WebGLRenderer({
                antialias: true,
                alpha: true,
                canvas: document.createElement('canvas') // We don't necessarily need to append it if using WebXR, but good practice
            });
            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.xr.enabled = true;
            rendererRef.current = renderer;

            // 3.5 Create Arrow
            const arrowGroup = new THREE.Group();

            // Shaft (Cylinder)
            const cylinder = new THREE.Mesh(
                new THREE.CylinderGeometry(0.04, 0.04, 0.6),
                new THREE.MeshBasicMaterial({ color: 0x3b82f6 }) // Blue matched to theme
            );
            cylinder.rotation.x = Math.PI / 2; // Flat on Z axis

            // Pointer (Cone)
            const cone = new THREE.Mesh(
                new THREE.ConeGeometry(0.12, 0.3),
                new THREE.MeshBasicMaterial({ color: 0x3b82f6 })
            );
            cone.rotation.x = -Math.PI / 2; // Pointing along -Z
            cone.position.z = -0.45; // Move to end of shaft

            arrowGroup.add(cylinder);
            arrowGroup.add(cone);

            // Position 2 meters in front of camera, slightly below eye level
            arrowGroup.position.set(0, -0.5, -2);

            // Add arrow to group that we can rotate
            const arrowWrapper = new THREE.Group();
            arrowWrapper.add(arrowGroup);

            // IMPORTANT: Add to camera so it follows the user, 
            // but we'll rotate it based on compass
            camera.add(arrowWrapper);
            scene.add(camera);
            arrowRef.current = arrowWrapper;

            // 4. Request Session
            setStatus('Requesting AR Session...');
            const session = await (navigator as any).xr.requestSession('immersive-ar', {
                requiredFeatures: ['local'],
                optionalFeatures: ['dom-overlay'],
                domOverlay: { root: containerRef.current }
            });
            xrSessionRef.current = session;
            setSessionActive(true);
            setStatus('AR Active');

            await renderer.xr.setSession(session);

            // 5. Animation Loop
            const onAnimationFrame = (_time: number, _frame: any) => {
                // Update arrow rotation based on heading AND bearing
                if (arrowRef.current) {
                    // Arrow rotation Y = (Bearing - Heading)
                    // Bearing is angle from North to destination (CW)
                    // Heading is angle from North device is facing (CW)
                    const relativeDirection = (bearingRef.current - headingRef.current);
                    const rad = (relativeDirection * Math.PI) / 180;

                    // Simple smoothing (Lerp-like but manual for now)
                    arrowRef.current.rotation.y = rad;
                }
                renderer.render(scene, camera);
            };
            renderer.setAnimationLoop(onAnimationFrame);

            session.addEventListener('end', () => {
                setSessionActive(false);
                renderer.setAnimationLoop(null);
                onExit();
            });

        } catch (err: any) {
            console.error('Failed to start AR:', err);
            setError(err.message || 'Unknown error starting AR');
            setStatus('Failed to start AR');
        }
    };

    const stopAR = async () => {
        if (xrSessionRef.current) {
            await xrSessionRef.current.end();
            xrSessionRef.current = null;
        }
        if (rendererRef.current) {
            rendererRef.current.setAnimationLoop(null);
            rendererRef.current.dispose();
        }
        onExit();
    };

    // Auto-start prompt if not active
    return (
        <div ref={containerRef} className="fixed inset-0 w-full h-full bg-black flex flex-col items-center justify-center overflow-hidden">
            {!sessionActive ? (
                <div className="z-50 text-center p-8 bg-gray-900/90 rounded-3xl border border-white/20 backdrop-blur-xl max-w-sm mx-4 shadow-2xl">
                    <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                        <Crosshair className="text-white w-10 h-10" />
                    </div>
                    <h1 className="text-white text-3xl font-bold mb-2">AR Ready</h1>
                    <p className="text-gray-400 mb-8">Accessing camera and sensors for navigation.</p>

                    {error && (
                        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm">
                            {error}
                        </div>
                    )}

                    <button
                        onClick={startAR}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all active:scale-95 shadow-lg shadow-blue-500/30"
                    >
                        Enter AR Mode
                    </button>

                    <button
                        onClick={onExit}
                        className="mt-4 w-full py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-all"
                    >
                        Back to Map
                    </button>
                </div>
            ) : (
                <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-6">
                    {/* Top Status */}
                    <div className="flex justify-between items-start pointer-events-auto">
                        <div className="bg-black/60 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/20 text-white">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                <span className="font-bold text-sm uppercase tracking-wider">AR Navigation Active</span>
                            </div>
                            <div className="text-xs opacity-70 font-mono">
                                {coords ? (
                                    <>LAT: {coords.lat.toFixed(6)}<br />LNG: {coords.lng.toFixed(6)}</>
                                ) : (
                                    'Waiting for GPS...'
                                )}
                                <div className="mt-1 pt-1 border-t border-white/10 text-blue-400">
                                    HEADING: {heading !== null ? `${heading}°` : '---'}
                                </div>
                                <div className="mt-1 text-green-400">
                                    BEARING: {bearing !== null ? `${bearing}°` : '---'}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                            <button
                                onClick={stopAR}
                                className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform pointer-events-auto"
                                aria-label="Exit AR"
                            >
                                <XCircle className="text-white w-6 h-6" />
                            </button>

                            {distance !== null && (
                                <div className="bg-blue-600/80 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 text-white font-bold animate-in fade-in slide-in-from-right-4">
                                    {distance > 1000 ? `${(distance / 1000).toFixed(1)}km` : `${distance}m`}
                                </div>
                            )}

                            <button
                                onClick={() => setVoiceEnabled(!voiceEnabled)}
                                className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90 pointer-events-auto border border-white/20 ${voiceEnabled ? 'bg-blue-600' : 'bg-gray-700'}`}
                                aria-label="Toggle Voice"
                            >
                                {voiceEnabled ? <Volume2 className="text-white w-5 h-5" /> : <VolumeX className="text-white w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    {/* Accessibility Guidance Alert (Center Top) */}
                    {activeAlert && (
                        <div className="absolute top-48 left-6 right-6 z-30 animate-in slide-in-from-top-10 duration-500">
                            <div className="bg-emerald-600/90 backdrop-blur-xl p-5 rounded-2xl border-2 border-emerald-400/50 shadow-2xl flex items-center gap-4 text-white">
                                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                                    <Info className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs uppercase font-bold tracking-widest opacity-80 mb-1">Nearby Feature</p>
                                    <p className="text-lg font-bold leading-tight">{activeAlert.message}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Destination Marker Name */}
                    <div className="absolute top-32 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-sm px-6 py-2 rounded-full border border-white/10 text-white text-sm font-medium">
                        Target: <span className="text-blue-400">{destination?.name || "Selected Destination"}</span>
                    </div>

                    {/* Bottom Indicator (Simple visual confirmation) */}
                    <div className="flex justify-center mb-12">
                        <div className="px-6 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 text-white/50 text-xs text-center">
                            WebXR / Three.js Scene Active
                        </div>
                    </div>
                </div>
            )}

            {/* Background for when session is not active */}
            {!sessionActive && (
                <div className="absolute inset-0 opacity-30 pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-black" />
                </div>
            )}
        </div>
    );
}
