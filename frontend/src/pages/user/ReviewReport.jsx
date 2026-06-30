import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import API from '../../api/API'
import {
  LuArrowLeft,
  LuMapPin,
  LuClock,
  LuFileText,
  LuImage,
  LuVideo,
  LuCircleCheck,
  LuCircleX,
  LuShieldAlert,
  LuTrash2
} from "react-icons/lu";

const CRIME_CATEGORIES = ["Assault","Harassment","Kidnapping","Accident","Fire","Robbery","Theft","Suspicious","Vandalism","Others"];
export default function ReviewReport() {
  const location = useLocation();
  const navigate = useNavigate();

  const prefillData = location.state?.prefillData || {};

 const formatCategory = (cat) => cat ? cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase() : "Others";

  const [formData, setFormData] = useState({
    crimeType: formatCategory(prefillData.crimeType),
    description: prefillData.description || "",
    location: prefillData.location || "",
    time: prefillData.time || "",
    role: prefillData.reporterType === "spectator" ? "spectator" : "victim", 
    images: [], 
    video: null 
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalState, setModalState] = useState({
    show: false,
    type: "",
    message: "",
  });
   
  const isFormValid =
    formData.crimeType &&
    formData.description.trim() !== "" &&
    formData.location.trim() !== "";
const [previews, setPreviews] = useState({ images: [], video: null });
  const [showMap, setShowMap] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: 25.2425, lng: 87.0158 });
  const [geocodedAddress, setGeocodedAddress] = useState("Move map to select location...");
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);

  // Clean up memory
  useEffect(() => {
    return () => {
      previews.images.forEach(url => URL.revokeObjectURL(url));
      if (previews.video) URL.revokeObjectURL(previews.video);
    };
  }, [previews]);

  // Map Component & Logic
  function MapDragTracker({ onDragEnd }) {
    useMapEvents({ moveend: (e) => onDragEnd(e.target.getCenter().lat, e.target.getCenter().lng) });
    return null;
  }

  const fetchAddress = async (lat, lng) => {
    setIsResolvingAddress(true);
    setGeocodedAddress("Translating coordinates...");
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      setGeocodedAddress(data.display_name || `${lat}, ${lng}`);
      setFormData(prev => ({ ...prev, location: `${lat}, ${lng}` }));
    } catch (err) {
      setGeocodedAddress(`${lat}, ${lng}`);
      setFormData(prev => ({ ...prev, location: `${lat}, ${lng}` }));
    } finally {
      setIsResolvingAddress(false);
    }
  };

  // Media Handlers
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    if (formData.images.length + files.length > 5) return alert("Maximum 5 images allowed.");
    const newImagePreviews = files.map(file => URL.createObjectURL(file));
    setFormData(prev => ({ ...prev, images: [...prev.images, ...files] }));
    setPreviews(prev => ({ ...prev, images: [...prev.images, ...newImagePreviews] }));
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (formData.video) return alert("Maximum 1 video allowed.");
    setFormData(prev => ({ ...prev, video: file }));
    setPreviews(prev => ({ ...prev, video: URL.createObjectURL(file) }));
  };

  const removeImage = (index) => {
    URL.revokeObjectURL(previews.images[index]);
    setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
    setPreviews(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const removeVideo = () => {
    URL.revokeObjectURL(previews.video);
    setFormData(prev => ({ ...prev, video: null }));
    setPreviews(prev => ({ ...prev, video: null }));
  };
  const handleInputChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          setFormData({
            ...formData,
            location: `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`,
          }),
        () =>
          alert(
            "Unable to retrieve your location. Please check your browser permissions.",
          ),
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

 const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;
    setIsSubmitting(true);
    
    try {
      const payload = new FormData();
      payload.append('crimeType', formData.crimeType.toLowerCase());
      payload.append('crimeDescription', formData.description);
      
      let lat = 25.2425; let lng = 87.0158;
      if (formData.location) {
        const parts = formData.location.split(',');
        if (parts.length === 2 && !isNaN(parts[0].trim())) {
          lat = parseFloat(parts[0].trim());
          lng = parseFloat(parts[1].trim());
        }
      }
      payload.append('latitude', lat);
      payload.append('longitude', lng);
      
      if (formData.time) {
        payload.append('crimeTime', new Date(formData.time).toISOString());
      } else {
        payload.append('crimeTime', new Date().toISOString());
      }
      
      payload.append('reporterType', formData.role);

      
      formData.images.forEach(img => payload.append('images', img));
      if (formData.video) payload.append('video', formData.video);

      const response = await API.post('/crime/report', payload);
      setModalState({ show: true, type: "success", message: "Your report has been successfully submitted to the authorities." });
    } catch (error) {
      setModalState({ show: true, type: "error", message: error.response?.data?.message || "Failed to submit report." });
    } finally {
      setIsSubmitting(false);
    }
  };
  const closeModal = () => {
    if (modalState.type === "success") {
      navigate("/user/reports");
    } else {
      setModalState({ show: false, type: "", message: "" });
    }
  };

  return (
    <div className="h-full w-full bg-(--gl-bg-base) text-(--gl-text-main) font-satoshi pb-30 ">
      <div className="sticky h-[11dvh] top-0 z-30 bg-(--gl-bg-surface) shadow border-b border-(--gl-border-light) px-4 py-4 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-(--gl-text-muted) hover:text-(--gl-text-main) font-medium"
        >
          <LuArrowLeft size={20} /> Back to Chat
        </button>
      </div>

      <div className=" mx-auto p-4 sm:p-8 h-[80dvh] overflow-auto">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-integral font-bold mb-2">
            Finalize Details
          </h1>
          <p className="text-(--gl-text-muted)">
            Review the information extracted by GuardLens AI. Edit fields and
            attach evidence before submitting.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* role toggle */}
          <div className="bg-(--gl-bg-surface) border border-(--gl-border-light) rounded-2xl p-6 flex flex-col gap-5 shadow-sm">
            <div className="flex gap-4 shrink-0">
            <button type="button" onClick={() => setFormData({ ...formData, role: 'victim' })} className={`flex-1 py-3 px-4 rounded-xl font-bold border ${formData.role === 'victim' ? 'border-(--gl-sos-base) text-(--gl-sos-base) bg-(--gl-sos-pulse)' : 'border-(--gl-border-light) text-(--gl-text-main) bg-(--gl-bg-base)'}`}>I am Victim</button>
            <button type="button" onClick={() => setFormData({ ...formData, role: 'spectator' })} className={`flex-1 py-3 px-4 rounded-xl font-bold border ${formData.role === 'spectator' ? 'border-(--gl-brand-primary) text-(--gl-brand-primary) bg-(--gl-bg-surface-hover)' : 'border-(--gl-border-light) text-(--gl-text-main) bg-(--gl-bg-base)'}`}>I am Spectator</button>
          </div>
            <h3 className="text-lg font-bold border-b border-(--gl-border-light) pb-2 flex items-center gap-2">
              <LuFileText className="text-(--gl-brand-primary)" /> Incident Information
            </h3>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-(--gl-text-main)">
                Crime Category *
              </label>
              <select
                name="crimeType"
                value={formData.crimeType}
                onChange={handleInputChange}
                className="w-full bg-(--gl-bg-base) border border-(--gl-border-light) text-(--gl-text-main) rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-(--gl-brand-primary)"
              >
                <option value="" disabled>
                  Select Category
                </option>
                {CRIME_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-(--gl-text-main)">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full bg-(--gl-bg-base) border border-(--gl-border-light) text-(--gl-text-main) rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-(--gl-brand-primary) resize-none"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-(--gl-text-main)">
                Incident Time
              </label>
              <div className="relative">
                <LuClock
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-(--gl-text-muted)"
                  size={18}
                />
              
                <input
                  type="datetime-local"
                  name="time"
                  value={formData.time}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 bg-(--gl-bg-base) border border-(--gl-border-light) text-(--gl-text-main) rounded-xl outline-none focus:ring-2 focus:ring-(--gl-brand-primary)"
                />
              </div>
            </div>
          </div>

         {/* Location Block */}
          <div className="bg-(--gl-bg-surface) border border-(--gl-border-light) rounded-2xl p-6 flex flex-col gap-5 shadow-sm">
            <h3 className="text-lg font-bold border-b border-(--gl-border-light) pb-2 flex items-center gap-2">
              <LuMapPin className="text-(--gl-brand-primary)" /> Location Data *
            </h3>

            {!showMap ? (
              <div className="flex flex-col gap-3">
                <input type="text" name="location" value={formData.location} onChange={handleInputChange} placeholder="Address or coordinates (lat, lng)" className="w-full bg-(--gl-bg-base) border border-(--gl-border-light) text-(--gl-text-main) rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-(--gl-brand-primary)" />
                <div className="flex items-center gap-3">
                  <button type="button" onClick={handleGetCurrentLocation} className="text-sm font-bold text-(--gl-brand-primary) hover:underline flex items-center gap-1">
                    <LuMapPin size={16} /> Use Current Location
                  </button>
                  <span className="text-(--gl-text-muted) text-sm">or</span>
                  <button type="button" onClick={() => setShowMap(true)} className="text-sm font-bold text-(--gl-brand-primary) hover:underline">Choose from Map</button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-[300px] w-full relative rounded-xl overflow-hidden border border-(--gl-border-light)">
                <div className="flex-1 w-full relative z-0">
                  <MapContainer center={[mapCenter.lat, mapCenter.lng]} zoom={16} zoomControl={false} className="w-full h-full absolute inset-0">
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <MapDragTracker onDragEnd={fetchAddress} />
                  </MapContainer>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1000] pointer-events-none drop-shadow-xl pb-6">
                    <LuMapPin size={40} className="text-(--gl-sos-base)" fill="white" />
                  </div>
                </div>
                <div className="bg-(--gl-bg-surface) p-3 z-10 border-t border-(--gl-border-light)">
                  <p className="text-xs text-(--gl-text-muted)">{isResolvingAddress ? 'Translating...' : geocodedAddress}</p>
                  <button type="button" onClick={() => setShowMap(false)} className="w-full mt-2 p-2 bg-(--gl-brand-primary) text-(--gl-text-inverse) font-bold rounded-lg hover:opacity-90">Confirm Location</button>
                </div>
              </div>
            )}
          </div>

         {/* Media Block */}
          <div className="bg-(--gl-bg-surface) border border-(--gl-border-light) rounded-2xl p-6 flex flex-col gap-5 shadow-sm">
            <h3 className="text-lg font-bold border-b border-(--gl-border-light) pb-2 flex items-center gap-2">
              <LuImage className="text-(--gl-brand-primary)" /> Attach Evidence
            </h3>
            
            <div className="flex gap-4 shrink-0">
              <label className={`flex-1 border-2 border-dashed border-(--gl-border-light) rounded-xl p-4 flex flex-col items-center justify-center text-center transition-colors ${formData.images.length >= 5 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-(--gl-bg-surface-hover)'}`}>
                <input type="file" accept="image/*" multiple className="hidden" disabled={formData.images.length >= 5} onChange={handleImageChange} />
                <LuImage size={24} className="text-(--gl-text-muted)" />
                <span className="text-sm font-bold text-(--gl-text-main) mt-2">Add Image</span>
              </label>

              <label className={`flex-1 border-2 border-dashed border-(--gl-border-light) rounded-xl p-4 flex flex-col items-center justify-center text-center transition-colors ${formData.video ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-(--gl-bg-surface-hover)'}`}>
                <input type="file" accept="video/*" className="hidden" disabled={formData.video} onChange={handleVideoChange} />
                <LuVideo size={24} className="text-(--gl-text-muted)" />
                <span className="text-sm font-bold text-(--gl-text-main) mt-2">Add Video</span>
              </label>
            </div>

            {/* Media Previews */}
            <div className="flex flex-wrap gap-3">
              {previews.images.map((url, i) => (
                <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-(--gl-border-light)">
                  <img src={url} alt="upload" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-(--gl-sos-base) text-(--gl-text-inverse) rounded-full p-1"><LuTrash2 size={12} /></button>
                </div>
              ))}
              {previews.video && (
                <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-(--gl-border-light) bg-black flex items-center justify-center">
                  <LuVideo size={24} className="text-(--gl-text-inverse)" />
                  <button type="button" onClick={removeVideo} className="absolute top-1 right-1 bg-(--gl-sos-base) text-(--gl-text-inverse) rounded-full p-1"><LuTrash2 size={12} /></button>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2 ${isFormValid ? "bg-(--gl-brand-primary) hover:bg-(--gl-brand-hover) text-(--gl-text-inverse) shadow-lg shadow-blue-500/20 cursor-pointer" : "bg-(--gl-bg-surface-hover) text-(--gl-text-muted) cursor-not-allowed"}`}
            >
              {isSubmitting ? "Submitting Report..." : "Submit Official Report"}
            </button>
          </div>
        </form>
      </div>

      {modalState.show && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-(--gl-bg-surface) rounded-2xl w-full max-w-md p-6 border border-(--gl-border-light) shadow-2xl">
            <div className="flex flex-col items-center text-center gap-4">
              {modalState.type === "success" ? (
                <div className="w-16 h-16 bg-(--gl-status-success)/20 text-(--gl-status-success) rounded-full flex items-center justify-center mb-2">
                  <LuCircleCheck size={32} />
                </div>
              ) : (
                <div className="w-16 h-16 bg-(--gl-sos-pulse) text-(--gl-sos-base) rounded-full flex items-center justify-center mb-2">
                  <LuCircleX size={32} />
                </div>
              )}
              <h2 className="text-2xl font-bold font-integral text-(--gl-text-main)">
                {modalState.type === "success"
                  ? "Report Submitted"
                  : "Submission Failed"}
              </h2>
              <p className="text-(--gl-text-muted) leading-relaxed">
                {modalState.message}
              </p>
              <button
                onClick={closeModal}
                className="w-full mt-4 py-3 bg-(--gl-bg-base) border border-(--gl-border-light) text-(--gl-text-main) rounded-xl font-bold hover:bg-(--gl-brand-primary) hover:text-(--gl-text-inverse) transition-colors"
              >
                {modalState.type === "success"
                  ? "Go to Dashboard"
                  : "Try Again"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}