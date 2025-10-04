
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
declare global {
  interface Window {
    google: any; // or install @types/google.maps for proper types
  }
}


export default function Maps() {
  const apiKey = "AIzaSyCUQiQ8Ku1c06N3e3CYVRdKKozErIydD9w";
  const mapRef = useRef(null);
  const markerRef = useRef<any>(null); // Store current marker
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [location, setLocation] = useState("");
  const [query, setQuery] = useState("Singapore");
  const router = useRouter();
  const [selectedLocation, setSelectedLocation] = useState("");

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
    if (!window.google) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => setMapLoaded(true);
      document.head.appendChild(script);
    } else {
      setMapLoaded(true);
    }
  }, []);

  // Initialize map after script loads
  useEffect(() => {
    if (!mapLoaded || mapInstance) return;

    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: 1.3521, lng: 103.8198 }, // default: Singapore
      zoom: 12,
    });

    // Click listener to get coordinates or reverse-geocode
    map.addListener("click", async (e) => {
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
    <div style={{ textAlign: "center", marginTop: "20px" }}>
      {/* Search Bar */}
      <form onSubmit={handleSearch} style={{ marginBottom: "10px" }}>
        <input
          type="text"
          placeholder="Search location..."
          value={query}
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
        <span>Selected Location: {location}</span>
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

