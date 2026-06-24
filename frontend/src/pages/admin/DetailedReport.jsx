import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  LuArrowLeft , LuMapPin , LuClock, LuUser, 
  LuShieldAlert, LuImage, LuVideo, LuSave, 
  LuFileText,LuX
} from 'react-icons/lu';
import API from '../../api/API'
// Mock API for preview environment compilation
// const API = {
//   get: async () => ({ 
//     data: { 
//       data: { 
//         _id: "mock12345678", 
//         crimeType: "Assault", 
//         status: "pending", 
//         severity: "unassigned", 
//         createdAt: new Date().toISOString(), 
//         crimeTime: new Date().toISOString(), 
//         reporterType: "victim", 
//         crimeDescription: "This is a mock report for the preview environment.", 
//         crimeLocation: { latitude: 25.5941, longitude: 85.1376 }, 
//         reporter: { name: "John Doe", email: "john@example.com" },
//         LuImages: ["https://picsum.photos/400", "https://picsum.photos/401"]
//       } 
//     } 
//   }),
//   patch: async () => ({ data: { success: true } })
// };

export default function DetailedReport() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Core State
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Update State (Buffering changes before saving)
  const [status, setStatus] = useState('');
  const [severity, setSeverity] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // UI State
  const [selectedImage, setSelectedImage] = useState(null); // For fullscreen LuImage viewer

  useEffect(() => {
    const fetchReportDetails = async () => {
      try {
        const response = await API.get(`/crime/admin/${id}`);
        console.log(response.data.data)
        const data = response.data.data;
        setReport(data);
        
        // Initialize our editable fields
        setStatus(data.status || 'pending');
        setSeverity(data.severity || 'unassigned');
      } catch (err) {
        console.error("Failed to fetch report details:", err);
        setError(err.response?.data?.message || "Could not load report details.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchReportDetails();
  }, [id]);

  // Derived state to check if the admin has unLuSaved changes
  const hasUnSavedChanges = report && (status !== (report.status || 'pending') || severity !== (report.severity || 'unassigned'));

  const handleSaveChanges = async () => {
    setIsUpdating(true);
    setUpdateSuccess(false);
    try {
      // NOTE: We will build this PATCH route in the backend next!
      await API.patch(`/crime/admin/${id}`, { status, severity });
      
      // Update local state to reflect the LuSaved changes
      setReport(prev => ({ ...prev, status, severity }));
      setUpdateSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => setUpdateSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to update report:", err);
      alert("Failed to LuSave changes. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-(--color-background-1) min-h-screen">
        <div className="text-xl font-bold text-(--color-highlight) animate-pulse">Loading Case File...</div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-(--color-background-1) min-h-screen p-6">
        <LuShieldAlert size={64} className="text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-(--color-primary) mb-2">Error Loading Report</h2>
        <p className="text-(--color-muted-foreground) mb-6">{error}</p>
        <button onClick={() => navigate('/admin/reports')} className="px-6 py-3 bg-(--color-background-2) border border-(--color-border) text-(--color-primary) rounded-xl font-bold hover:bg-(--color-highlight) hover:text-white transition-colors">
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-(--color-background-1) font-satoshi text-(--color-primary) pb-20">
      
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-40 bg-(--color-background-1)/90 backdrop-blur-md border-b border-(--color-border) px-4 sm:px-8 py-4 flex items-center justify-between">
        <button 
          onClick={() => navigate('/admin/crime-report')}
          className="flex items-center gap-2 text-(--color-muted-foreground) hover:text-(--color-primary) transition-colors font-medium"
        >
          <LuArrowLeft size={20} /> <span className="hidden sm:inline">Back to Reports</span>
        </button>
        <div className="font-mono text-sm opacity-60 font-bold tracking-widest">
          CASE #{report._id.slice(-8).toUpperCase()}
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 sm:p-8">
        
        {/* Header & Controls Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-integral font-bold text-(--color-primary) uppercase mb-2">
              {report.crimeType}
            </h1>
            <p className="flex items-center gap-2 text-(--color-muted-foreground)">
              <LuClock size={16} /> Reported on {new Date(report.createdAt).toLocaleString()}
            </p>
          </div>

          {/* Status & Severity Control Box */}
          <div className="w-full lg:w-auto bg-(--color-background-2) border border-(--color-border) rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center gap-4">
            
            <div className="w-full sm:w-auto flex flex-col gap-1">
              <label className="text-xs font-bold text-(--color-muted-foreground) uppercase tracking-wider">Severity</label>
              <select 
                value={severity} 
                onChange={(e) => setSeverity(e.target.value)}
                className={`outline-none bg-(--color-background-1) border rounded-lg px-3 py-2 font-bold cursor-pointer transition-colors
                  ${severity === 'critical' ? 'border-red-400 text-red-600' : 
                    severity === 'high' ? 'border-orange-400 text-orange-600' : 
                    severity === 'medium' ? 'border-yellow-400 text-yellow-600' : 
                    'border-blue-400 text-blue-600'}`}
              >
                <option value="unassigned">Unassigned</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div className="w-full sm:w-auto flex flex-col gap-1">
              <label className="text-xs font-bold text-(--color-muted-foreground) uppercase tracking-wider">Status</label>
              <select 
                value={status} 
                onChange={(e) => setStatus(e.target.value)}
                className={`outline-none bg-(--color-background-1) border rounded-lg px-3 py-2 font-bold cursor-pointer transition-colors
                  ${status === 'verified' ? 'border-green-400 text-green-600' : 
                    status === 'resolved' ? 'border-purple-400 text-purple-600' : 
                    status === 'rejected' ? 'border-gray-400 text-gray-600' : 
                    'border-yellow-400 text-yellow-600'}`}
              >
                <option value="pending">Pending</option>
                <option value="verified">Verified</option>
                <option value="resolved">Resolved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {hasUnSavedChanges && (
              <button 
                onClick={handleSaveChanges}
                disabled={isUpdating}
                className="w-full sm:w-auto mt-2 sm:mt-0 flex items-center justify-center gap-2 bg-(--color-highlight) text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity"
              >
                {isUpdating ? 'Saving...' : <><LuSave size={18} /> Save</>}
              </button>
            )}
            
            {updateSuccess && !hasUnSavedChanges && (
              <span className="text-green-500 font-bold text-sm animate-pulse">Updated!</span>
            )}
          </div>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Details (Takes up 2/3 on desktop) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* Description Block */}
            <div className="bg-(--color-background-2) border border-(--color-border) rounded-2xl p-6">
              <h3 className="flex items-center gap-2 text-lg font-bold mb-4 border-b border-(--color-border) pb-2">
                <LuFileText className="text-(--color-highlight)" /> Incident Description
              </h3>
              <p className="text-(--color-primary) whitespace-pre-wrap leading-relaxed">
                {report.crimeDescription || "No description provided by the reporter."}
              </p>
            </div>

            {/* Reporter & Location Info Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Reporter Info */}
              <div className="bg-(--color-background-2) border border-(--color-border) rounded-2xl p-6">
                <h3 className="flex items-center gap-2 text-lg font-bold mb-4 border-b border-(--color-border) pb-2">
                  <LuUser className="text-(--color-highlight)" /> Reporter Details
                </h3>
                <div className="flex flex-col gap-3">
                  <div>
                    <span className="block text-xs text-(--color-muted-foreground) uppercase font-bold">Role</span>
                    <span className="capitalize font-medium">{report.reporterType}</span>
                  </div>
                  {/* Safely check if reporter was populated */}
                  {report.reporter ? (
                    <>
                      <div>
                        <span className="block text-xs text-(--color-muted-foreground) uppercase font-bold">Name</span>
                        <span className="font-medium">{report.reporter.name || 'Unknown'}</span>
                      </div>
                      <div>
                        <span className="block text-xs text-(--color-muted-foreground) uppercase font-bold">Email</span>
                        <a href={`mailto:${report.reporter.email}`} className="font-medium text-(--color-highlight) hover:underline">
                          {report.reporter.email || 'Not provided'}
                        </a>
                      </div>
                    </>
                  ) : (
                    <div className="text-red-500 font-medium">Anonymous / User Deleted</div>
                  )}
                </div>
              </div>

              {/* Location Info */}
              <div className="bg-(--color-background-2) border border-(--color-border) rounded-2xl p-6">
                <h3 className="flex items-center gap-2 text-lg font-bold mb-4 border-b border-(--color-border) pb-2">
                  <LuMapPin className="text-(--color-highlight)" /> Location Data
                </h3>
                <div className="flex flex-col gap-3">
                  <div>
                    <span className="block text-xs text-(--color-muted-foreground) uppercase font-bold">Incident Time</span>
                    <span className="font-medium">{new Date(report.crimeTime).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-(--color-muted-foreground) uppercase font-bold">Coordinates</span>
                    <span className="font-mono bg-(--color-background-1) px-2 py-1 rounded border border-(--color-border) text-sm">
                      {report.crimeLocation.latitude}, {report.crimeLocation.longitude}
                    </span>
                  </div>
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${report.crimeLocation.latitude},${report.crimeLocation.longitude}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="mt-2 text-sm font-bold text-(--color-highlight) hover:underline inline-block"
                  >
                    Open in Google Maps &rarr;
                  </a>
                </div>
              </div>

            </div>
          </div>

          {/* Right Column: Evidence (Takes up 1/3 on desktop) */}
          <div className="flex flex-col gap-6">
            
            {/* LuVideo Evidence */}
            {report.video && (
              <div className="bg-(--color-background-2) border border-(--color-border) rounded-2xl p-6">
                <h3 className="flex items-center gap-2 text-lg font-bold mb-4 border-b border-(--color-border) pb-2">
                  <LuVideo className="text-(--color-highlight)" /> Video Evidence
                </h3>
                <div className="rounded-xl overflow-hidden bg-black aspect-LuVideo border border-(--color-border)">
                  <LuVideo 
                    src={report.video} 
                    controls 
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            )}

            {/* Photographic Evidence */}
            <div className="bg-(--color-background-2) border border-(--color-border) rounded-2xl p-6">
              <h3 className="flex items-center gap-2 text-lg font-bold mb-4 border-b border-(--color-border) pb-2">
                <LuImage className="text-(--color-highlight)" /> Photographic Evidence
              </h3>
              
              {(!report.images || report.images.length === 0) ? (
                <div className="text-center py-8 text-(--color-muted-foreground)">
                  <LuImage size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-medium">No Images attached to this report.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {report.images.map((img, index) => (
                    <div 
                      key={index} 
                      onClick={() => setSelectedImage(img)}
                      className="aspect-square rounded-xl overflow-hidden border border-(--color-border) cursor-pointer group relative"
                    >
                      <img 
                        src={img} 
                        alt={`Evidence ${index + 1}`} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <LuImage className="text-white opacity-0 group-hover:opacity-100 drop-shadow-md" size={24} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen LuImage Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <button 
            onClick={() => setSelectedImage(null)}
            className="absolute top-16 right-4 text-white hover:text-red-500 transition-colors p-2 bg-black/50 rounded-full"
          >
            <LuX size={32} />
          </button>
          <img 
            src={selectedImage} 
            alt="Fullscreen Evidence" 
            className="max-w-full max-h-[90vh] object-contain rounded-lg border border-gray-700 shadow-2xl" 
          />
        </div>
      )}

    </div>
  );
}