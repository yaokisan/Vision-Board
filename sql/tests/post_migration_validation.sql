-- 移行後の最終バリデーションテスト（TDD）

SELECT 'POST-MIGRATION FINAL VALIDATION' as test_name;

-- テスト1: データ数の整合性確認
SELECT 'Data count consistency:' as test_section;

SELECT 
  'companies' as table_name, 
  COUNT(*) as count, 
  '2' as expected,
  CASE WHEN COUNT(*) = 2 THEN 'PASS' ELSE 'FAIL' END as test_result
FROM companies
UNION ALL
SELECT 
  'layers' as table_name, 
  COUNT(*) as count, 
  '7' as expected,
  CASE WHEN COUNT(*) = 7 THEN 'PASS' ELSE 'FAIL' END as test_result
FROM layers
UNION ALL  
SELECT 
  'businesses' as table_name, 
  COUNT(*) as count, 
  '7' as expected,
  CASE WHEN COUNT(*) = 7 THEN 'PASS' ELSE 'FAIL' END as test_result
FROM businesses
UNION ALL
SELECT 
  'tasks' as table_name, 
  COUNT(*) as count, 
  '10' as expected,
  CASE WHEN COUNT(*) = 10 THEN 'PASS' ELSE 'FAIL' END as test_result
FROM tasks
UNION ALL
SELECT 
  'executors' as table_name, 
  COUNT(*) as count, 
  '6' as expected,
  CASE WHEN COUNT(*) = 6 THEN 'PASS' ELSE 'FAIL' END as test_result
FROM executors;

-- テスト2: 新しい構造の確認
SELECT 'New structure validation:' as test_section;

-- 2.1 全業務がbusiness_idを持っているか
SELECT 
  'All tasks have business_id' as test_item,
  COUNT(*) as total_count,
  COUNT(business_id) as with_business_id,
  CASE WHEN COUNT(*) = COUNT(business_id) THEN 'PASS' ELSE 'FAIL' END as test_result
FROM tasks;

-- 2.2 全実行者がtask_idを持っているか
SELECT 
  'All executors have task_id' as test_item,
  COUNT(*) as total_count,
  COUNT(task_id) as with_task_id,
  CASE WHEN COUNT(*) = COUNT(task_id) THEN 'PASS' ELSE 'FAIL' END as test_result
FROM executors;

-- 2.3 businessesテーブルにlayer_idカラムが存在しないか
SELECT 
  'businesses.layer_id removed' as test_item,
  COUNT(*) as layer_id_columns,
  CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END as test_result
FROM information_schema.columns 
WHERE table_name = 'businesses' AND column_name = 'layer_id';

-- 2.4 tasksテーブルにlayer_idカラムが存在しないか
SELECT 
  'tasks.layer_id removed' as test_item,
  COUNT(*) as layer_id_columns,
  CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END as test_result
FROM information_schema.columns 
WHERE table_name = 'tasks' AND column_name = 'layer_id';

-- 2.5 tasks.business_idがNOT NULLになっているか
SELECT 
  'tasks.business_id is NOT NULL' as test_item,
  is_nullable,
  CASE WHEN is_nullable = 'NO' THEN 'PASS' ELSE 'FAIL' END as test_result
FROM information_schema.columns 
WHERE table_name = 'tasks' AND column_name = 'business_id';

-- テスト3: データ整合性の確認
SELECT 'Data integrity validation:' as test_section;

-- 3.1 参照整合性: 全業務が有効なbusiness_idを持っているか
SELECT 
  'All tasks reference valid businesses' as test_item,
  COUNT(t.id) as total_tasks,
  COUNT(b.id) as valid_references,
  CASE WHEN COUNT(t.id) = COUNT(b.id) THEN 'PASS' ELSE 'FAIL' END as test_result
FROM tasks t
LEFT JOIN businesses b ON t.business_id = b.id;

-- 3.2 参照整合性: 全実行者が有効なtask_idを持っているか
SELECT 
  'All executors reference valid tasks' as test_item,
  COUNT(e.id) as total_executors,
  COUNT(t.id) as valid_references,
  CASE WHEN COUNT(e.id) = COUNT(t.id) THEN 'PASS' ELSE 'FAIL' END as test_result
FROM executors e
LEFT JOIN tasks t ON e.task_id = t.id;

-- テスト4: 「新しい事業」への割り当て確認
SELECT 'Business assignment validation:' as test_section;

SELECT 
  'Tasks assigned to target business' as test_item,
  COUNT(*) as assigned_count,
  '10' as expected_count,
  CASE WHEN COUNT(*) = 10 THEN 'PASS' ELSE 'FAIL' END as test_result
FROM tasks 
WHERE business_id = 'c4d5638c-c156-440d-8d73-331f01f1a626';

-- テスト5: 移行後の構造確認（階層チェック）
SELECT 'Hierarchy validation:' as test_section;

-- 5.1 事業→業務の階層が正しく形成されているか
SELECT 
  b.name as business_name,
  COUNT(t.id) as task_count,
  CASE WHEN COUNT(t.id) > 0 THEN 'HAS_TASKS' ELSE 'NO_TASKS' END as hierarchy_status
FROM businesses b
LEFT JOIN tasks t ON b.id = t.business_id
GROUP BY b.id, b.name
ORDER BY b.name;

-- 5.2 業務→実行者の階層が正しく形成されているか
SELECT 
  t.name as task_name,
  COUNT(e.id) as executor_count,
  CASE WHEN COUNT(e.id) > 0 THEN 'HAS_EXECUTORS' ELSE 'NO_EXECUTORS' END as hierarchy_status
FROM tasks t
LEFT JOIN executors e ON t.id = e.task_id
GROUP BY t.id, t.name
ORDER BY t.name;