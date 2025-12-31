const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const auth = require("../middleware/auth");

// Stripe Checkout Session Creation
router.post("/create-checkout-session", auth, async (req, res) => {
  const { items } = req.body;

  try {
    const line_items = items.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.name,
          metadata: {
            product_id: item.id,
          },
        },
        unit_amount: Math.round(item.price * 100), // Stripe expects amount in cents
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/cart`,
      metadata: {
        userId: req.user.id,
        items: JSON.stringify(
          items.map((i) => ({ id: i.id, quantity: i.quantity, price: i.price }))
        ),
      },
    });

    res.json({ id: session.id, url: session.url });
  } catch (err) {
    console.error("Stripe Session Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Verify Stripe Session and Place Order
router.post("/verify-payment", auth, async (req, res) => {
  const { sessionId } = req.body;
  const client = await pool.connect();

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return res.status(400).json({ error: "Payment not completed" });
    }

    // Check if this session has already been processed (prevent double-order)
    // For simplicity in this demo, we'll assume it hasn't. In production, use session.id tracking in DB.

    const userId = session.metadata.userId;
    const items = JSON.parse(session.metadata.items);

    await client.query("BEGIN");

    const createdSales = [];
    const timestamp = new Date();

    for (const item of items) {
      // Check current stock first
      const invCheck = await client.query(
        "SELECT quantity FROM inventory WHERE product_id = $1",
        [item.id]
      );

      const currentStock = invCheck.rows[0]?.quantity || 0;
      if (currentStock < item.quantity) {
        throw new Error(`Insufficient stock for product id ${item.id}`);
      }

      const total_amount = item.price * item.quantity;

      const saleResult = await client.query(
        "INSERT INTO sales (product_id, quantity, total_amount, sale_date, user_id, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
        [item.id, item.quantity, total_amount, timestamp, userId, "completed"]
      );
      createdSales.push(saleResult.rows[0]);

      await client.query(
        "UPDATE inventory SET quantity = quantity - $1 WHERE product_id = $2",
        [item.quantity, item.id]
      );
    }

    await client.query("COMMIT");
    res.json({ message: "Order placed successfully", sales: createdSales });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Payment Verification Error:", err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

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
      currentPage: page,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user's orders (My Orders)
router.get("/my-orders", auth, async (req, res) => {
  const userId = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    const totalCountResult = await pool.query(
      "SELECT COUNT(*) FROM sales WHERE user_id = $1",
      [userId]
    );
    const totalCount = parseInt(totalCountResult.rows[0].count);

    const query = `
      SELECT s.id, s.product_id, s.quantity, s.total_amount, s.sale_date, s.status,
             p.name as product_name, p.sku, p.price
      FROM sales s 
      JOIN products p ON s.product_id = p.id 
      WHERE s.user_id = $1
      ORDER BY s.sale_date DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await pool.query(query, [userId, limit, offset]);

    res.json({
      orders: result.rows,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Checkout (Batch Create Sales)
router.post("/checkout", auth, async (req, res) => {
  const { items } = req.body; // items: [{ product_id, quantity, price }]
  const userId = req.user.id; // Get user ID from authenticated token
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const createdSales = [];
    const timestamp = new Date();

    for (const item of items) {
      if (!item.product_id || !item.quantity || !item.price) continue;

      // Check current stock first
      const invCheck = await client.query(
        "SELECT quantity FROM inventory WHERE product_id = $1",
        [item.product_id]
      );

      const currentStock = invCheck.rows[0]?.quantity || 0;
      if (currentStock < item.quantity) {
        throw new Error(`Insufficient stock for product id ${item.product_id}`);
      }

      const total_amount = item.price * item.quantity;

      // Create sale record with user_id
      const saleResult = await client.query(
        "INSERT INTO sales (product_id, quantity, total_amount, sale_date, user_id, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
        [
          item.product_id,
          item.quantity,
          total_amount,
          timestamp,
          userId,
          "completed",
        ]
      );
      createdSales.push(saleResult.rows[0]);

      // Update inventory
      await client.query(
        "UPDATE inventory SET quantity = quantity - $1 WHERE product_id = $2",
        [item.quantity, item.product_id]
      );
    }

    await client.query("COMMIT");
    res.json({ message: "Order placed successfully", sales: createdSales });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
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
