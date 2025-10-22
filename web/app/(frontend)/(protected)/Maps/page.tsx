
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    google: any; // or install @types/google.maps for proper types
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
}
export default function Maps() {
  const mapsAPIKey = "AIzaSyCUQiQ8Ku1c06N3e3CYVRdKKozErIydD9w";
  const mapRef = useRef(null);
  const markerRef = useRef<any>(null); // Store current marker
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [location, setLocation] = useState("");
  const [query, setQuery] = useState("Singapore");
  const router = useRouter();
  const [selectedLocation, setSelectedLocation] = useState("");
  const markersRef = useRef<{ libName: string; marker: any }[]>([]);

  const [libraries, setLibraries] = useState<Library[]>([]);

  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return; // skip if already fetched
    hasFetched.current = true;

    async function loadLibraries() {
      const res = await fetch("/api/libraries");
      const data = await res.json();
      setLibraries(Array.isArray(data) ? data : []);
    }

    loadLibraries();
  }, []);

  useEffect(() => {
    if (!mapInstance) return;
    if (!libraries || libraries.length === 0) return;

    const duplicates = libraries.filter((lib, i, arr) =>
      arr.some(
        (other, j) =>
          i !== j &&
          lib.coordinates.geoLatitude === other.coordinates.geoLatitude &&
          lib.coordinates.geoLongitude === other.coordinates.geoLongitude
      )
    );

    if (duplicates.length > 0) {
      console.warn(
        `⚠️ Found ${duplicates.length} libraries with duplicate coordinates:`,
        duplicates.map((d) => d.name)
      );
    } else {
      console.log(
        "✅ No duplicate coordinates found — all markers should be visible."
      );
    }



  const offset = (index: number) => (index % 2 === 0 ? 0.00005 : -0.00005);

  libraries.forEach((lib, index) => {
    let lat = parseFloat(lib.coordinates?.geoLatitude);
    let lng = parseFloat(lib.coordinates?.geoLongitude);
    if (isNaN(lat) || isNaN(lng)) return;

    // If multiple libraries share the same coordinate, offset slightly
    const duplicateCount = libraries.filter(
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
      title: lib.name,
      icon: {
        url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
      },
    });

  // Add click handler to toggle color
  marker.addListener("click", () => {
    markersRef.current.forEach(({ libName, marker: m }) => {
      m.setIcon({
        url:
          libName === lib.name
            ? "https://maps.google.com/mapfiles/ms/icons/red-dot.png"
            : "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
      });
    });
    setSelectedLocation(lib.name);
    setLocation(lib.name);
  });

  markersRef.current.push({ libName: lib.name, marker });
});
  }, [libraries, mapInstance]);




  const handleMapClick = (location: string) => {
    setSelectedLocation(location);
  };
  

  const returnLocation = () => {
    if (!selectedLocation) {
      alert("Please select a location first!");
      return; 
    }

     sessionStorage.setItem("selectedLocation", selectedLocation);
     router.push("/groups/create");

  };





  // Load Google Maps JS API
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
    // If already loaded, check if window.google is ready
    if (window.google) {
      setMapLoaded(true);
    } else {
      existingScript.addEventListener("load", () => setMapLoaded(true));
    }
  }
}, [mapsAPIKey]);
  
  
  

  // Initialize map after script loads
  useEffect(() => {
    if (!mapLoaded || mapInstance) return;

    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: 1.3521, lng: 103.8198 }, // default: Singapore
      zoom: 12,
    });

    // Click listener to get coordinates or reverse-geocode
    map.addListener("click", async (e) => {
      // 🔵 Reset all library markers to blue when user clicks on the map
      markersRef.current.forEach(({ marker }) => {
        marker.setIcon({
          url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
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

      // Also update selectedLocation so Return button works
      setSelectedLocation(address);

      // Remove previous marker if it exists
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }

      // Add a new marker at the clicked location
      markerRef.current = new window.google.maps.Marker({
        position: { lat, lng },
        map: map,
        icon: {
          url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
        },
      });
    });

    setMapInstance(map);
  }, [mapLoaded, mapInstance]);

  // Handle search form submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query || !mapInstance) return;

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: query }, (results, status) => {
      if (status === "OK" && results[0]) {
        const loc = results[0].geometry.location;

        mapInstance.setCenter(loc);
        mapInstance.setZoom(15);

        // Remove previous marker if it exists
        if (markerRef.current) {
          markerRef.current.setMap(null);
        }

        // Add new marker at search result
        markerRef.current = new window.google.maps.Marker({
          position: loc,
          map: mapInstance,
        });

        setLocation(results[0].formatted_address);
        setSelectedLocation(results[0].formatted_address);
      } else {
        alert("Location not found");
      }
    });
  };

  return (
    <div style={{ textAlign: "center", marginTop: "20px", color: "#585252ff" }}>
      {/* Search Bar */}
      <form onSubmit={handleSearch} style={{ marginBottom: "10px" }}>
        <input
          type="text"
          placeholder="Search location"
          //value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            padding: "10px",
            width: "300px",
            borderRadius: "4px 0 0 4px",
            border: "1px solid #ccc",
            outline: "none",
          }}
        />
        <button
          type="submit"
          style={{
            padding: "10px 15px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "0 4px 4px 0",
            cursor: "pointer",
          }}
        >
          Search
        </button>
      </form>

      {/* Map */}
      <div
        ref={mapRef}
        style={{
          width: "100%",
          height: "1000px",
          border: "2px solid #000",
          borderRadius: "8px",
        }}
      />

      {/* Floating Library List */}
      <div
        style={{
          position: "absolute",
          top: "300px",
          right: "20px",
          width: "400px",
          height: "800px",
          backgroundColor: "rgba(255,255,255,0.95)",
          borderRadius: "8px",
          boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
          padding: "10px",
          overflowY: "auto",
          zIndex: 3,
        }}
      >
        <h3 style={{ marginBottom: "10px", textAlign: "center" }}>
          📚 Libraries
        </h3>

        {!Array.isArray(libraries) || libraries.length === 0 ? (
          <p>Loading libraries...</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {libraries.map((lib, index) => (
              <li
                key={index}
                onClick={() => {
                  const lat = parseFloat(lib.coordinates.geoLatitude);
                  const lng = parseFloat(lib.coordinates.geoLongitude);
                  if (!isNaN(lat) && !isNaN(lng) && mapInstance) {
                    mapInstance.setCenter({ lat, lng });
                    mapInstance.setZoom(16);
                  }
                  if (markerRef.current) {
                    markerRef.current.setMap(null);
                    markerRef.current = null;
                  }

                  // Change marker colors using the ref, not state
                  markersRef.current.forEach(({ libName, marker }) => {
                    marker.setIcon({
                      url:
                        libName === lib.name
                          ? "http://maps.google.com/mapfiles/ms/icons/red-dot.png"
                          : "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                    });
                  });

                  setSelectedLocation(lib.name);
                  setLocation(lib.name);
                }}
                style={{
                  backgroundColor:
                    selectedLocation === lib.name ? "#dbeafe" : "white",
                  padding: "8px",
                  marginBottom: "6px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  transition: "background-color 0.2s",
                }}
              >
                <strong>{lib.name}</strong>
                <br />
                <small>
                  {lib.address.block} {lib.address.streetName},{" "}
                  {lib.address.postalCode}
                </small>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Selected location */}
      <div
        style={{
          marginTop: "50px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
        }}
      >
        <span style={{ color: "#080808ff", fontSize: "19px" }}>
          Selected Location: {location}
        </span>
        {!selectedLocation && (
          <span style={{ color: "#f87171", fontSize: "14px" }}>
            No location selected
          </span>
        )}
        <button
          className={`mt-1 px-4 py-1 rounded ${
            selectedLocation
              ? "bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
              : "bg-gray-400 text-gray-200 cursor-not-allowed"
          }`}
          onClick={returnLocation}
          disabled={!selectedLocation}
        >
          Return Location
        </button>
      </div>
    </div>
  );
}

