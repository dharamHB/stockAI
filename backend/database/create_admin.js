const pool = require("../config/db");
const bcrypt = require("bcryptjs");

const createAdmin = async () => {
  try {
    const password = "admin123";
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Check if admin exists logic could be added, but for now we just try to insert.
    // If username 'admin' or email 'admin@stockai.com' is unique, it'll fail if exists or we can use ON CONFLICT DO NOTHING

    // Check if table has constraints on name or email?
    // Looking at schema: email UNIQUE NOT NULL.

    const checkUser = await pool.query(
      "SELECT * FROM users WHERE email = 'admin@stockai.com'"
    );
    if (checkUser.rows.length > 0) {
      console.log("Admin user already exists. Updating password...");
      await pool.query(
        "UPDATE users SET password = $1 WHERE email = 'admin@stockai.com'",
        [hashedPassword]
      );
    } else {
      console.log("Creating admin user...");
      await pool.query(
        "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)",
        ["admin", "admin@stockai.com", hashedPassword, "admin"]
      );
    }

    console.log("Admin user setup complete.");
    process.exit(0);
  } catch (err) {
    console.error("Error creating admin:", err);
    process.exit(1);
  }
};

createAdmin();
