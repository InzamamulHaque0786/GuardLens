import userModel from '../models/user.model.js';
import crimeModel from '../models/crime.model.js'; 
import { Broadcast } from '../models/broadcast.model.js';


export const getDashboardStats = async (req, res) => {
    try {
        // 1. Fast KPI Counts
        const totalUsers = await userModel.countDocuments();
        
        // Count broadcasts that haven't expired and are still marked active
        const activeBroadcasts = await Broadcast.countDocuments({ 
            isActive: true, 
            expiresAt: { $gt: new Date() } 
        });
        
        // Assuming your Crime model has a 'status' field (e.g., 'Pending', 'Resolved')
        const activeReports = await crimeModel.countDocuments({ status: { $ne: 'Resolved' } });
        const resolvedReports = await crimeModel.countDocuments({ status: 'Resolved' });

        // 2. Crime Distribution for the Donut Chart
        const crimeDistribution = await crimeModel.aggregate([
            { $group: { _id: "$crimeType", count: { $sum: 1 } } },
            { $sort: { count: -1 } } // Sort largest categories to the top
        ]);

        // 3. Reports Over Last 7 Days for the Line Chart
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentReportsTrend = await crimeModel.aggregate([
            { $match: { createdAt: { $gte: sevenDaysAgo } } },
            {
                $group: {
                    // Group by exact Day (YYYY-MM-DD)
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } } // Sort chronologically
        ]);

        return res.status(200).json({
            success: true,
            data: {
                kpis: {
                    totalUsers,
                    activeBroadcasts,
                    activeReports,
                    resolvedReports
                },
                charts: {
                    distribution: crimeDistribution,
                    recentTrend: recentReportsTrend
                }
            }
        });

    } catch (error) {
        console.error("Dashboard Stats Error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch dashboard stats." });
    }
};