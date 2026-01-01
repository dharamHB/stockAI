const fs = require("fs");
const pool = require("../config/db");
const path = require("path");

const migrateRoles = async () => {
  try {
    const sql = fs.readFileSync(
      path.join(__dirname, "roles_schema.sql"),
      "utf8"
    );
    await pool.query(sql);
    console.log("Roles and Modules schema applied successfully");
    process.exit(0);
  } catch (err) {
    console.error("Error applying roles schema:", err);
    process.exit(1);
  }
};

migrateRoles();
