"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    google: any;
  }
}

interface Library {
  name: string;
  address: {
    block: string;
    streetName: string;
    buildingName: string;
    unit: string;
    country: string;
    postalCode: string;
  };
  coordinates: {
    geoLatitude: string;
    geoLongitude: string;
  };
  distance?: number; // Added distance field
}

export default function Maps() {
  const mapsAPIKey = "AIzaSyCUQiQ8Ku1c06N3e3CYVRdKKozErIydD9w";
  const mapRef = useRef(null);
  const markerRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [location, setLocation] = useState("");
  const [query, setQuery] = useState("Singapore");
  const router = useRouter();
  const [selectedLocation, setSelectedLocation] = useState("");
  const markersRef = useRef<{ libName: string; marker: any }[]>([]);
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [filteredLibraries, setFilteredLibraries] = useState<Library[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchLocation, setSearchLocation] = useState<{ lat: number; lng: number } | null>(null);
  const hasFetched = useRef(false);

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return Math.round(distance * 10) / 10; // Round to 1 decimal place
  };

  // Sort libraries by distance from search location
  const sortLibrariesByDistance = (libraries: Library[], searchLat: number, searchLng: number): Library[] => {
    return libraries
      .map(lib => {
        const libLat = parseFloat(lib.coordinates.geoLatitude);
        const libLng = parseFloat(lib.coordinates.geoLongitude);
        if (isNaN(libLat) || isNaN(libLng)) return { ...lib, distance: Infinity };
        
        const distance = calculateDistance(searchLat, searchLng, libLat, libLng);
        return { ...lib, distance };
      })
      .filter(lib => lib.distance !== Infinity)
      .sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
  };

  // Detect if we're coming from edit form
  useEffect(() => {
    const editForm = sessionStorage.getItem('editGroupForm');
    if (editForm) {
      const formData = JSON.parse(editForm);
      setSelectedLocation(formData.location || '');
      setLocation(formData.location || '');
    }
  }, []);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    async function loadLibraries() {
      setIsLoading(true);
      try {
        const res = await fetch("/api/libraries");
        const data = await res.json();
        const loadedLibraries = Array.isArray(data) ? data : [];
        setLibraries(loadedLibraries);
        setFilteredLibraries(loadedLibraries); // Initially show all libraries
      } catch (error) {
        console.error("Failed to load libraries:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadLibraries();
  }, []);

  useEffect(() => {
    if (!mapInstance) return;
    if (!filteredLibraries || filteredLibraries.length === 0) return;

    // Clear existing markers
    markersRef.current.forEach(({ marker }) => marker.setMap(null));
    markersRef.current = [];

    const duplicates = filteredLibraries.filter((lib, i, arr) =>
      arr.some(
        (other, j) =>
          i !== j &&
          lib.coordinates.geoLatitude === other.coordinates.geoLatitude &&
          lib.coordinates.geoLongitude === other.coordinates.geoLongitude
      )
    );

    const offset = (index: number) => (index % 2 === 0 ? 0.00005 : -0.00005);

    filteredLibraries.forEach((lib, index) => {
      let lat = parseFloat(lib.coordinates?.geoLatitude);
      let lng = parseFloat(lib.coordinates?.geoLongitude);
      if (isNaN(lat) || isNaN(lng)) return;

      const duplicateCount = filteredLibraries.filter(
        (other) =>
          other.coordinates.geoLatitude === lib.coordinates.geoLatitude &&
          other.coordinates.geoLongitude === lib.coordinates.geoLongitude
      ).length;

      if (duplicateCount > 1) {
        lat += offset(index);
        lng += offset(index);
      }

      const marker = new window.google.maps.Marker({
        position: { lat, lng },
        map: mapInstance,
        title: `${lib.name}${lib.distance ? ` (${lib.distance}km)` : ''}`,
        icon: {
          url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
        },
      });

      marker.addListener("click", () => {
        markersRef.current.forEach(({ libName, marker: m }) => {
          m.setIcon({
            url:
              libName === lib.name
                ? "https://maps.google.com/mapfiles/ms/icons/red-dot.png"
                : "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
          });
        });

        const countryAndPostal =
          lib.address?.country && lib.address?.postalCode
            ? `${lib.address.country} ${lib.address.postalCode}`
            : lib.address?.country || lib.address?.postalCode || "";

        const fullAddress = [
          lib.address?.block,
          lib.address?.streetName,
          lib.address?.buildingName,
          countryAndPostal,
        ]
          .filter(Boolean)
          .join(", ");

        setSelectedLocation(fullAddress);
        setLocation(fullAddress);
      });

      markersRef.current.push({ libName: lib.name, marker });
    });
  }, [filteredLibraries, mapInstance]);

  const handleLocationSelect = () => {
    if (!selectedLocation) {
      alert("Please select a location first!");
      return;
    }

    const editForm = sessionStorage.getItem('editGroupForm');
    
    sessionStorage.setItem('selectedLocation', selectedLocation);
    
    if (editForm) {
      const formData = JSON.parse(editForm);
      router.push(`/groups?tab=mine&edit=${formData.groupId}`);
    } else {
      router.push('/groups/create');
    }
  };

  useEffect(() => {
    const existingScript = document.querySelector(
      'script[src^="https://maps.googleapis.com/maps/api/js"]'
    );

    if (!existingScript) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${mapsAPIKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => setMapLoaded(true);
      document.head.appendChild(script);
    } else {
      if (window.google) {
        setMapLoaded(true);
      } else {
        existingScript.addEventListener("load", () => setMapLoaded(true));
      }
    }
  }, [mapsAPIKey]);

  useEffect(() => {
    if (!mapLoaded || mapInstance) return;

    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: 1.3521, lng: 103.8198 },
      zoom: 12,
    });

    map.addListener("click", async (e) => {
      markersRef.current.forEach(({ marker }) => {
        marker.setIcon({
          url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
        });
      });

      const lat = e.latLng.lat();
      const lng = e.latLng.lng();

      const geocoder = new window.google.maps.Geocoder();
      const res = await geocoder.geocode({ location: { lat, lng } });

      let address = "";
      if (res.results[0]) {
        address = res.results[0].formatted_address;
        setLocation(address);
      } else {
        address = `Lat: ${lat}, Lng: ${lng}`;
        setLocation(address);
      }

      setSelectedLocation(address);

      if (markerRef.current) {
        markerRef.current.setMap(null);
      }

      markerRef.current = new window.google.maps.Marker({
        position: { lat, lng },
        map: map,
        icon: {
          url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
        },
      });

      // Update libraries with distances from clicked location
      const sortedLibraries = sortLibrariesByDistance(libraries, lat, lng);
      setFilteredLibraries(sortedLibraries);
      setSearchLocation({ lat, lng });
    });

    setMapInstance(map);
  }, [mapLoaded, mapInstance, libraries]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query || !mapInstance) return;

    setIsLoading(true);
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: query }, (results, status) => {
      setIsLoading(false);
      if (status === "OK" && results[0]) {
        const loc = results[0].geometry.location;
        const lat = loc.lat();
        const lng = loc.lng();

        mapInstance.setCenter(loc);
        mapInstance.setZoom(15);

        if (markerRef.current) {
          markerRef.current.setMap(null);
        }

        markerRef.current = new window.google.maps.Marker({
          position: loc,
          map: mapInstance,
          icon: {
            url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
          },
        });

        setLocation(results[0].formatted_address);
        setSelectedLocation(results[0].formatted_address);
        setSearchLocation({ lat, lng });

        // Sort libraries by distance from searched location
        const sortedLibraries = sortLibrariesByDistance(libraries, lat, lng);
        setFilteredLibraries(sortedLibraries);

      } else {
        alert("Location not found");
      }
    });
  };

  const showAllLibraries = () => {
    setFilteredLibraries(libraries);
    setSearchLocation(null);
    if (mapInstance) {
      mapInstance.setCenter({ lat: 1.3521, lng: 103.8198 });
      mapInstance.setZoom(12);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Select Study Location
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Choose a library or search for any location in Singapore to set your study group meeting point
          </p>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <form onSubmit={handleSearch} className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search for locations in Singapore..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-black to-blue-700 text-white px-8 py-3 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Searching...
                </>
              ) : (
                <>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Search
                </>
              )}
            </button>
          </form>
        </div>

        {/* Main Content */}
        <div className="flex gap-6">
          {/* Map Container */}
          <div className="flex-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div
                ref={mapRef}
                className="w-full h-[600px] rounded-xl"
              />
            </div>

            {/* Selected Location Panel */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Selected Location</h3>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <p className={`text-lg ${location ? 'text-gray-900' : 'text-gray-500'}`}>
                        {location || "No location selected"}
                      </p>
                      {searchLocation && (
                        <p className="text-sm text-gray-600 mt-1">
                          📍 Showing libraries by distance from this location
                        </p>
                      )}
                    </div>
                    {!selectedLocation && (
                      <span className="text-sm text-red-600 bg-red-50 px-3 py-1 rounded-full">
                        Please select a location
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleLocationSelect}
                  disabled={!selectedLocation}
                  className={`px-8 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                    selectedLocation
                      ? "bg-gradient-to-r from-black to-blue-700 text-white hover:opacity-90 shadow-sm"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Use This Location
                </button>
              </div>
            </div>
          </div>

          {/* Libraries Sidebar */}
          <div className="w-96">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-black to-blue-700 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                      </svg>
                      {searchLocation ? 'Nearby Libraries' : 'Libraries'}
                    </h3>
                    <p className="text-blue-100 text-sm mt-1">
                      {searchLocation 
                        ? 'Sorted by distance from your search location' 
                        : 'Click on a library to select it as your study location'
                      }
                    </p>
                  </div>
                  {searchLocation && (
                    <button
                      onClick={showAllLibraries}
                      className="text-xs bg-white/20 text-white px-3 py-1 rounded-lg hover:bg-white/30 transition-colors"
                    >
                      Show All
                    </button>
                  )}
                </div>
              </div>
              
              <div className="h-[528px] overflow-y-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : !Array.isArray(filteredLibraries) || filteredLibraries.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <svg className="h-12 w-12 mx-auto text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <p>No libraries found</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {filteredLibraries.map((lib, index) => {
                      const isSelected = selectedLocation.includes(lib.name);
                      return (
                        <li
                          key={index}
                          onClick={() => {
                            const lat = parseFloat(lib.coordinates.geoLatitude);
                            const lng = parseFloat(lib.coordinates.geoLongitude);
                            if (!isNaN(lat) && !isNaN(lng) && mapInstance) {
                              mapInstance.setCenter({ lat, lng });
                              mapInstance.setZoom(16);
                            }

                            markersRef.current.forEach(({ libName, marker }) => {
                              marker.setIcon({
                                url:
                                  libName === lib.name
                                    ? "https://maps.google.com/mapfiles/ms/icons/red-dot.png"
                                    : "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                              });
                            });

                            const countryAndPostal =
                              lib.address?.country && lib.address?.postalCode
                                ? `${lib.address.country} ${lib.address.postalCode}`
                                : lib.address?.country || lib.address?.postalCode || "";

                            const fullAddress = [
                              lib.address?.block,
                              lib.address?.streetName,
                              lib.address?.buildingName,
                              countryAndPostal,
                            ]
                              .filter(Boolean)
                              .join(", ");

                            setSelectedLocation(fullAddress);
                            setLocation(fullAddress);
                          }}
                          className={`p-4 cursor-pointer transition-all duration-200 hover:bg-gray-50 group ${
                            isSelected ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                              isSelected ? 'bg-blue-600' : 'bg-gray-300 group-hover:bg-blue-400'
                            }`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <h4 className={`font-medium truncate ${
                                  isSelected ? 'text-blue-900' : 'text-gray-900'
                                }`}>
                                  {lib.name}
                                </h4>
                                {lib.distance !== undefined && (
                                  <span className="flex-shrink-0 bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full ml-2">
                                    {lib.distance} km
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                {lib.address.block} {lib.address.streetName}
                                {lib.address.buildingName && `, ${lib.address.buildingName}`}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {lib.address.postalCode}
                              </p>
                            </div>
                            {isSelected && (
                              <svg className="flex-shrink-0 w-5 h-5 text-blue-600 mt-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}