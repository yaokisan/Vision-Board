-- 移行前のデータ状態確認テスト（TDD）
-- このテストは移行前の現在の状態をベースラインとして記録

-- テスト1: 移行前の基本データ数確認
SELECT 'PRE-MIGRATION BASELINE TEST' as test_name;

-- 1.1 各テーブルのレコード数（移行前）
SELECT 'Table counts (before migration):' as test_section;
SELECT 
  'companies' as table_name, COUNT(*) as count, 'expected: 2' as note FROM companies
UNION ALL
SELECT 'layers' as table_name, COUNT(*) as count, 'expected: 7' as note FROM layers
UNION ALL  
SELECT 'businesses' as table_name, COUNT(*) as count, 'expected: 7' as note FROM businesses
UNION ALL
SELECT 'tasks' as table_name, COUNT(*) as count, 'expected: 10' as note FROM tasks
UNION ALL
SELECT 'executors' as table_name, COUNT(*) as count, 'expected: 6' as note FROM executors;

-- テスト2: 移行対象データの確認
SELECT 'Migration target data:' as test_section;

-- 2.1 business_id = NULLの業務数（移行対象）
SELECT 
  'Tasks without business_id' as test_item,
  COUNT(*) as current_count,
  '10' as expected_count,
  CASE WHEN COUNT(*) = 10 THEN 'PASS' ELSE 'FAIL' END as test_result
FROM tasks 
WHERE business_id IS NULL;

-- 2.2 task_id = NULLの実行者数（修正対象）  
SELECT 
  'Executors without task_id' as test_item,
  COUNT(*) as current_count,
  '3' as expected_count,
  CASE WHEN COUNT(*) = 3 THEN 'PASS' ELSE 'FAIL' END as test_result
FROM executors 
WHERE task_id IS NULL;

-- 2.3 移行先の「新しい事業」が存在することを確認
SELECT 
  'Target business exists' as test_item,
  COUNT(*) as current_count,
  '1' as expected_count,
  CASE WHEN COUNT(*) = 1 THEN 'PASS' ELSE 'FAIL' END as test_result
FROM businesses 
WHERE id = 'c4d5638c-c156-440d-8d73-331f01f1a626' AND name = '新しい事業';

-- テスト3: 現在の構造の確認
SELECT 'Current structure validation:' as test_section;

-- 3.1 事業は全てlayer_idを持っているか
SELECT 
  'All businesses have layer_id' as test_item,
  COUNT(*) as total_businesses,
  COUNT(layer_id) as businesses_with_layer,
  CASE WHEN COUNT(*) = COUNT(layer_id) THEN 'PASS' ELSE 'FAIL' END as test_result
FROM businesses;

-- 3.2 業務は全てlayer_idを持っているか
SELECT 
  'All tasks have layer_id' as test_item,
  COUNT(*) as total_tasks,
  COUNT(layer_id) as tasks_with_layer,
  CASE WHEN COUNT(*) = COUNT(layer_id) THEN 'PASS' ELSE 'FAIL' END as test_result  
FROM tasks;

-- テスト4: 移行後の期待値計算
SELECT 'Post-migration expectations:' as test_section;

-- 4.1 移行後、全業務がbusiness_idを持つべき
SELECT 
  'Expected tasks with business_id after migration' as test_item,
  COUNT(*) as expected_count,
  '10' as note
FROM tasks;

-- 4.2 移行後、task_id = NULLの実行者はいなくなるべき
SELECT 
  'Expected executors without task_id after migration' as test_item,
  '0' as expected_count,
  'All executors should have tasks' as note;