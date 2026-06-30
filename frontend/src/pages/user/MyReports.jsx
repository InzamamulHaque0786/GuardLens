import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LuSearch,
  LuFilter,
  LuMapPin,
  LuClock,
  LuShieldAlert,
  LuChevronRight,
} from "react-icons/lu";

// Adjust this import path to point to your Axios instance
import API from "../../api/API";

export default function MyReports() {
  const navigate = useNavigate();

  // Core State
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const fetchMyReports = async () => {
      try {
        const response = await API.get("/crime/my-reports");
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

  // SAFELY PARSE DATES TO PREVENT CRASHES
  const parseSafeDate = (dateString) => {
    if (!dateString) return null;
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? null : d;
  };

  const formatDate = (dateString) => {
    const d = parseSafeDate(dateString);
    return d ? d.toLocaleDateString() : "Unknown Date";
  };

  const formatTime = (dateString) => {
    const d = parseSafeDate(dateString);
    return d
      ? `at ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
      : "";
  };

  // Derived State: Filtering
  const getProcessedReports = () => {
    let processed = [...reports];

    // Search Filter
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      processed = processed.filter(
        (r) =>
          r.crimeType?.toLowerCase().includes(lowerSearch) ||
          r._id.toLowerCase().includes(lowerSearch),
      );
    }

    // Status Filter
    if (statusFilter !== "all") {
      processed = processed.filter((r) => r.status === statusFilter);
    }

    // Safely sort by newest first (handles invalid dates gracefully)
    processed.sort((a, b) => {
      const dateA = parseSafeDate(a.createdAt)?.getTime() || 0;
      const dateB = parseSafeDate(b.createdAt)?.getTime() || 0;
      return dateB - dateA;
    });

    return processed;
  };

  const displayReports = getProcessedReports();

  // Helper functions for UI Badges (Guardlens Design System)
  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case "critical":
        return "bg-(--gl-sos-pulse) text-(--gl-sos-base) border-(--gl-sos-base)";
      case "high":
        return "bg-(--gl-status-warning) text-(--gl-bg-base) border-(--gl-status-warning)";
      case "medium":
        return "bg-(--gl-brand-primary) text-(--gl-text-inverse) border-(--gl-brand-primary)";
      case "low":
        return "bg-(--gl-bg-surface-hover) text-(--gl-text-main) border-(--gl-border-light)";
      default:
        return "bg-(--gl-bg-surface-hover) text-(--gl-text-muted) border-(--gl-border-light)";
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "verified":
        return "bg-(--gl-status-success) text-(--gl-text-inverse)";
      case "resolved":
        return "bg-(--gl-brand-primary) text-(--gl-text-inverse)";
      case "rejected":
        return "bg-(--gl-bg-surface-hover) text-(--gl-text-muted)";
      default:
        return "bg-(--gl-status-warning) text-(--gl-bg-base)"; // Pending
    }
  };

  return (
    <div className="h-[84dvh] md:h-[90dvh] w-full">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-40 bg-(--gl-bg-base)/90 backdrop-blur-md border-b border-(--gl-border-light) px-5 sm:px-8 py-4  flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-integral font-bold text-(--gl-text-main) mb-2">
          My Reports
        </h1>
      </div>
      <div className="h-full w-full flex flex-col bg-(--gl-bg-base) font-satoshi  mx-auto p-4 sm:p-6 lg:p-8">
        {/* Control Panel (Search & Filter) */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6 bg-(--gl-bg-surface)  p-2 rounded-xl border border-(--gl-border-light)">
          {/* Search Bar */}
          <div className="relative w-full sm:flex-1">
            <LuSearch
              className="absolute left-3 top-1/2 -translate-y-1/2 text-(--gl-text-muted)"
              size={20}
            />
            <input
              type="text"
              placeholder="Search by type or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-(--gl-border-light) bg-(--gl-bg-base) text-(--gl-text-main) placeholder:text-(--gl-text-muted) focus:ring-2 focus:ring-(--gl-border-focus) outline-none transition-shadow"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 bg-(--gl-bg-base) border border-(--gl-border-light) rounded-lg px-3 py-2 w-full sm:w-auto min-w-[160px] focus-within:ring-2 focus-within:ring-(--gl-border-focus)">
            <LuFilter size={18} className="text-(--gl-text-muted) shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-transparent text-(--gl-text-main) text-sm md:text-base font-medium outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="pending_review">Pending</option>
              <option value="verified">Verified</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Error & Loading States */}
        {isLoading && (
          <div className="text-center py-10 md:py-20 text-(--gl-brand-primary) font-bold animate-pulse">
            Loading your reports...
          </div>
        )}
        {error && (
          <div className="p-4 bg-(--gl-sos-pulse) border border-(--gl-sos-base) text-(--gl-sos-base) rounded-xl mb-6 font-bold">
            {error}
          </div>
        )}

        {/* Responsive List View */}
        {!isLoading && !error && (
          <div className="flex flex-col gap-3 md:gap-4 overflow-y-auto pb-10 px-4">
            {displayReports.length === 0 ? (
              <div className="text-center py-12 md:py-20 text-(--gl-text-muted)">
                <LuShieldAlert size={48} className="mx-auto mb-4 opacity-50" />
                <p className="text-base md:text-lg font-bold">
                  No reports found.
                </p>
                <button
                  onClick={() => navigate("/report-crime")}
                  className="mt-4 px-6 py-2 bg-(--gl-brand-primary) text-(--gl-text-inverse) font-bold rounded-lg hover:opacity-90 transition-opacity"
                >
                  File a New Report
                </button>
              </div>
            ) : (
              displayReports.map((report) => (
                <div
                  key={report._id}
                  onClick={() => navigate(`/user/report/${report._id}`)}
                  className="group flex flex-col md:flex-row justify-between items-start md:items-center p-4 md:p-5 bg-(--gl-bg-surface) border border-(--gl-border-light) rounded-xl hover:border-(--gl-brand-primary) hover:shadow-md transition-all cursor-pointer gap-4"
                >
                  {/* Left Side: Information */}
                  <div className="flex flex-col gap-3 w-full">
                    {/* Title & Badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-base md:text-lg text-(--gl-text-main) uppercase tracking-wide mr-2">
                        {report.crimeType}
                      </span>
                      <span
                        className={`px-2 py-1 text-[10px] md:text-xs font-bold rounded-md uppercase ${getStatusColor(report.status)}`}
                      >
                        {report.status || "Pending"}
                      </span>
                      {/* Only show severity if admin has assigned it (not 'unassigned') */}
                      {report.severity && report.severity !== "unassigned" && (
                        <span
                          className={`px-2 py-1 text-[10px] md:text-xs font-bold rounded-md border ${getSeverityColor(report.severity)}`}
                        >
                          {report.severity}
                        </span>
                      )}
                    </div>

                    {/* Metadata Stack */}
                    <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-5 text-xs md:text-sm text-(--gl-text-muted)">
                      <span className="flex items-center gap-1.5 truncate">
                        <LuClock size={14} className="shrink-0" />
                        {formatDate(report.crimeTime)}{" "}
                        {formatTime(report.crimeTime)}
                      </span>
                      <span className="flex items-center gap-1.5 truncate">
                        <LuMapPin size={14} className="shrink-0" />
                        Location:{" "}
                        {report.crimeLocation?.latitude?.toFixed(4) ||
                          "N/A"},{" "}
                        {report.crimeLocation?.longitude?.toFixed(4) || "N/A"}
                      </span>
                    </div>
                  </div>

                  {/* Right Side: Action Button */}
                  <div className="flex items-center justify-end w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-(--gl-border-light) text-(--gl-brand-primary) font-bold gap-1 text-sm md:text-base opacity-100 md:opacity-80 md:group-hover:opacity-100 transition-opacity shrink-0">
                    View Status <LuChevronRight size={18} />
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
