const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    console.log("Starting UUID migration...");

    // 1. Enable Extension
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

    // --- Helper to add new_id to a table ---
    const addNewId = async (table) => {
      console.log(`Adding new_id to ${table}...`);
      await client.query(
        `ALTER TABLE ${table} ADD COLUMN new_id UUID DEFAULT uuid_generate_v4();`
      );
    };

    // --- Helper to migrate FK ---
    // targetTable: table with the foreign key (e.g. inventory)
    // targetCol: name of new FK column (e.g. new_product_id)
    // sourceTable: referenced table (e.g. products)
    // oldFK: old FK column name (e.g. product_id)
    const migrateFK = async (targetTable, targetCol, sourceTable, oldFK) => {
      console.log(`Migrating FK ${targetTable}.${oldFK} -> ${sourceTable}...`);
      await client.query(
        `ALTER TABLE ${targetTable} ADD COLUMN ${targetCol} UUID;`
      );
      await client.query(`
            UPDATE ${targetTable} 
            SET ${targetCol} = s.new_id 
            FROM ${sourceTable} s 
            WHERE ${targetTable}.${oldFK} = s.id;
        `);
    };

    // 2. Add new_id to all tables with PK 'id'
    const tablesWithId = [
      "users",
      "products",
      "inventory",
      "sales",
      "orders",
      "roles",
      "modules",
    ];
    for (const t of tablesWithId) {
      await addNewId(t);
    }
    // role_permissions has no 'id', it has composite key.

    // 3. Migrate Foreign Keys (populate new UUID columns in child tables)

    // products -> inventory.product_id
    await migrateFK("inventory", "new_product_id", "products", "product_id");
    // products -> sales.product_id
    await migrateFK("sales", "new_product_id", "products", "product_id");

    // users -> orders.user_id
    await migrateFK("orders", "new_user_id", "users", "user_id");

    // orders -> sales.order_id
    await migrateFK("sales", "new_order_id", "orders", "order_id");

    // roles -> role_permissions.role_id
    await migrateFK("role_permissions", "new_role_id", "roles", "role_id");

    // modules -> role_permissions.module_id
    await migrateFK(
      "role_permissions",
      "new_module_id",
      "modules",
      "module_id"
    );

    // 4. Drop Old Constraints & Columns, Rename New Columns, Add New Constraints

    const finalizeTable = async (table) => {
      console.log(`Finalizing ${table}...`);
      // Drop PK constraint
      // Need to find constraint name usually, but for 'id', usually table_pkey?
      // Let's force drop id column with CASCADE, which drops PK and dependent FKs?
      // CASCADE is dangerous if we miss something, but here we want to replace relationships.
      // BUT we must ensuring new columns are ready.

      // Strategy: Drop old 'id' column with CASCADE. This removes the PK and any FKs pointing TO it.
      // It also removes FKs FROM this table if 'id' was part of it (unlikely for 'id').
      // Wait, dropping 'products.id' CASCADE will drop 'inventory.product_id' FK constraint (but not column usually? No, just constraint).
      // Let's try explicit constraint dropping if possible, or just DROP COLUMN CASCADE.

      await client.query(`ALTER TABLE ${table} DROP COLUMN id CASCADE;`);
      await client.query(`ALTER TABLE ${table} RENAME COLUMN new_id TO id;`);
      await client.query(`ALTER TABLE ${table} ADD PRIMARY KEY (id);`);
    };

    // Order matters? Not really if we drop cascade, but safer to do master then child?
    // Actually, if we drop products.id CASCADE, it might drop constraints in sales/inventory.
    // Then we just fix columns in sales/inventory.

    // Let's finalize Masters first
    await finalizeTable("users");
    await finalizeTable("products");
    await finalizeTable("roles");
    await finalizeTable("modules");
    await finalizeTable("orders"); // depends on users (migrated), uses new_user_id?
    // Wait, 'orders' has 'user_id' FK. We populated 'new_user_id'.
    // We need to swap 'user_id' in orders BEFORE finalizing orders ID?
    // No, finalizeTable('orders') drops orders.id. It doesn't touch orders.user_id.

    // Helper to swap FK column in child
    const swapFK = async (table, oldCol, newCol, refTable) => {
      console.log(`Swapping FK column ${table}.${oldCol}...`);
      // Drop old column
      await client.query(`ALTER TABLE ${table} DROP COLUMN ${oldCol} CASCADE;`);
      // Rename new
      await client.query(
        `ALTER TABLE ${table} RENAME COLUMN ${newCol} TO ${oldCol};`
      );
      // Add FK constraint
      await client.query(
        `ALTER TABLE ${table} ADD CONSTRAINT fk_${table}_${refTable} FOREIGN KEY (${oldCol}) REFERENCES ${refTable}(id) ON DELETE CASCADE;`
      ); // Assuming generic cascade, maybe tune later
    };

    // Now fix FKs in tables that HAVE them

    // Orders: user_id
    await swapFK("orders", "user_id", "new_user_id", "users");

    // Inventory: product_id
    await finalizeTable("inventory");
    await swapFK("inventory", "product_id", "new_product_id", "products");

    // Sales: product_id, order_id
    await finalizeTable("sales"); // Fixes sales.id
    // Set FKs to SET NULL or CASCADE based on original?
    // Orig sales.product_id was SET NULL. orders was probably CASCADE?
    // Let's look at schema.sql:
    // inventory.product_id CASCADE
    // sales.product_id SET NULL
    // orders -> users ?

    // Fix Inventory FK (CASCADE match)
    // (Already done above with Generic CASCADE, which matches schema.sql)

    // Fix Sales FKs
    console.log("Fixing Sales FKs...");
    await client.query("ALTER TABLE sales DROP COLUMN product_id CASCADE;");
    await client.query(
      "ALTER TABLE sales RENAME COLUMN new_product_id TO product_id;"
    );
    await client.query(
      "ALTER TABLE sales ADD CONSTRAINT fk_sales_products FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;"
    );

    await client.query("ALTER TABLE sales DROP COLUMN order_id CASCADE;");
    await client.query(
      "ALTER TABLE sales RENAME COLUMN new_order_id TO order_id;"
    );
    // orders FK logic? Schema didn't show orders table. Assuming CASCADE or restrict.
    await client.query(
      "ALTER TABLE sales ADD CONSTRAINT fk_sales_orders FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;"
    );

    // Role Permission (Composite PK)
    // It has role_id, module_id.
    console.log("Finalizing role_permissions...");
    // Drop old columns
    await client.query(
      "ALTER TABLE role_permissions DROP COLUMN role_id CASCADE;"
    );
    await client.query(
      "ALTER TABLE role_permissions DROP COLUMN module_id CASCADE;"
    );
    // Rename new
    await client.query(
      "ALTER TABLE role_permissions RENAME COLUMN new_role_id TO role_id;"
    );
    await client.query(
      "ALTER TABLE role_permissions RENAME COLUMN new_module_id TO module_id;"
    );
    // Add FKs
    await client.query(
      "ALTER TABLE role_permissions ADD CONSTRAINT fk_rp_roles FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE;"
    );
    await client.query(
      "ALTER TABLE role_permissions ADD CONSTRAINT fk_rp_modules FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE;"
    );
    // Add PK
    await client.query(
      "ALTER TABLE role_permissions ADD PRIMARY KEY (role_id, module_id);"
    );

    await client.query("COMMIT");
    console.log("Migration complete!");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Migration failed:", err);
  } finally {
    client.release();
    pool.end();
  }
}

migrate();
