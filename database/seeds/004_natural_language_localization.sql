-- Q BMS v2.0.6.1
-- Natural business-language localization refinement.
-- English source data is unchanged.
-- Thai/Lao remain DRAFT until company language review.

UPDATE business_unit_translations t
SET
  description = CASE t.locale
    WHEN 'th' THEN 'สายธุรกิจ ' || b.name
    WHEN 'lo' THEN 'ສາຍທຸລະກິດ ' || b.name
    ELSE t.description
  END,
  updated_at = NOW()
FROM business_units b
WHERE t.business_unit_id = b.id
  AND t.locale IN ('th', 'lo');

UPDATE job_level_translations
SET
  name = CASE
    WHEN locale = 'th' AND name = 'ผู้ปฏิบัติงานอาวุโส' THEN 'ผู้เชี่ยวชาญและพนักงานอาวุโส'
    WHEN locale = 'lo' AND name = 'ພະນັກງານອາວຸໂສ' THEN 'ຜູ້ຊ່ຽວຊານ ແລະ ພະນັກງານອາວຸໂສ'
    ELSE name
  END,
  updated_at = NOW()
WHERE locale IN ('th', 'lo');

UPDATE job_grade_translations
SET
  name = CASE
    WHEN locale = 'th' AND name = 'ประธานเจ้าหน้าที่บริหาร' THEN 'CEO / ประธานเจ้าหน้าที่บริหาร'
    WHEN locale = 'th' AND name = 'ผู้บริหารระดับ C-Level' THEN 'C-Level'
    WHEN locale = 'th' AND name = 'หัวหน้าฝ่าย / หัวหน้าหน่วยธุรกิจ' THEN 'หัวหน้าฝ่าย / หัวหน้าสายธุรกิจ'
    WHEN locale = 'lo' AND name = 'ປະທານບໍລິຫານ' THEN 'CEO / ປະທານບໍລິຫານ'
    WHEN locale = 'lo' AND name = 'ຜູ້ບໍລິຫານລະດັບ C-Level' THEN 'C-Level'
    WHEN locale = 'lo' AND name = 'ຫົວໜ້າພະແນກ / ຫົວໜ້າໜ່ວຍທຸລະກິດ' THEN 'ຫົວໜ້າພະແນກ / ຫົວໜ້າສາຍທຸລະກິດ'
    ELSE name
  END,
  updated_at = NOW()
WHERE locale IN ('th', 'lo');
