import { Mic } from 'lucide-react';

interface HomeScreenProps {
  onStart: () => void;
  onVoiceCommand: () => void;
}

export function HomeScreen({ onStart, onVoiceCommand }: HomeScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-white px-6">
      <div className="flex flex-col items-center text-center max-w-md w-full">
        {/* App Logo/Icon */}
        <div className="mb-8 w-24 h-24 bg-blue-600 rounded-3xl flex items-center justify-center" aria-hidden="true">
          <Navigation className="w-14 h-14 text-white" />
        </div>

        {/* App Title */}
        <h1 className="mb-3">GuideAble AR</h1>
        
        {/* Subtitle */}
        <p className="text-gray-600 mb-12">
          Accessible navigation made easier
        </p>

        {/* Primary CTA */}
        <button
          onClick={onStart}
          className="w-full bg-blue-600 text-white py-5 px-8 rounded-2xl mb-4 hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-lg"
          aria-label="Start navigation"
        >
          Let's Start Navigation
        </button>

        {/* Voice Command Button */}
        <button
          onClick={onVoiceCommand}
          className="w-16 h-16 bg-white border-2 border-blue-600 text-blue-600 rounded-full flex items-center justify-center hover:bg-blue-50 active:bg-blue-100 transition-colors shadow-md mb-12"
          aria-label="Voice Command"
        >
          <Mic className="w-7 h-7" />
        </button>

        {/* Footer */}
        <div className="flex items-center gap-3 text-gray-500">
          <span className="flex items-center gap-2">
            <Mic className="w-4 h-4" />
            <span>Voice-enabled</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-2">
            <Camera className="w-4 h-4" />
            <span>AR supported</span>
          </span>
        </div>
      </div>
    </div>
  );
}

function Navigation({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 11l19-9-9 19-2-8-8-2z" />
    </svg>
  );
}

function Camera({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}