-- Phase 2: データ移行実行（TDD）

-- Step 1: 全業務を「新しい事業」に割り当て
UPDATE tasks 
SET business_id = 'c4d5638c-c156-440d-8d73-331f01f1a626'  -- 新しい事業のID
WHERE business_id IS NULL;

-- Step 2: 孤立した実行者を適当な業務に割り当て
-- まず、最初の業務を取得
WITH first_task AS (
  SELECT id FROM tasks LIMIT 1
)
UPDATE executors 
SET task_id = (SELECT id FROM first_task)
WHERE task_id IS NULL;

-- Step 3: 移行結果の確認
SELECT 'DATA MIGRATION RESULTS:' as section;

-- 3.1 業務の移行確認
SELECT 
  'Tasks migration status' as check_item,
  COUNT(*) as total_tasks,
  COUNT(business_id) as tasks_with_business,
  COUNT(*) - COUNT(business_id) as tasks_without_business,
  CASE WHEN COUNT(*) = COUNT(business_id) THEN 'SUCCESS' ELSE 'FAILED' END as migration_status
FROM tasks;

-- 3.2 実行者の修正確認
SELECT 
  'Executors fix status' as check_item,
  COUNT(*) as total_executors,
  COUNT(task_id) as executors_with_task,
  COUNT(*) - COUNT(task_id) as executors_without_task,
  CASE WHEN COUNT(*) = COUNT(task_id) THEN 'SUCCESS' ELSE 'FAILED' END as fix_status
FROM executors;

-- 3.3 「新しい事業」に紐づいた業務数
SELECT 
  'Tasks assigned to target business' as check_item,
  COUNT(*) as task_count,
  '10' as expected_count,
  CASE WHEN COUNT(*) = 10 THEN 'SUCCESS' ELSE 'UNEXPECTED' END as assignment_status
FROM tasks 
WHERE business_id = 'c4d5638c-c156-440d-8d73-331f01f1a626';

-- Step 4: データ整合性チェック
SELECT 'DATA INTEGRITY CHECK:' as section;

-- 4.1 存在しないbusiness_idを参照している業務がないか
SELECT 
  'Orphaned tasks (invalid business_id)' as check_item,
  COUNT(*) as orphaned_count,
  CASE WHEN COUNT(*) = 0 THEN 'OK' ELSE 'ERROR' END as status
FROM tasks t
LEFT JOIN businesses b ON t.business_id = b.id
WHERE t.business_id IS NOT NULL AND b.id IS NULL;

-- 4.2 存在しないtask_idを参照している実行者がないか
SELECT 
  'Orphaned executors (invalid task_id)' as check_item,
  COUNT(*) as orphaned_count,
  CASE WHEN COUNT(*) = 0 THEN 'OK' ELSE 'ERROR' END as status
FROM executors e
LEFT JOIN tasks t ON e.task_id = t.id
WHERE e.task_id IS NOT NULL AND t.id IS NULL;