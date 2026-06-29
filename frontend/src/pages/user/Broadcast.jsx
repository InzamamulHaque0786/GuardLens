import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import API from "../../api/API";
import { 
  LuRadioReceiver, LuMapPin, LuShieldAlert, 
  LuClock, LuVolume2 
} from "react-icons/lu";

// Math formula to calculate the exact distance between two GPS coordinates in meters
const getDistanceInMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * rad) * Math.cos(lat2 * rad) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export default function Broadcast() {
  const [alerts, setAlerts] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [loadingMsg, setLoadingMsg] = useState("Acquiring GPS Signal...");

  useEffect(() => {
    // 1. Get User's Location First
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(loc);
          fetchAndFilterAlerts(loc);
        },
        (err) => {
          setLoadingMsg("Please enable location services to receive local alerts.");
        }
      );
    } else {
      setLoadingMsg("Geolocation is not supported by your browser.");
    }

    // 2. Open the real-time WebSocket connection to your backend
    // IMPORTANT: Make sure this matches your backend port (usually 5000)
    // const socket = io("http://localhost:3000"); 
    const socket = io("https://guardlens-v0cv.onrender.com", {
    withCredentials: true
});

    // 3. Listen for the 'receive_broadcast' event from the Admin
    socket.on("receive_broadcast", (newBroadcast) => {
      console.log("Live Alert Received!", newBroadcast);
      
      // If we have the user's location, check if this new live alert is meant for them
      setUserLocation((currentLoc) => {
        if (currentLoc) {
          const alertLat = newBroadcast.location.coordinates[1];
          const alertLng = newBroadcast.location.coordinates[0];
          const distance = getDistanceInMeters(currentLoc.lat, currentLoc.lng, alertLat, alertLng);

          // If the user is inside the danger radius, add it to the top of the feed!
          if (distance <= newBroadcast.radiusInMeters) {
            setAlerts((prev) => [newBroadcast, ...prev]);
            
            // Optional: You can trigger a native browser notification here!
            if (Notification.permission === 'granted') {
               new Notification("EMERGENCY ALERT: " + newBroadcast.title, { body: newBroadcast.message });
            }
          }
        }
        return currentLoc;
      });
    });

    // Request notification permission for live popups
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }

    // Cleanup the socket connection if the user leaves the page
    return () => socket.disconnect();
  }, []);

  const fetchAndFilterAlerts = async (loc) => {
    try {
      setLoadingMsg("Scanning for local broadcasts...");
      const response = await API.get("/broadcast"); // Using your route
      
      if (response.data.success) {
        const allActiveAlerts = response.data.data;
        
        // Filter out alerts that are too far away
        const localAlerts = allActiveAlerts.filter(alert => {
          const alertLat = alert.location.coordinates[1]; // MongoDB stores [lng, lat]
          const alertLng = alert.location.coordinates[0];
          const distance = getDistanceInMeters(loc.lat, loc.lng, alertLat, alertLng);
          return distance <= alert.radiusInMeters;
        });

        setAlerts(localAlerts);
      }
    } catch (error) {
      setLoadingMsg("Failed to connect to emergency servers.");
    } finally {
      setLoadingMsg("");
    }
  };

  if (!userLocation || loadingMsg) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-(--gl-bg-base) p-4 text-center font-satoshi text-(--gl-text-main)">
        <LuRadioReceiver size={48} className="text-(--gl-sos-base) animate-pulse mb-4" />
        <h2 className="text-xl font-bold">{loadingMsg}</h2>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 font-satoshi text-(--gl-text-main)">
      
      <div className="flex items-center justify-between mb-8 border-b border-(--gl-border-light) pb-4">
        <div>
          <h1 className="text-3xl font-integral font-bold text-(--gl-sos-base) flex items-center gap-3">
            <LuShieldAlert size={32} /> Local Alerts
          </h1>
          <p className="text-(--gl-text-muted) mt-2 font-medium flex items-center gap-1">
            <LuMapPin size={16} /> Scanning your immediate area
          </p>
        </div>
        
        {/* Live Indicator */}
        <div className="flex items-center gap-2 bg-(--gl-bg-surface) border border-(--gl-border-light) text-(--gl-status-success) px-3 py-1.5 rounded-full text-sm font-bold shadow-sm">
          <div className="w-2.5 h-2.5 bg-(--gl-status-success) rounded-full animate-ping"></div>
          Live Feed
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {alerts.length === 0 ? (
          <div className="bg-(--gl-bg-surface) border border-(--gl-border-light) rounded-2xl p-10 text-center flex flex-col items-center">
            <LuShieldAlert size={48} className="text-(--gl-status-success) mb-4" />
            <h3 className="text-xl font-bold">No Active Alerts</h3>
            <p className="text-(--gl-text-muted) mt-2">Your area is currently clear. Any emergency broadcasts in your radius will appear here instantly.</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div key={alert._id} className="bg-(--gl-sos-pulse) border-l-4 border-(--gl-sos-base) rounded-r-2xl p-5 md:p-6 shadow-sm flex flex-col gap-3 transition-all hover:shadow-md">
              
              <div className="flex justify-between items-start gap-4">
                <h3 className="text-xl font-bold text-(--gl-sos-base) leading-tight">{alert.title}</h3>
                <span className="flex items-center gap-1 text-xs font-bold text-(--gl-sos-base) bg-(--gl-bg-base) px-2 py-1 rounded-md shrink-0">
                  <LuClock size={12} /> 
                  {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              
              <p className="text-(--gl-text-main) font-medium leading-relaxed">
                {alert.message}
              </p>

              {/* Audio Player if the admin attached a voice note */}
              {alert.audioUrl && (
                <div className="mt-2 bg-(--gl-bg-surface) rounded-xl p-3 border border-(--gl-border-light) flex items-center gap-3">
                  <LuVolume2 className="text-(--gl-sos-base) shrink-0" size={20} />
                  <audio src={alert.audioUrl} controls className="w-full h-10" />
                </div>
              )}
              
            </div>
          ))
        )}
      </div>
    </div>
  );
}