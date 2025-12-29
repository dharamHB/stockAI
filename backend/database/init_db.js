const fs = require("fs");
const pool = require("../config/db");
const path = require("path");

const setupDatabase = async () => {
  try {
    const schemaSql = fs.readFileSync(
      path.join(__dirname, "schema.sql"),
      "utf8"
    );
    await pool.query(schemaSql);
    console.log("Database schema applied successfully");
    process.exit(0);
  } catch (err) {
    console.error("Error applying database schema:", err);
    process.exit(1);
  }
};

setupDatabase();
