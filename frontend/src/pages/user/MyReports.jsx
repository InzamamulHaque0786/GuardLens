import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LuSearch, LuFilter, LuMapPin, 
  LuClock, LuShieldAlert, LuChevronRight 
} from 'react-icons/lu';

// Adjust this import path to point to your Axios instance
import API from '../../api/API'; 

export default function MyReports() {
  const navigate = useNavigate();
  
  // Core State
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchMyReports = async () => {
      try {
        const response = await API.get('/crime/my-reports');
        // Assuming backend sends { success: true, data: [...] }
        setReports(response.data.data); 
      } catch (err) {
        console.error("Failed to fetch user reports:", err);
        setError("Could not load your reports. Please check your connection.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMyReports();
  }, []);

  // Derived State: Filtering
  const getProcessedReports = () => {
    let processed = [...reports];

    // Search Filter
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      processed = processed.filter(r => 
        r.crimeType?.toLowerCase().includes(lowerSearch) || 
        r._id.toLowerCase().includes(lowerSearch)
      );
    }

    // Status Filter
    if (statusFilter !== 'all') {
      processed = processed.filter(r => r.status === statusFilter);
    }

    // Always sort by newest first for the user view
    processed.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return processed;
  };

  const displayReports = getProcessedReports();

  // Helper functions for UI Badges
  const getSeverityColor = (severity) => {
    switch(severity?.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'low': return 'bg-blue-100 text-blue-700 border-blue-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'verified': return 'bg-green-100 text-green-700';
      case 'resolved': return 'bg-purple-100 text-purple-700';
      case 'rejected': return 'bg-gray-200 text-gray-600';
      default: return 'bg-yellow-100 text-yellow-700'; // Pending
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-(--color-background-1) font-satoshi max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
      
      {/* Header Area */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-integral font-bold text-(--color-primary) mb-2">My Reports</h1>
        <p className="text-sm md:text-base text-(--color-muted-foreground)">Track the status of incidents you've reported.</p>
      </div>

      {/* Control Panel (Search & Filter) */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6 bg-(--color-background-2) p-4 md:p-5 rounded-xl border border-(--color-border)">
        
        {/* Search Bar */}
        <div className="relative w-full sm:flex-1">
          <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-(--color-muted-foreground)" size={20} />
          <input 
            type="text" 
            placeholder="Search by type or ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-(--color-border) bg-(--color-background-1) text-(--color-primary) focus:ring-2 focus:ring-(--color-highlight) outline-none transition-shadow"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 bg-(--color-background-1) border border-(--color-border) rounded-lg px-3 py-2 w-full sm:w-auto min-w-[160px] focus-within:ring-2 focus-within:ring-(--color-highlight)">
          <LuFilter size={18} className="text-(--color-muted-foreground) shrink-0" />
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)} 
            className="w-full bg-transparent text-(--color-primary) text-sm md:text-base font-medium outline-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="resolved">Resolved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Error & Loading States */}
      {isLoading && <div className="text-center py-10 md:py-20 text-(--color-highlight) font-bold animate-pulse">Loading your reports...</div>}
      {error && <div className="p-4 bg-red-100 text-red-700 rounded-xl mb-6 font-bold">{error}</div>}

      {/* Responsive List View */}
      {!isLoading && !error && (
        <div className="flex flex-col gap-3 md:gap-4 overflow-y-auto pb-10">
          {displayReports.length === 0 ? (
            <div className="text-center py-12 md:py-20 text-(--color-muted-foreground)">
              <LuShieldAlert size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-base md:text-lg font-bold">No reports found.</p>
              <button 
                onClick={() => navigate('/report-crime')}
                className="mt-4 px-6 py-2 bg-(--color-highlight) text-white font-bold rounded-lg hover:opacity-90 transition-opacity"
              >
                File a New Report
              </button>
            </div>
          ) : (
            displayReports.map((report) => (
              <div 
                key={report._id} 
                onClick={() => navigate(`/user/report/${report._id}`)}
                className="group flex flex-col md:flex-row justify-between items-start md:items-center p-4 md:p-5 bg-(--color-background-2) border border-(--color-border) rounded-xl hover:border-(--color-highlight) hover:shadow-md transition-all cursor-pointer gap-4"
              >
                {/* Left Side: Information */}
                <div className="flex flex-col gap-3 w-full">
                  
                  {/* Title & Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-base md:text-lg text-(--color-primary) uppercase tracking-wide mr-2">
                      {report.crimeType}
                    </span>
                    <span className={`px-2 py-1 text-[10px] md:text-xs font-bold rounded-md uppercase ${getStatusColor(report.status)}`}>
                      {report.status || 'Pending'}
                    </span>
                    {/* Only show severity if admin has assigned it (not 'unassigned') */}
                    {report.severity && report.severity !== 'unassigned' && (
                      <span className={`px-2 py-1 text-[10px] md:text-xs font-bold rounded-md border ${getSeverityColor(report.severity)}`}>
                        {report.severity}
                      </span>
                    )}
                  </div>
                  
                  {/* Metadata Stack */}
                  <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-5 text-xs md:text-sm text-(--color-muted-foreground)">
                    <span className="flex items-center gap-1.5 truncate">
                      <LuClock size={14} className="shrink-0" /> 
                      {new Date(report.createdAt).toLocaleDateString()} at {new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="flex items-center gap-1.5 truncate">
                      <LuMapPin size={14} className="shrink-0" /> 
                      Location: {report.crimeLocation?.latitude?.toFixed(4)}, {report.crimeLocation?.longitude?.toFixed(4)}
                    </span>
                  </div>
                </div>

                {/* Right Side: Action Button */}
                <div className="flex items-center justify-end w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-(--color-border) text-(--color-highlight) font-bold gap-1 text-sm md:text-base opacity-100 md:opacity-80 md:group-hover:opacity-100 transition-opacity shrink-0">
                  View Status <LuChevronRight size={18} />
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}