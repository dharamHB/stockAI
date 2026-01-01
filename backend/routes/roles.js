const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const auth = require("../middleware/auth");

// Middleware to check if user is admin or super_admin
const isAdmin = async (req, res, next) => {
  try {
    const userRole = req.user.role;
    if (userRole === "admin" || userRole === "super_admin") {
      next();
    } else {
      res.status(403).json({ error: "Access denied. Admin only." });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all roles with their permissions (All authenticated users can see the map)
router.get("/", auth, async (req, res) => {
  try {
    // First get all modules to ensure super_admin has all
    const modulesRes = await pool.query("SELECT name FROM modules");
    const allModules = modulesRes.rows.map((m) => m.name);

    const query = `
      SELECT r.id, r.name, r.slug, r.is_system, 
             COALESCE(array_agg(m.name) FILTER (WHERE m.name IS NOT NULL), '{}') as permissions
      FROM roles r
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      LEFT JOIN modules m ON rp.module_id = m.id
      GROUP BY r.id
      ORDER BY r.id ASC
    `;
    const result = await pool.query(query);

    const rolesObject = {};
    result.rows.forEach((row) => {
      // Force super_admin to have all permissions
      if (row.slug === "super_admin") {
        rolesObject[row.slug] = allModules;
      } else {
        rolesObject[row.slug] = row.permissions;
      }
    });

    res.json(rolesObject);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all modules
router.get("/modules", auth, isAdmin, async (req, res) => {
  try {
    const result = await pool.query("SELECT name FROM modules ORDER BY id ASC");
    res.json(result.rows.map((row) => row.name));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new role
router.post("/", auth, isAdmin, async (req, res) => {
  const { name, slug } = req.body;

  if (!name || !slug) {
    return res.status(400).json({ error: "Name and slug are required" });
  }

  try {
    // Check if slug or name already exists
    const checkExits = await pool.query(
      "SELECT id FROM roles WHERE slug = $1 OR name = $2",
      [slug, name]
    );
    if (checkExits.rows.length > 0) {
      return res
        .status(400)
        .json({ error: "Role with this name or slug already exists" });
    }

    const result = await pool.query(
      "INSERT INTO roles (name, slug) VALUES ($1, $2) RETURNING *",
      [name, slug]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update role permissions
router.put("/permissions", auth, isAdmin, async (req, res) => {
  const { permissions } = req.body; // Expecting { roleSlug: [moduleNames] }

  if (!permissions) {
    return res.status(400).json({ error: "Permissions data is required" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    for (const [roleSlug, moduleNames] of Object.entries(permissions)) {
      // Skip super_admin as it always has all permissions
      if (roleSlug === "super_admin") continue;

      // Get role ID
      const roleRes = await client.query(
        "SELECT id FROM roles WHERE slug = $1",
        [roleSlug]
      );
      if (roleRes.rows.length === 0) continue;

      const roleId = roleRes.rows[0].id;

      // Delete existing permissions for this role
      await client.query("DELETE FROM role_permissions WHERE role_id = $1", [
        roleId,
      ]);

      if (moduleNames && Array.isArray(moduleNames) && moduleNames.length > 0) {
        // Get module IDs
        const moduleRes = await client.query(
          "SELECT id FROM modules WHERE name = ANY($1)",
          [moduleNames]
        );
        const moduleIds = moduleRes.rows.map((m) => m.id);

        // Insert new permissions
        for (const moduleId of moduleIds) {
          await client.query(
            "INSERT INTO role_permissions (role_id, module_id) VALUES ($1, $2)",
            [roleId, moduleId]
          );
        }
      }
    }

    await client.query("COMMIT");
    res.json({ message: "Permissions updated successfully" });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Delete a role
router.delete("/:slug", auth, isAdmin, async (req, res) => {
  const { slug } = req.params;
  try {
    const roleRes = await pool.query(
      "SELECT is_system FROM roles WHERE slug = $1",
      [slug]
    );
    if (roleRes.rows.length === 0) {
      return res.status(404).json({ error: "Role not found" });
    }
    if (
      roleRes.rows[0].is_system ||
      slug === "super_admin" ||
      slug === "admin"
    ) {
      return res.status(400).json({ error: "System roles cannot be deleted" });
    }

    await pool.query("DELETE FROM roles WHERE slug = $1", [slug]);
    res.json({ message: "Role deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
