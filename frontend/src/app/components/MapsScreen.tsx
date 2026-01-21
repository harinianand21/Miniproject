import { useState, useEffect, useRef } from "react";
import { Search, Mic, Plus } from "lucide-react";
import { MapContainer, TileLayer, Marker, Polyline, useMap, CircleMarker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { BottomSheet } from "./BottomSheet";
import { AccessibilityMarker } from "../../types/accessibility";
import { useMapRouting } from "../hooks/useMapRouting";
import { api } from "../../services/api";
import { ThumbsUp, ThumbsDown } from "lucide-react";

// Custom function to create emoji icons that match the previous UI
const createEmojiIcon = (emoji: string) => L.divIcon({
  html: `<div style="
    font-size: 24px;
    background: white;
    border-radius: 50%;
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
    cursor: pointer;
    border: 2px solid transparent;
    transition: all 0.2s;
  " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
    ${emoji}
  </div>`,
  className: 'custom-emoji-icon',
  iconSize: [48, 48],
  iconAnchor: [24, 24],
});

// Helper component to update map view and handle clicks
// Moved outside to prevent re-mounting on every parent render
interface MapEventsProps {
  userLocation: [number, number];
  destination: [number, number] | null;
  setDestination: (dest: [number, number] | null) => void;
  setSelectedMarker: (marker: AccessibilityMarker | null) => void;
  setSelectedPlace: (place: any) => void;
  setMapViewbox: (box: string) => void;
}

function MapEvents({ userLocation, destination, setDestination, setSelectedMarker, setSelectedPlace, setMapViewbox }: MapEventsProps) {
  const map = useMap();
  const hasCenteredRef = useRef(false);

  useMapEvents({
    click(e) {
      setDestination([e.latlng.lat, e.latlng.lng]);
      setSelectedMarker(null); // Clear selected marker if clicking elsewhere
      setSelectedPlace(null); // Clear selected place if clicking map directly
    },
  });

  // Automatically pan to destination when it changes (from search or click)
  useEffect(() => {
    if (destination) {
      map.flyTo(destination, 16);
    }
  }, [destination, map]);

  // Track map bounds for bounded searching
  useEffect(() => {
    const updateViewbox = () => {
      const bounds = map.getBounds();
      const west = bounds.getWest();
      const north = bounds.getNorth();
      const east = bounds.getEast();
      const south = bounds.getSouth();
      // Nominatim viewbox is left,top,right,bottom (lon,lat,lon,lat)
      setMapViewbox(`${west},${north},${east},${south}`);
    };

    map.on('moveend', updateViewbox);
    updateViewbox();
    return () => { map.off('moveend', updateViewbox); };
  }, [map, setMapViewbox]);

  // Initial center on user location ONLY ONCE when GPS is acquired
  useEffect(() => {
    if (userLocation && !destination && !hasCenteredRef.current) {
      map.setView(userLocation, 15);
      hasCenteredRef.current = true;
    }
  }, [userLocation, map, destination]);

  return null;
}

interface MapsScreenProps {
  onAddData: (locationData?: { lat: number; lng: number; name: string }) => void;
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
      name: "Chennai Central",
      placeName: "Chennai Central",
      details: "Wheelchair ramp available at the main entrance gate.",
      votes: 12,
      anchorPosition: { top: "42%", left: "54%" }
    },
    {
      id: "2",
      type: "elevator",
      lat: 13.085,
      lng: 80.275,
      name: "Egmore Metro",
      placeName: "Egmore Metro",
      details: "Operational elevator connecting street level to ticketing hall.",
      votes: 8,
      anchorPosition: { top: "68%", left: "32%" }
    },
    {
      id: "3",
      type: "obstacle",
      lat: 13.08,
      lng: 80.28,
      name: "Anna Salai",
      placeName: "Anna Salai",
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
      placeName: "Government Hospital Precinct",
      details: "Public accessible restroom with wide stall entry.",
      votes: 15,
      anchorPosition: { top: "48%", left: "48%" }
    },
    {
      id: "6",
      type: "braille",
      lat: 13.081,
      lng: 80.273,
      name: "Victoria Public Hall",
      placeName: "Victoria Public Hall",
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
      placeName: "Chintadripet MRTS Station",
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
      placeName: "General Hospital Road",
      details: "Clean tactile paving along the primary pedestrian stretch.",
      votes: 18,
      anchorPosition: { top: "44%", left: "38%" }
    },
    {
      id: "9",
      type: "parking",
      lat: 13.0815,
      lng: 80.274,
      name: "City Square Parking",
      placeName: "City Square Parking",
      details: "Designated disabled parking spots near the elevator.",
      votes: 20,
      anchorPosition: { top: "50%", left: "50%" }
    }
  ]);
  const [crowdsourcedPoints, setCrowdsourcedPoints] = useState<any[]>([]);

  // Fetch crowdsourced points from backend
  const fetchPoints = async () => {
    try {
      const response = await api.get("/points");
      setCrowdsourcedPoints(response.data);
    } catch (error) {
      console.error("Error fetching points:", error);
    }
  };

  useEffect(() => {
    fetchPoints();
  }, []);

  const handlePointVote = async (id: string, voteType: 'upvote' | 'downvote') => {
    try {
      await api.patch(`/points/${id}/vote`, { voteType });
      fetchPoints(); // Refresh points after voting
    } catch (error) {
      console.error("Error voting:", error);
    }
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMarker, setSelectedMarker] = useState<AccessibilityMarker | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<any>(null);
  const [mapViewbox, setMapViewbox] = useState("");

  // Use Nominatim API for real place searching
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setShowSuggestions(true);

    try {
      // Fetch from Nominatim with India restriction and current viewbox biassing
      let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&countrycodes=in`;
      if (mapViewbox) {
        url += `&viewbox=${mapViewbox}&bounded=1`;
      }

      const response = await fetch(url);
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectDestination = (dest: any) => {
    const lat = parseFloat(dest.lat);
    const lng = parseFloat(dest.lon);

    setSearchQuery(dest.display_name);
    setSelectedPlace({
      displayName: dest.display_name,
      lat: lat,
      lon: lng
    });
    setShowSuggestions(false);
    setDestination([lat, lng]);

    // Map events will handle flyTo via effect
  };

  const { routeCoordinates, getRoute } = useMapRouting();
  const [userLocation, setUserLocation] = useState<[number, number]>([13.0827, 80.2707]);
  const [destination, setDestination] = useState<[number, number] | null>(null);

  // Get real user location on mount (using watchPosition for live updates)
  useEffect(() => {
    if ("geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.error("Geolocation error:", error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  useEffect(() => {
    console.log("DESTINATION CHANGE", destination);
    if (destination) {
      // OSRM request ordered: userLocation (start) -> destination (end)
      getRoute(userLocation, destination);
    }
  }, [destination, userLocation, getRoute]);

  // Sync destination with selectedMarker
  useEffect(() => {
    if (selectedMarker) {
      setDestination([selectedMarker.lat, selectedMarker.lng]);
    }
  }, [selectedMarker]);

  const handleVote = (direction: "up" | "down") => {
    if (!selectedMarker) return;

    const change = direction === "up" ? 1 : -1;

    // Check if it's a crowdsourced point
    const isCrowdsourced = crowdsourcedPoints.some(p => p._id === selectedMarker.id);

    if (isCrowdsourced) {
      handlePointVote(selectedMarker.id, direction === "up" ? 'upvote' : 'downvote');
      setSelectedMarker(prev => prev ? { ...prev, votes: prev.votes + change } : null);
      return;
    }

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

      {/* LEAFLET MAP */}
      <MapContainer
        center={userLocation}
        zoom={15}
        className="absolute inset-0 w-full h-full z-10"
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* User Location Marker */}
        <CircleMarker
          center={userLocation}
          radius={10}
          pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.8 }}
        />

        {/* Accessibility Markers (Predefined) */}
        {markers.map((marker) => {
          const emojiMap: Record<string, string> = {
            ramp: "♿",
            elevator: "⬆️",
            obstacle: "⚠️",
            bathroom: "🚻",
            parking: "🅿️",
            braille: "🖐️",
            audio: "🔊",
            stairs: "🏃",
            tactile: "👣"
          };

          return (
            <Marker
              key={marker.id}
              position={[marker.lat, marker.lng]}
              icon={createEmojiIcon(emojiMap[marker.type] || "📍")}
              eventHandlers={{
                click: () => {
                  setSelectedMarker(marker);
                  setDestination([marker.lat, marker.lng]); // TRIGGERS ROUTING
                },
              }}
            />
          );
        })}

        {/* Route Polyline - This array of coordinates will be reused for AR navigation later */}
        {routeCoordinates.length > 0 && (
          <Polyline
            positions={routeCoordinates.map(c => [c.lat, c.lng] as [number, number])}
            pathOptions={{ color: '#3b82f6', weight: 6, opacity: 0.8, lineJoin: 'round' }}
          />
        )}

        {/* Crowdsourced Markers (User-Added) */}
        {crowdsourcedPoints.map((point) => {
          const emojiMap: Record<string, string> = {
            ramp: "♿",
            elevator: "⬆️",
            obstacle: "⚠️",
            bathroom: "🚻",
            parking: "🅿️",
            braille: "🖐️",
            audio: "🔊",
            stairs: "🏃",
            tactile: "👣"
          };

          const featureType = (point.featureType || point.type) as keyof typeof emojiMap;

          return (
            <Marker
              key={point._id}
              position={[point.latitude, point.longitude]}
              icon={createEmojiIcon(emojiMap[featureType] || "📍")}
              eventHandlers={{
                click: () => {
                  // UNIFIED RICH CARD DATA
                  setSelectedMarker({
                    id: point._id,
                    type: featureType as any,
                    name: point.placeName || point.title || "", // Backend is now guaranteed to provide a name
                    details: point.description || point.notes || "No additional information provided.",
                    lat: point.latitude,
                    lng: point.longitude,
                    votes: point.upvotes || 0,
                    // Additional fields for completeness
                    placeName: point.placeName,
                    title: point.title,
                    description: point.description,
                    upvotes: point.upvotes,
                    downvotes: point.downvotes
                  });
                  setDestination([point.latitude, point.longitude]); // TRIGGERS ROUTING
                },
              }}
            />
          );
        })}

        {/* Destination Marker (if user clicked on map) */}
        {destination && !selectedMarker && (
          <CircleMarker
            center={destination}
            radius={10}
            pathOptions={{ color: 'green', fillColor: 'green', fillOpacity: 0.6 }}
          />
        )}

        <MapEvents
          userLocation={userLocation}
          destination={destination}
          setDestination={setDestination}
          setSelectedMarker={setSelectedMarker}
          setSelectedPlace={setSelectedPlace}
          setMapViewbox={setMapViewbox}
        />
      </MapContainer>

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
          {showSuggestions && (searchQuery.length > 0) && (
            <div className="mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden max-h-[60vh] overflow-y-auto animate-in slide-in-from-top-2 md:mt-4 md:rounded-3xl">
              {isSearching ? (
                <div className="px-5 py-8 flex flex-col items-center gap-3">
                  <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-gray-500 text-sm">Searching places...</span>
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map((dest, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectDestination(dest)}
                    className="w-full px-5 py-4 text-left hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0 flex items-center gap-3"
                  >
                    <Search className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="text-gray-700 text-sm line-clamp-2">{dest.display_name}</span>
                  </button>
                ))
              ) : (
                <div className="px-5 py-4 text-gray-400 italic">No matching places found...</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Markers UI (Removed as they are now integrated into Leaflet) */}

      {/* ADD BUTTON */}
      <button
        onClick={() => {
          const loc = selectedMarker
            ? { lat: selectedMarker.lat, lng: selectedMarker.lng, name: selectedMarker.name }
            : selectedPlace
              ? { lat: selectedPlace.lat, lng: selectedPlace.lon, name: selectedPlace.displayName }
              : destination
                ? { lat: destination[0], lng: destination[1], name: searchQuery || "Selected Map Point" }
                : { lat: userLocation[0], lng: userLocation[1], name: "Current Location" };
          onAddData(loc);
        }}
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
