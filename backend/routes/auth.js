const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Login User
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    // Check if user exists (checking email or name as username)
    const result = await pool.query(
      "SELECT * FROM users WHERE name = $1 OR email = $1",
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const user = result.rows[0];

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Create and sign JWT
    const payload = {
      user: {
        id: user.id,
        role: user.role,
      },
    };

    // Fetch role permissions for this specific user's role
    const modulesRes = await pool.query(
      `SELECT m.name FROM modules m 
       JOIN role_permissions rp ON m.id = rp.module_id 
       JOIN roles r ON rp.role_id = r.id 
       WHERE r.slug = $1`,
      [user.role]
    );
    let userPermissions = modulesRes.rows.map((m) => m.name);

    // Handle super_admin override
    if (user.role === "super_admin") {
      const allModules = await pool.query("SELECT name FROM modules");
      userPermissions = allModules.rows.map((m) => m.name);
    }

    jwt.sign(
      payload,
      process.env.JWT_SECRET || "secret",
      { expiresIn: "1h" },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            permissions: userPermissions,
          },
        });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

module.exports = router;
