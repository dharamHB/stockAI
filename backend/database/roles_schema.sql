-- Role and Module Management Schema

CREATE TABLE IF NOT EXISTS modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    key VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, module_id)
);

-- Seed Modules
INSERT INTO modules (name, key) VALUES
('Dashboard', 'dashboard'),
('Users', 'users'),
('Products', 'products'),
('Inventory', 'inventory'),
('Sales', 'sales'),
('Cart', 'cart'),
('My Orders', 'my_orders'),
('All Orders', 'all_orders'),
('Settings', 'settings')
ON CONFLICT (key) DO NOTHING;

-- Seed Initial Roles
INSERT INTO roles (name, slug, is_system) VALUES
('Super Admin', 'super_admin', true),
('Admin', 'admin', true),
('Manager', 'manager', false),
('User', 'user', false)
ON CONFLICT (slug) DO NOTHING;

-- Seed Default Permissions (Super Admin gets all)
INSERT INTO role_permissions (role_id, module_id)
SELECT r.id, m.id 
FROM roles r, modules m 
WHERE r.slug = 'super_admin'
ON CONFLICT DO NOTHING;

-- Admin gets all
INSERT INTO role_permissions (role_id, module_id)
SELECT r.id, m.id 
FROM roles r, modules m 
WHERE r.slug = 'admin'
ON CONFLICT DO NOTHING;

-- Manager permissions
INSERT INTO role_permissions (role_id, module_id)
SELECT r.id, m.id 
FROM roles r, modules m 
WHERE r.slug = 'manager' AND m.key IN ('dashboard', 'products', 'inventory', 'sales', 'cart', 'my_orders', 'all_orders')
ON CONFLICT DO NOTHING;

-- User permissions
INSERT INTO role_permissions (role_id, module_id)
SELECT r.id, m.id 
FROM roles r, modules m 
WHERE r.slug = 'user' AND m.key IN ('dashboard', 'products', 'cart', 'my_orders', 'settings')
ON CONFLICT DO NOTHING;
