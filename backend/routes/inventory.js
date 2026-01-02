const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const auth = require("../middleware/auth");
const checkPermission = require("../middleware/permission");

// Get all inventory with pagination
router.get("/", auth, checkPermission("Inventory"), async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  const userRole = req.user.role;
  const userId = req.user.id;

  try {
    let whereClause = "";
    let params = [];

    // Filter for tenant
    if (userRole === "tenant") {
      whereClause = "WHERE p.tenant_id = $1";
      params = [userId];
    }

    const countQuery = `
      SELECT COUNT(*) 
      FROM inventory i 
      JOIN products p ON i.product_id = p.id 
      ${whereClause}
    `;
    const totalCountResult = await pool.query(countQuery, params);
    const totalCount = parseInt(totalCountResult.rows[0].count);

    const query = `
      SELECT i.*, p.name as product_name, p.sku, p.category 
      FROM inventory i 
      JOIN products p ON i.product_id = p.id 
      ${whereClause}
      ORDER BY p.name
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    const result = await pool.query(query, [...params, limit, offset]);

    res.json({
      items: result.rows,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get stock for a specific product
router.get(
  "/product/:productId",
  auth,
  checkPermission("Inventory"),
  async (req, res) => {
    const { productId } = req.params;
    const userRole = req.user.role;
    const userId = req.user.id;

    try {
      let query =
        "SELECT quantity FROM inventory i JOIN products p ON i.product_id = p.id WHERE i.product_id = $1";
      const params = [productId];

      if (userRole === "tenant") {
        query += " AND p.tenant_id = $2";
        params.push(userId);
      }

      const result = await pool.query(query, params);

      if (result.rows.length === 0) {
        // Distinguish between not found and access denied could be better, but for now 404 is safe
        return res
          .status(404)
          .json({
            error: "Inventory not found for this product or access denied",
          });
      }
      res.json({ quantity: result.rows[0].quantity });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// Update inventory quantity
router.put("/:id", auth, checkPermission("Inventory"), async (req, res) => {
  const { id } = req.params;
  const { quantity, low_stock_threshold } = req.body;
  const userRole = req.user.role;
  const userId = req.user.id;

  try {
    // Check permission if tenant
    if (userRole === "tenant") {
      const checkQuery = `
        SELECT 1 
        FROM inventory i 
        JOIN products p ON i.product_id = p.id 
        WHERE i.id = $1 AND p.tenant_id = $2
      `;
      const checkResult = await pool.query(checkQuery, [id, userId]);
      if (checkResult.rows.length === 0) {
        return res
          .status(403)
          .json({ error: "Access denied or inventory item not found" });
      }
    }

    const result = await pool.query(
      "UPDATE inventory SET quantity = $1, low_stock_threshold = $2, last_updated = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *",
      [quantity, low_stock_threshold, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const { Parser } = require("json2csv");
const PDFDocument = require("pdfkit");

// Export Inventory as CSV
router.get(
  "/export/csv",
  auth,
  checkPermission("Inventory"),
  async (req, res) => {
    const userRole = req.user.role;
    const userId = req.user.id;
    try {
      let whereClause = "";
      let params = [];

      if (userRole === "tenant") {
        whereClause = "WHERE p.tenant_id = $1";
        params = [userId];
      }

      const query = `
          SELECT i.id, p.name as product_name, p.sku, i.quantity, i.low_stock_threshold, i.last_updated
          FROM inventory i 
          JOIN products p ON i.product_id = p.id 
          ${whereClause}
          ORDER BY p.name
        `;
      const result = await pool.query(query, params);
      const inventory = result.rows;

      const fields = [
        "id",
        "product_name",
        "sku",
        "quantity",
        "low_stock_threshold",
        "last_updated",
      ];
      const json2csvParser = new Parser({ fields });
      const csv = json2csvParser.parse(inventory);

      res.header("Content-Type", "text/csv");
      res.attachment("inventory.csv");
      return res.send(csv);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error exporting CSV" });
    }
  }
);

// Export Inventory as PDF
router.get(
  "/export/pdf",
  auth,
  checkPermission("Inventory"),
  async (req, res) => {
    const userRole = req.user.role;
    const userId = req.user.id;
    try {
      let whereClause = "";
      let params = [];

      if (userRole === "tenant") {
        whereClause = "WHERE p.tenant_id = $1";
        params = [userId];
      }

      const query = `
          SELECT i.id, p.name as product_name, p.sku, i.quantity, i.low_stock_threshold, i.last_updated
          FROM inventory i 
          JOIN products p ON i.product_id = p.id 
          ${whereClause}
          ORDER BY p.name
        `;
      const result = await pool.query(query, params);
      const inventory = result.rows;

      const doc = new PDFDocument();
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=inventory.pdf"
      );

      doc.pipe(res);

      doc.fontSize(20).text("Inventory Report", { align: "center" });
      doc.moveDown();

      inventory.forEach((item, i) => {
        doc.fontSize(12).text(`Item #${i + 1}: ${item.product_name}`);
        doc.fontSize(10).text(`SKU: ${item.sku || "N/A"}`);
        doc.text(`Quantity: ${item.quantity}`);
        doc.text(`Low Stock Threshold: ${item.low_stock_threshold}`);
        doc.text(`Last Updated: ${item.last_updated}`);
        doc.moveDown(0.5);
        doc.text("---------------------------------------------------");
        doc.moveDown(0.5);
      });

      doc.end();
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error exporting PDF" });
    }
  }
);

module.exports = router;
