const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const auth = require("../middleware/auth");
const checkPermission = require("../middleware/permission");

router.get("/", auth, checkPermission("Dashboard"), async (req, res) => {
  try {
    const { role, id } = req.user;

    let queries = {};

    if (role === "tenant") {
      // Tenant Stats
      queries = {
        revenue: {
          text: `SELECT SUM(s.total_amount) as total 
                 FROM sales s 
                 JOIN products p ON s.product_id = p.id 
                 WHERE p.tenant_id = $1`,
          values: [id],
        },
        orders: {
          text: `SELECT COUNT(*) as total 
                 FROM sales s 
                 JOIN products p ON s.product_id = p.id 
                 WHERE p.tenant_id = $1`,
          values: [id],
        },
        users: {
          text: `SELECT COUNT(DISTINCT s.user_id) as total 
                 FROM sales s 
                 JOIN products p ON s.product_id = p.id 
                 WHERE p.tenant_id = $1`,
          values: [id],
        },
        lowStock: {
          text: `SELECT COUNT(*) as total 
                 FROM inventory i 
                 JOIN products p ON i.product_id = p.id 
                 WHERE p.tenant_id = $1 AND i.quantity <= i.low_stock_threshold`,
          values: [id],
        },
        salesTrend: {
          text: `SELECT to_char(s.sale_date, 'Dy') as name, SUM(s.quantity) as demand 
                 FROM sales s 
                 JOIN products p ON s.product_id = p.id 
                 WHERE p.tenant_id = $1 AND s.sale_date > NOW() - INTERVAL '7 days' 
                 GROUP BY 1, s.sale_date 
                 ORDER BY s.sale_date`,
          values: [id],
        },
      };
    } else if (role === "user") {
      // Regular User Stats (Personal)
      queries = {
        revenue: {
          text: `SELECT SUM(total_amount) as total FROM orders WHERE user_id = $1`,
          values: [id],
        },
        orders: {
          text: `SELECT COUNT(*) as total FROM orders WHERE user_id = $1`,
          values: [id],
        },
        users: {
          // For users, maybe show number of items purchased or something similar?
          // Or just 1 (themself). Let's show total items purchased.
          text: `SELECT COUNT(*) as total FROM sales WHERE user_id = $1`,
          values: [id],
        },
        lowStock: {
          // Users don't manage inventory
          text: `SELECT 0 as total`,
          values: [],
        },
        salesTrend: {
          // User spending trend?
          text: `SELECT to_char(created_at, 'Dy') as name, SUM(total_amount) as demand 
                 FROM orders 
                 WHERE user_id = $1 AND created_at > NOW() - INTERVAL '7 days' 
                 GROUP BY 1, created_at 
                 ORDER BY created_at`,
          values: [id],
        },
      };
    } else {
      // Admin / Super Admin Stats (Global)
      queries = {
        revenue: {
          text: "SELECT SUM(total_amount) as total FROM sales",
          values: [],
        },
        orders: { text: "SELECT COUNT(*) as total FROM sales", values: [] },
        users: { text: "SELECT COUNT(*) as total FROM users", values: [] },
        lowStock: {
          text: "SELECT COUNT(*) as total FROM inventory WHERE quantity <= low_stock_threshold",
          values: [],
        },
        salesTrend: {
          // Last 7 days orders count
          text: `SELECT to_char(created_at, 'Dy') as name, COUNT(*) as demand 
                 FROM orders 
                 WHERE created_at > NOW() - INTERVAL '7 days' 
                 GROUP BY 1, created_at 
                 ORDER BY created_at`,
          values: [],
        },
        // Super Admin Specific Extra Stats
        userRoles: {
          text: "SELECT role, COUNT(*) as count FROM users GROUP BY role",
          values: [],
        },
        categories: {
          text: "SELECT category, COUNT(*) as count FROM products WHERE category IS NOT NULL GROUP BY category",
          values: [],
        },
        stockStatus: {
          text: `
            SELECT 
              CASE 
                WHEN quantity = 0 THEN 'Out of Stock'
                WHEN quantity <= low_stock_threshold THEN 'Low Stock'
                ELSE 'In Stock'
              END as status,
              COUNT(*) as count
            FROM inventory
            GROUP BY 1
          `,
          values: [],
        },
      };
    }

    const promises = [
      pool.query(queries.revenue.text, queries.revenue.values),
      pool.query(queries.orders.text, queries.orders.values),
      pool.query(queries.users.text, queries.users.values),
      pool.query(queries.lowStock.text, queries.lowStock.values),
      pool.query(queries.salesTrend.text, queries.salesTrend.values),
    ];

    // Add extra queries if they exist (for super_admin)
    if (queries.userRoles)
      promises.push(
        pool.query(queries.userRoles.text, queries.userRoles.values)
      );
    if (queries.categories)
      promises.push(
        pool.query(queries.categories.text, queries.categories.values)
      );
    if (queries.stockStatus)
      promises.push(
        pool.query(queries.stockStatus.text, queries.stockStatus.values)
      );

    const results = await Promise.all(promises);

    const revenueRes = results[0];
    const ordersRes = results[1];
    const usersRes = results[2];
    const lowStockRes = results[3];
    const salesTrendRes = results[4];

    // Optional results
    const userRolesRes = queries.userRoles ? results[5] : null;
    const categoriesRes = queries.categories ? results[6] : null;
    const stockStatusRes = queries.stockStatus ? results[7] : null;

    res.json({
      revenue: revenueRes.rows[0]?.total || 0,
      orders: ordersRes.rows[0]?.total || 0,
      users: usersRes.rows[0]?.total || 0,
      lowStock: lowStockRes.rows[0]?.total || 0,
      salesTrend: salesTrendRes.rows,
      // Extra stats
      userRoleDistribution: userRolesRes ? userRolesRes.rows : [],
      categoryDistribution: categoriesRes ? categoriesRes.rows : [],
      stockDistribution: stockStatusRes ? stockStatusRes.rows : [],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
