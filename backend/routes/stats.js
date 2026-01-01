const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const auth = require("../middleware/auth");
const checkPermission = require("../middleware/permission");

router.get("/", auth, checkPermission("Dashboard"), async (req, res) => {
  try {
    // Parallel queries for dashboard stats
    const [revenueRes, ordersRes, usersRes, lowStockRes, salesTrendRes] =
      await Promise.all([
        pool.query("SELECT SUM(total_amount) as total FROM sales"),
        pool.query("SELECT COUNT(*) as total FROM sales"),
        pool.query("SELECT COUNT(*) as total FROM users"),
        pool.query(
          "SELECT COUNT(*) as total FROM inventory WHERE quantity <= low_stock_threshold"
        ),
        pool.query(`
        SELECT to_char(sale_date, 'Dy') as name, SUM(quantity) as demand 
        FROM sales 
        WHERE sale_date > NOW() - INTERVAL '7 days' 
        GROUP BY 1, sale_date 
        ORDER BY sale_date
      `),
      ]);

    res.json({
      revenue: revenueRes.rows[0].total || 0,
      orders: ordersRes.rows[0].total || 0,
      users: usersRes.rows[0].total || 0,
      lowStock: lowStockRes.rows[0].total || 0,
      salesTrend: salesTrendRes.rows, // Use real sales as proxy for demand pattern
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
