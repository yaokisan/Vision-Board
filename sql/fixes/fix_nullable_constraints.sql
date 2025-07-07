-- ドラッグ&ドロップでのノード作成エラーを修正
-- NOT NULL制約を緩和して、親ノード情報がない場合もノード作成を可能にする

-- 1. CXOノード（positions）のcompany_id制約を緩和
ALTER TABLE positions ALTER COLUMN company_id DROP NOT NULL;

-- 2. 実行者ノード（executors）のtask_id制約を緩和
ALTER TABLE executors ALTER COLUMN task_id DROP NOT NULL;

-- 修正後の確認
SELECT 'CONSTRAINT CHECK:' as section;

-- positionsテーブルの制約確認
SELECT 
  'positions' as table_name,
  column_name,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'positions' 
  AND column_name IN ('company_id', 'attribute');

-- executorsテーブルの制約確認
SELECT 
  'executors' as table_name,
  column_name,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'executors' 
  AND column_name IN ('task_id', 'attribute');