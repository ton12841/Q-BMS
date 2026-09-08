BEGIN;

CREATE TABLE IF NOT EXISTS platform_registry_items (
  id BIGSERIAL PRIMARY KEY,
  code VARCHAR(80) NOT NULL UNIQUE,
  item_type VARCHAR(20) NOT NULL,
  name VARCHAR(160) NOT NULL,
  domain VARCHAR(120) NOT NULL,
  ownership VARCHAR(40) NOT NULL,
  lifecycle_status VARCHAR(30) NOT NULL DEFAULT 'REGISTERED',
  availability_status VARCHAR(30) NOT NULL DEFAULT 'CATALOG',
  permission_namespace VARCHAR(80),
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 100,
  is_system_item BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_registry_items_type
  ON platform_registry_items(item_type);

CREATE INDEX IF NOT EXISTS idx_platform_registry_items_domain
  ON platform_registry_items(domain);

CREATE INDEX IF NOT EXISTS idx_platform_registry_items_status
  ON platform_registry_items(lifecycle_status, availability_status);

INSERT INTO platform_registry_items (
  code,
  item_type,
  name,
  domain,
  ownership,
  lifecycle_status,
  availability_status,
  permission_namespace,
  description,
  sort_order,
  is_system_item
)
VALUES
  ('EMPLOYEE', 'MODULE', 'Employee', 'People & Organization', 'SHARED_MODULE', 'REGISTERED', 'CATALOG', 'employee', 'Employee master, profile and employment records.', 10, TRUE),
  ('ORGANIZATION', 'MODULE', 'Organization', 'People & Organization', 'SHARED_MODULE', 'REGISTERED', 'CATALOG', 'organization', 'Business Unit, Level / Grade, Position and Reporting Lines.', 20, TRUE),

  ('CUSTOMER', 'MODULE', 'Customer', 'Business Operations', 'SHARED_MODULE', 'REGISTERED', 'CATALOG', 'customer', 'Shared customer and contact information.', 30, TRUE),
  ('PRODUCT', 'MODULE', 'Product', 'Business Operations', 'SHARED_MODULE', 'REGISTERED', 'CATALOG', 'product', 'Shared products, packages and service catalog.', 40, TRUE),
  ('SUPPLIER', 'MODULE', 'Supplier / Vendor', 'Business Operations', 'SHARED_MODULE', 'REGISTERED', 'CATALOG', 'supplier', 'Shared supplier and vendor master data.', 50, TRUE),
  ('LOCATION', 'MODULE', 'Location / Site', 'Business Operations', 'SHARED_MODULE', 'REGISTERED', 'CATALOG', 'location', 'Shared company, customer and operational location master data.', 60, TRUE),
  ('ASSET', 'MODULE', 'Asset', 'Business Operations', 'SHARED_MODULE', 'REGISTERED', 'CATALOG', 'asset', 'Shared physical and assigned asset records.', 70, TRUE),

  ('DOCUMENT', 'MODULE', 'Document', 'Shared Services', 'SHARED_MODULE', 'REGISTERED', 'CATALOG', 'document', 'Shared document metadata and ownership records.', 80, TRUE),
  ('TASK_APPROVAL', 'MODULE', 'Task & Approval', 'Shared Services', 'SHARED_MODULE', 'REGISTERED', 'CATALOG', 'task', 'Shared task, approval and workflow records.', 90, TRUE),
  ('NOTIFICATION', 'MODULE', 'Notification', 'Shared Services', 'SHARED_MODULE', 'REGISTERED', 'CATALOG', 'notification', 'Shared system and workflow notifications.', 100, TRUE),

  ('HRM', 'TOOL', 'HRM', 'People & Organization', 'BUSINESS_TOOL', 'REGISTERED', 'CATALOG', 'hrm', 'Employee lifecycle, onboarding, attendance, leave and performance operations.', 110, TRUE),
  ('INVENTORY', 'TOOL', 'Inventory', 'Business Operations', 'BUSINESS_TOOL', 'REGISTERED', 'CATALOG', 'inventory', 'Stock, equipment and inventory operations.', 120, TRUE),
  ('INSTALLATION', 'TOOL', 'Installation', 'Business Operations', 'BUSINESS_TOOL', 'REGISTERED', 'CATALOG', 'installation', 'Installation jobs, scheduling and completion workflow.', 130, TRUE),

  ('FINANCIAL', 'TOOL', 'Financial', 'Management & Control', 'BUSINESS_TOOL', 'REGISTERED', 'CATALOG', 'finance', 'Finance operations, revenue, cost and financial controls.', 140, TRUE),
  ('PROCUREMENT', 'TOOL', 'Procurement', 'Management & Control', 'BUSINESS_TOOL', 'REGISTERED', 'CATALOG', 'procurement', 'Purchasing, vendor and procurement workflow.', 150, TRUE),
  ('MANAGEMENT_DASHBOARD', 'TOOL', 'Management Dashboard', 'Management & Control', 'BUSINESS_TOOL', 'REGISTERED', 'CATALOG', 'management', 'Cross-business performance and management overview.', 160, TRUE),
  ('CRM', 'TOOL', 'CRM', 'Management & Control', 'BUSINESS_TOOL', 'HOLD', 'RESERVED', 'crm', 'Reserved for later migration. Current CRM GS implementation remains on hold.', 170, TRUE),

  ('IT_ADMIN', 'TOOL', 'IT Admin', 'Platform Administration', 'PLATFORM_TOOL', 'REGISTERED', 'CATALOG', 'it', 'Employee account setup, access administration, IT requests and device assignment.', 180, TRUE),
  ('SUPER_ADMIN', 'TOOL', 'Super Admin', 'Platform Administration', 'PLATFORM_TOOL', 'REGISTERED', 'CATALOG', 'system', 'Platform governance, roles, permissions, module registry and audit.', 190, TRUE)
ON CONFLICT (code) DO UPDATE
SET
  item_type = EXCLUDED.item_type,
  name = EXCLUDED.name,
  domain = EXCLUDED.domain,
  ownership = EXCLUDED.ownership,
  lifecycle_status = EXCLUDED.lifecycle_status,
  availability_status = EXCLUDED.availability_status,
  permission_namespace = EXCLUDED.permission_namespace,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  is_system_item = EXCLUDED.is_system_item,
  updated_at = NOW();

INSERT INTO permissions (code, name, description, permission_group)
VALUES (
  'system.module_management.view',
  'View Module Management',
  'View the canonical Q BMS Module and Tool registry, lifecycle and availability state.',
  'System'
)
ON CONFLICT (code) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  permission_group = EXCLUDED.permission_group;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code = 'system.module_management.view'
WHERE r.code = 'SUPER_ADMIN'
ON CONFLICT DO NOTHING;

DO $$
DECLARE
  v_modules INTEGER;
  v_tools INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_modules
  FROM platform_registry_items
  WHERE item_type = 'MODULE';

  SELECT COUNT(*) INTO v_tools
  FROM platform_registry_items
  WHERE item_type = 'TOOL';

  IF v_modules <> 10 OR v_tools <> 9 THEN
    RAISE EXCEPTION
      'Module Management registry verification failed. Expected 10 Modules / 9 Tools, got % / %',
      v_modules,
      v_tools;
  END IF;
END $$;

COMMIT;
