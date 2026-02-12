import { useState, useEffect, useRef } from "react";
import { Search, Mic, Plus } from "lucide-react";
import { MapContainer, TileLayer, Marker, Polyline, useMap, CircleMarker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { BottomSheet } from "./BottomSheet";
import { AccessibilityMarker } from "../../types/accessibility";
import { useMapRouting } from "../hooks/useMapRouting";
import { supabase } from "../../lib/supabase";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { DEFAULT_LOCATION, MAP_CONFIG } from "../../config/constants";

// Reusable factory for circular emoji icons
const createFeatureIcon = (emoji: string, bg: string) =>
  L.divIcon({
    className: '',
    html: `
      <div style="
        width: 42px;
        height: 42px;
        border-radius: 50%;
        background: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        box-shadow: 0 6px 14px rgba(0,0,0,0.15);
        border: 3px solid ${bg};
      ">
        ${emoji}
      </div>
    `,
    iconSize: [42, 42],
    iconAnchor: [21, 21],
  });

const featureIconMap: Record<string, L.DivIcon> = {
  ramp: createFeatureIcon('♿', '#3B82F6'),
  tactile: createFeatureIcon('👣', '#8B5CF6'),
  bathroom: createFeatureIcon('🚻', '#10B981'),
  elevator: createFeatureIcon('🛗', '#6366F1'),
  parking: createFeatureIcon('🅿️', '#F59E0B'),
  audio: createFeatureIcon('🔊', '#06B6D4'),
  warning: createFeatureIcon('⚠️', '#EF4444'),
};

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

/**
 * Props for the Maps Screen component
 * Main map interface for viewing accessibility features and planning navigation
 */
interface MapsScreenProps {
  /**
   * Callback to navigate to the Add Data screen
   * @param locationData - Optional location data to pre-fill the form
   */
  onAddData: (locationData?: {
    lat?: number;
    lng?: number;
    name?: string;
    featureType?: string;
  }) => void;

  /**
   * Callback to start AR navigation to a destination
   * @param dest - Optional destination coordinates, name, and route
   */
  onStartNavigation: (dest?: {
    lat?: number;
    lng?: number;
    name?: string;
    route?: Array<{ lat: number; lng: number }>;
  }) => void;

  /**
   * Callback to open voice command overlay
   */
  onVoiceCommand: () => void;
}

export default function MapsScreen({
  onAddData,
  onStartNavigation,
  onVoiceCommand,
}: MapsScreenProps) {
  const [markers, setMarkers] = useState<any[]>([]);

  // Fetch points from Supabase
  const fetchPoints = async () => {
    try {
      const { data, error } = await supabase.from('accessibility_points').select('*');
      if (error) throw error;

      // Filter out any markers with missing or invalid coordinates to prevent crashes
      const validPoints = (data || []).filter(item =>
        item &&
        typeof item.latitude === 'number' &&
        typeof item.longitude === 'number' &&
        !isNaN(item.latitude) &&
        !isNaN(item.longitude)
      );

      setMarkers(validPoints);
    } catch (error) {
      console.error("Error fetching points:", error);
      setMarkers([]); // Ensure empty state on error
    }
  };

  useEffect(() => {
    fetchPoints();
  }, []);

  const handleVote = async (id: string, voteType: 'up' | 'down') => {
    try {
      const marker = markers.find(m => m.id === id);
      if (!marker) return;

      const newUpvotes = voteType === 'up' ? (marker.upvotes || 0) + 1 : (marker.upvotes || 0);
      const newDownvotes = voteType === 'down' ? (marker.downvotes || 0) + 1 : (marker.downvotes || 0);

      const { error } = await supabase
        .from('accessibility_points')
        .update({ upvotes: newUpvotes, downvotes: newDownvotes })
        .eq('id', id);

      if (error) throw error;

      // Update local state for immediate feedback
      setMarkers(prev => prev.map(m =>
        m.id === id ? { ...m, upvotes: newUpvotes, downvotes: newDownvotes } : m
      ));

      // Also update selectedMarker if it matches
      setSelectedMarker(prev => {
        if (prev && prev.id === id) {
          return {
            ...prev,
            upvotes: newUpvotes,
            downvotes: newDownvotes,
            votes: newUpvotes - newDownvotes
          };
        }
        return prev;
      });
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
  const [userLocation, setUserLocation] = useState<[number, number]>([DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lng]);
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

  // Voting logic is handled by the async handleVote function defined above

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

        {/* Accessibility Markers from Supabase */}
        {markers.map((marker) => {
          const rawType = (marker.feature_type || marker.featureType || marker.type || 'ramp') as string;
          const normalizedType = rawType.toLowerCase();

          return (
            <Marker
              key={marker.id}
              position={[marker.latitude, marker.longitude]}
              icon={featureIconMap[normalizedType] ?? featureIconMap.ramp}
              eventHandlers={{
                click: () => {
                  const name = marker.place_name || marker.placeName || marker.title || "";
                  const feature = normalizedType;
                  const details = marker.description || marker.notes || "No additional information provided.";

                  setSelectedMarker({
                    id: marker.id,
                    type: feature as any,
                    name: name,
                    details: details,
                    lat: marker.latitude,
                    lng: marker.longitude,
                    votes: (marker.upvotes || 0) - (marker.downvotes || 0),
                    placeName: name,
                    title: name,
                    description: details,
                    upvotes: marker.upvotes,
                    downvotes: marker.downvotes
                  });
                  setDestination([marker.latitude, marker.longitude]);
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
            onVote={(dir) => handleVote(selectedMarker.id, dir)}
            onStartNavigation={() => {
              if (selectedMarker) {
                onStartNavigation({
                  lat: selectedMarker.lat,
                  lng: selectedMarker.lng,
                  name: selectedMarker.placeName || selectedMarker.name,
                  route: routeCoordinates // Pass route for AR waypoint visualization
                });
              } else if (destination) {
                onStartNavigation({
                  lat: destination[0],
                  lng: destination[1],
                  name: searchQuery || "Selected Location",
                  route: routeCoordinates // Pass route for AR waypoint visualization
                });
              }
            }}
          />
        </div>
      )}
    </div>
  );
}
