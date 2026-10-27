import { Sale } from '../models/Sale.js';
import { Product } from '../models/Product.js';
import { Customer } from '../models/Customer.js';
import { DayClose } from '../models/DayClose.js';
import { User } from '../models/User.js';

export const getAiBusinessAdvice = async (req, res, next) => {
  try {
    const { mode = 'daily' } = req.query; // 'daily' or 'weekly'
    const userId = req.user._id;

    const user = await User.findById(userId).select('+geminiApiKey');
    const apiKey = process.env.GEMINI_API_KEY || user?.geminiApiKey;

    // Date boundaries
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Fetch store metrics in parallel
    const [salesToday, salesWeek, products, customers, recentDayClose] = await Promise.all([
      Sale.find({ user: userId, createdAt: { $gte: startOfDay }, status: 'COMPLETED' }),
      Sale.find({ user: userId, createdAt: { $gte: startOfWeek }, status: 'COMPLETED' }),
      Product.find({ user: userId }),
      Customer.find({ user: userId }),
      DayClose.findOne({ user: userId }).sort({ createdAt: -1 }),
    ]);

    // Financial summaries
    const revenueToday = Math.round(salesToday.reduce((sum, s) => sum + (s.grandTotal || 0), 0));
    const profitToday = Math.round(salesToday.reduce((sum, s) => sum + (s.grossProfit || 0), 0));
    const marginToday = revenueToday > 0 ? Math.round((profitToday / revenueToday) * 100) : 0;

    const revenueWeek = Math.round(salesWeek.reduce((sum, s) => sum + (s.grandTotal || 0), 0));
    const profitWeek = Math.round(salesWeek.reduce((sum, s) => sum + (s.grossProfit || 0), 0));
    const marginWeek = revenueWeek > 0 ? Math.round((profitWeek / revenueWeek) * 100) : 0;

    // Item sales velocity in the past 7 days
    const itemSalesMap = {};
    salesWeek.forEach((sale) => {
      (sale.items || []).forEach((item) => {
        const key = item.productId?.toString() || item.name;
        if (!itemSalesMap[key]) {
          itemSalesMap[key] = {
            name: item.name,
            quantity: 0,
            revenue: 0,
            profit: 0,
          };
        }
        itemSalesMap[key].quantity += item.quantity || 1;
        itemSalesMap[key].revenue += (item.sellingPrice || 0) * (item.quantity || 1);
        itemSalesMap[key].profit += (item.profit || 0);
      });
    });

    const itemSalesList = Object.values(itemSalesMap).sort((a, b) => b.revenue - a.revenue);
    const topSellers = itemSalesList.slice(0, 5);

    // Low stock & reorder alerts
    const lowStockItems = products
      .filter((p) => p.stock <= p.safetyThreshold)
      .map((p) => ({
        name: p.name,
        stock: p.stock,
        safetyThreshold: p.safetyThreshold,
        unit: p.unit,
        costPrice: p.costPrice,
        sellingPrice: p.sellingPrice,
        suggestedReorder: Math.max((p.safetyThreshold * 2) - p.stock, 5),
      }))
      .slice(0, 6);

    // Dead / slow-moving stock (has stock > 0, but zero sales in the past 7 days)
    const activeItemNames = new Set(itemSalesList.map((i) => i.name.toLowerCase()));
    const slowMovingItems = products
      .filter((p) => p.stock > 0 && !activeItemNames.has(p.name.toLowerCase()))
      .map((p) => ({
        name: p.name,
        stock: p.stock,
        unit: p.unit,
        tiedUpCapital: Math.round(p.stock * p.costPrice),
      }))
      .slice(0, 5);

    // Margin leakage (items where profit margin is below 8%)
    const thinMarginItems = products
      .filter((p) => {
        const margin = p.sellingPrice > 0 ? ((p.sellingPrice - p.costPrice) / p.sellingPrice) * 100 : 0;
        return margin < 8 && p.sellingPrice > 0;
      })
      .map((p) => ({
        name: p.name,
        costPrice: p.costPrice,
        sellingPrice: p.sellingPrice,
        marginPercent: Math.round(((p.sellingPrice - p.costPrice) / p.sellingPrice) * 100),
      }))
      .slice(0, 4);

    // Khata credit health
    let totalKhataDebt = 0;
    let totalKhataSurplus = 0;
    const highDebtCustomers = [];

    customers.forEach((c) => {
      if (c.balance > 0) {
        totalKhataDebt += c.balance;
        if (c.balance >= 1000) {
          highDebtCustomers.push({ name: c.name, phone: c.phone, balance: c.balance });
        }
      } else if (c.balance < 0) {
        totalKhataSurplus += Math.abs(c.balance);
      }
    });

    highDebtCustomers.sort((a, b) => b.balance - a.balance);

    const storeSummary = {
      storeName: req.user.storeName,
      mode,
      figures: {
        today: { revenue: revenueToday, profit: profitToday, marginPercent: marginToday, bills: salesToday.length },
        week: { revenue: revenueWeek, profit: profitWeek, marginPercent: marginWeek, bills: salesWeek.length },
      },
      topSellers,
      lowStockCount: lowStockItems.length,
      lowStockItems,
      slowMovingCount: slowMovingItems.length,
      slowMovingItems,
      thinMarginItems,
      khata: {
        totalDebt: Math.round(totalKhataDebt),
        totalSurplus: Math.round(totalKhataSurplus),
        topDebtors: highDebtCustomers.slice(0, 4),
      },
      drawerDiscrepancy: recentDayClose?.discrepancy || 0,
    };

    // If API key is present, invoke Gemini API
    if (apiKey) {
      try {
        const promptText = `
You are an expert Indian retail operations and FMCG store consultant specializing in Kirana stores, mini-marts, and supermarkets.
Analyze the following store data for period "${mode.toUpperCase()}":
${JSON.stringify(storeSummary, null, 2)}

Provide a sharp, realistic, highly actionable retail briefing in strict JSON format.
Ensure all advice is practical for an Indian storekeeper (e.g. price hikes, combo bundles, supplier reorder budget, WhatsApp debt follow-ups).

Respond ONLY with valid JSON matching this exact structure:
{
  "headline": "Short punchy status headline for the storekeeper",
  "healthScore": 88,
  "healthStatus": "Thriving | Healthy | Needs Attention",
  "executiveSummary": "2 to 3 sentences summarizing the revenue, profit margins, and key operational focus",
  "marginAlerts": [
    {
      "productName": "Item Name",
      "issue": "Specific margin or pricing concern",
      "recommendedAction": "Exact retail action to take (e.g. increase SP by ₹5 or renegotiate with vendor)"
    }
  ],
  "restockPriorities": [
    {
      "productName": "Item Name",
      "urgency": "High | Medium",
      "suggestedQty": 10,
      "reason": "Why to reorder now based on sales velocity and low buffer"
    }
  ],
  "deadStockSolutions": [
    {
      "productName": "Item Name",
      "strategy": "Actionable way to liquidate dead stock (e.g. bundle with X, discount 15%, counter placement)"
    }
  ],
  "khataAdvice": {
    "riskLevel": "Low | Moderate | High",
    "recommendation": "Advice on debt collection and handling advance surpluses"
  },
  "growthInitiatives": [
    "Concrete strategic action 1",
    "Concrete strategic action 2",
    "Concrete strategic action 3"
  ]
}
`;

        const candidateModels = ['gemini-3.1-flash-lite', 'gemini-3.5-flash', 'gemini-3.8-flash', 'gemini-flash-latest'];
        for (const model of candidateModels) {
          try {
            const geminiResponse = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: [{ parts: [{ text: promptText }] }],
                  generationConfig: {
                    responseMimeType: 'application/json',
                    temperature: 0.2,
                  },
                }),
              }
            );

            if (geminiResponse.ok) {
              const geminiData = await geminiResponse.json();
              const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
              if (rawText) {
                const parsedAdvice = JSON.parse(rawText);
                return res.status(200).json({
                  success: true,
                  mode,
                  isAiGenerated: true,
                  modelUsed: model,
                  storeMetrics: storeSummary,
                  advice: parsedAdvice,
                });
              }
            } else {
              console.warn(`Model ${model} returned non-OK status:`, geminiResponse.status);
            }
          } catch (modelErr) {
            console.warn(`Model ${model} failed, trying next:`, modelErr.message);
          }
        }
      } catch (geminiErr) {
        console.error('Gemini invocation error, falling back to heuristic engine:', geminiErr.message);
      }
    }

    // Heuristic Fallback Engine (when API key is absent or network fails)
    const fallbackAdvice = {
      headline: mode === 'daily'
        ? (revenueToday > 0 ? `Today's revenue is ₹${revenueToday.toLocaleString('en-IN')} with a ${marginToday}% gross margin` : 'Register open — awaiting today’s counter checkout transactions')
        : `7-Day Revenue stands at ₹${revenueWeek.toLocaleString('en-IN')} across ${salesWeek.length} completed customer orders`,
      healthScore: Math.min(100, Math.max(50, (marginToday || marginWeek || 15) * 4 + (lowStockItems.length === 0 ? 25 : 10))),
      healthStatus: (marginToday >= 15 || marginWeek >= 15) ? 'Healthy' : 'Needs Attention',
      executiveSummary: mode === 'daily'
        ? `Store has closed ${salesToday.length} bills today generating ₹${profitToday.toLocaleString('en-IN')} in gross profit. ${lowStockItems.length > 0 ? `${lowStockItems.length} products need replenishment.` : 'Shelf stock is well-balanced.'}`
        : `Weekly volume reached ₹${revenueWeek.toLocaleString('en-IN')}. ${totalKhataDebt > 0 ? `₹${totalKhataDebt.toLocaleString('en-IN')} is pending in customer Khata credit.` : 'Customer debt is minimal.'}`,
      marginAlerts: thinMarginItems.map((item) => ({
        productName: item.name,
        issue: `Gross profit margin is only ${item.marginPercent}% (Wholesale ₹${item.costPrice} vs Retail ₹${item.sellingPrice}).`,
        recommendedAction: `Increase retail price by ₹${Math.max(2, Math.round(item.costPrice * 0.05))} to protect store margins against distributor increases.`,
      })),
      restockPriorities: lowStockItems.map((item) => ({
        productName: item.name,
        urgency: item.stock === 0 ? 'High' : 'Medium',
        suggestedQty: item.suggestedReorder,
        reason: item.stock === 0 ? 'Out of stock on shelves! Customers will turn away.' : `Only ${item.stock} ${item.unit} left against safety threshold of ${item.safetyThreshold}.`,
      })),
      deadStockSolutions: slowMovingItems.map((item) => ({
        productName: item.name,
        strategy: `Holding ${item.stock} ${item.unit} worth ₹${item.tiedUpCapital}. Place near checkout counter or bundle with fast-selling grocery staples.`,
      })),
      khataAdvice: {
        riskLevel: totalKhataDebt > 10000 ? 'High' : totalKhataDebt > 3000 ? 'Moderate' : 'Low',
        recommendation: highDebtCustomers.length > 0
          ? `${highDebtCustomers.length} customer(s) owe over ₹1,000 each. Use 1-click WhatsApp reminders to encourage partial settlements.`
          : 'Customer credit ledger is within safe working limits.',
      },
      growthInitiatives: [
        'Place high-margin confectionery and snacks near the billing counter to drive impulse basket additions.',
        'Review supplier purchase invoices weekly to ensure distributor wholesale price hikes are reflected in counter selling prices.',
        'Encourage UPI and Cash settlement for bills under ₹200 to keep checkout queues moving rapidly.',
      ],
    };

    return res.status(200).json({
      success: true,
      mode,
      isAiGenerated: false,
      hasKeyConfigured: Boolean(apiKey),
      storeMetrics: storeSummary,
      advice: fallbackAdvice,
    });
  } catch (err) {
    next(err);
  }
};
