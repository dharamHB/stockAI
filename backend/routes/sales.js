const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// Get all sales with pagination
router.get("/", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    const totalCountResult = await pool.query("SELECT COUNT(*) FROM sales");
    const totalCount = parseInt(totalCountResult.rows[0].count);

    const query = `
      SELECT s.*, p.name as product_name, p.sku 
      FROM sales s 
      JOIN products p ON s.product_id = p.id 
      ORDER BY s.sale_date DESC
      LIMIT $1 OFFSET $2
    `;
    const result = await pool.query(query, [limit, offset]);
    
    res.json({
        sales: result.rows,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create sale
router.post("/", async (req, res) => {
  const { product_id, quantity, total_amount } = req.body;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Create sale record
    const saleResult = await client.query(
      "INSERT INTO sales (product_id, quantity, total_amount) VALUES ($1, $2, $3) RETURNING *",
      [product_id, quantity, total_amount]
    );

    // Update inventory
    await client.query(
      "UPDATE inventory SET quantity = quantity - $1 WHERE product_id = $2",
      [quantity, product_id]
    );

    await client.query("COMMIT");
    res.json(saleResult.rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

const { Parser } = require("json2csv");
const PDFDocument = require("pdfkit");

// Export Sales as CSV
router.get("/export/csv", async (req, res) => {
  try {
    const query = `
          SELECT s.id, p.name as product_name, p.sku, s.quantity, s.total_amount, s.sale_date
          FROM sales s 
          JOIN products p ON s.product_id = p.id 
          ORDER BY s.sale_date DESC
        `;
    const result = await pool.query(query);
    const sales = result.rows;

    const fields = [
      "id",
      "product_name",
      "sku",
      "quantity",
      "total_amount",
      "sale_date",
    ];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(sales);

    res.header("Content-Type", "text/csv");
    res.attachment("sales.csv");
    return res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error exporting CSV" });
  }
});

// Export Sales as PDF
router.get("/export/pdf", async (req, res) => {
  try {
    const query = `
          SELECT s.id, p.name as product_name, p.sku, s.quantity, s.total_amount, s.sale_date
          FROM sales s 
          JOIN products p ON s.product_id = p.id 
          ORDER BY s.sale_date DESC
        `;
    const result = await pool.query(query);
    const sales = result.rows;

    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=sales.pdf");

    doc.pipe(res);

    doc.fontSize(20).text("Sales Report", { align: "center" });
    doc.moveDown();

    sales.forEach((sale, i) => {
      doc.fontSize(12).text(`Sale #${i + 1}: ${sale.product_name}`);
      doc.fontSize(10).text(`SKU: ${sale.sku || "N/A"}`);
      doc.text(`Quantity: ${sale.quantity}`);
      doc.text(`Total Amount: $${sale.total_amount}`);
      doc.text(`Date: ${sale.sale_date}`);
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
