import { useState, useCallback, useRef, useEffect } from 'react';

export function useWebXRAR() {
    const [isActive, setIsActive] = useState(false);
    const [status, setStatus] = useState<string>('Ready');
    const [isSupported, setIsSupported] = useState<boolean | null>(null);
    const sessionRef = useRef<any>(null);

    // Check WebXR support on mount
    useEffect(() => {
        const checkSupport = async () => {
            if (!('xr' in navigator)) {
                setIsSupported(false);
                setStatus('WebXR not available');
                return;
            }

            try {
                const supported = await (navigator as any).xr.isSessionSupported('immersive-ar');
                setIsSupported(supported);
                if (!supported) {
                    setStatus('AR not supported on this device');
                }
            } catch (err) {
                console.error('Error checking WebXR support:', err);
                setIsSupported(false);
                setStatus('Could not check AR support');
            }
        };

        checkSupport();
    }, []);

    const stopAR = useCallback(async () => {
        if (sessionRef.current) {
            try {
                await sessionRef.current.end();
            } catch (err) {
                console.error('Error ending WebXR session:', err);
            }
            sessionRef.current = null;
            setIsActive(false);
            setStatus('Stopped');
        }
    }, []);

    const startAR = useCallback(async () => {
        // Must be called from a user gesture
        if (!('xr' in navigator)) {
            setStatus('WebXR not supported');
            return false;
        }

        if (sessionRef.current) {
            console.warn('AR session already active');
            return true;
        }

        try {
            setStatus('Starting AR...');

            // Request immersive-ar session with dom-overlay
            const session = await (navigator as any).xr.requestSession('immersive-ar', {
                requiredFeatures: ['local'],
                optionalFeatures: ['dom-overlay'],
                domOverlay: { root: document.body }
            });

            sessionRef.current = session;
            setIsActive(true);
            setStatus('AR Active');

            // Handle session end
            session.addEventListener('end', () => {
                sessionRef.current = null;
                setIsActive(false);
                setStatus('Session ended');
            });

            // Animation loop to keep session alive
            const onXRFrame = (_time: number, _frame: any) => {
                if (sessionRef.current) {
                    session.requestAnimationFrame(onXRFrame);
                }
            };
            session.requestAnimationFrame(onXRFrame);

            return true;

        } catch (err: any) {
            console.error('WebXR Start Error:', err);
            setStatus(`Error: ${err.message || 'Failed to start AR'}`);
            setIsActive(false);
            return false;
        }
    }, []);

    return {
        startAR,
        stopAR,
        isActive,
        status,
        isSupported
    };
}
