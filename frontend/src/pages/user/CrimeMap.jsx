import React, { useState, useRef, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from "react-leaflet";
import L from "leaflet";
import {
  LuLocateFixed,
  LuLayers,
  LuMap,
  LuSatellite,
  LuSearch,
  LuMic,
  LuClock,
  LuMapPin,
  LuX,
  LuShieldAlert,
  LuImage,
  LuVideo,
  LuInfo,
} from "react-icons/lu";
import API from "../../api/API";

const crimeColors = {
  assault: '#DC2626',     // Red (Violent, immediate danger)
  kidnapping: '#9333EA',  // Purple (Severe, high-alert emergency)
  fire: '#EA580C',        // Orange (Literal fire/hazard)
  accident: '#EAB308',    // Yellow (Warning, traffic/environmental hazard)
  harassment: '#EC4899',  // Pink (Interpersonal violation)
  robbery: '#2563EB',     // Blue (Property crime with confrontation)
  theft: '#06B6D4',       // Cyan (Property crime, stealth/non-violent)
  vandalism: '#8B5CF6',   // Violet (Property damage)
  suspicious: '#6366F1',  // Indigo (Observation, potential threat)
  others: '#64748B',      // Slate (Neutral fallback)
  default: '#64748B'      // Fallback for missing/unknown data
};

const createCustomIcon = (hexColor) => {
  return L.divIcon({
    className: "custom-leaflet-icon",
    // We use inline styles here for the background and a custom tinted shadow
    html: `<div class="w-6 h-6 rounded-full border-2 border-[var(--gl-bg-surface)] shadow-lg flex items-center justify-center animate-pulse" style="background-color: ${hexColor}; box-shadow: 0 4px 10px -1px ${hexColor}80;"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
    tooltipAnchor: [12, 0],
  });
};

const createPinIcon = (mainColorVariable) => {
  const color = `var(${mainColorVariable})`;
  return L.divIcon({
    className: "custom-guardlens-pin",
    html: `
      <div class="relative w-6 h-[26px]">
        <div class="absolute top-0 left-0 w-8 h-8 bg-red-800 rounded-full ">
          <div class="absolute bottom-[-3px] left-1/2 -translate-x-1/2 w-[16px] h-[16px] rotate-45 bg-red-800 rounded-br-sm"></div>
          <div class="absolute inset-[10px] bg-white rounded-full"></div>
        </div>
      </div>`,
    iconSize: [24, 30],
    iconAnchor: [12, 26],
    popupAnchor: [0, -26],
  });
};
export default function CrimeMap() {
  const [activePin, setActivePin] = useState(null);

  const mapRef = useRef(null);
  const searchContainerRef = useRef(null);
  const layerMenuRef = useRef(null); // Added ref for the filter menu
  const defaultPosition = [20.5937, 78.9629]; // Center of India
  //for text to speech
  const [isListening, setIsListening] = useState(false);

  // === MAP TILE & FILTER STATE ===
  const [isLayerMenuOpen, setIsLayerMenuOpen] = useState(false);
  const [mapType, setMapType] = useState("street");

  const tileUrls = {
    street: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    // Swapped ArcGIS for Google Maps Hybrid (lyrs=y means Satellite + Labels)
    satellite: "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
  };

  // const tileUrls = {
  //   street: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  //   satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
  // };

  const [filters, setFilters] = useState({});
  const [crimes, setCrimes] = useState([]);
  const [isLoadingCrimes, setIsLoadingCrimes] = useState(true);

  // === SMART SEARCH STATE ===
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load recent searches from local memory on first boot
  const [recentSearches, setRecentSearches] = useState(() => {
    const saved = localStorage.getItem("guardlens_recent_searches");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    const fetchMapData = async () => {
      try {
        const response = await API.get("/crime/crime-locations");
        const fetchedCrimes = response.data.data;
        setCrimes(fetchedCrimes);

        // Dynamically build your layer menu filters based on the database data!
        const uniqueTypes = [
          ...new Set(fetchedCrimes.map((c) => c.crimeType.toLowerCase())),
        ];
        const newFilters = {};
        uniqueTypes.forEach((type) => (newFilters[type] = true));
        setFilters(newFilters);
      } catch (err) {
        console.error("Failed to load map data:", err);
      } finally {
        setIsLoadingCrimes(false);
      }
    };
    fetchMapData();
  }, []);

  // 1. CLICK OUTSIDE DETECTOR (Updated to handle both Search and Layer Menu)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target)
      ) {
        setIsDropdownOpen(false);
      }
      if (
        layerMenuRef.current &&
        !layerMenuRef.current.contains(event.target)
      ) {
        setIsLayerMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 2. THE DEBOUNCER (Auto-fetch suggestions as you type)
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.trim().length < 3) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        // We limit it to 5 results to keep the UI clean
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`,
        );
        const data = await response.json();
        setSuggestions(data);
      } catch (error) {
        console.error("Autocomplete failed:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Wait 500ms after the user stops typing before fetching
    const delayTimer = setTimeout(fetchSuggestions, 500);
    return () => clearTimeout(delayTimer); // Cancels the previous timer if they keep typing
  }, [searchQuery]);

  // === SPEECH-TO-TEXT ENGINE ===
  const handleVoiceSearch = () => {
    // Check if the browser supports the Web Speech API
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        "Voice search is not supported in this browser. Try Chrome or Safari.",
      );
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US"; // You can change this to 'hi-IN' for Hindi if needed
    recognition.interimResults = false;

    // What happens when it starts listening
    recognition.onstart = () => {
      setIsListening(true);
    };

    // What happens when it hears words
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
      setIsDropdownOpen(true); // Open the dropdown so they see the auto-suggestions immediately
    };

    // What happens when it stops or errors out
    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    // Fire it up
    recognition.start();
  };

  // 3. EXECUTE THE FLIGHT
  const executeSearch = (lat, lon, displayName) => {
    mapRef.current?.flyTo([lat, lon], 14, { animate: true, duration: 1.5 });
    setSearchQuery(displayName);
    setIsDropdownOpen(false);

    // NEW: Drop the pin on the map
    setActivePin({ lat, lon, label: displayName });

    const newRecent = { lat, lon, displayName };
    const updatedRecents = [
      newRecent,
      ...recentSearches.filter((item) => item.displayName !== displayName),
    ].slice(0, 5);
    setRecentSearches(updatedRecents);
    localStorage.setItem(
      "guardlens_recent_searches",
      JSON.stringify(updatedRecents),
    );
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (suggestions.length > 0) {
      // If they hit enter, just fly to the very first suggestion
      executeSearch(
        suggestions[0].lat,
        suggestions[0].lon,
        suggestions[0].display_name,
      );
    }
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem("guardlens_recent_searches");
  };

  const goToUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          mapRef.current?.flyTo([latitude, longitude], 15, {
            animate: true,
            duration: 1.5,
          });

          // NEW: Drop the pin for the user's GPS location
          setActivePin({
            lat: latitude,
            lon: longitude,
            label: "Your Current Location",
          });
        },
        () => alert("Please enable location permissions."),
      );
    }
  };

  // 4. AUTO-LOCATE ON BOOT
useEffect(() => {
  // We wait 1 second so the map finishes rendering the India fallback first, 
  // then we smoothly fly to the user's real location.
  const timer = setTimeout(() => {
    goToUserLocation();
  }, 1000);

  return () => clearTimeout(timer);
}, []);

  const toggleFilter = (crimeType) =>
    setFilters((prev) => ({ ...prev, [crimeType]: !prev[crimeType] }));

  return (
    <div className="h-full w-full relative font-satoshi">
      {/* ========================================== */}
      {/* 1. THE SMART SEARCH BAR                    */}
      {/* ========================================== */}
      <div
        ref={searchContainerRef}
        className="absolute top-4 left-4 right-20 md:right-auto md:w-full md:max-w-sm z-[50]"
      >
        <form
          onSubmit={handleManualSubmit}
          className="relative flex items-center w-full h-12 px-4 rounded-full bg-(--gl-bg-surface) border border-(--gl-border-light) shadow-md transition-shadow focus-within:ring-2 focus-within:ring-(--gl-border-focus) z-20"
        >
          <LuSearch size={20} className="text-(--gl-text-muted) shrink-0" />

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsDropdownOpen(true);
            }}
            onFocus={() => setIsDropdownOpen(true)}
            placeholder="Search location..."
            className="w-full h-full bg-transparent border-none outline-none px-3 text-(--gl-text-main) placeholder:text-(--gl-text-muted) text-sm font-medium"
          />

          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSuggestions([]);
              }}
              className="p-1 mr-1 rounded-full text-(--gl-text-muted) hover:text-(--gl-text-main) transition-colors shrink-0"
            >
              <LuX size={16} />
            </button>
          )}

          <button
            type="button"
            onClick={handleVoiceSearch}
            className={`p-1.5 rounded-full transition-all shrink-0 ${
              isListening
                ? "text-white bg-[#EF4444] animate-pulse shadow-md shadow-red-500/50" // Flashing Red when listening
                : "text-(--gl-text-muted) hover:text-(--gl-text-main) hover:bg-(--gl-bg-surface-hover)"
            }`}
          >
            <LuMic size={18} />
          </button>
        </form>

        {/* ========================================== */}
        {/* THE DROPDOWN MENU                          */}
        {/* ========================================== */}
        {isDropdownOpen &&
          (searchQuery.trim().length > 0 || recentSearches.length > 0) && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-(--gl-bg-surface) border border-(--gl-border-light) rounded-2xl shadow-xl overflow-hidden z-10 flex flex-col max-h-80">
              <div className="overflow-y-auto">
                {/* --- SCENARIO A: SHOWING SUGGESTIONS WHILE TYPING --- */}
                {searchQuery.trim().length > 0 ? (
                  <>
                    {isLoading ? (
                      <div className="p-4 text-center text-sm text-(--gl-text-muted)">
                        Searching...
                      </div>
                    ) : suggestions.length > 0 ? (
                      suggestions.map((place, idx) => (
                        <button
                          key={idx}
                          onClick={() =>
                            executeSearch(
                              place.lat,
                              place.lon,
                              place.display_name,
                            )
                          }
                          className="w-full flex items-start gap-3 p-3 text-left hover:bg-(--gl-bg-surface-hover) transition-colors border-b border-(--gl-border-light) last:border-0"
                        >
                          <LuMapPin
                            size={18}
                            className="text-(--gl-text-muted) mt-0.5 shrink-0"
                          />
                          <span className="text-sm text-(--gl-text-main) line-clamp-2">
                            {place.display_name}
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="p-4 text-center text-sm text-(--gl-text-muted)">
                        No results found.
                      </div>
                    )}
                  </>
                ) : (
                  /* --- SCENARIO B: SHOWING RECENT SEARCHES (EMPTY INPUT) --- */
                  <>
                    <div className="flex items-center justify-between px-4 py-2 bg-(--gl-bg-surface-hover) border-b border-(--gl-border-light)">
                      <span className="text-xs font-bold text-(--gl-text-muted) uppercase tracking-wider">
                        Recent Searches
                      </span>
                      <button
                        onClick={clearRecentSearches}
                        className="text-[10px] font-bold text-(--gl-sos-base) hover:opacity-80"
                      >
                        CLEAR
                      </button>
                    </div>
                    {recentSearches.map((place, idx) => (
                      <button
                        key={idx}
                        onClick={() =>
                          executeSearch(place.lat, place.lon, place.displayName)
                        }
                        className="w-full flex items-start gap-3 p-3 text-left hover:bg-(--gl-bg-surface-hover) transition-colors border-b border-(--gl-border-light) last:border-0"
                      >
                        <LuClock
                          size={18}
                          className="text-(--gl-text-muted) mt-0.5 shrink-0"
                        />
                        <span className="text-sm text-(--gl-text-main) line-clamp-2">
                          {place.displayName}
                        </span>
                      </button>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}
      </div>

      {isLoadingCrimes && (
        <div className="absolute inset-0 z-[2000] bg-(--gl-bg-base)/50 backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <div className="bg-(--gl-bg-surface) px-6 py-4 rounded-xl shadow-2xl font-bold text-(--gl-brand-primary) animate-pulse flex items-center gap-3">
            <LuMapPin className="animate-bounce" /> Syncing Live Data...
          </div>
        </div>
      )}
      {/* ========================================== */}
      {/* 2. THE MAP ENGINE                            */}
      {/* ========================================== */}
      <MapContainer
        center={defaultPosition}
        zoom={5}
        scrollWheelZoom={true}
        className="h-full w-full z-0"
        ref={mapRef}
        zoomControl={false}
        minZoom={3}
        maxBounds={[[-90, -180], [90, 180]]}
      >
        <TileLayer url={tileUrls[mapType]} />
        {/* YOUR NEW ACTIVE PIN */}
        {activePin && (
          <Marker
            position={[activePin.lat, activePin.lon]}
            icon={createPinIcon("--gl-sos-base")}
          >
            <Popup className="font-satoshi font-bold">{activePin.label}</Popup>
          </Marker>
        )}

        {/* DATABASE CRIME PINS */}
        {crimes.map((crime) => {
          const crimeKey = crime.crimeType.toLowerCase();
          // Check if this crime type is toggled ON in your layer menu filters
          const isVisible = filters[crime.crimeType.toLowerCase()] !== false;
          if (!isVisible) return null;

          const pinColor = crimeColors[crimeKey] || crimeColors.default;

          return (
            <Marker
              key={crime._id}
              position={[
                crime.crimeLocation.latitude,
                crime.crimeLocation.longitude,
              ]}
              icon={createCustomIcon(pinColor)}
            >
              <Tooltip
                className="custom-tooltip font-satoshi border-0 shadow-lg rounded-lg"
                direction="top"
                offset={[0, -10]}
              >
                <div className="text-center">
                  <p className="font-bold text-(--gl-text-main) uppercase text-sm">
                    {crime.crimeType}
                  </p>
                  <p className="text-xs text-(--gl-text-muted)">
                    {crime.status === "verified" ? "Verified" : "Pending"}
                  </p>
                </div>
              </Tooltip>

              <Popup className="custom-popup" maxWidth={320} minWidth={280}>
                <div className="flex flex-col gap-3 font-satoshi text-(--gl-text-main) p-1">
                  <div className="flex justify-between items-start border-b border-(--gl-border-light) pb-2">
                    <div>
                      <h3 className="font-bold text-lg leading-tight uppercase">
                        {crime.crimeType}
                      </h3>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider text-white ${crime.status === "verified" ? "bg-(--gl-status-success)" : "bg-(--gl-status-warning)"}`}
                      >
                        {crime.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                    <p className="text-sm leading-snug">
                      {crime.crimeDescription || "No description provided."}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-(--gl-text-muted) mt-1">
                      <LuClock size={12} />{" "}
                      {new Date(crime.crimeTime).toLocaleString()}
                    </div>
                  </div>

                  {(crime.images?.length > 0 || crime.videoUrl) && (
                    <div className="mt-2 pt-2 border-t border-(--gl-border-light)">
                      <p className="text-xs font-bold text-(--gl-text-muted) uppercase tracking-wider mb-2 flex items-center gap-1">
                        <LuInfo size={12} /> Evidence Attached
                      </p>
                      {crime.images?.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pb-1">
                          {crime.images.map((img, i) => (
                            <img
                              key={i}
                              src={img}
                              alt="evidence"
                              className="w-12 h-12 rounded object-cover border border-(--gl-border-light) flex-shrink-0"
                            />
                          ))}
                        </div>
                      )}
                      {crime.videoUrl && (
                        <div className="flex items-center gap-2 mt-2 text-xs font-bold text-(--gl-brand-primary) bg-(--gl-bg-surface-hover) p-2 rounded">
                          <LuVideo size={14} /> Video available
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* ========================================== */}
      {/* 3. FLOATING MAP CONTROLS                     */}
      {/* ========================================== */}
      <div className="absolute bottom-20 md:bottom-8 right-4 z-[40] flex flex-col gap-3 items-end">
        {/* Wrapped layer menu and button in a div with layerMenuRef */}
        <div ref={layerMenuRef} className="flex flex-col items-end gap-3">
          {isLayerMenuOpen && (
            <div className="bg-(--gl-bg-surface) border border-(--gl-border-light) rounded-2xl shadow-xl p-4 w-48 mb-2 flex flex-col gap-4">
              <div>
                <p className="text-xs font-bold text-(--gl-text-muted) uppercase tracking-wider mb-2">
                  Map Type
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setMapType("street")}
                    className={`flex-1 flex flex-col items-center p-2 rounded-xl border transition-colors ${mapType === "street" ? "bg-(--gl-bg-surface-hover) border-(--gl-border-focus) text-(--gl-brand-primary)" : "border-transparent text-(--gl-text-main) hover:bg-(--gl-bg-surface-hover)"}`}
                  >
                    <LuMap size={20} className="mb-1" />
                    <span className="text-[10px] font-bold">Street</span>
                  </button>
                  <button
                    onClick={() => setMapType("satellite")}
                    className={`flex-1 flex flex-col items-center p-2 rounded-xl border transition-colors ${mapType === "satellite" ? "bg-(--gl-bg-surface-hover) border-(--gl-border-focus) text-(--gl-brand-primary)" : "border-transparent text-(--gl-text-main) hover:bg-(--gl-bg-surface-hover)"}`}
                  >
                    <LuSatellite size={20} className="mb-1" />
                    <span className="text-[10px] font-bold">Satellite</span>
                  </button>
                </div>
              </div>
              <div className="border-t border-(--gl-border-light) pt-3">
                <p className="text-xs font-bold text-(--gl-text-muted) uppercase tracking-wider mb-2">
                  Show Crimes
                </p>
                {Object.keys(filters).map((crime) => {
                  // Look up the exact same color for the menu legend
                  const dotColor = crimeColors[crime] || crimeColors.default;

                  return (
                    <label
                      key={crime}
                      className="flex items-center gap-3 py-1 cursor-pointer hover:bg-(--gl-bg-surface-hover) px-2 rounded-lg transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={filters[crime]}
                        onChange={() => toggleFilter(crime)}
                        className="w-4 h-4 rounded border-(--gl-border-light) text-(--gl-brand-primary) focus:ring-(--gl-border-focus)"
                      />

                      {/* THE NEW LEGEND DOT */}

                      <span className="text-sm font-medium text-(--gl-text-main) capitalize">
                        {crime}
                      </span>

                      <span
                        className="w-3 h-3 rounded-full shadow-sm"
                        style={{ backgroundColor: dotColor }}
                      ></span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
          <button
            onClick={() => setIsLayerMenuOpen(!isLayerMenuOpen)}
            className="flex items-center justify-center h-12 w-12 rounded-full bg-(--gl-bg-surface) text-(--gl-text-main) border border-(--gl-border-light) shadow-md hover:shadow-lg transition-all focus:outline-none"
          >
            <LuLayers size={22} />
          </button>
        </div>
        <button
          onClick={goToUserLocation}
          className="flex items-center justify-center h-12 w-12 rounded-full bg-(--gl-bg-surface) text-(--gl-brand-primary) border border-(--gl-border-light) shadow-md hover:shadow-lg transition-all focus:outline-none"
        >
          <LuLocateFixed size={22} />
        </button>
      </div>

      {/* Inject Leaflet popup/tooltip custom overrides */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .leaflet-popup-content-wrapper { border-radius: 12px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1); background: var(--gl-bg-surface); }
        .leaflet-popup-content { margin: 12px; color: var(--gl-text-main); }
        .leaflet-tooltip { padding: 8px 12px; background: var(--gl-bg-surface); border-radius: 8px; color: var(--gl-text-main); }
        .leaflet-popup-tip { background: var(--gl-bg-surface); }
        .leaflet-tooltip-top:before { border-top-color: var(--gl-bg-surface); }
      `,
        }}
      />
    </div>
  );
}
