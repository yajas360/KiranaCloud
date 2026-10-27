import { Sale } from '../models/Sale.js';
import { Product } from '../models/Product.js';
import { Customer } from '../models/Customer.js';
import { DayClose } from '../models/DayClose.js';

export const getDashboardMetrics = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // 1. Today's Sales Aggregation
    const todaySalesAgg = await Sale.aggregate([
      {
        $match: {
          user: req.user._id,
          status: 'COMPLETED',
          date: { $gte: startOfToday, $lte: endOfToday },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$grandTotal' },
          totalProfit: { $sum: '$netProfit' },
          totalBills: { $sum: 1 },
        },
      },
    ]);

    const todayRevenue = todaySalesAgg.length > 0 ? todaySalesAgg[0].totalRevenue : 0;
    const todayProfit = todaySalesAgg.length > 0 ? todaySalesAgg[0].totalProfit : 0;
    const todayBills = todaySalesAgg.length > 0 ? todaySalesAgg[0].totalBills : 0;
    const todayMargin = todayRevenue > 0 ? Math.round((todayProfit / todayRevenue) * 100) : 0;

    // 2. Inventory Stock Metrics
    const totalProducts = await Product.countDocuments({ user: req.user._id });
    const lowStockCount = await Product.countDocuments({
      user: req.user._id,
      $expr: {
        $and: [
          { $lte: ['$stockQuantity', '$minThreshold'] },
          { $gt: ['$stockQuantity', 0] },
        ],
      },
    });
    const outOfStockCount = await Product.countDocuments({
      user: req.user._id,
      stockQuantity: 0,
    });

    // 3. Last 7 Days Daily Revenue & Profit Trend
    const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0);

    const trendAgg = await Sale.aggregate([
      {
        $match: {
          user: req.user._id,
          status: 'COMPLETED',
          date: { $gte: sevenDaysAgo, $lte: endOfToday },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          revenue: { $sum: '$grandTotal' },
          profit: { $sum: '$netProfit' },
          bills: { $sum: 1 },
        },
      },
      { $sort: { '_id': 1 } },
    ]);

    const trendMap = new Map();
    for (const item of trendAgg) {
      trendMap.set(item._id, item);
    }

    const last7DaysTrend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-IN', { weekday: 'short' });
      const record = trendMap.get(dateKey) || { revenue: 0, profit: 0, bills: 0 };

      last7DaysTrend.push({
        date: dateKey,
        day: dayName,
        revenue: record.revenue,
        profit: record.profit,
        bills: record.bills,
      });
    }

    // 4. Sales by Category (Unwind items array)
    const categoryAgg = await Sale.aggregate([
      {
        $match: {
          user: req.user._id,
          status: 'COMPLETED',
        },
      },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'productDoc',
        },
      },
      { $unwind: { path: '$productDoc', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$productDoc.category',
          totalRevenue: { $sum: '$items.total' },
          itemsSold: { $sum: '$items.quantity' },
        },
      },
      { $sort: { totalRevenue: -1 } },
    ]);

    const categoryBreakdown = categoryAgg.map((c) => ({
      category: c._id || 'General',
      revenue: c.totalRevenue,
      itemsSold: c.itemsSold,
    }));

    // 5. Top 5 Best-Selling Products
    const topProductsAgg = await Sale.aggregate([
      {
        $match: {
          user: req.user._id,
          status: 'COMPLETED',
        },
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          name: { $first: '$items.name' },
          sku: { $first: '$items.sku' },
          sellingPrice: { $first: '$items.sellingPrice' },
          totalUnitsSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.total' },
        },
      },
      { $sort: { totalUnitsSold: -1 } },
      { $limit: 5 },
    ]);

    // 6. Recent 5 Transactions
    const recentSales = await Sale.find({ user: req.user._id })
      .sort({ date: -1 })
      .limit(6);

    res.status(200).json({
      success: true,
      data: {
        today: {
          revenue: todayRevenue,
          netProfit: todayProfit,
          billsCount: todayBills,
          marginPercentage: todayMargin,
        },
        inventoryHealth: {
          totalProducts,
          lowStockCount,
          outOfStockCount,
          healthyCount: Math.max(0, totalProducts - lowStockCount - outOfStockCount),
        },
        last7DaysTrend,
        categoryBreakdown,
        topProducts: topProductsAgg,
        recentSales,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getDayCloseSummary = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const [salesBreakdownAgg, khataAgg, existingClose] = await Promise.all([
      Sale.aggregate([
        {
          $match: {
            user: req.user._id,
            status: 'COMPLETED',
            date: { $gte: startOfToday, $lte: endOfToday },
          },
        },
        {
          $group: {
            _id: '$paymentMethod',
            total: { $sum: '$grandTotal' },
            count: { $sum: 1 },
            profit: { $sum: '$netProfit' },
          },
        },
      ]),
      Customer.aggregate([
        { $match: { user: req.user._id } },
        { $unwind: '$history' },
        {
          $match: {
            'history.type': 'PAYMENT',
            'history.date': { $gte: startOfToday, $lte: endOfToday },
          },
        },
        {
          $group: {
            _id: null,
            totalKhataCollected: { $sum: '$history.amount' },
          },
        },
      ]),
      DayClose.findOne({
        user: req.user._id,
        date: { $gte: startOfToday, $lte: endOfToday },
      }),
    ]);

    let cashSales = 0;
    let upiSales = 0;
    let cardSales = 0;
    let creditSales = 0;
    let totalRevenue = 0;
    let totalProfit = 0;
    let totalBills = 0;

    salesBreakdownAgg.forEach((group) => {
      totalRevenue += group.total;
      totalProfit += group.profit;
      totalBills += group.count;

      if (group._id === 'Cash') cashSales = group.total;
      else if (group._id === 'UPI') upiSales = group.total;
      else if (group._id === 'Card') cardSales = group.total;
      else if (group._id === 'Credit') creditSales = group.total;
    });

    const khataCollected = khataAgg.length > 0 ? khataAgg[0].totalKhataCollected : 0;

    res.status(200).json({
      success: true,
      data: {
        date: startOfToday,
        totalRevenue,
        totalProfit,
        totalBills,
        cashSales,
        upiSales,
        cardSales,
        creditSales,
        khataCollected,
        existingClose: existingClose || null,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const submitDayClose = async (req, res, next) => {
  try {
    const { startingFloat = 0, countedCash = 0, notes = '' } = req.body;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const [salesBreakdownAgg, khataAgg] = await Promise.all([
      Sale.aggregate([
        {
          $match: {
            user: req.user._id,
            status: 'COMPLETED',
            date: { $gte: startOfToday, $lte: endOfToday },
          },
        },
        {
          $group: {
            _id: '$paymentMethod',
            total: { $sum: '$grandTotal' },
            count: { $sum: 1 },
            profit: { $sum: '$netProfit' },
          },
        },
      ]),
      Customer.aggregate([
        { $match: { user: req.user._id } },
        { $unwind: '$history' },
        {
          $match: {
            'history.type': 'PAYMENT',
            'history.date': { $gte: startOfToday, $lte: endOfToday },
          },
        },
        {
          $group: {
            _id: null,
            totalKhataCollected: { $sum: '$history.amount' },
          },
        },
      ]),
    ]);

    let cashSales = 0;
    let upiSales = 0;
    let cardSales = 0;
    let creditSales = 0;
    let totalRevenue = 0;
    let totalProfit = 0;
    let totalBills = 0;

    salesBreakdownAgg.forEach((group) => {
      totalRevenue += group.total;
      totalProfit += group.profit;
      totalBills += group.count;

      if (group._id === 'Cash') cashSales = group.total;
      else if (group._id === 'UPI') upiSales = group.total;
      else if (group._id === 'Card') cardSales = group.total;
      else if (group._id === 'Credit') creditSales = group.total;
    });

    const khataCollected = khataAgg.length > 0 ? khataAgg[0].totalKhataCollected : 0;
    const numFloat = Math.max(0, parseFloat(startingFloat) || 0);
    const numCounted = Math.max(0, parseFloat(countedCash) || 0);

    const expectedCash = numFloat + cashSales + khataCollected;
    const difference = Math.round((numCounted - expectedCash) * 100) / 100;
    const status = Math.abs(difference) < 0.01 ? 'MATCHED' : difference < 0 ? 'SHORTAGE' : 'SURPLUS';

    const dayCloseRecord = await DayClose.findOneAndUpdate(
      {
        user: req.user._id,
        date: { $gte: startOfToday, $lte: endOfToday },
      },
      {
        user: req.user._id,
        date: startOfToday,
        totalRevenue,
        totalProfit,
        totalBills,
        cashSales,
        upiSales,
        cardSales,
        creditSales,
        khataCollected,
        startingFloat: numFloat,
        expectedCash,
        countedCash: numCounted,
        difference,
        status,
        notes: notes.trim(),
        closedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Day closed and Z-Report recorded successfully.',
      data: dayCloseRecord,
    });
  } catch (err) {
    next(err);
  }
};

export const getDayCloseHistory = async (req, res, next) => {
  try {
    const history = await DayClose.find({ user: req.user._id })
      .sort({ date: -1 })
      .limit(30);

    res.status(200).json({
      success: true,
      data: history,
    });
  } catch (err) {
    next(err);
  }
};
