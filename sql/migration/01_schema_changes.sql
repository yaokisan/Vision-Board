-- Phase 1: データベーススキーマ変更（TDD）
-- 選択肢B実装: 業務は必ず事業に属する構造

-- Step 1: バックアップ用ビューを作成（ロールバック用）
CREATE OR REPLACE VIEW backup_current_structure AS
SELECT 
  'businesses' as table_name,
  b.id,
  b.name,
  b.layer_id,
  NULL as business_id,
  NULL as task_id,
  b.attribute
FROM businesses b
UNION ALL
SELECT 
  'tasks' as table_name,
  t.id,
  t.name,
  t.layer_id,
  t.business_id,
  NULL as task_id,
  t.attribute
FROM tasks t
UNION ALL
SELECT 
  'executors' as table_name,
  e.id,
  e.name,
  NULL as layer_id,
  NULL as business_id,
  e.task_id,
  e.attribute
FROM executors e;

-- Step 2: 制約確認
SELECT 'CONSTRAINT ANALYSIS:' as section;

-- businessesテーブルの制約確認
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'businesses'::regclass;

-- tasksテーブルの制約確認  
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'tasks'::regclass;