const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const auth = require("../middleware/auth");
const checkPermission = require("../middleware/permission");

// Get all products with pagination and date filtering
// Get all products with pagination and date filtering
// Public access: View all
// Tenant access: View own
// Super Admin access: View all
router.get("/", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  const { startDate, endDate } = req.query;

  // Check for token manually to determine context (Public vs Admin/Tenant)
  const token = req.header("x-auth-token");
  let tenantId = null;
  let isSuperAdmin = false;

  if (token) {
    try {
      const jwt = require("jsonwebtoken");
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
      if (decoded.user.role === "tenant") {
        tenantId = decoded.user.id;
      } else if (decoded.user.role === "super_admin") {
        isSuperAdmin = true;
      }
    } catch (e) {
      // Token invalid or expired, treat as public
    }
  }

  try {
    let countQuery = "SELECT COUNT(*) FROM products p";
    let selectQuery = `
      SELECT p.*, COALESCE(i.quantity, 0) as stock_quantity, u.name as vendor_name 
      FROM products p
      LEFT JOIN inventory i ON p.id = i.product_id
      LEFT JOIN users u ON p.tenant_id = u.id
    `;
    let whereClause = [];
    let queryParams = [];

    // Tenant Filter
    if (tenantId) {
      whereClause.push(`p.tenant_id = $${queryParams.length + 1}`);
      queryParams.push(tenantId);
    }

    // Date Filtering
    if (startDate) {
      whereClause.push(`p.created_at >= $${queryParams.length + 1}`);
      queryParams.push(startDate);
    }
    if (endDate) {
      whereClause.push(`p.created_at <= $${queryParams.length + 1}`);
      queryParams.push(endDate);
    }

    const whereString =
      whereClause.length > 0 ? " WHERE " + whereClause.join(" AND ") : "";

    // Count
    const totalResult = await pool.query(countQuery + whereString, queryParams);
    const totalCount = parseInt(totalResult.rows[0].count);

    // Results
    const paginationParams = [...queryParams, limit, offset];
    const result = await pool.query(
      selectQuery +
        whereString +
        ` ORDER BY p.created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${
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
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Create product
router.post("/", auth, checkPermission("Products"), async (req, res) => {
  const { name, sku, category, price, description, status, image_url } =
    req.body;
  const tenantId = req.user.role === "tenant" ? req.user.id : null; // Super admin items have null tenant_id or their own? Let's say null or their own.
  // Actually allowing super_admin to create system products (null tenant_id) or assigned to them.
  // Requirement says "Super admin have all access".
  const ownerId = req.user.role === "super_admin" ? null : req.user.id;

  try {
    const result = await pool.query(
      "INSERT INTO products (name, sku, category, price, description, status, image_url, tenant_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",
      [name, sku, category, price, description, status, image_url, ownerId]
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
router.put("/:id", auth, checkPermission("Products"), async (req, res) => {
  const { id } = req.params;
  const { name, sku, category, price, description, status, image_url } =
    req.body;

  try {
    // Check ownership if tenant
    if (req.user.role === "tenant") {
      const check = await pool.query(
        "SELECT tenant_id FROM products WHERE id = $1",
        [id]
      );
      if (check.rows.length === 0)
        return res.status(404).json({ error: "Product not found" });
      if (check.rows[0].tenant_id !== req.user.id) {
        return res
          .status(403)
          .json({
            error: "Access denied. You can only update your own products.",
          });
      }
    }

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
router.get("/stats", auth, async (req, res) => {
  try {
    let tenantFilter = "";
    let params = [];

    if (req.user.role === "tenant") {
      tenantFilter = " AND p.tenant_id = $1";
      params = [req.user.id];
    }

    // Join with products table to filter by tenant
    const lowStockQuery = `
      SELECT COUNT(*) FROM inventory i 
      JOIN products p ON i.product_id = p.id
      WHERE i.quantity > 0 AND i.quantity <= i.low_stock_threshold
      ${tenantFilter}
    `;

    const outOfStockQuery = `
      SELECT COUNT(*) FROM inventory i
      JOIN products p ON i.product_id = p.id
      WHERE i.quantity = 0
      ${tenantFilter}
    `;

    const lowStockResult = await pool.query(lowStockQuery, params);
    const outOfStockResult = await pool.query(outOfStockQuery, params);

    // Today's sales count
    // Need to join sales -> products to filter by tenant
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    let salesQuery = `
        SELECT COUNT(*) FROM sales s
        JOIN products p ON s.product_id = p.id
        WHERE s.sale_date >= $${params.length + 1} AND s.sale_date <= $${
      params.length + 2
    }
        ${tenantFilter}
    `;

    const todaysSalesResult = await pool.query(salesQuery, [
      ...params,
      today.toISOString(),
      endOfDay.toISOString(),
    ]);

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
router.delete("/:id", auth, checkPermission("Products"), async (req, res) => {
  const { id } = req.params;
  try {
    // Check ownership if tenant
    if (req.user.role === "tenant") {
      const check = await pool.query(
        "SELECT tenant_id FROM products WHERE id = $1",
        [id]
      );
      if (check.rows.length === 0)
        return res.status(404).json({ error: "Product not found" });
      if (check.rows[0].tenant_id !== req.user.id) {
        return res
          .status(403)
          .json({
            error: "Access denied. You can only delete your own products.",
          });
      }
    }

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
router.post(
  "/import",
  [auth, checkPermission("Products"), upload.single("file")],
  async (req, res) => {
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
                `Skipping row with missing name or price: ${JSON.stringify(
                  row
                )}`
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
  }
);

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
