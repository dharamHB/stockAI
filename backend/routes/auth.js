const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Login User
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    // Check if user exists (checking email, username, or name)
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1 OR username = $1 OR name = $1",
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const user = result.rows[0];

    // Check account status
    if (user.status && user.status !== "active") {
      // Allow super_admin to bypass this check if needed, but usually they are active.
      // If a user is pending or rejected, deny access.
      let errorMsg = "Access denied.";
      if (user.status === "pending") {
        errorMsg =
          "Your account is currently pending approval. Please wait for admin verification.";
      } else if (user.status === "rejected") {
        errorMsg =
          "Your account application has been rejected. Please contact support.";
      } else {
        errorMsg = `Account status: ${user.status}. Access denied.`;
      }
      return res.status(403).json({ error: errorMsg });
    }

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

// Register Tenant
router.post("/register-tenant", async (req, res) => {
  const { name, email, contact_number, username, password } = req.body;

  try {
    // Check if user exists (email or username)
    // Username is new column, name is old column used as username in login
    // We should check both email and username column
    const userCheck = await pool.query(
      "SELECT * FROM users WHERE email = $1 OR username = $2",
      [email, username]
    );

    if (userCheck.rows.length > 0) {
      return res
        .status(400)
        .json({ error: "User with this email or username already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert new tenant user
    // Role: 'tenant', Status: 'pending'
    const newUser = await pool.query(
      "INSERT INTO users (name, email, phone, username, password, role, status) VALUES ($1, $2, $3, $4, $5, 'tenant', 'pending') RETURNING id, name, email, role, status",
      [name, email, contact_number, username, hashedPassword]
    );

    const userId = newUser.rows[0].id;

    // Create Notification for Admin
    await pool.query(
      "INSERT INTO notifications (type, message, data) VALUES ($1, $2, $3)",
      [
        "TENANT_REGISTERED",
        `New tenant registration: ${name} (${username})`,
        JSON.stringify({ userId: userId, email: email, name: name }),
      ]
    );

    res.status(201).json({
      message: "Registration successful. Please wait for admin approval.",
      user: newUser.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error: " + err.message);
  }
});

module.exports = router;
