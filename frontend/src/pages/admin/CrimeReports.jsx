import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LuSearch, LuFilter, LuArrowUpDown, LuMapPin, 
  LuClock, LuShieldAlert, LuChevronRight, LuTriangleAlert
} from 'react-icons/lu';
import API from '../../api/API'; 

export default function CrimeReports() {
  const navigate = useNavigate();
  
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest'); 

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await API.get('/crime/admin/reports');
        setReports(response.data.data); 
      } catch (err) {
        console.error("Failed to fetch reports:", err);
        setError("Could not load reports. Please check your connection.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchReports();
  }, []);

  const getProcessedReports = () => {
    let processed = [...reports];

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      processed = processed.filter(r => 
        r.crimeType?.toLowerCase().includes(lowerSearch) || 
        r._id.toLowerCase().includes(lowerSearch)
      );
    }

    if (statusFilter !== 'all') {
      processed = processed.filter(r => r.status === statusFilter);
    }

    if (severityFilter !== 'all') {
      processed = processed.filter(r => r.severity === severityFilter);
    }

    processed.sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.crimeTime) - new Date(a.crimeTime);
      if (sortBy === 'oldest') return new Date(a.crimeTime) - new Date(b.crimeTime);
      
      if (sortBy === 'severity') {
        const weight = { critical: 4, high: 3, medium: 2, low: 1, unassigned: 0 };
        const valA = weight[a.severity?.toLowerCase()] || 0;
        const valB = weight[b.severity?.toLowerCase()] || 0;
        return valB - valA; 
      }
      return 0;
    });

    return processed;
  };

  const displayReports = getProcessedReports();

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
      default: return 'bg-yellow-100 text-yellow-700'; 
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-(--color-background-1) font-satoshi max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      
      {/* Header Area */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-integral font-bold text-(--color-primary) mb-2">Admin Dashboard</h1>
        <p className="text-sm md:text-base text-(--color-muted-foreground)">Manage and review all incoming crime reports.</p>
      </div>

      {/* Control Panel (Fully Mobile Responsive) */}
      <div className="flex flex-col gap-4 mb-6 bg-(--color-background-2) p-4 md:p-5 rounded-xl border border-(--color-border)">
        
        {/* Search Bar */}
        <div className="relative w-full">
          <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-(--color-muted-foreground)" size={20} />
          <input 
            type="text" 
            placeholder="Search by type or ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-(--color-border) bg-(--color-background-1) text-(--color-primary) focus:ring-2 focus:ring-(--color-highlight) outline-none transition-shadow"
          />
        </div>

        {/* Filters Grid (Stacks on mobile, 3-columns on desktop) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
          {/* Status Filter */}
          <div className="flex items-center gap-2 bg-(--color-background-1) border border-(--color-border) rounded-lg px-3 py-2 w-full focus-within:ring-2 focus-within:ring-(--color-highlight)">
            <LuFilter size={18} className="text-(--color-muted-foreground) shrink-0" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full bg-transparent text-(--color-primary) text-sm md:text-base font-medium outline-none cursor-pointer">
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          {/* Severity Filter */}
          <div className="flex items-center gap-2 bg-(--color-background-1) border border-(--color-border) rounded-lg px-3 py-2 w-full focus-within:ring-2 focus-within:ring-(--color-highlight)">
            <LuTriangleAlert size={18} className="text-(--color-muted-foreground) shrink-0" />
            <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} className="w-full bg-transparent text-(--color-primary) text-sm md:text-base font-medium outline-none cursor-pointer">
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Sort Option */}
          <div className="flex items-center gap-2 bg-(--color-background-1) border border-(--color-border) rounded-lg px-3 py-2 w-full focus-within:ring-2 focus-within:ring-(--color-highlight)">
            <LuArrowUpDown size={18} className="text-(--color-muted-foreground) shrink-0" />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full bg-transparent text-(--color-primary) text-sm md:text-base font-medium outline-none cursor-pointer">
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="severity">Highest Severity</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error & Loading States */}
      {isLoading && <div className="text-center py-10 md:py-20 text-(--color-highlight) font-bold animate-pulse">Fetching records...</div>}
      {error && <div className="p-4 bg-red-100 text-red-700 rounded-xl mb-6 font-bold">{error}</div>}

      {/* Responsive List View */}
      {!isLoading && !error && (
        <div className="flex flex-col gap-3 md:gap-4 overflow-y-auto pb-10">
          {displayReports.length === 0 ? (
            <div className="text-center py-12 md:py-20 text-(--color-muted-foreground)">
              <LuShieldAlert size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-base md:text-lg font-bold">No reports found matching your criteria.</p>
            </div>
          ) : (
            displayReports.map((report) => (
              <div 
                key={report._id} 
                onClick={() => navigate(`/admin/report/${report._id}`)}
                className="group flex flex-col md:flex-row justify-between items-start md:items-center p-4 md:p-5 bg-(--color-background-2) border border-(--color-border) rounded-xl hover:border-(--color-highlight) hover:shadow-md transition-all cursor-pointer gap-4"
              >
                {/* Left Side: Information */}
                <div className="flex flex-col gap-3 w-full">
                  
                  {/* Title & Badges (Wrap safely on small screens) */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-base md:text-lg text-(--color-primary) uppercase tracking-wide mr-2">
                      {report.crimeType}
                    </span>
                    <span className={`px-2 py-1 text-[10px] md:text-xs font-bold rounded-md border ${getSeverityColor(report.severity)}`}>
                      {report.severity || 'Unassigned'}
                    </span>
                    <span className={`px-2 py-1 text-[10px] md:text-xs font-bold rounded-md uppercase ${getStatusColor(report.status)}`}>
                      {report.status || 'Pending'}
                    </span>
                  </div>
                  
                  {/* Metadata Stack (Stacks vertically on phone, row on tablet/desktop) */}
                  <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-5 text-xs md:text-sm text-(--color-muted-foreground)">
                    <span className="flex items-center gap-1.5 truncate">
                      <LuClock size={14} className="shrink-0" /> 
                      {new Date(report.crimeTime).toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1.5 truncate">
                      <LuMapPin size={14} className="shrink-0" /> 
                      {report.crimeLocation?.latitude?.toFixed(4)}, {report.crimeLocation?.longitude?.toFixed(4)}
                    </span>
                    <span className="font-mono opacity-70 flex items-center">
                      ID: {report._id.slice(-6)}
                    </span>
                  </div>
                </div>

                {/* Right Side: Action Button */}
                {/* On mobile: full width with top border. On desktop: auto width, no border, right aligned */}
                <div className="flex items-center justify-end w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-(--color-border) text-(--color-highlight) font-bold gap-1 text-sm md:text-base opacity-100 md:opacity-80 md:group-hover:opacity-100 transition-opacity shrink-0">
                  Review Details <LuChevronRight size={18} />
                </div>

              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}