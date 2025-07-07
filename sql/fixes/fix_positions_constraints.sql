-- positionsテーブルの制約を確認
SELECT 
  'POSITIONS CONSTRAINTS:' as section;

-- 制約の詳細を確認
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'positions'::regclass;

-- カラム情報も確認
SELECT 
  column_name,
  is_nullable,
  column_default,
  data_type
FROM information_schema.columns 
WHERE table_name = 'positions' 
ORDER BY ordinal_position;