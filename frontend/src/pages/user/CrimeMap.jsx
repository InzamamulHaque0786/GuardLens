import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';

export default function CrimeMap() {
  // Center coordinates (Currently set near Patna, Bihar, India based on your time zone)
  // change these to whatever default location you want!
  const defaultPosition = [25.5941, 85.1376]; 

  return (
    // The MapContainer MUST have a height, or it won't render at all
    <div className="h-full w-full">
      <MapContainer 
        center={defaultPosition} 
        zoom={13} 
        scrollWheelZoom={true}
        className="h-full w-full z-0" // z-0 ensures it stays UNDER your floating widgets
      >
        {/* The TileLayer is the actual imagery. We use standard OpenStreetMap tiles (100% free) */}
        {/* <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        /> */}

        <TileLayer
  attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
/>
        
        {/* A sample pin on the map */}
        <Marker position={defaultPosition}>
          <Popup>
            Welcome to the Map! <br /> You can customize this popup.
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}