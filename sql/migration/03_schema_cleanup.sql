-- Phase 3: スキーマクリーンアップ（TDD）
-- データ移行完了後、不要なカラムを削除

-- Step 1: 移行後テスト
SELECT 'PRE-CLEANUP VALIDATION:' as section;

-- 1.1 全業務がbusiness_idを持っているか最終確認
SELECT 
  'All tasks have business_id' as validation_item,
  COUNT(*) as total_tasks,
  COUNT(business_id) as tasks_with_business,
  CASE 
    WHEN COUNT(*) = COUNT(business_id) AND COUNT(*) > 0 THEN 'READY_FOR_CLEANUP'
    ELSE 'NOT_READY'
  END as cleanup_readiness
FROM tasks;

-- 1.2 全実行者がtask_idを持っているか最終確認
SELECT 
  'All executors have task_id' as validation_item,
  COUNT(*) as total_executors,
  COUNT(task_id) as executors_with_task,
  CASE 
    WHEN COUNT(*) = COUNT(task_id) AND COUNT(*) > 0 THEN 'READY_FOR_CLEANUP'
    ELSE 'NOT_READY'
  END as cleanup_readiness
FROM executors;

-- Step 2: スキーマ変更実行
-- 注意: この操作は元に戻せないため、上記のバリデーションが成功してから実行

-- 2.1 businessesテーブルからlayer_idを削除
ALTER TABLE businesses DROP COLUMN layer_id;

-- 2.2 tasksテーブルからlayer_idを削除  
ALTER TABLE tasks DROP COLUMN layer_id;

-- 2.3 tasksテーブルのbusiness_idにNOT NULL制約を追加
ALTER TABLE tasks ALTER COLUMN business_id SET NOT NULL;

-- Step 3: スキーマ変更後の確認
SELECT 'POST-CLEANUP VALIDATION:' as section;

-- 3.1 businessesテーブルのカラム確認
SELECT 
  'businesses table structure' as check_item,
  column_name,
  is_nullable,
  data_type
FROM information_schema.columns 
WHERE table_name = 'businesses' 
ORDER BY ordinal_position;

-- 3.2 tasksテーブルのカラム確認
SELECT 
  'tasks table structure' as check_item,
  column_name,
  is_nullable,
  data_type
FROM information_schema.columns 
WHERE table_name = 'tasks' 
ORDER BY ordinal_position;

-- 3.3 新しい制約の確認
SELECT 
  'tasks table constraints' as check_item,
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'tasks'::regclass
  AND contype IN ('c', 'n');  -- チェック制約とNOT NULL制約