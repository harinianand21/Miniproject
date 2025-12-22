import { Camera } from 'lucide-react';

interface ARPermissionScreenProps {
  onAllow: () => void;
  onCancel: () => void;
}

export function ARPermissionScreen({ onAllow, onCancel }: ARPermissionScreenProps) {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        {/* Illustration */}
        <div className="mb-8 relative">
          {/* Camera Icon */}
          <div className="w-32 h-32 mx-auto bg-blue-100 rounded-3xl flex items-center justify-center mb-6">
            <Camera className="w-16 h-16 text-blue-600" />
          </div>
          
          {/* AR Arrows Illustration */}
          <div className="relative h-24">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 flex gap-2">
              <ArrowIcon className="text-blue-600 animate-bounce" style={{ animationDelay: '0ms' }} />
              <ArrowIcon className="text-blue-500 animate-bounce" style={{ animationDelay: '150ms' }} />
              <ArrowIcon className="text-blue-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="mb-4">Camera Access Needed</h1>

        {/* Description */}
        <p className="text-gray-600 mb-8">
          Camera access needed for AR navigation. We'll overlay helpful navigation arrows and accessibility alerts on your real-world view.
        </p>

        {/* Privacy Note */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-4 mb-8">
          <p className="text-blue-900">
            🔒 Your camera feed stays private and is never recorded or stored
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={onAllow}
            className="w-full bg-blue-600 text-white py-5 px-6 rounded-2xl hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-lg"
          >
            Allow Camera & Start AR
          </button>
          
          <button
            onClick={onCancel}
            className="w-full bg-gray-100 text-gray-700 py-5 px-6 rounded-2xl hover:bg-gray-200 active:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function ArrowIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      className={className}
      style={style}
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}
