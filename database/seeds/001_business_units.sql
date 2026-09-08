-- Q BMS v2.0.2.0
-- Initial Business Unit seed
-- Safe to run repeatedly.

INSERT INTO business_units (
  code,
  name,
  description,
  status,
  sort_order
)
VALUES
  ('IQURI', 'iQuri', 'iQuri business unit', 'ACTIVE', 10),
  ('QPOS', 'QPOS', 'QPOS business unit', 'ACTIVE', 20),
  ('IQURI_X', 'iQuri X', 'iQuri X business unit', 'ACTIVE', 30),
  ('LBB', 'LBB', 'LBB business unit', 'ACTIVE', 40)
ON CONFLICT (code)
DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  status = EXCLUDED.status,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();
