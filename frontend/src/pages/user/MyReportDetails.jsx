import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
   LuArrowLeft, 
 LuMapPin, 
  LuClock, 
 LuUser, 
  LuShieldAlert, 
  LuImage, 
  LuVideo, 
  LuFileText, 
  LuX
} from 'react-icons/lu';
import API from '../../api/API'
// Mock API for preview environment compilation
// Replace this with: import API from '../../api/API';
// const API = {
//   get: async (url) => {
//     // Simulating network delay
//     await new Promise(resolve => setTimeout(resolve, 800));
//     return { 
//       data: { 
//         data: { 
//           _id: "mock12345678", 
//           crimeType: "Theft", 
//           status: "pending", 
//           severity: "high", 
//           createdAt: new Date().toISOString(), 
//           crimeTime: new Date(Date.now() - 86400000).toISOString(), 
//           reporterType: "victim", 
//           crimeDescription: "My bicycle was stolen from outside the library. It is a blue mountain bike. I have attached photos of where it was parked.", 
//           crimeLocation: { latitude: 25.5941, longitude: 85.1376 }, 
//           images: ["https://picsum.photos/400/300", "https://picsum.photos/401/300"]
//         } 
//       } 
//     };
//   }
// };

export default function MyReportDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Core State
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // UI State
  const [selectedImage, setSelectedImage] = useState(null); // For fullscreen image viewer

  useEffect(() => {
    const fetchReportDetails = async () => {
      try {
        const response = await API.get(`/crime/${id}`);
        setReport(response.data.data);
      } catch (err) {
        console.error("Failed to fetch report details:", err);
        setError(err.response?.data?.message || "Could not load report details.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchReportDetails();
  }, [id]);

  // UI Badge Helpers
  const getSeverityStyle = (severity) => {
    switch(severity?.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'low': return 'bg-blue-100 text-blue-700 border-blue-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getStatusStyle = (status) => {
    switch(status?.toLowerCase()) {
      case 'verified': return 'bg-green-100 text-green-700 border-green-300';
      case 'resolved': return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'rejected': return 'bg-gray-200 text-gray-700 border-gray-400';
      default: return 'bg-yellow-100 text-yellow-700 border-yellow-300'; // Pending
    }
  };

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-(--color-background-1) min-h-screen">
        <div className="flex items-center gap-3 text-xl font-bold text-(--color-highlight) animate-pulse">
          <LuShieldAlert className="animate-bounce" /> Loading Case File...
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-(--color-background-1) min-h-screen p-6">
        <LuShieldAlert size={64} className="text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-(--color-primary) mb-2">Error Loading Report</h2>
        <p className="text-(--color-muted-foreground) mb-6">{error}</p>
        <button onClick={() => navigate('/user/reports')} className="px-6 py-3 bg-(--color-background-2) border border-(--color-border) text-(--color-primary) rounded-xl font-bold hover:bg-(--color-highlight) hover:text-white transition-colors">
          Back to My Reports
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-(--color-background-1) font-satoshi text-(--color-primary) pb-20">
      
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-40 bg-(--color-background-1)/90 backdrop-blur-md border-b border-(--color-border) px-4 sm:px-8 py-4 flex items-center justify-between">
        <button 
          onClick={() => navigate('/user/reports')}
          className="flex items-center gap-2 text-(--color-muted-foreground) hover:text-(--color-primary) transition-colors font-medium"
        >
          <LuArrowLeft size={20} /> <span className="hidden sm:inline">Back to List</span>
        </button>
        <div className="font-mono text-sm opacity-60 font-bold tracking-widest">
          CASE #{report._id.slice(-8).toUpperCase()}
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 sm:p-8">
        
        {/* Header & Status Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-integral font-bold text-(--color-primary) uppercase mb-2">
              {report.crimeType}
            </h1>
            <p className="flex items-center gap-2 text-(--color-muted-foreground)">
              <LuClock size={16} /> Submitted on {new Date(report.createdAt).toLocaleString()}
            </p>
          </div>

          {/* Read-Only Status Badges */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-(--color-muted-foreground) uppercase tracking-wider">Current Status</span>
              <span className={`px-4 py-2 rounded-lg font-bold uppercase border ${getStatusStyle(report.status)}`}>
                {report.status || 'Pending'}
              </span>
            </div>
            
            {report.severity && report.severity !== 'unassigned' && (
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-(--color-muted-foreground) uppercase tracking-wider">Police Severity</span>
                <span className={`px-4 py-2 rounded-lg font-bold uppercase border ${getSeverityStyle(report.severity)}`}>
                  {report.severity}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Details */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* Description Block */}
            <div className="bg-(--color-background-2) border border-(--color-border) rounded-2xl p-6">
              <h3 className="flex items-center gap-2 text-lg font-bold mb-4 border-b border-(--color-border) pb-2">
                <LuFileText className="text-(--color-highlight)" /> Incident Description
              </h3>
              <p className="text-(--color-primary) whitespace-pre-wrap leading-relaxed">
                {report.crimeDescription || "No description was provided for this report."}
              </p>
            </div>

            {/* Context Info Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Role Info */}
              <div className="bg-(--color-background-2) border border-(--color-border) rounded-2xl p-6">
                <h3 className="flex items-center gap-2 text-lg font-bold mb-4 border-b border-(--color-border) pb-2">
                  <LuUser className="text-(--color-highlight)" /> Your Role
                </h3>
                <div className="flex flex-col gap-3">
                  <div>
                    <span className="block text-xs text-(--color-muted-foreground) uppercase font-bold">Reported As</span>
                    <span className="capitalize font-medium text-lg">{report.reporterType}</span>
                  </div>
                </div>
              </div>

              {/* Location Info */}
              <div className="bg-(--color-background-2) border border-(--color-border) rounded-2xl p-6">
                <h3 className="flex items-center gap-2 text-lg font-bold mb-4 border-b border-(--color-border) pb-2">
                  <LuMapPin className="text-(--color-highlight)" /> Incident Data
                </h3>
                <div className="flex flex-col gap-3">
                  <div>
                    <span className="block text-xs text-(--color-muted-foreground) uppercase font-bold">Incident Time</span>
                    <span className="font-medium">{new Date(report.crimeTime).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-(--color-muted-foreground) uppercase font-bold">Coordinates</span>
                    <span className="font-mono bg-(--color-background-1) px-2 py-1 rounded border border-(--color-border) text-sm">
                      {report.crimeLocation.latitude?.toFixed(4)}, {report.crimeLocation.longitude?.toFixed(4)}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Right Column: Evidence */}
          <div className="flex flex-col gap-6">
            
            {/* Video Evidence */}
            {report.videoUrl && (
              <div className="bg-(--color-background-2) border border-(--color-border) rounded-2xl p-6">
                <h3 className="flex items-center gap-2 text-lg font-bold mb-4 border-b border-(--color-border) pb-2">
                  <LuVideo className="text-(--color-highlight)" /> Attached Video
                </h3>
                <div className="rounded-xl overflow-hidden bg-black aspect-video border border-(--color-border)">
                  <video 
                    src={report.videoUrl} 
                    controls 
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            )}

            {/* Photographic Evidence */}
            <div className="bg-(--color-background-2) border border-(--color-border) rounded-2xl p-6">
              <h3 className="flex items-center gap-2 text-lg font-bold mb-4 border-b border-(--color-border) pb-2">
                <LuImage className="text-(--color-highlight)" /> Attached Photos
              </h3>
              
              {(!report.images || report.images.length === 0) ? (
                <div className="text-center py-8 text-(--color-muted-foreground)">
                  <LuImage size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-medium">No images were attached to this report.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {report.images.map((img, index) => (
                    <div 
                      key={index} 
                      onClick={() => setSelectedImage(img)}
                      className="aspect-square rounded-xl overflow-hidden border border-(--color-border) cursor-pointer group relative bg-(--color-background-1)"
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

      {/* Fullscreen Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <button 
            onClick={() => setSelectedImage(null)}
            className="absolute top-6 right-6 text-white hover:text-red-500 transition-colors p-2 bg-black/50 rounded-full"
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