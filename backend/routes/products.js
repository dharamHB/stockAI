const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const auth = require("../middleware/auth");

// Get all products with pagination and date filtering
router.get("/", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  const { startDate, endDate } = req.query;

  try {
    let countQuery = "SELECT COUNT(*) FROM products";
    let selectQuery = "SELECT * FROM products";
    let whereClause = "";
    let queryParams = [];

    // Add date filtering if provided
    if (startDate && endDate) {
      whereClause = " WHERE created_at >= $1 AND created_at <= $2";
      queryParams = [startDate, endDate];
    } else if (startDate) {
      whereClause = " WHERE created_at >= $1";
      queryParams = [startDate];
    } else if (endDate) {
      whereClause = " WHERE created_at <= $1";
      queryParams = [endDate];
    }

    const totalResult = await pool.query(countQuery + whereClause, queryParams);
    const totalCount = parseInt(totalResult.rows[0].count);

    // Add pagination parameters
    const paginationParams = [...queryParams, limit, offset];
    const result = await pool.query(
      selectQuery +
        whereClause +
        ` ORDER BY created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${
          queryParams.length + 2
        }`,
      paginationParams
    );

    res.json({
      products: result.rows,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create product
router.post("/", auth, async (req, res) => {
  if (req.user.role !== "admin" && req.user.role !== "super_admin") {
    return res.status(403).json({ error: "Access denied" });
  }
  const { name, sku, category, price, description, status, image_url } =
    req.body;
  try {
    const result = await pool.query(
      "INSERT INTO products (name, sku, category, price, description, status, image_url) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
      [name, sku, category, price, description, status, image_url]
    );
    // Also create an inventory entry for the new product
    await pool.query(
      "INSERT INTO inventory (product_id, quantity, low_stock_threshold) VALUES ($1, 0, 10)",
      [result.rows[0].id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update product
router.put("/:id", auth, async (req, res) => {
  if (req.user.role !== "admin" && req.user.role !== "super_admin") {
    return res.status(403).json({ error: "Access denied" });
  }
  const { id } = req.params;
  const { name, sku, category, price, description, status, image_url } =
    req.body;
  try {
    const result = await pool.query(
      "UPDATE products SET name = $1, sku = $2, category = $3, price = $4, description = $5, status = $6, image_url = $7 WHERE id = $8 RETURNING *",
      [name, sku, category, price, description, status, image_url, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get product stats
router.get("/stats", async (req, res) => {
  try {
    // Low stock count (quantity <= low_stock_threshold)
    const lowStockResult = await pool.query(
      "SELECT COUNT(*) FROM inventory WHERE quantity > 0 AND quantity <= low_stock_threshold"
    );

    // Out of stock count (quantity = 0)
    const outOfStockResult = await pool.query(
      "SELECT COUNT(*) FROM inventory WHERE quantity = 0"
    );

    // Today's sales count
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todaysSalesResult = await pool.query(
      "SELECT COUNT(*) FROM sales WHERE sale_date >= $1 AND sale_date <= $2",
      [today.toISOString(), endOfDay.toISOString()]
    );

    res.json({
      lowStockCount: parseInt(lowStockResult.rows[0].count),
      outOfStockCount: parseInt(outOfStockResult.rows[0].count),
      todaysSalesCount: parseInt(todaysSalesResult.rows[0].count),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete product
router.delete("/:id", auth, async (req, res) => {
  if (req.user.role !== "admin" && req.user.role !== "super_admin") {
    return res.status(403).json({ error: "Access denied" });
  }
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM products WHERE id = $1", [id]);
    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const multer = require("multer");
const csv = require("csv-parser");
const { Readable } = require("stream");

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Import products from CSV
router.post("/import", [auth, upload.single("file")], async (req, res) => {
  if (req.user.role !== "admin" && req.user.role !== "super_admin") {
    return res.status(403).json({ error: "Access denied" });
  }
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const results = [];
  const stream = Readable.from(req.file.buffer.toString());

  stream
    .pipe(csv())
    .on("data", (data) => results.push(data))
    .on("end", async () => {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");

        let importedCount = 0;
        const errors = [];

        for (const row of results) {
          // Basic validation
          if (!row.name || !row.price) {
            errors.push(
              `Skipping row with missing name or price: ${JSON.stringify(row)}`
            );
            continue;
          }

          try {
            // Check if SKU exists if provided
            if (row.sku) {
              const existingProduct = await client.query(
                "SELECT id FROM products WHERE sku = $1",
                [row.sku]
              );
              if (existingProduct.rows.length > 0) {
                // Option: Update or Skip. For now, we'll skip duplicates to avoid overwriting.
                errors.push(`Skipping existing SKU: ${row.sku}`);
                continue;
              }
            }

            const insertProductText = `
                    INSERT INTO products (name, sku, category, price, description, status)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    RETURNING id
                `;
            const productValues = [
              row.name,
              row.sku || null,
              row.category || null,
              parseFloat(row.price),
              row.description || null,
              row.status || "active",
            ];

            const res = await client.query(insertProductText, productValues);
            const productId = res.rows[0].id;

            // Inventory
            const quantity = parseInt(row.quantity) || 0;
            const threshold = parseInt(row.low_stock_threshold) || 10;

            await client.query(
              "INSERT INTO inventory (product_id, quantity, low_stock_threshold) VALUES ($1, $2, $3)",
              [productId, quantity, threshold]
            );

            importedCount++;
          } catch (err) {
            errors.push(`Error importing ${row.name}: ${err.message}`);
          }
        }

        await client.query("COMMIT");
        res.json({
          message: `Successfully imported ${importedCount} products`,
          errors: errors.length > 0 ? errors : undefined,
        });
      } catch (err) {
        await client.query("ROLLBACK");
        res.status(500).json({ error: "Transaction failed: " + err.message });
      } finally {
        client.release();
      }
    });
});

const { Parser } = require("json2csv");
const PDFDocument = require("pdfkit");

// Export Products as CSV
router.get("/export/csv", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM products");
    const products = result.rows;

    const fields = [
      "id",
      "name",
      "sku",
      "category",
      "price",
      "status",
      "description",
      "created_at",
    ];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(products);

    res.header("Content-Type", "text/csv");
    res.attachment("products.csv");
    return res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error exporting CSV" });
  }
});

// Export Products as PDF
router.get("/export/pdf", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM products");
    const products = result.rows;

    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=products.pdf");

    doc.pipe(res);

    doc.fontSize(20).text("Products Report", { align: "center" });
    doc.moveDown();

    products.forEach((product, i) => {
      doc.fontSize(12).text(`Product #${i + 1}: ${product.name}`);
      doc.fontSize(10).text(`SKU: ${product.sku || "N/A"}`);
      doc.text(`Category: ${product.category || "N/A"}`);
      doc.text(`Price: $${product.price}`);
      doc.text(`Status: ${product.status}`);
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
