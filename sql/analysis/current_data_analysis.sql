-- 現在のデータ構造を詳細に分析して変更の影響を把握

-- 1. 全体のデータ概要
SELECT 'DATA OVERVIEW:' as section;
SELECT 
  'companies' as table_name, COUNT(*) as count FROM companies
UNION ALL
SELECT 'layers' as table_name, COUNT(*) as count FROM layers
UNION ALL  
SELECT 'businesses' as table_name, COUNT(*) as count FROM businesses
UNION ALL
SELECT 'tasks' as table_name, COUNT(*) as count FROM tasks
UNION ALL
SELECT 'executors' as table_name, COUNT(*) as count FROM executors;

-- 2. 事業テーブルの現在の状態（layer_id削除予定）
SELECT 'BUSINESSES ANALYSIS:' as section;
SELECT 
  b.id,
  b.name,
  b.layer_id,
  l.name as layer_name,
  l.type as layer_type,
  b.attribute
FROM businesses b
LEFT JOIN layers l ON b.layer_id = l.id
ORDER BY b.name;

-- 3. 業務テーブルの現在の状態（layer_id削除予定、business_id必須化予定）
SELECT 'TASKS ANALYSIS:' as section;
SELECT 
  t.id,
  t.name,
  t.business_id,
  b.name as business_name,
  t.layer_id,
  l.name as layer_name,
  CASE 
    WHEN t.business_id IS NOT NULL AND t.layer_id IS NOT NULL THEN 'BOTH'
    WHEN t.business_id IS NOT NULL AND t.layer_id IS NULL THEN 'BUSINESS_ONLY'
    WHEN t.business_id IS NULL AND t.layer_id IS NOT NULL THEN 'LAYER_ONLY'
    ELSE 'NEITHER'
  END as relationship_type
FROM tasks t
LEFT JOIN businesses b ON t.business_id = b.id
LEFT JOIN layers l ON t.layer_id = l.id
ORDER BY relationship_type, t.name;

-- 4. 実行者テーブルの現在の状態
SELECT 'EXECUTORS ANALYSIS:' as section;
SELECT 
  e.id,
  e.name,
  e.task_id,
  t.name as task_name,
  t.business_id,
  b.name as business_name,
  CASE 
    WHEN e.task_id IS NULL THEN 'NO_TASK'
    WHEN t.business_id IS NULL THEN 'TASK_WITHOUT_BUSINESS'
    ELSE 'PROPER_CHAIN'
  END as chain_status
FROM executors e
LEFT JOIN tasks t ON e.task_id = t.id
LEFT JOIN businesses b ON t.business_id = b.id
ORDER BY chain_status, e.name;

-- 5. レイヤーテーブルの現在の状態
SELECT 'LAYERS ANALYSIS:' as section;
SELECT 
  l.id,
  l.name,
  l.type,
  l.attribute,
  COUNT(DISTINCT b.id) as businesses_count,
  COUNT(DISTINCT t.id) as tasks_count
FROM layers l
LEFT JOIN businesses b ON b.layer_id = l.id
LEFT JOIN tasks t ON t.layer_id = l.id
GROUP BY l.id, l.name, l.type, l.attribute
ORDER BY l.name;

-- 6. 問題のあるデータパターンを特定
SELECT 'POTENTIAL ISSUES:' as section;

-- 事業を持たない業務（layer_idのみ）
SELECT 'Tasks without business_id:' as issue_type, COUNT(*) as count
FROM tasks WHERE business_id IS NULL AND layer_id IS NOT NULL
UNION ALL
-- 業務を持たない実行者
SELECT 'Executors without task_id:' as issue_type, COUNT(*) as count  
FROM executors WHERE task_id IS NULL
UNION ALL
-- business_idもlayer_idも持たない業務
SELECT 'Tasks with neither business nor layer:' as issue_type, COUNT(*) as count
FROM tasks WHERE business_id IS NULL AND layer_id IS NULL;