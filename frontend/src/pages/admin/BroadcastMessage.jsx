import React, { useState, useRef } from "react";
import { MapContainer, TileLayer, Circle, useMapEvents } from "react-leaflet";
import { 
  LuRadioTower, LuMapPin, LuMic, LuSquare, LuPlay, 
  LuTrash2, LuSend, LuShieldAlert 
} from "react-icons/lu";
import API from "../../api/API";

// Component to handle map clicks and move the alert center
function MapClickHandler({ setLocation }) {
  useMapEvents({
    click(e) {
      setLocation({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export default function BroadcastMessage() {
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    radiusInMeters: 1000, // Default 1km
  });
  
  // Default map location (update to your city's default)
  const [location, setLocation] = useState({ lat: 25.2425, lng: 87.0158 });
  
  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- Audio Recorder Logic ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        chunksRef.current = []; // reset
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      alert("Microphone access denied or unavailable.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      // Stop all microphone tracks to turn off the red recording light on the browser tab
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const deleteAudio = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    chunksRef.current = [];
  };

  // --- Submit Logic ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.message) {
      setStatus({ type: "error", message: "Title and Message are required." });
      return;
    }

    setIsSubmitting(true);
    setStatus({ type: "", message: "" });

    try {
      // 1. Create a FormData object instead of a JSON object
      const payload = new FormData();
      payload.append("title", formData.title);
      payload.append("message", formData.message);
      payload.append("latitude", location.lat);
      payload.append("longitude", location.lng);
      payload.append("radiusInMeters", formData.radiusInMeters);

      // 2. Append the actual audio file if it was recorded
      if (audioBlob) {
        // The third argument gives the Blob a file name so multer recognizes it
        payload.append("audio", audioBlob, "emergency-alert.webm"); 
      }

      // Axios will automatically detect FormData and set the correct multipart/form-data headers
      await API.post("/broadcast/create", payload);
      
      setStatus({ type: "success", message: "Emergency Broadcast transmitted successfully!" });
      setFormData({ title: "", message: "", radiusInMeters: 1000 });
      deleteAudio();
      
    } catch (error) {
      setStatus({ type: "error", message: error.response?.data?.message || "Failed to broadcast." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 font-satoshi text-black">
      <div className="mb-8 border-b border-gray-200 pb-4">
        <h1 className="text-3xl font-integral font-bold text-red-600 flex items-center gap-3">
          <LuRadioTower size={32} /> Emergency Broadcast Center
        </h1>
        <p className="text-gray-600 mt-2 font-medium">Instantly alert all users within a specific geographic radius.</p>
      </div>
       <div className="bg-amber-300 overflow-auto h-[70vh]">
      {status.message && (
        <div className={`p-4 mb-6 rounded-xl font-bold flex items-center gap-2 ${status.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          <LuShieldAlert size={20} /> {status.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        
        {/* Step 1: Message Content */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col gap-4">
          <h2 className="text-xl font-bold border-b border-gray-100 pb-2">1. Alert Details</h2>
          
          <div className="flex flex-col gap-2">
            <label className="font-bold text-gray-700">Alert Title *</label>
            <input 
              type="text" name="title" value={formData.title} onChange={handleInputChange} 
              placeholder="e.g., Active Fire on Main Street" 
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-bold text-gray-700">Detailed Message *</label>
            <textarea 
              name="message" value={formData.message} onChange={handleInputChange} rows={3}
              placeholder="Provide clear instructions for users in the area..." 
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-red-500 resize-none"
            />
          </div>

          {/* Audio Recorder Section */}
          <div className="flex flex-col gap-2 mt-2">
            <label className="font-bold text-gray-700">Voice Briefing (Optional)</label>
            
            {!audioUrl ? (
              <div className="flex items-center gap-4">
                {!isRecording ? (
                  <button type="button" onClick={startRecording} className="flex items-center gap-2 px-6 py-3 bg-red-100 text-red-600 hover:bg-red-200 font-bold rounded-xl transition-colors">
                    <LuMic size={20} /> Start Recording
                  </button>
                ) : (
                  <button type="button" onClick={stopRecording} className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-bold rounded-xl animate-pulse">
                    <LuSquare size={20} fill="currentColor" /> Stop Recording
                  </button>
                )}
                {isRecording && <span className="text-red-500 font-bold text-sm flex items-center gap-2"><div className="w-3 h-3 bg-red-500 rounded-full animate-ping"></div> Recording live...</span>}
              </div>
            ) : (
              <div className="flex items-center gap-4 bg-gray-50 border border-gray-200 p-3 rounded-xl">
                <audio src={audioUrl} controls className="h-10 w-full max-w-sm" />
                <button type="button" onClick={deleteAudio} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                  <LuTrash2 size={20} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Step 2: Geofencing Map */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col gap-4">
          <h2 className="text-xl font-bold border-b border-gray-100 pb-2 flex justify-between items-center">
            <span>2. Target Area</span>
            <span className="text-sm text-red-500 font-bold bg-red-50 px-3 py-1 rounded-full">
              Radius: {formData.radiusInMeters >= 1000 ? `${formData.radiusInMeters / 1000} km` : `${formData.radiusInMeters} m`}
            </span>
          </h2>
          
          <p className="text-sm text-gray-500 font-medium">Click on the map to set the center of the alert zone. Use the slider to adjust the danger radius.</p>
          
          <input 
            type="range" name="radiusInMeters" 
            min="100" max="10000" step="100" 
            value={formData.radiusInMeters} onChange={handleInputChange}
            className="w-full accent-red-600"
          />

          <div className="h-[400px] w-full rounded-xl border border-gray-200 overflow-hidden relative z-0">
            <MapContainer center={[location.lat, location.lng]} zoom={14} className="w-full h-full">
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <MapClickHandler setLocation={setLocation} />
              
              {/* This circle visually represents the exact Geofence! */}
              <Circle 
                center={[location.lat, location.lng]} 
                radius={formData.radiusInMeters} 
                pathOptions={{ color: 'red', fillColor: '#fca5a5', fillOpacity: 0.4 }} 
              />
              
              {/* Center Pin */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1000] pointer-events-none drop-shadow-xl pb-6">
                <LuMapPin size={40} className="text-red-600" fill="white" />
              </div>
            </MapContainer>
          </div>
        </div>

        <button 
          type="submit" disabled={isSubmitting}
          className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-lg flex justify-center items-center gap-3 transition-colors shadow-lg shadow-red-500/30 disabled:opacity-50"
        >
          <LuSend size={24} /> {isSubmitting ? "Transmitting..." : "Broadcast Alert Now"}
        </button>

      </form>
      </div>
    </div>
  );
}