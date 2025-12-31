const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// Get all inventory with pagination
router.get("/", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    const totalCountResult = await pool.query("SELECT COUNT(*) FROM inventory");
    const totalCount = parseInt(totalCountResult.rows[0].count);

    const query = `
      SELECT i.*, p.name as product_name, p.sku, p.category 
      FROM inventory i 
      JOIN products p ON i.product_id = p.id 
      ORDER BY p.name
      LIMIT $1 OFFSET $2
    `;
    const result = await pool.query(query, [limit, offset]);

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
router.get("/product/:productId", async (req, res) => {
  const { productId } = req.params;
  try {
    const result = await pool.query(
      "SELECT quantity FROM inventory WHERE product_id = $1",
      [productId]
    );
    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Inventory not found for this product" });
    }
    res.json({ quantity: result.rows[0].quantity });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update inventory quantity
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { quantity, low_stock_threshold } = req.body;
  try {
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
router.get("/export/csv", async (req, res) => {
  try {
    const query = `
          SELECT i.id, p.name as product_name, p.sku, i.quantity, i.low_stock_threshold, i.last_updated
          FROM inventory i 
          JOIN products p ON i.product_id = p.id 
          ORDER BY p.name
        `;
    const result = await pool.query(query);
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
});

// Export Inventory as PDF
router.get("/export/pdf", async (req, res) => {
  try {
    const query = `
          SELECT i.id, p.name as product_name, p.sku, i.quantity, i.low_stock_threshold, i.last_updated
          FROM inventory i 
          JOIN products p ON i.product_id = p.id 
          ORDER BY p.name
        `;
    const result = await pool.query(query);
    const inventory = result.rows;

    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=inventory.pdf");

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
});

module.exports = router;
