import React, { useState, useEffect, useRef } from 'react';
import { 
  LuUser, LuPhone, LuMail, LuDroplet, 
  LuHeartPulse, LuMapPin, LuPlus, LuShieldCheck, 
  LuPen, LuTrash2, LuCamera, LuSave, LuX
} from 'react-icons/lu';
import API from "../../api/API"; // Adjust the path to your API utility

export default function UserProfile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Edit Mode States
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ phone: "", bloodGroup: "" });
  const [isSaving, setIsSaving] = useState(false);
  
  // Image Upload State
  const fileInputRef = useRef(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // 1. Fetch Profile on Mount
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await API.get('/user/profile');
      if (response.data.success) {
        setUser(response.data.data);
        setEditData({
          phone: response.data.data.phone || "",
          bloodGroup: response.data.data.bloodGroup || "Unknown"
        });
      }
    } catch (error) {
      console.error("Failed to fetch profile", error);
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle Immediate Image Upload
  const handleImageClick = () => {
    fileInputRef.current.click(); // Trigger the hidden file input
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("profileImage", file);

      const response = await API.put('/user/profile', formData);
      
      if (response.data.success) {
        setUser(response.data.data); // Update UI with the new image URL
      }
    } catch (error) {
      console.error("Image upload failed", error);
      alert("Failed to upload image. Please try again.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  // 3. Handle Saving Text Edits
  const handleSaveEdits = async () => {
    setIsSaving(true);
    try {
      // Since we aren't uploading a file here, we can just send standard JSON
      // Multer on the backend will just ignore req.file and process the text body!
      const response = await API.put('/user/profile', {
        phone: editData.phone,
        bloodGroup: editData.bloodGroup
      });

      if (response.data.success) {
        setUser(response.data.data);
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Failed to save profile", error);
      alert("Failed to save profile changes.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center font-bold text-(--gl-text-muted)">Loading Profile...</div>;
  }

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center font-bold text-(--gl-sos-base)">Failed to load user data.</div>;
  }

  const memberSince = new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 font-satoshi text-(--gl-text-main) pb-20">
      
      {/* Hidden File Input for Avatar */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImageChange} 
        accept="image/*" 
        className="hidden" 
      />

      {/* 1. Hero Section (Identity) */}
      <div className="bg-(--gl-bg-surface) rounded-3xl p-6 md:p-8 shadow-sm border border-(--gl-border-light) mb-8 flex flex-col md:flex-row items-center md:items-start gap-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-24 bg-(--gl-brand-primary)/10 rounded-t-3xl border-b border-(--gl-brand-primary)/20"></div>
        
        {/* Profile Picture with Hover Effect */}
        <div 
          onClick={handleImageClick}
          className="relative z-10 w-24 h-24 md:w-32 md:h-32 bg-(--gl-bg-surface-hover) text-(--gl-brand-primary) rounded-full flex items-center justify-center border-4 border-(--gl-bg-base) shadow-lg shrink-0 cursor-pointer group overflow-hidden"
        >
          {user.profileImage ? (
            <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <LuUser size={48} />
          )}
          
          {/* Dark overlay on hover */}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <LuCamera size={28} className="text-white" />
          </div>

          {isUploadingImage && (
            <div className="absolute inset-0 bg-(--gl-bg-surface)/80 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-(--gl-brand-primary) border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
        
        <div className="relative z-10 flex flex-col items-center md:items-start text-center md:text-left mt-2 md:mt-6 w-full">
          <h1 className="text-2xl md:text-3xl font-bold font-integral flex items-center gap-2">
            {user.name}
            <LuShieldCheck className="text-(--gl-brand-primary)" size={24} title="Verified User" />
          </h1>
          <p className="text-(--gl-text-muted) font-medium mt-1">GuardLens Member since {memberSince}</p>
          
          {/* Edit Toggle Button */}
          {!isEditing ? (
            <button 
              onClick={() => setIsEditing(true)}
              className="mt-4 px-5 py-2 bg-(--gl-bg-surface-hover) hover:bg-(--gl-border-light) text-(--gl-text-main) font-bold rounded-lg text-sm flex items-center gap-2 transition-colors"
            >
              <LuPen size={16} /> Edit Details
            </button>
          ) : (
            <div className="mt-4 flex gap-3">
              <button 
                onClick={handleSaveEdits}
                disabled={isSaving}
                className="px-5 py-2 bg-(--gl-status-success) hover:opacity-90 text-(--gl-text-inverse) font-bold rounded-lg text-sm flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <LuSave size={16} /> {isSaving ? "Saving..." : "Save"}
              </button>
              <button 
                onClick={() => setIsEditing(false)}
                className="px-5 py-2 bg-(--gl-sos-pulse) hover:opacity-80 text-(--gl-sos-base) font-bold rounded-lg text-sm flex items-center gap-2 transition-colors"
              >
                <LuX size={16} /> Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Left Column */}
        <div className="flex flex-col gap-8">
          
          {/* 2. Personal & Medical Info */}
          <div className="bg-(--gl-bg-surface) rounded-3xl p-6 shadow-sm border border-(--gl-border-light)">
            <h2 className="text-xl font-bold font-integral mb-5 border-b border-(--gl-border-light) pb-3">Personal Details</h2>
            
            <div className="flex flex-col gap-5">
              
              {/* Email (Never editable here for security reasons) */}
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-(--gl-bg-base) flex items-center justify-center text-(--gl-text-muted) shrink-0">
                  <LuMail size={20} />
                </div>
                <div>
                  <p className="text-xs text-(--gl-text-muted) font-bold uppercase tracking-wider">Email Address</p>
                  <p className="font-medium text-(--gl-text-muted)">{user.email}</p>
                </div>
              </div>

              {/* Phone Number */}
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-(--gl-bg-base) flex items-center justify-center text-(--gl-text-muted) shrink-0">
                  <LuPhone size={20} />
                </div>
                <div className="w-full">
                  <p className="text-xs text-(--gl-text-muted) font-bold uppercase tracking-wider">Phone Number</p>
                  {!isEditing ? (
                    <p className="font-medium text-(--gl-text-main)">{user.phone || "Not provided"}</p>
                  ) : (
                    <input 
                      type="text" 
                      value={editData.phone}
                      onChange={(e) => setEditData({...editData, phone: e.target.value})}
                      placeholder="+91 9876543210"
                      className="mt-1 w-full border border-(--gl-border-light) bg-transparent text-(--gl-text-main) rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-(--gl-border-focus)"
                    />
                  )}
                </div>
              </div>

              {/* Blood Group */}
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-(--gl-sos-pulse) flex items-center justify-center text-(--gl-sos-base) shrink-0">
                  <LuDroplet size={20} />
                </div>
                <div className="w-full">
                  <p className="text-xs text-(--gl-text-muted) font-bold uppercase tracking-wider">Blood Group</p>
                  {!isEditing ? (
                    <p className="font-bold text-(--gl-sos-base)">{user.bloodGroup}</p>
                  ) : (
                    <select 
                      value={editData.bloodGroup}
                      onChange={(e) => setEditData({...editData, bloodGroup: e.target.value})}
                      className="mt-1 w-full border border-(--gl-border-light) bg-transparent rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-(--gl-border-focus) text-(--gl-sos-base) font-bold"
                    >
                      {['Unknown', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                        <option key={bg} value={bg} className="text-black">{bg}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* 3. Saved Safe Zones (Static for now until we build the map modal) */}
          <div className="bg-(--gl-bg-surface) rounded-3xl p-6 shadow-sm border border-(--gl-border-light)">
             <div className="flex justify-between items-center mb-5 border-b border-(--gl-border-light) pb-3">
              <h2 className="text-xl font-bold font-integral flex items-center gap-2">
                <LuMapPin className="text-(--gl-status-success)" /> Safe Zones
              </h2>
              <button className="text-(--gl-status-success) p-1 hover:opacity-80 rounded-md transition-colors">
                <LuPlus size={20} />
              </button>
            </div>
            <p className="text-sm text-(--gl-text-muted) text-center py-4">Safe zones feature coming next.</p>
          </div>

        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-8">
          
          {/* 4. Emergency Contacts (Static for now until we build the add form) */}
          <div className="bg-(--gl-bg-surface) rounded-3xl p-6 shadow-sm border border-(--gl-sos-pulse) relative overflow-hidden h-full">
             <div className="flex justify-between items-center mb-5 border-b border-(--gl-sos-pulse) pb-3 relative z-10">
              <h2 className="text-xl font-bold font-integral flex items-center gap-2 text-(--gl-sos-base)">
                <LuHeartPulse size={24} /> Trusted Contacts
              </h2>
              <button className="text-(--gl-sos-base) p-1 hover:opacity-80 rounded-md transition-colors">
                <LuPlus size={20} />
              </button>
            </div>
            <p className="text-sm text-(--gl-text-muted) mb-4 relative z-10">
              These contacts will automatically receive your live location if you trigger an SOS alert.
            </p>
            <div className="bg-(--gl-sos-pulse) border border-(--gl-sos-base) p-4 rounded-xl text-center">
                <p className="text-sm text-(--gl-sos-base) font-bold">Add forms coming next.</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}