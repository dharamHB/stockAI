const pool = require("../config/db");

const updateSchema = async () => {
  try {
    await pool.query(
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255);"
    );
    console.log("Successfully added password column to users table.");
    process.exit(0);
  } catch (err) {
    console.error("Error updating schema:", err);
    process.exit(1);
  }
};

updateSchema();
