import { ThumbsUp, ThumbsDown, Navigation } from 'lucide-react';
import { AccessibilityMarker } from '../../types/accessibility';

interface BottomSheetProps {
  marker: AccessibilityMarker;
  onClose: () => void;
  onVote: (direction: 'up' | 'down') => void;
  onStartNavigation: () => void;
}

export function BottomSheet({ marker, onClose, onVote, onStartNavigation }: BottomSheetProps) {
  return (
    <>
      {/* Backdrop - Only on mobile/tablet to allow interaction on desktop if needed, or keep for focus */}
      <div
        className="absolute inset-0 bg-black/30 z-40 md:bg-transparent md:pointer-events-none"
        onClick={onClose}
      />

      {/* Bottom Sheet / Floating Panel */}
      <div className="absolute bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl animate-slide-up md:animate-none md:top-24 md:right-6 md:left-auto md:bottom-auto md:w-[400px] md:rounded-3xl md:pointer-events-auto">
        <div className="px-6 py-6 md:py-8">
          {/* Close Button - Desktop Only */}
          <button
            onClick={onClose}
            className="hidden md:flex absolute top-4 right-4 w-8 h-8 items-center justify-center rounded-full hover:bg-gray-100 text-gray-400"
          >
            <span className="text-2xl">×</span>
          </button>

          {/* Drag Handle - Mobile Only */}
          <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6 md:hidden" />

          {/* Content Wrapper */}
          <div className="md:max-h-[70vh] md:overflow-y-auto">
            {/* Location Name */}
            <h2 className="mb-3 text-2xl font-bold">{marker.name}</h2>

            {/* Type Badge */}
            <div className="mb-4">
              <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${marker.type === 'ramp' ? 'bg-green-100 text-green-800' :
                marker.type === 'elevator' ? 'bg-blue-100 text-blue-800' :
                  marker.type === 'bathroom' ? 'bg-purple-100 text-purple-800' :
                    marker.type === 'parking' ? 'bg-indigo-100 text-indigo-800' :
                      marker.type === 'braille' ? 'bg-amber-100 text-amber-800' :
                        marker.type === 'audio' ? 'bg-teal-100 text-teal-800' :
                          marker.type === 'stairs' ? 'bg-red-100 text-red-800' :
                            marker.type === 'tactile' ? 'bg-cyan-100 text-cyan-800' :
                              'bg-orange-100 text-orange-800'
                }`}>
                {marker.type === 'ramp' && '♿ Wheelchair Ramp'}
                {marker.type === 'elevator' && '⬆️ Elevator'}
                {marker.type === 'bathroom' && '🚻 Accessible Restroom'}
                {marker.type === 'parking' && '🅿️ Disabled Parking'}
                {marker.type === 'braille' && '🖐️ Braille Guidance'}
                {marker.type === 'audio' && '🔊 Audio Guidance'}
                {marker.type === 'stairs' && '🏃 Steep Stairs/Obstacle'}
                {marker.type === 'tactile' && '👣 Tactile Paving'}
                {marker.type === 'obstacle' && '⚠️ Obstacle'}
              </span>
            </div>

            {/* Details */}
            <p className="text-gray-700 mb-6 leading-relaxed">
              {marker.details}
            </p>

            {/* Voting */}
            <div className="flex flex-wrap items-center gap-3 mb-8">
              <span className="text-gray-600 font-medium w-full md:w-auto mb-2 md:mb-0">Is this accurate?</span>
              <button
                onClick={() => onVote('up')}
                className="flex items-center gap-2 px-5 py-2.5 bg-green-50 text-green-700 rounded-xl hover:bg-green-100 active:scale-95 transition-all border border-green-200"
                aria-label="Upvote"
              >
                <ThumbsUp className="w-5 h-5" />
                <span className="font-bold">{marker.votes}</span>
              </button>
              <button
                onClick={() => onVote('down')}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-700 rounded-xl hover:bg-red-100 active:scale-95 transition-all border border-red-200"
                aria-label="Downvote"
              >
                <ThumbsDown className="w-5 h-5" />
              </button>
            </div>

            {/* Start Navigation Button */}
            <button
              onClick={onStartNavigation}
              className="w-full bg-blue-600 text-white py-5 px-6 rounded-2xl flex items-center justify-center gap-3 font-bold hover:bg-blue-700 active:scale-[0.98] transition-all shadow-xl shadow-blue-600/20"
            >
              <Navigation className="w-6 h-6" />
              <span>Start Navigation</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
