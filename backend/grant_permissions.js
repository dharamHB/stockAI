const pool = require("./config/db");

async function grantPermissions() {
  try {
    const modRes = await pool.query(
      "SELECT id FROM modules WHERE name = 'All Orders'"
    );
    if (modRes.rows.length === 0) {
      console.log("Module not found");
      process.exit(1);
    }
    const moduleId = modRes.rows[0].id;

    const roles = [1, 2]; // Super Admin, Admin
    for (const roleId of roles) {
      const check = await pool.query(
        "SELECT * FROM role_permissions WHERE role_id = $1 AND module_id = $2",
        [roleId, moduleId]
      );
      if (check.rows.length === 0) {
        await pool.query(
          "INSERT INTO role_permissions (role_id, module_id) VALUES ($1, $2)",
          [roleId, moduleId]
        );
        console.log(`Granted permission for role ${roleId}`);
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

grantPermissions();
