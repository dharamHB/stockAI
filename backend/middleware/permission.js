const pool = require("../config/db");

const checkPermission = (moduleName) => {
  return async (req, res, next) => {
    try {
      const userRole = req.user.role;

      // Super Admin always has full access
      if (userRole === "super_admin") {
        return next();
      }

      // Special case for role management
      if (moduleName === "Users" && userRole === "admin") {
        // Admin can manage users but maybe not roles?
        // Actually let's follow the DB.
      }

      const query = `
        SELECT 1 FROM role_permissions rp
        JOIN roles r ON rp.role_id = r.id
        JOIN modules m ON rp.module_id = m.id
        WHERE r.slug = $1 AND m.name = $2
      `;
      const result = await pool.query(query, [userRole, moduleName]);

      if (result.rows.length > 0) {
        next();
      } else {
        res
          .status(403)
          .json({
            error: `Access denied. No permission for module: ${moduleName}`,
          });
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
};

module.exports = checkPermission;
