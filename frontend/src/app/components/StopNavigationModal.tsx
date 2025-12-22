interface StopNavigationModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export function StopNavigationModal({ onConfirm, onCancel }: StopNavigationModalProps) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center px-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative z-10 bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="px-6 py-8">
          {/* Icon */}
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-8 h-8 text-red-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </div>

          {/* Title */}
          <h2 className="text-center mb-4">
            Stop Navigation?
          </h2>

          {/* Description */}
          <p className="text-gray-600 text-center mb-8">
            Do you want to stop navigation? You can always restart it later.
          </p>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={onConfirm}
              className="w-full bg-red-600 text-white py-4 px-6 rounded-2xl hover:bg-red-700 active:bg-red-800 transition-colors"
            >
              Yes, Stop
            </button>

            <button
              onClick={onCancel}
              className="w-full bg-gray-100 text-gray-700 py-4 px-6 rounded-2xl hover:bg-gray-200 active:bg-gray-300 transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
