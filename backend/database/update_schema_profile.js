const pool = require("../config/db");

const updateSchema = async () => {
  try {
    await pool.query(
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image VARCHAR(255);"
    );
    await pool.query(
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS hobbies TEXT[];"
    );
    console.log(
      "Successfully added profile_image and hobbies columns to users table."
    );
    process.exit(0);
  } catch (err) {
    console.error("Error updating schema:", err);
    process.exit(1);
  }
};

updateSchema();
