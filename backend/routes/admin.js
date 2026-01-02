const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const auth = require("../middleware/auth");
const checkPermission = require("../middleware/permission"); // Assuming I can reuse it or check role manually

// Approve/Reject Tenant
// Only Super Admin or Admin should do this here.
// Assuming 'Users' permission covers this, or I can check role directly.
router.post("/approve-tenant", auth, async (req, res) => {
  const { userId, action } = req.body; // action: 'approve' | 'reject'

  if (req.user.role !== "super_admin" && req.user.role !== "admin") {
    return res.status(403).json({ error: "Access denied. Admins only." });
  }

  try {
    const status = action === "approve" ? "active" : "rejected";

    const result = await pool.query(
      "UPDATE users SET status = $1 WHERE id = $2 RETURNING id, name, email, status",
      [status, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      message: `Tenant ${action}d successfully.`,
      user: result.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
