-- 属性修正前の完全な現状分析用SQLスクリプト

-- 1. テーブルスキーマの確認
SELECT 'TABLE SCHEMAS:' as section;

-- edgesテーブルの構造確認
SELECT 'edges table schema:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'edges' 
ORDER BY ordinal_position;

-- 各ノードテーブルのattributeカラム確認
SELECT 'Node tables attribute column:' as info;
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE column_name = 'attribute' 
  AND table_name IN ('companies', 'positions', 'layers', 'businesses', 'tasks', 'executors')
ORDER BY table_name;

-- 2. 現在のエッジ関係を完全に確認
SELECT 'ALL CURRENT EDGES:' as section;
SELECT 
  e.id as edge_id,
  e.source_node_id,
  e.target_node_id,
  -- ソースノードの詳細情報
  CASE 
    WHEN e.source_node_id LIKE 'company-%' THEN 
      'COMPANY: ' || COALESCE((SELECT name FROM companies WHERE id = REPLACE(e.source_node_id, 'company-', '')::uuid), 'NOT FOUND')
    WHEN e.source_node_id LIKE 'business-%' THEN 
      'BUSINESS: ' || COALESCE((SELECT name FROM businesses WHERE id = REPLACE(e.source_node_id, 'business-', '')::uuid), 'NOT FOUND')
    WHEN e.source_node_id LIKE 'task-%' THEN 
      'TASK: ' || COALESCE((SELECT name FROM tasks WHERE id = REPLACE(e.source_node_id, 'task-', '')::uuid), 'NOT FOUND')
    WHEN e.source_node_id LIKE 'position-%' THEN 
      'POSITION: ' || COALESCE((SELECT name FROM positions WHERE id = REPLACE(e.source_node_id, 'position-', '')::uuid), 'NOT FOUND')
    WHEN e.source_node_id LIKE 'executor-%' THEN 
      'EXECUTOR: ' || COALESCE((SELECT name FROM executors WHERE id = REPLACE(e.source_node_id, 'executor-', '')::uuid), 'NOT FOUND')
    WHEN e.source_node_id LIKE 'layer-%' THEN 
      'LAYER: ' || COALESCE((SELECT name FROM layers WHERE id = REPLACE(e.source_node_id, 'layer-', '')::uuid), 'NOT FOUND')
    ELSE e.source_node_id
  END as source_info,
  -- ターゲットノードの詳細情報
  CASE 
    WHEN e.target_node_id LIKE 'company-%' THEN 
      'COMPANY: ' || COALESCE((SELECT name FROM companies WHERE id = REPLACE(e.target_node_id, 'company-', '')::uuid), 'NOT FOUND')
    WHEN e.target_node_id LIKE 'business-%' THEN 
      'BUSINESS: ' || COALESCE((SELECT name FROM businesses WHERE id = REPLACE(e.target_node_id, 'business-', '')::uuid), 'NOT FOUND')
    WHEN e.target_node_id LIKE 'task-%' THEN 
      'TASK: ' || COALESCE((SELECT name FROM tasks WHERE id = REPLACE(e.target_node_id, 'task-', '')::uuid), 'NOT FOUND')
    WHEN e.target_node_id LIKE 'position-%' THEN 
      'POSITION: ' || COALESCE((SELECT name FROM positions WHERE id = REPLACE(e.target_node_id, 'position-', '')::uuid), 'NOT FOUND')
    WHEN e.target_node_id LIKE 'executor-%' THEN 
      'EXECUTOR: ' || COALESCE((SELECT name FROM executors WHERE id = REPLACE(e.target_node_id, 'executor-', '')::uuid), 'NOT FOUND')
    WHEN e.target_node_id LIKE 'layer-%' THEN 
      'LAYER: ' || COALESCE((SELECT name FROM layers WHERE id = REPLACE(e.target_node_id, 'layer-', '')::uuid), 'NOT FOUND')
    ELSE e.target_node_id
  END as target_info
FROM edges e
ORDER BY e.source_node_id, e.target_node_id;

-- 3. 事業ノードから業務ノードへの直接エッジ
SELECT 'BUSINESS → TASK EDGES:' as section;
SELECT 
  e.source_node_id,
  e.target_node_id,
  b.id as business_id,
  b.name as business_name,
  b.attribute as business_attribute,
  t.id as task_id,
  t.name as task_name,
  t.attribute as current_task_attribute
FROM edges e
JOIN businesses b ON e.source_node_id = 'business-' || b.id::text
JOIN tasks t ON e.target_node_id = 'task-' || t.id::text
ORDER BY b.name, t.name;

-- 4. 業務ノードから実行者ノードへの直接エッジ
SELECT 'TASK → EXECUTOR EDGES:' as section;
SELECT 
  e.source_node_id,
  e.target_node_id,
  t.id as task_id,
  t.name as task_name,
  t.attribute as current_task_attribute,
  ex.id as executor_id,
  ex.name as executor_name,
  ex.attribute as current_executor_attribute
FROM edges e
JOIN tasks t ON e.source_node_id = 'task-' || t.id::text
JOIN executors ex ON e.target_node_id = 'executor-' || ex.id::text
ORDER BY t.name, ex.name;

-- 5. エッジで繋がっていない孤立ノードの確認
SELECT 'ORPHANED NODES:' as section;

-- エッジで繋がっていない業務ノード
SELECT 'ORPHANED TASKS:' as type, t.id, t.name, t.attribute as current_attribute
FROM tasks t
WHERE 'task-' || t.id::text NOT IN (
  SELECT target_node_id FROM edges WHERE target_node_id LIKE 'task-%'
)
UNION ALL
-- エッジで繋がっていない実行者ノード
SELECT 'ORPHANED EXECUTORS:' as type, ex.id, ex.name, ex.attribute as current_attribute
FROM executors ex
WHERE 'executor-' || ex.id::text NOT IN (
  SELECT target_node_id FROM edges WHERE target_node_id LIKE 'executor-%'
)
ORDER BY type, name;

-- 6. 現在の全ノードの属性状況
SELECT 'CURRENT ATTRIBUTE SUMMARY:' as section;

SELECT 'businesses' as table_name, 
       name as node_name,
       id::text as node_id,
       CASE WHEN attribute IS NULL THEN 'NULL (company)' ELSE attribute::text END as current_attribute
FROM businesses 
UNION ALL
SELECT 'tasks' as table_name,
       name as node_name,
       id::text as node_id,
       CASE WHEN attribute IS NULL THEN 'NULL (company)' ELSE attribute END as current_attribute
FROM tasks
UNION ALL
SELECT 'executors' as table_name,
       name as node_name,
       id::text as node_id,
       CASE WHEN attribute IS NULL THEN 'NULL (company)' ELSE attribute END as current_attribute
FROM executors
UNION ALL
SELECT 'companies' as table_name,
       name as node_name,
       id::text as node_id,
       CASE WHEN attribute IS NULL THEN 'NULL (company)' ELSE attribute::text END as current_attribute
FROM companies
UNION ALL
SELECT 'positions' as table_name,
       name as node_name,
       id::text as node_id,
       CASE WHEN attribute IS NULL THEN 'NULL (company)' ELSE attribute::text END as current_attribute
FROM positions
ORDER BY table_name, node_name;

-- 7. エッジのノードID形式確認
SELECT 'EDGE NODE ID PATTERNS:' as section;
SELECT 
  'source patterns' as type,
  LEFT(source_node_id, POSITION('-' IN source_node_id)) as pattern,
  COUNT(*) as count
FROM edges 
GROUP BY LEFT(source_node_id, POSITION('-' IN source_node_id))
UNION ALL
SELECT 
  'target patterns' as type,
  LEFT(target_node_id, POSITION('-' IN target_node_id)) as pattern,
  COUNT(*) as count
FROM edges 
GROUP BY LEFT(target_node_id, POSITION('-' IN target_node_id))
ORDER BY type, pattern;