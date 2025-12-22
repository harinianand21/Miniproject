import { useState } from "react";
import { Search, Mic, Plus } from "lucide-react";
import { BottomSheet } from "./BottomSheet";
import { AccessibilityMarker } from "../../types/accessibility";

interface MapsScreenProps {
  onAddData: () => void;
  onStartNavigation: () => void;
  onVoiceCommand: () => void;
}

export default function MapsScreen({
  onAddData,
  onStartNavigation,
  onVoiceCommand,
}: MapsScreenProps) {
  // Predefined realistic locations with anchor positions on the map view
  const [markers, setMarkers] = useState<(AccessibilityMarker & { anchorPosition: { top: string; left: string } })[]>([
    {
      id: "1",
      type: "ramp",
      lat: 13.0827,
      lng: 80.2707,
      name: "Chennai Central - Main Entry",
      details: "Wheelchair ramp available at the main entrance gate.",
      votes: 12,
      anchorPosition: { top: "42%", left: "54%" }
    },
    {
      id: "2",
      type: "elevator",
      lat: 13.085,
      lng: 80.275,
      name: "Egmore Metro - Platform Lift",
      details: "Operational elevator connecting street level to ticketing hall.",
      votes: 8,
      anchorPosition: { top: "68%", left: "32%" }
    },
    {
      id: "3",
      type: "obstacle",
      lat: 13.08,
      lng: 80.28,
      name: "Anna Salai - Road Work",
      details: "Sidewalk repair work blocking the pedestrian path.",
      votes: -5,
      anchorPosition: { top: "55%", left: "62%" }
    },
    {
      id: "4",
      type: "bathroom",
      lat: 13.083,
      lng: 80.272,
      name: "Government Hospital Precinct",
      details: "Public accessible restroom with wide stall entry.",
      votes: 15,
      anchorPosition: { top: "48%", left: "48%" }
    },
    {
      id: "6",
      type: "braille",
      lat: 13.081,
      lng: 80.273,
      name: "Victoria Public Hall Entrance",
      details: "Tactile site map and Braille directory available at the information desk.",
      votes: 7,
      anchorPosition: { top: "35%", left: "58%" }
    },
    {
      id: "7",
      type: "audio",
      lat: 13.084,
      lng: 80.276,
      name: "Chintadripet MRTS Station",
      details: "Beacon-based audio announcements for visually impaired travelers.",
      votes: 11,
      anchorPosition: { top: "72%", left: "52%" }
    },
    {
      id: "8",
      type: "tactile",
      lat: 13.078,
      lng: 80.270,
      name: "General Hospital Road",
      details: "Clean tactile paving along the primary pedestrian stretch.",
      votes: 18,
      anchorPosition: { top: "44%", left: "38%" }
    },
  ]);

  const [searchQuery, setSearchQuery] = useState("");
  const [mapUrl, setMapUrl] = useState("https://www.openstreetmap.org/export/embed.html?bbox=80.25,13.06,80.29,13.10&layer=mapnik");
  const [selectedMarker, setSelectedMarker] = useState<AccessibilityMarker | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const mockDestinations = [
    "Central Metro Station, Chennai",
    "Marina Beach, Chennai",
    "T-Nagar Shopping Complex, Chennai",
    "Apollo Hospital, Greams Road",
    "Chennai International Airport",
    "Phoenix Marketcity, Velachery",
    "IIT Madras, Adyar"
  ];

  const filteredDestinations = mockDestinations.filter(d =>
    d.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    setShowSuggestions(false);

    // Simulate map update
    setMapUrl(`https://www.openstreetmap.org/export/embed.html?layers=mapnik&q=${encodeURIComponent(searchQuery)}`);
  };

  const handleSelectDestination = (dest: string) => {
    setSearchQuery(dest);
    setShowSuggestions(false);
    setMapUrl(`https://www.openstreetmap.org/export/embed.html?layers=mapnik&q=${encodeURIComponent(dest)}`);
  };

  const handleVote = (direction: "up" | "down") => {
    if (!selectedMarker) return;

    const change = direction === "up" ? 1 : -1;

    setMarkers((prev) =>
      prev.map((m) =>
        m.id === selectedMarker.id ? { ...m, votes: m.votes + change } : m
      )
    );

    setSelectedMarker((prev) =>
      prev ? { ...prev, votes: prev.votes + change } : null
    );
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden">

      {/* REAL MAP (REPLACES GRID) */}
      <iframe
        title="map"
        src={mapUrl}
        className="absolute inset-0 w-full h-full pointer-events-none select-none"
        style={{ border: 0 }}
      />

      {/* SEARCH BAR / FLOATING PANEL ON DESKTOP */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-white/90 to-transparent md:bg-none md:p-0 md:top-6 md:right-6 md:left-auto md:w-[400px]">
        <div className="md:bg-white/80 md:backdrop-blur-md md:rounded-[2rem] md:shadow-2xl md:p-2 md:border md:border-white/40">
          <form
            onSubmit={handleSearch}
            className="bg-white rounded-2xl shadow-lg flex items-center px-4 py-4 gap-3 border border-gray-200 md:shadow-none md:border-0"
          >
            <button
              type="submit"
              className="hover:bg-gray-100 p-1 rounded-full transition-colors"
            >
              <Search className="w-6 h-6 text-gray-400" />
            </button>
            <input
              type="text"
              placeholder="Search destination or say it"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              className="flex-1 outline-none bg-transparent"
            />
            <button
              type="button"
              onClick={onVoiceCommand}
              className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center transform active:scale-95 transition-transform"
            >
              <Mic className="w-5 h-5 text-white" />
            </button>
          </form>

          {/* SEARCH SUGGESTIONS DROP-DOWN */}
          {showSuggestions && searchQuery.length > 0 && (
            <div className="mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden max-h-[60vh] overflow-y-auto animate-in slide-in-from-top-2 md:mt-4 md:rounded-3xl">
              {filteredDestinations.length > 0 ? (
                filteredDestinations.map((dest, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectDestination(dest)}
                    className="w-full px-5 py-4 text-left hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0 flex items-center gap-3"
                  >
                    <Search className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700">{dest}</span>
                  </button>
                ))
              ) : (
                <div className="px-5 py-4 text-gray-400 italic">No matching places found...</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MARKERS (UI ONLY) */}
      <div className="absolute inset-0 pointer-events-none">
        {markers.map((marker) => (
          <button
            key={marker.id}
            onClick={() => setSelectedMarker(marker)}
            className="absolute z-20 text-xl bg-white rounded-full w-12 h-12 shadow flex items-center justify-center pointer-events-auto transform hover:scale-110 transition-transform"
            style={{
              top: marker.anchorPosition.top,
              left: marker.anchorPosition.left,
              transform: "translate(-50%, -50%)",
            }}
          >
            {marker.type === "ramp" && "♿"}
            {marker.type === "elevator" && "⬆️"}
            {marker.type === "obstacle" && "⚠️"}
            {marker.type === "bathroom" && "🚻"}
            {marker.type === "parking" && "🅿️"}
            {marker.type === "braille" && "🖐️"}
            {marker.type === "audio" && "🔊"}
            {marker.type === "stairs" && "🏃"}
            {marker.type === "tactile" && "👣"}
          </button>
        ))}
      </div>

      {/* ADD BUTTON */}
      <button
        onClick={onAddData}
        className="fixed md:absolute bottom-6 md:bottom-10 right-6 md:right-10 z-30 w-16 h-16 bg-green-600 text-white rounded-full shadow-2xl flex items-center justify-center transform active:scale-95 transition-transform hover:bg-green-700"
      >
        <Plus className="w-8 h-8" />
      </button>

      {/* BOTTOM SHEET / INFORMATION PANEL */}
      {selectedMarker && (
        <div className="absolute inset-0 z-40">
          <BottomSheet
            marker={selectedMarker}
            onClose={() => setSelectedMarker(null)}
            onVote={handleVote}
            onStartNavigation={onStartNavigation}
          />
        </div>
      )}
    </div>
  );
}
