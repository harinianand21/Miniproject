import { useState, useEffect } from 'react';
import { Mic, ArrowUp } from 'lucide-react';
import { StopNavigationModal } from './StopNavigationModal';
import { useWebXRAR } from '../hooks/useWebXRAR';

interface ARNavigationScreenProps {
  onStop: () => void;
  onVoiceCommand: () => void;
}

export function ARNavigationScreen({ onStop, onVoiceCommand }: ARNavigationScreenProps) {
  const [distance, setDistance] = useState(250);
  const [alert, setAlert] = useState<string | null>('Ramp ahead in 50m');
  const [showStopModal, setShowStopModal] = useState(false);
  const [showARPrompt, setShowARPrompt] = useState(true);
  const { startAR, stopAR, isActive, status, isSupported } = useWebXRAR();

  useEffect(() => {
    // Simulate distance countdown
    const interval = setInterval(() => {
      setDistance(prev => {
        if (prev <= 10) return 10;
        return prev - 5;
      });
    }, 1000);

    // Simulate changing alerts
    const alertTimeout = setTimeout(() => {
      setAlert('Elevator on your right');
    }, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(alertTimeout);
      // Stop AR session when component unmounts
      stopAR();
    };
  }, [stopAR]);

  const handleStartAR = async () => {
    const success = await startAR();
    if (success) {
      setShowARPrompt(false);
    }
  };

  const handleStopNavigation = () => {
    stopAR();
    onStop();
  };

  return (
    <div className="relative w-screen h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-700 overflow-hidden">
      {/* AR Start Prompt Overlay - Only shown before AR starts */}
      {showARPrompt && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="text-center px-6 max-w-md">
            <div className="w-24 h-24 mx-auto mb-6 bg-blue-500 rounded-full flex items-center justify-center">
              <ArrowUp className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-white text-2xl font-bold mb-4">Start AR Navigation</h2>
            <p className="text-white/80 mb-8">
              {isSupported === false
                ? 'AR is not supported on this device. You can still use navigation mode.'
                : 'Tap below to activate your camera and start AR navigation'}
            </p>
            <button
              onClick={handleStartAR}
              className="w-full bg-blue-600 text-white py-5 px-6 rounded-2xl hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-2xl font-bold mb-4"
            >
              {isSupported === false ? 'Continue Without AR' : 'Start AR Camera'}
            </button>
            <button
              onClick={onStop}
              className="w-full bg-white/10 text-white py-4 px-6 rounded-2xl hover:bg-white/20 active:bg-white/30 transition-colors"
            >
              Cancel
            </button>
            {isSupported !== null && (
              <p className="text-white/60 text-sm mt-4">Status: {status}</p>
            )}
          </div>
        </div>
      )}

      {/* Simulated Camera View Background */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-purple-900/20 to-pink-900/30" />
        {/* Grid overlay for AR feel */}
        <div className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      {/* AR Directional Arrow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 flex flex-col items-center z-10">
        <div className="relative mb-4">
          {/* Glowing effect */}
          <div className="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-50 animate-pulse" />

          {/* Arrow */}
          <div className="relative w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center shadow-2xl border-4 border-white/30">
            <ArrowUp className="w-12 h-12 text-white animate-bounce" />
          </div>
        </div>

        {/* Distance Indicator */}
        <div className="bg-black/60 backdrop-blur-sm px-8 py-4 rounded-2xl border-2 border-white/30">
          <p className="text-white text-center">
            <span className="block text-sm opacity-80 mb-1">Distance</span>
            <span className="block text-5xl font-bold">{distance}m</span>
          </p>
        </div>
      </div>

      {/* Accessibility Alert Badge */}
      {alert && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-20 w-11/12 max-w-md">
          <div className="bg-green-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border-2 border-white/30">
            <span className="text-2xl">♿</span>
            <span className="flex-1">{alert}</span>
          </div>
        </div>
      )}

      {/* Voice Command Button - Top Right */}
      <button
        onClick={onVoiceCommand}
        className="absolute top-6 right-6 z-20 w-14 h-14 bg-white/20 backdrop-blur-sm border-2 border-white/40 text-white rounded-full flex items-center justify-center hover:bg-white/30 active:bg-white/40 shadow-xl"
        aria-label="Voice Command"
      >
        <Mic className="w-6 h-6" />
      </button>

      {/* Stop Navigation Button - Bottom / Floating on Desktop */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-6 bg-gradient-to-t from-black/50 to-transparent md:bg-none md:top-auto md:bottom-10 md:left-auto md:right-10 md:w-auto md:p-0">
        <button
          onClick={() => setShowStopModal(true)}
          className="w-full md:w-auto bg-red-600 text-white py-5 px-6 md:py-4 md:px-8 rounded-2xl hover:bg-red-700 active:bg-red-800 transition-colors shadow-2xl border-2 border-white/20 font-bold"
        >
          Stop Navigation
        </button>
      </div>

      {/* Status Bar - Top */}
      <div className="absolute top-6 left-6 z-20 bg-black/60 backdrop-blur-sm px-4 py-3 rounded-xl border border-white/30">
        <div className="flex items-center gap-2 text-white">
          <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
          <span>{isActive ? 'AR Active' : 'Navigation Mode'}</span>
        </div>
      </div>

      {/* Stop Confirmation Modal */}
      {showStopModal && (
        <StopNavigationModal
          onConfirm={handleStopNavigation}
          onCancel={() => setShowStopModal(false)}
        />
      )}
    </div>
  );
}
