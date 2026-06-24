import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import { 
  LuTriangleAlert, LuMapPin, LuCamera, LuShieldAlert, 
  LuFlame, LuCar, LuChevronLeft, LuCircleCheck, LuImage, 
  LuVideo, LuCircleHelp, LuTrash2, LuUserX, LuUserMinus, 
  LuSiren, LuEye, LuHammer 
} from 'react-icons/lu';
import API from '../../api/API';

export default function ReportCrime() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error,setError]=useState(null);

  // Map UI States
  const [showMap, setShowMap] = useState(false);
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [geocodedAddress, setGeocodedAddress] = useState("Move map to select location...");
  
  // Defaulting to Bhagalpur coordinates for initial load
  const [mapCenter, setMapCenter] = useState({ lat: 25.2425, lng: 87.0158 });

  const [formData, setFormData] = useState({
    category: '',
    location: null,
    time: '', // NEW: Added time state
    role: "victim", 
    description: '',
    images: [], 
    video: null 
  });

  const [previews, setPreviews] = useState({ images: [], video: null });

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => {
    if (step === 2 || step==3) {
      setShowMap(false);
    }
    setStep((prev) => prev - 1);}

  useEffect(() => {
    return () => {
      previews.images.forEach(url => URL.revokeObjectURL(url));
      if (previews.video) URL.revokeObjectURL(previews.video);
    };
  }, [previews]);

  const categories = [
    { id: 'assault', label: 'Assault', desc: 'Physical attacks or violence', icon: <LuTriangleAlert size={20} /> },
    { id: 'harassment', label: 'Harassment', desc: 'Threats, stalking, eve-teasing', icon: <LuUserX size={20} /> },
    { id: 'kidnapping', label: 'Kidnapping', desc: 'Abduction or missing person', icon: <LuUserMinus size={20} /> },
    { id: 'accident', label: 'Accident', desc: 'Hit & run or collisions', icon: <LuCar size={20} /> },
    { id: 'fire', label: 'Hazard', desc: 'Fires, spills, or live wires', icon: <LuFlame size={20} /> },
    { id: 'robbery', label: 'Robbery', desc: 'Violent theft or snatching', icon: <LuSiren size={20} /> },
    { id: 'theft', label: 'Theft', desc: 'Non-violent property crime', icon: <LuShieldAlert size={20} /> },
    { id: 'suspicious', label: 'Suspicious', desc: 'Scouting or gang loitering', icon: <LuEye size={20} /> },
    { id: 'vandalism', label: 'Vandalism', desc: 'Property damage or nuisance', icon: <LuHammer size={20} /> },
    { id: 'others', label: 'Others', desc: 'Requires written description', icon: <LuCircleHelp size={20} /> },
  ];

  const handleCategorySelect = (categoryId) => {
    setFormData({ ...formData, category: categoryId });
    nextStep();
  };

  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setFormData({ ...formData, location: { lat: pos.coords.latitude, lng: pos.coords.longitude } });
          nextStep();
        },
        () => alert("Please enable location permissions.")
      );
    }
  };

  const handleChooseOnMap = () => {
    setFormData({ ...formData, location: { lat: 25.5941, lng: 85.1376 } }); 
    nextStep();
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    if (formData.images.length + files.length > 5) {
      alert("Maximum 5 images allowed.");
      return;
    }

    const newImagePreviews = files.map(file => URL.createObjectURL(file));
    
    setFormData(prev => ({ ...prev, images: [...prev.images, ...files] }));
    setPreviews(prev => ({ ...prev, images: [...prev.images, ...newImagePreviews] }));
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (formData.video) {
      alert("Maximum 1 video allowed.");
      return;
    }

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

  const isDescriptionRequired = true;
  
  const isStep3Valid = () => {
    if (!formData.role) return false;
    if (!formData.time) return false; // NEW: Time is mandatory
    if (isDescriptionRequired && formData.description.length < 20) return false;
    if (formData.role === 'spectator' && formData.images.length === 0) return false;
    return true; 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null)
    const payload = new FormData();
    payload.append('crimeType', formData.category);
    payload.append('crimeDescription', formData.description);
    payload.append('latitude', formData.location.lat);
    payload.append('longitude', formData.location.lng);
    // payload.append('crimeTime', formData.time); // NEW: Sending time to backend
    payload.append('reporterType', formData.role);

    const utcTime = new Date(formData.time).toISOString();
    payload.append('crimeTime', utcTime);

    formData.images.forEach((img) => {
      payload.append('images', img); 
    });

    if (formData.video) {
      payload.append('video', formData.video);
    }
    //my code
    try{
      const response = await API.post('/crime/report',payload);
      console.log(response)
      setSubmitted(true)
      setIsSubmitting(false)
    }catch(err){
      console.error("Reporting Crime failed ",err);
      setError(err.response?.data?.message || "Crime Reporting failed")
    }finally{
      setIsSubmitting(false)
    }
    //my code
  };
   // Invisible component to track center coordinates when dragging stops
function MapDragTracker({ onDragEnd }) {
  useMapEvents({
    moveend: (e) => {
      const center = e.target.getCenter();
      onDragEnd(center.lat, center.lng);
    },
  });
  return null;
}
const fetchAddress = async (lat, lng) => {
    setIsResolvingAddress(true);
    setGeocodedAddress("Translating coordinates to address...");
    try {
      // Free OpenStreetMap reverse geocoding
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await response.json();
      
      setGeocodedAddress(data.display_name || "Address not found, but coordinates secured.");
      setFormData(prev => ({ ...prev, location: { lat, lng } }));
    } catch (error) {
      console.error("Geocoding failed", error);
      setGeocodedAddress("Coordinates secured (Network error getting street name)");
      setFormData(prev => ({ ...prev, location: { lat, lng } }));
    } finally {
      setIsResolvingAddress(false);
    }
  };
  if (submitted) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-6 bg-(--color-background-1) font-satoshi text-center">
        <LuCircleCheck size={64} className="text-green-500 mb-4" />
        <h2 className="text-2xl font-bold text-(--color-primary) mb-2">Report Secured</h2>
        <button 
          onClick={() => { 
            setStep(1); setSubmitted(false); setPreviews({ images: [], video: null });
            // Resetting time here as well
            setFormData({ category: '', location: null, time: '', role: "victim", description: '', images: [], video: null }); 
          }} 
          className="mt-8 px-6 py-3 bg-(--color-highlight) text-white font-bold rounded-xl"
        >
          OK
        </button>
      </div>
    );
  }

  return (
    // NEW: Updated max-w-2xl to max-w-4xl lg:max-w-5xl for much better desktop scaling
    <div className="h-full w-full flex flex-col bg-(--color-background-1) font-satoshi max-w-4xl lg:max-w-5xl mx-auto p-4 md:p-8 lg:p-12 relative">
      <div className="flex items-center mb-6">
        {step > 1 && <button onClick={prevStep} className="p-2 mr-4 rounded-full hover:bg-(--color-background-2) text-(--color-primary)"><LuChevronLeft size={24} /></button>}
        <div>
          <h1 className="text-2xl font-integral font-bold text-(--color-primary)">Report Crime</h1>
          <p className="text-sm text-(--color-muted-foreground)">Step {step} of 3</p>
        </div>
      </div>

      <div className="w-full bg-(--color-background-2) h-2 rounded-full mb-6 overflow-hidden">
        <div className="bg-(--color-highlight) h-full transition-all duration-300" style={{ width: `${(step / 3) * 100}%` }}></div>
      </div>

      {step === 1 && (
        // NEW: Added md:grid-cols-4 lg:grid-cols-5 so categories span beautifully across desktop
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 overflow-y-auto pb-4">
          {categories.map((cat) => (
            <button key={cat.id} onClick={() => handleCategorySelect(cat.id)} className="flex flex-col items-center p-4 border border-(--color-border) rounded-xl hover:border-(--color-highlight) hover:bg-blue-50 dark:hover:bg-blue-900/20 text-(--color-primary) text-center transition-all">
              <div className="text-(--color-highlight) mb-2">{cat.icon}</div>
              <span className="font-bold text-sm">{cat.label}</span>
              <span className="text-xs text-(--color-muted-foreground) mt-1 leading-tight">{cat.desc}</span>
            </button>
          ))}
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-4 mx-auto w-full h-full flex-1 min-h-[500px]">
          
          {!showMap ? (
            // The Initial Buttons
            <div className="flex flex-col gap-4 max-w-2xl mx-auto w-full mt-8">
              <button onClick={handleCurrentLocation} className="flex items-center justify-center gap-4 p-5 w-full bg-(--color-highlight) text-white rounded-2xl transition-opacity hover:opacity-90">
                <LuMapPin size={24} /> <span className="font-bold">Use Current Location</span>
              </button>
              <button onClick={() => setShowMap(true)} className="flex items-center justify-center gap-4 p-5 w-full border border-(--color-border) text-(--color-primary) rounded-2xl transition-colors hover:bg-(--color-background-2)">
                <LuMapPin size={24} /> <span className="font-bold">Choose on Map</span>
              </button>
            </div>
          ) : (
            // The Map UI
            <div className="flex flex-col h-full w-full relative rounded-xl overflow-hidden border border-(--color-border)">
              
              {/* The Interactive Map */}
              <div className="flex-1 w-full relative z-0">
                <MapContainer 
                  center={[mapCenter.lat, mapCenter.lng]} 
                  zoom={16} 
                  zoomControl={false}
                  className="w-full h-full absolute inset-0"
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <MapDragTracker onDragEnd={fetchAddress} />
                </MapContainer>

                {/* The Fixed Center Pin (The "Uber" Magic) */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1000] pointer-events-none drop-shadow-xl pb-6">
                  <LuMapPin size={48} className="text-red-500" fill="white" />
                </div>
              </div>

              {/* The Bottom Action Card */}
              <div className="bg-(--color-background-1) p-4 z-10 shadow-lg border-t border-(--color-border)">
                <div className="mb-4">
                  <p className="text-xs text-(--color-muted-foreground) font-bold uppercase mb-1">Selected Location</p>
                  <p className={`text-sm md:text-base font-medium ${isResolvingAddress ? 'animate-pulse text-(--color-highlight)' : 'text-(--color-primary)'}`}>
                    {geocodedAddress}
                  </p>
                </div>
                
                <button 
                  onClick={nextStep}
                  disabled={isResolvingAddress || !formData.location}
                  className={`w-full p-4 rounded-xl font-bold transition-all ${isResolvingAddress || !formData.location ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-800' : 'bg-(--color-highlight) text-white hover:opacity-90'}`}
                >
                  Confirm Location
                </button>
              </div>

            </div>
          )}
        </div>
      )}

      {step === 3 && (
        <form onSubmit={handleSubmit} className="flex flex-col h-full pb-20 overflow-y-auto">
          <div className="flex gap-4 mb-6 shrink-0">
            <button type="button" onClick={() => setFormData({ ...formData, role: 'victim' })} className={`flex-1 py-3 px-4 rounded-xl font-bold border ${formData.role === 'victim' ? 'border-red-500 text-red-500 bg-red-50 dark:bg-red-900/20' : 'border-(--color-border) text-(--color-primary)'}`}>I am Victim</button>
            <button type="button" onClick={() => setFormData({ ...formData, role: 'spectator' })} className={`flex-1 py-3 px-4 rounded-xl font-bold border ${formData.role === 'spectator' ? 'border-blue-500 text-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-(--color-border) text-(--color-primary)'}`}>I am Spectator</button>
          </div>

          {formData.role && (
            <div className="flex flex-col flex-1 shrink-0">
              
              {/* NEW: Time Input Block */}
              <div className="flex flex-col mb-6 shrink-0">
                <label className="font-bold text-(--color-primary) mb-2">When did this happen?</label>
                <input 
                  type="datetime-local" 
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="w-full p-4 rounded-xl border border-(--color-border) bg-(--color-background-1) text-(--color-primary) focus:ring-2 focus:ring-(--color-highlight) outline-none"
                />
              </div>

              <div className="flex justify-between items-end mb-2">
                <label className="font-bold text-(--color-primary)">Description</label>
                {isDescriptionRequired ? (
                  <span className={`text-xs ${formData.description.length >= 20 ? 'text-green-500' : 'text-red-500'}`}>{formData.description.length}/20 chars req</span>
                ) : <span className="text-xs text-(--color-muted-foreground)">Optional</span>}
              </div>
              <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full p-4 rounded-xl border border-(--color-border) bg-(--color-background-1) text-(--color-primary) h-24 mb-6 shrink-0 outline-none focus:ring-2 focus:ring-(--color-highlight)" />

              <div className="flex justify-between items-end mb-2">
                <label className="font-bold text-(--color-primary)">Evidence (Images: {formData.images.length}/5 | Video: {formData.video ? '1' : '0'}/1)</label>
                {formData.role === 'spectator' && <span className="text-xs text-red-500">* 1 Image Required</span>}
              </div>

              <div className="flex gap-4 mb-4 shrink-0">
                <label className={`flex-1 border-2 border-dashed border-(--color-border) rounded-xl p-4 flex flex-col items-center justify-center text-center transition-colors ${formData.images.length >= 5 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-(--color-background-2)'}`}>
                  <input type="file" accept="image/*" multiple className="hidden" disabled={formData.images.length >= 5} onChange={handleImageChange} />
                  <LuCamera size={24} className="text-(--color-muted-foreground)" />
                  <span className="text-sm font-bold text-(--color-primary) mt-2">Add Image</span>
                </label>

                <label className={`flex-1 border-2 border-dashed border-(--color-border) rounded-xl p-4 flex flex-col items-center justify-center text-center transition-colors ${formData.video ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-(--color-background-2)'}`}>
                  <input type="file" accept="video/*" className="hidden" disabled={formData.video} onChange={handleVideoChange} />
                  <LuVideo size={24} className="text-(--color-muted-foreground)" />
                  <span className="text-sm font-bold text-(--color-primary) mt-2">Add Video</span>
                </label>
              </div>

              <div className="flex flex-wrap gap-3 mb-6 shrink-0">
                {previews.images.map((url, i) => (
                  <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-(--color-border)">
                    <img src={url} alt="upload" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"><LuTrash2 size={12} /></button>
                  </div>
                ))}
                {previews.video && (
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-(--color-border) bg-black flex items-center justify-center">
                    <LuVideo size={24} className="text-white" />
                    <button type="button" onClick={removeVideo} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"><LuTrash2 size={12} /></button>
                  </div>
                )}
              </div>

{error && (
  <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-xl text-sm font-bold flex items-center gap-2">
    <LuTriangleAlert size={20} />
    {error}
  </div>
)}

              <button 
                type="submit"
                disabled={!isStep3Valid() || isSubmitting}
                className={`w-full mt-auto py-4 rounded-xl font-bold text-lg transition-all shrink-0 ${!isStep3Valid() ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-800' : 'bg-(--color-highlight) text-white hover:opacity-90'}`}
              >
                {isSubmitting ? 'Transmitting...' : 'Submit to Police'}
              </button>
            </div>
          )}
        </form>
      )}
    </div>
  );
}