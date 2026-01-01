const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const auth = require("../middleware/auth");
const checkPermission = require("../middleware/permission");
const bcrypt = require("bcryptjs");

// Get all users with pagination and date filtering
router.get("/", auth, checkPermission("Users"), async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  const { startDate, endDate } = req.query;

  try {
    let countQuery = "SELECT COUNT(*) FROM users";
    let selectQuery = "SELECT id, name, email, role, created_at FROM users";
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

    const totalCountResult = await pool.query(
      countQuery + whereClause,
      queryParams
    );
    const totalCount = parseInt(totalCountResult.rows[0].count);

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
      users: result.rows,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create user
router.post("/", auth, checkPermission("Users"), async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    // Check if assigning super_admin
    if (role === "super_admin") {
      const superAdminCount = await pool.query(
        "SELECT COUNT(*) FROM users WHERE role = 'super_admin'"
      );
      if (parseInt(superAdminCount.rows[0].count) > 0) {
        return res
          .status(400)
          .json({ error: "Only one Super Admin is allowed in the system." });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const result = await pool.query(
      "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, email, hashedPassword, role]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configure multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (!fs.existsSync("uploads/")) {
      fs.mkdirSync("uploads/");
    }
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Appending extension
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type, only JPEG and PNG is allowed!"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
});

// Get User Profile (Protected) - MUST BE BEFORE /:id
router.get("/profile", auth, async (req, res) => {
  try {
    const user = await pool.query(
      "SELECT id, name, email, role, profile_image, hobbies FROM users WHERE id = $1",
      [req.user.id]
    );
    res.json(user.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Update User Profile (Protected) - MUST BE BEFORE /:id
router.put(
  "/profile",
  [auth, upload.single("profile_image")],
  async (req, res) => {
    try {
      const { name, hobbies } = req.body;
      // email is explicitly ignored from req.body to prevent changes

      let profileImage = undefined;
      if (req.file) {
        profileImage = req.file.path;
      }

      // Prepare query
      let query = "UPDATE users SET name = $1, hobbies = $2";
      let params = [name, hobbies ? JSON.parse(hobbies) : []]; // Expecting hbbies as JSON stringified array from frontend form-data
      let paramCount = 3;

      if (profileImage) {
        query += `, profile_image = $${paramCount}`;
        params.push(profileImage);
        paramCount++;
      }

      query += ` WHERE id = $${paramCount} RETURNING id, name, email, role, profile_image, hobbies`;
      params.push(req.user.id);

      const result = await pool.query(query, params);
      res.json(result.rows[0]);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error: " + err.message);
    }
  }
);

// Change Password (Protected)
router.put("/change-password", auth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    // Get user from DB
    const userResult = await pool.query("SELECT * FROM users WHERE id = $1", [
      req.user.id,
    ]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = userResult.rows[0];

    // Check current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid current password" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await pool.query("UPDATE users SET password = $1 WHERE id = $2", [
      hashedPassword,
      req.user.id,
    ]);

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Update user (Admin Update other user)
router.put("/:id", auth, checkPermission("Users"), async (req, res) => {
  const { id } = req.params;
  const { name, email, role, password } = req.body;
  try {
    // Check if user exists and their current role
    const userResult = await pool.query(
      "SELECT role FROM users WHERE id = $1",
      [id]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const currentRole = userResult.rows[0].role;

    // Prevent promoting to super_admin if one already exists
    if (role === "super_admin" && currentRole !== "super_admin") {
      const superAdminCount = await pool.query(
        "SELECT COUNT(*) FROM users WHERE role = 'super_admin'"
      );
      if (parseInt(superAdminCount.rows[0].count) > 0) {
        return res
          .status(400)
          .json({ error: "Only one Super Admin is allowed in the system." });
      }
    }

    // Prevent changing role of super_admin
    if (currentRole === "super_admin" && role !== "super_admin") {
      return res
        .status(403)
        .json({ error: "Super Admin role cannot be changed" });
    }

    let query, params;
    if (password && password.trim() !== "") {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      query =
        "UPDATE users SET name = $1, email = $2, role = $3, password = $4 WHERE id = $5 RETURNING id, name, email, role, created_at";
      params = [name, email, role, hashedPassword, id];
    } else {
      query =
        "UPDATE users SET name = $1, email = $2, role = $3 WHERE id = $4 RETURNING id, name, email, role, created_at";
      params = [name, email, role, id];
    }

    const result = await pool.query(query, params);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete user
router.delete("/:id", auth, checkPermission("Users"), async (req, res) => {
  const { id } = req.params;
  try {
    // Check if the user is a super_admin
    const userResult = await pool.query(
      "SELECT role FROM users WHERE id = $1",
      [id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    if (userResult.rows[0].role === "super_admin") {
      return res
        .status(403)
        .json({ error: "Super Admin user cannot be deleted" });
    }

    await pool.query("DELETE FROM users WHERE id = $1", [id]);
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
