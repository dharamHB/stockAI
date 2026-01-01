const pool = require("./config/db");

async function addModule() {
  try {
    const check = await pool.query(
      "SELECT * FROM modules WHERE name = 'All Orders'"
    );
    if (check.rows.length === 0) {
      await pool.query("INSERT INTO modules (name, key) VALUES ($1, $2)", [
        "All Orders",
        "all_orders",
      ]);
      console.log("Module 'All Orders' added.");
    } else {
      console.log("Module 'All Orders' already exists.");
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

addModule();
