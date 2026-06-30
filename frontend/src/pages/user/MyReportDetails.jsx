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
import API from '../../api/API';

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

  // SAFELY FORMAT DATES TO PREVENT "Invalid Date" FRONTEND CRASHES
  const formatSafeDate = (dateString) => {
    if (!dateString) return 'Not Available';
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? 'Not Available' : d.toLocaleString();
  };

  // UI Badge Helpers using new GL Design System
  const getSeverityStyle = (severity) => {
    switch(severity?.toLowerCase()) {
      case 'critical': return 'bg-(--gl-sos-pulse) text-(--gl-sos-base) border-(--gl-sos-base)';
      case 'high': return 'bg-(--gl-status-warning) text-(--gl-bg-base) border-(--gl-status-warning)';
      case 'medium': return 'bg-(--gl-brand-primary) text-(--gl-text-inverse) border-(--gl-brand-primary)';
      case 'low': return 'bg-(--gl-bg-surface-hover) text-(--gl-text-main) border-(--gl-border-light)';
      default: return 'bg-(--gl-bg-surface-hover) text-(--gl-text-muted) border-(--gl-border-light)';
    }
  };

  const getStatusStyle = (status) => {
    switch(status?.toLowerCase()) {
      case 'verified': return 'bg-(--gl-status-success) text-(--gl-text-inverse) border-(--gl-status-success)';
      case 'resolved': return 'bg-(--gl-brand-primary) text-(--gl-text-inverse) border-(--gl-brand-primary)';
      case 'rejected': return 'bg-(--gl-bg-surface-hover) text-(--gl-text-muted) border-(--gl-border-light)';
      default: return 'bg-(--gl-status-warning) text-(--gl-bg-base) border-(--gl-status-warning)'; // Pending
    }
  };

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-(--gl-bg-base) min-h-screen">
        <div className="flex items-center gap-3 text-xl font-bold text-(--gl-brand-primary) animate-pulse">
          <LuShieldAlert className="animate-bounce" /> Loading Case File...
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-(--gl-bg-base) min-h-screen p-6">
        <LuShieldAlert size={64} className="text-(--gl-sos-base) mb-4" />
        <h2 className="text-2xl font-bold text-(--gl-text-main) mb-2">Error Loading Report</h2>
        <p className="text-(--gl-text-muted) mb-6">{error}</p>
        <button onClick={() => navigate('/user/reports')} className="px-6 py-3 bg-(--gl-bg-surface) border border-(--gl-border-light) text-(--gl-text-main) rounded-xl font-bold hover:bg-(--gl-brand-primary) hover:text-(--gl-text-inverse) transition-colors">
          Back to My Reports
        </button>
      </div>
    );
  }

  return (
    <div className="h-[94dvh] overflow-auto  w-full bg-(--gl-bg-base) font-satoshi text-(--gl-text-main) pb-20">
      
       <div className="sticky h-[11dvh] top-0 z-40 bg-(--gl-bg-base)/90 backdrop-blur-md border-b border-(--gl-border-light) px-5 sm:px-8 py-4  flex items-center gap-2">
        <button 
          onClick={() => navigate('/user/reports')}
          className="flex items-center gap-2 text-(--gl-text-muted) hover:text-(--gl-text-main) transition-colors font-medium"
        >
          <LuArrowLeft size={20} /> <span className="hidden sm:inline">Back to List</span>
        </button>
        <div className="font-mono text-sm opacity-60 font-bold tracking-widest">
          CASE #{report._id.slice(-8).toUpperCase()}
        </div>
      </div>

      {/* Top Navigation Bar */}
      {/* <div className="sticky top-0 z-40 bg-(--gl-bg-base)/90 backdrop-blur-md border-b border-(--gl-border-light) px-4 sm:px-8 py-4 flex items-center justify-between">
        <button 
          onClick={() => navigate('/user/reports')}
          className="flex items-center gap-2 text-(--gl-text-muted) hover:text-(--gl-text-main) transition-colors font-medium"
        >
          <LuArrowLeft size={20} /> <span className="hidden sm:inline">Back to List</span>
        </button>
        <div className="font-mono text-sm opacity-60 font-bold tracking-widest">
          CASE #{report._id.slice(-8).toUpperCase()}
        </div>
      </div> */}
      
      <div className="max-w-7xl  mx-auto p-4 sm:p-8">
        
        {/* Header & Status Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-integral font-bold text-(--gl-text-main) uppercase mb-2">
              {report.crimeType}
            </h1>
            <p className="flex items-center gap-2 text-(--gl-text-muted)">
              <LuClock size={16} /> Submitted on {formatSafeDate(report.createdAt)}
            </p>
          </div>

          {/* Read-Only Status Badges */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-(--gl-text-muted) uppercase tracking-wider">Current Status</span>
              <span className={`px-4 py-2 rounded-lg font-bold uppercase border ${getStatusStyle(report.status)}`}>
                {report.status || 'Pending'}
              </span>
            </div>
            
            {report.severity && report.severity !== 'unassigned' && (
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-(--gl-text-muted) uppercase tracking-wider">Police Severity</span>
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
            <div className="bg-(--gl-bg-surface) border border-(--gl-border-light) rounded-2xl p-6">
              <h3 className="flex items-center gap-2 text-lg font-bold mb-4 border-b border-(--gl-border-light) pb-2">
                <LuFileText className="text-(--gl-brand-primary)" /> Incident Description
              </h3>
              <p className="text-(--gl-text-main) whitespace-pre-wrap leading-relaxed">
                {report.crimeDescription || "No description was provided for this report."}
              </p>
            </div>

            {/* Context Info Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Role Info */}
              <div className="bg-(--gl-bg-surface) border border-(--gl-border-light) rounded-2xl p-6">
                <h3 className="flex items-center gap-2 text-lg font-bold mb-4 border-b border-(--gl-border-light) pb-2">
                  <LuUser className="text-(--gl-brand-primary)" /> Your Role
                </h3>
                <div className="flex flex-col gap-3">
                  <div>
                    <span className="block text-xs text-(--gl-text-muted) uppercase font-bold">Reported As</span>
                    <span className="capitalize font-medium text-lg">{report.reporterType}</span>
                  </div>
                </div>
              </div>

              {/* Location Info */}
              <div className="bg-(--gl-bg-surface) border border-(--gl-border-light) rounded-2xl p-6">
                <h3 className="flex items-center gap-2 text-lg font-bold mb-4 border-b border-(--gl-border-light) pb-2">
                  <LuMapPin className="text-(--gl-brand-primary)" /> Incident Data
                </h3>
                <div className="flex flex-col gap-3">
                  <div>
                    <span className="block text-xs text-(--gl-text-muted) uppercase font-bold">Incident Time</span>
                    <span className="font-medium">{formatSafeDate(report.crimeTime)}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-(--gl-text-muted) uppercase font-bold">Coordinates</span>
                    <span className="font-mono bg-(--gl-bg-base) px-2 py-1 rounded border border-(--gl-border-light) text-sm">
                      {report.crimeLocation?.latitude?.toFixed(4) || "N/A"}, {report.crimeLocation?.longitude?.toFixed(4) || "N/A"}
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
              <div className="bg-(--gl-bg-surface) border border-(--gl-border-light) rounded-2xl p-6">
                <h3 className="flex items-center gap-2 text-lg font-bold mb-4 border-b border-(--gl-border-light) pb-2">
                  <LuVideo className="text-(--gl-brand-primary)" /> Attached Video
                </h3>
                <div className="rounded-xl overflow-hidden bg-black aspect-video border border-(--gl-border-light)">
                  <video 
                    src={report.videoUrl} 
                    controls 
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            )}

            {/* Photographic Evidence */}
            <div className="bg-(--gl-bg-surface) border border-(--gl-border-light) rounded-2xl p-6">
              <h3 className="flex items-center gap-2 text-lg font-bold mb-4 border-b border-(--gl-border-light) pb-2">
                <LuImage className="text-(--gl-brand-primary)" /> Attached Photos
              </h3>
              
              {(!report.images || report.images.length === 0) ? (
                <div className="text-center py-8 text-(--gl-text-muted)">
                  <LuImage size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-medium">No images were attached to this report.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {report.images.map((img, index) => (
                    <div 
                      key={index} 
                      onClick={() => setSelectedImage(img)}
                      className="aspect-square rounded-xl overflow-hidden border border-(--gl-border-light) cursor-pointer group relative bg-(--gl-bg-base)"
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
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <button 
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-22 text-white hover:text-(--gl-sos-base) transition-colors p-2 bg-black/50 rounded-full"
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