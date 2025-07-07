-- positionsテーブルのname制約を削除して柔軟な役職名を許可

-- 1. 現在の制約を削除
ALTER TABLE positions DROP CONSTRAINT positions_name_check;

-- 2. 修正後の確認
SELECT 'POSITIONS CONSTRAINTS AFTER REMOVAL:' as section;

-- 残っている制約を確認
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'positions'::regclass
  AND contype = 'c'; -- チェック制約のみ