const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// Get all users with pagination
router.get("/", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    const totalCountResult = await pool.query("SELECT COUNT(*) FROM users");
    const totalCount = parseInt(totalCountResult.rows[0].count);

    const result = await pool.query(
      "SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2",
      [limit, offset]
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

const bcrypt = require("bcryptjs");

// Create user
router.post("/", async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
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

const auth = require("../middleware/auth");
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

// Update user (Admin Update other user)
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, email, role, password } = req.body;
  try {
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
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM users WHERE id = $1", [id]);
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
