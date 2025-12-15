import Booking from "../models/Booking.js";
import Auth from "../models/Auth.js";
import Finance from "../models/Finance.js";
import Field from "../models/Field.js";
import { logger } from "../utils/logger.js";

// Get analytics dashboard data
export const getAnalytics = async (req, res) => {
  try {
    const { from, to } = req.query;

    // Date filters
    const dateFilter = {};
    if (from) dateFilter.$gte = new Date(from);
    if (to) dateFilter.$lte = new Date(to);
    const hasDateFilter = Object.keys(dateFilter).length > 0;

    // 1. Total Stats
    const totalUsers = await Auth.countDocuments({ role: false });
    const totalBookings = await Booking.countDocuments(hasDateFilter ? { createdAt: dateFilter } : {});

    // Revenue from paid bookings
    const revenueData = await Booking.aggregate([
      {
        $match: {
          paymentStatus: "paid",
          ...(hasDateFilter ? { createdAt: dateFilter } : {}),
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalPrice" },
        },
      },
    ]);
    const totalRevenue = revenueData[0]?.total || 0;

    // 2. Bookings by Status
    const bookingsByStatus = await Booking.aggregate([
      {
        $match: hasDateFilter ? { createdAt: dateFilter } : {},
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // 3. Revenue by Month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const revenueByMonth = await Booking.aggregate([
      {
        $match: {
          paymentStatus: "paid",
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          revenue: { $sum: "$totalPrice" },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ]);

    // Format month names
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const formattedRevenueByMonth = revenueByMonth.map((item) => ({
      month: `${monthNames[item._id.month - 1]} ${item._id.year}`,
      revenue: item.revenue,
      bookings: item.count,
    }));

    // 4. Top Fields by Revenue
    const topFields = await Booking.aggregate([
      {
        $match: {
          paymentStatus: "paid",
          ...(hasDateFilter ? { createdAt: dateFilter } : {}),
        },
      },
      {
        $lookup: {
          from: "fields",
          localField: "fieldId",
          foreignField: "_id",
          as: "field",
        },
      },
      {
        $unwind: "$field",
      },
      {
        $group: {
          _id: "$fieldId",
          fieldName: { $first: "$field.name" },
          sport: { $first: "$field.sport" },
          bookings: { $sum: 1 },
          revenue: { $sum: "$totalPrice" },
        },
      },
      {
        $sort: { revenue: -1 },
      },
      {
        $limit: 5,
      },
    ]);

    // 5. Payment Status Distribution
    const paymentDistribution = await Booking.aggregate([
      {
        $match: hasDateFilter ? { createdAt: dateFilter } : {},
      },
      {
        $group: {
          _id: "$paymentStatus",
          count: { $sum: 1 },
          totalAmount: { $sum: "$totalPrice" },
        },
      },
    ]);

    // 6. Popular Time Slots
    const popularTimeSlots = await Booking.aggregate([
      {
        $match: hasDateFilter ? { createdAt: dateFilter } : {},
      },
      {
        $group: {
          _id: {
            $concat: ["$startTime", " - ", "$endTime"],
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    // 7. User Activity (New users per month)
    const userActivity = await Auth.aggregate([
      {
        $match: {
          role: false,
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ]);

    const formattedUserActivity = userActivity.map((item) => ({
      month: `${monthNames[item._id.month - 1]} ${item._id.year}`,
      users: item.count,
    }));

    // 8. Finance Summary
    const financeStats = await Finance.aggregate([
      {
        $group: {
          _id: "$type",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    const income = financeStats.find((s) => s._id === "income");
    const expense = financeStats.find((s) => s._id === "expense");

    const financeSummary = {
      totalIncome: income?.total || 0,
      totalExpense: expense?.total || 0,
      netProfit: (income?.total || 0) - (expense?.total || 0),
      incomeCount: income?.count || 0,
      expenseCount: expense?.count || 0,
    };

    logger.info(`Analytics data retrieved | admin=${req.user.id} period=${from || "all"} to ${to || "now"}`);

    return res.status(200).json({
      status: 200,
      data: {
        overview: {
          totalRevenue,
          totalBookings,
          totalUsers,
          netProfit: financeSummary.netProfit,
        },
        bookingsByStatus,
        revenueByMonth: formattedRevenueByMonth,
        topFields,
        paymentDistribution,
        popularTimeSlots,
        userActivity: formattedUserActivity,
        financeSummary,
      },
      message: "Analytics data berhasil diambil",
    });
  } catch (error) {
    console.error("Error getting analytics:", error);
    logger.error(`Error getting analytics: ${error.message}`);
    return res.status(500).json({
      status: 500,
      message: "Gagal mengambil data analytics",
    });
  }
};
