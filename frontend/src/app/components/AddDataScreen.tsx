import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';

interface AddDataScreenProps {
  onBack: () => void;
  onSubmit: (data: any) => void;
}

export function AddDataScreen({ onBack, onSubmit }: AddDataScreenProps) {
  const [formData, setFormData] = useState({
    location: '',
    ramp: false,
    elevator: false,
    bathroom: false,
    parking: false,
    braille: false,
    audioGuidance: false,
    tactile: false,
    notes: ''
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const mockPlaces = [
    "Times Square, New York",
    "Central Park, New York",
    "Grand Central Terminal, New York",
    "Empire State Building, New York",
    "Brooklyn Bridge, New York",
    "High Line, New York",
    "Metropolitan Museum of Art, New York"
  ];

  const filteredPlaces = mockPlaces.filter(place =>
    place.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.location) {
      alert("Please select a location first");
      return;
    }

    // Show success state
    setIsSuccess(true);

    // Wait for animation then call onSubmit
    setTimeout(() => {
      onSubmit(formData);
    }, 3000);
  };

  const handleSelectPlace = (place: string) => {
    setFormData({ ...formData, location: place });
    setSearchQuery(place);
    setShowSuggestions(false);
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
          <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Submitted Successfully!</h2>
        <p className="text-gray-500 text-center text-lg">Your accessibility update has been recorded.</p>
        <div className="mt-8 flex gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 z-10">
        <div className="flex items-center gap-4 px-4 py-4 max-w-5xl mx-auto w-full">
          <button
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200"
            aria-label="Go back"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="flex-1 text-xl font-bold">Add Accessibility Info</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <form onSubmit={handleSubmit} className="px-6 py-6 max-w-2xl mx-auto">
          {/* Location Section with Search */}
          <div className="mb-8 relative">
            <label className="block text-gray-600 font-medium mb-3 text-lg">
              Location
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Search or type location..."
                className="w-full px-5 py-5 bg-gray-50/50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-lg"
              />

              {showSuggestions && searchQuery.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl z-20 overflow-hidden max-h-60 overflow-y-auto animate-in slide-in-from-top-2">
                  {filteredPlaces.length > 0 ? (
                    filteredPlaces.map((place, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectPlace(place)}
                        className="w-full px-5 py-4 text-left hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0 flex items-center gap-3"
                      >
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        <span className="text-gray-700">{place}</span>
                      </button>
                    ))
                  ) : (
                    <div className="px-5 py-4 text-gray-400 italic">No locations found...</div>
                  )}
                </div>
              )}
            </div>
            {formData.location && (
              <p className="mt-2 text-sm text-blue-600 flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                Location selected: {formData.location}
              </p>
            )}
          </div>

          {/* Accessibility Features Section */}
          <div className="mb-8">
            <h2 className="text-gray-900 font-bold mb-5 text-xl">Accessibility Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ToggleOption
                label="Ramp available"
                icon={<div className="bg-blue-500 rounded-lg p-1.5"><svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M11,18H9V16H11V18M13,14H11V7H13V14Z" /></svg></div>}
                checked={formData.ramp}
                onChange={(checked) => setFormData({ ...formData, ramp: checked })}
              />

              <ToggleOption
                label="Elevator available"
                icon={<div className="bg-blue-400 rounded-lg p-1.5"><svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 10l7-7 7 7M5 14l7 7 7-7" /></svg></div>}
                checked={formData.elevator}
                onChange={(checked) => setFormData({ ...formData, elevator: checked })}
              />

              <ToggleOption
                label="Accessible Bathroom"
                icon={<div className="bg-purple-100 rounded-lg p-1.5 text-xl flex items-center justify-center">🚻</div>}
                checked={formData.bathroom}
                onChange={(checked) => setFormData({ ...formData, bathroom: checked })}
              />

              <ToggleOption
                label="Disabled Parking"
                icon={<div className="bg-indigo-100 rounded-lg p-1.5 text-xl flex items-center justify-center">🅿️</div>}
                checked={formData.parking}
                onChange={(checked) => setFormData({ ...formData, parking: checked })}
              />

              <ToggleOption
                label="Braille Signage"
                icon={<div className="bg-amber-100 rounded-lg p-1.5 text-xl flex items-center justify-center">🖐️</div>}
                checked={formData.braille}
                onChange={(checked) => setFormData({ ...formData, braille: checked })}
              />

              <ToggleOption
                label="Tactile Paving"
                icon={<div className="bg-cyan-100 rounded-lg p-1.5 text-xl flex items-center justify-center">👣</div>}
                checked={formData.tactile}
                onChange={(checked) => setFormData({ ...formData, tactile: checked })}
              />

              <ToggleOption
                label="Audio Guidance"
                icon={<div className="bg-teal-100 rounded-lg p-1.5 text-xl flex items-center justify-center">🔊</div>}
                checked={formData.audioGuidance}
                onChange={(checked) => setFormData({ ...formData, audioGuidance: checked })}
              />
            </div>
          </div>

          {/* Additional Notes Field */}
          <div className="mb-8">
            <label htmlFor="notes" className="block text-gray-700 font-medium mb-3 text-lg">
              Additional Notes (Optional)
            </label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add any helpful details about accessibility..."
              className="w-full px-5 py-5 border border-gray-200 rounded-2xl resize-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-300 text-lg"
              rows={4}
            />
          </div>

          {/* Action Buttons */}
          <div className="mt-8">
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-5 px-6 rounded-2xl font-bold text-lg hover:bg-blue-700 active:transform active:scale-[0.98] transition-all shadow-xl shadow-blue-600/20"
            >
              Submit Accessibility Info
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ToggleOptionProps {
  label: string;
  icon: React.ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function ToggleOption({ label, icon, checked, onChange }: ToggleOptionProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="flex items-center gap-4">
        <span className="text-xl flex items-center justify-center w-10 h-10">{icon}</span>
        <span className="text-gray-700 font-medium">{label}</span>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`
          relative w-14 h-8 rounded-full transition-colors duration-200 ease-in-out
          ${checked ? 'bg-blue-600' : 'bg-gray-200'}
        `}
      >
        <span
          className={`
            absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-sm transition-transform duration-200 ease-in-out
            ${checked ? 'translate-x-6' : 'translate-x-0'}
          `}
        />
      </button>
    </div>
  );
}
