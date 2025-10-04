"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    google: any; // or you can use more precise types if you install @types/google.maps
  }
}

export default function Maps() {
  const mapRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapInstance, setMapInstance] = useState(null);
  const [location, setLocation] = useState("");
  const [query, setQuery] = useState("Singapore");

  // Load Google Maps JS API
  useEffect(() => {
    if (!window.google) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyCUQiQ8Ku1c06N3e3CYVRdKKozErIydD9w&libraries=places`;
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

      if (res.results[0]) {
        setLocation(res.results[0].formatted_address);
      } else {
        setLocation(`Lat: ${lat}, Lng: ${lng}`);
      }
    });

    setMapInstance(map);
  }, [mapLoaded, mapInstance]);

  // Handle search form submit
  const handleSearch = (e) => {
    e.preventDefault();
    if (!query || !mapInstance) return;

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: query }, (results, status) => {
      if (status === "OK" && results[0]) {
        const location = results[0].geometry.location;
        mapInstance.setCenter(location);
        mapInstance.setZoom(15);

        // Optional: mark searched location
        new window.google.maps.Marker({
          position: location,
          map: mapInstance,
        });
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
      <p style={{ marginTop: "10px" }}>Selected Location: {location}</p>
    </div>
  );
}
