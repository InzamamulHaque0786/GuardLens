import React, { useState, useEffect } from 'react';
import { 
  LuUsers, LuRadioTower, LuShieldAlert, LuCircleCheck,
  LuMap, LuFileText, LuCirclePlus
} from 'react-icons/lu';
import { 
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { Link } from 'react-router-dom'; // Assuming you use react-router for navigation
import API from "../../api/API"; // Adjust path to your axios instance

// Vibrant colors for the Crime Distribution Pie Chart
const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#3b82f6', '#8b5cf6', '#ec4899', '#64748b'];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        // Hitting your exact endpoint
        const response = await API.get('/dashboard/getall');
        if (response.data.success) {
          setStats(response.data.data);
        }
      } catch (err) {
        console.error("Dashboard Fetch Error:", err);
        setError("Failed to load dashboard data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-500 font-bold font-satoshi">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        Initializing Command Center...
      </div>
    );
  }

  if (error || !stats) {
    return <div className="min-h-screen flex items-center justify-center font-bold text-red-500">{error}</div>;
  }

  // Destructuring your backend data (Make sure these match what your backend actually sends!)
  const { kpis, charts } = stats;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 font-satoshi text-black bg-gray-50 min-h-screen">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-integral text-gray-900">Command Center</h1>
        <p className="text-gray-500 font-medium mt-1">Real-time overview of platform activity and safety metrics.</p>
      </div>

      {/* 1. KPI Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <LuUsers size={28} />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Total Users</p>
            <h3 className="text-2xl font-bold font-integral">{kpis?.totalUsers || 0}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
            <LuShieldAlert size={28} />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Active Incidents</p>
            <h3 className="text-2xl font-bold font-integral text-red-600">{kpis?.activeReports || 0}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shrink-0">
            <LuCircleCheck size={28} />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Resolved Cases</p>
            <h3 className="text-2xl font-bold font-integral text-green-600">{kpis?.resolvedReports || 0}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
            <LuRadioTower size={28} />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Live Broadcasts</p>
            <h3 className="text-2xl font-bold font-integral text-orange-500">{kpis?.activeBroadcasts || 0}</h3>
          </div>
        </div>

      </div>

      {/* 2. Analytical Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        
        {/* Donut Chart: Crime Distribution */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold font-integral mb-6">Incident Distribution</h2>
          <div className="h-72 w-full">
            {charts?.distribution?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.distribution}
                    dataKey="count"
                    nameKey="_id" // The crimeType from the aggregation
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={3}
                  >
                    {charts.distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 font-medium">No incident data available.</div>
            )}
          </div>
        </div>

        {/* Bar Chart: Recent Trend */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold font-integral mb-6">Reports Over Last 7 Days</h2>
          <div className="h-72 w-full">
            {charts?.recentTrend?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.recentTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="_id" 
                    tick={{ fontSize: 12, fill: '#64748b' }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#64748b' }} 
                    axisLine={false} 
                    tickLine={false} 
                    allowDecimals={false}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 font-medium">No trend data available.</div>
            )}
          </div>
        </div>

      </div>

      {/* 3. Quick Actions */}
      <h2 className="text-lg font-bold font-integral mb-4">Command Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <Link to="/admin/reports" className="group bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center hover:border-blue-500 hover:shadow-md transition-all">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <LuFileText size={24} />
            </div>
            <div>
              <p className="font-bold text-gray-900">Manage Reports</p>
              <p className="text-xs text-gray-500">Triage and update statuses</p>
            </div>
          </div>
        </Link>

        <Link to="/admin/map" className="group bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center hover:border-purple-500 hover:shadow-md transition-all">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <LuMap size={24} />
            </div>
            <div>
              <p className="font-bold text-gray-900">Global Crime Map</p>
              <p className="text-xs text-gray-500">Spatial analysis & routing</p>
            </div>
          </div>
        </Link>

        <Link to="/admin/broadcast" className="group bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center hover:border-red-500 hover:shadow-md transition-all">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-50 text-red-600 rounded-lg group-hover:bg-red-600 group-hover:text-white transition-colors">
              <LuCirclePlus size={24} />
            </div>
            <div>
              <p className="font-bold text-gray-900">New Broadcast</p>
              <p className="text-xs text-gray-500">Transmit geofenced alert</p>
            </div>
          </div>
        </Link>

      </div>

    </div>
  );
}