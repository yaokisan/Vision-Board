-- エッジベースで属性を修正するSQLスクリプト

-- 修正前の状況確認
SELECT 'BEFORE FIX - PROBLEM NODES:' as section;

-- 問題のある業務ノードを確認
SELECT 
  'TASK' as node_type,
  t.name as node_name,
  t.id::text as node_id,
  t.attribute as current_attribute,
  b.id::text as should_be_attribute,
  b.name as parent_business
FROM tasks t
JOIN edges e ON e.target_node_id = 'task-' || t.id::text
JOIN businesses b ON e.source_node_id = 'business-' || b.id::text
WHERE t.attribute != b.id::text OR t.attribute IS NULL
ORDER BY b.name, t.name;

-- 問題のある実行者ノードを確認
SELECT 
  'EXECUTOR' as node_type,
  ex.name as node_name,
  ex.id::text as node_id,
  ex.attribute as current_attribute,
  'NULL (orphaned)' as should_be_attribute,
  'No parent' as parent_business
FROM executors ex
WHERE 'executor-' || ex.id::text NOT IN (
  SELECT target_node_id FROM edges WHERE target_node_id LIKE 'executor-%'
)
ORDER BY ex.name;

-- 1. エッジで繋がっている業務ノードの属性を親事業に合わせる
UPDATE tasks 
SET attribute = (
  SELECT b.id::text
  FROM edges e
  JOIN businesses b ON e.source_node_id = 'business-' || b.id::text
  WHERE e.target_node_id = 'task-' || tasks.id::text
)
WHERE 'task-' || id::text IN (
  SELECT target_node_id 
  FROM edges 
  WHERE target_node_id LIKE 'task-%'
    AND source_node_id LIKE 'business-%'
);

-- 2. エッジで繋がっている実行者ノードの属性を親業務の属性に合わせる
UPDATE executors 
SET attribute = (
  SELECT t.attribute
  FROM edges e
  JOIN tasks t ON e.source_node_id = 'task-' || t.id::text
  WHERE e.target_node_id = 'executor-' || executors.id::text
)
WHERE 'executor-' || id::text IN (
  SELECT target_node_id 
  FROM edges 
  WHERE target_node_id LIKE 'executor-%'
    AND source_node_id LIKE 'task-%'
);

-- 3. 孤立している業務ノードの属性をNULLに設定（会社属性）
UPDATE tasks 
SET attribute = NULL
WHERE 'task-' || id::text NOT IN (
  SELECT target_node_id 
  FROM edges 
  WHERE target_node_id LIKE 'task-%'
);

-- 4. 孤立している実行者ノードの属性をNULLに設定（会社属性）
UPDATE executors 
SET attribute = NULL
WHERE 'executor-' || id::text NOT IN (
  SELECT target_node_id 
  FROM edges 
  WHERE target_node_id LIKE 'executor-%'
);

-- 修正後の確認
SELECT 'AFTER FIX - VERIFICATION:' as section;

-- 事業→業務の関係確認
SELECT 
  'BUSINESS → TASK' as relationship,
  b.name as parent_name,
  b.id::text as parent_id,
  b.attribute as parent_attribute,
  t.name as child_name,
  t.id::text as child_id,
  t.attribute as child_attribute,
  CASE 
    WHEN t.attribute = b.id::text THEN 'CORRECT'
    ELSE 'ERROR'
  END as status
FROM edges e
JOIN businesses b ON e.source_node_id = 'business-' || b.id::text
JOIN tasks t ON e.target_node_id = 'task-' || t.id::text
ORDER BY b.name, t.name;

-- 業務→実行者の関係確認
SELECT 
  'TASK → EXECUTOR' as relationship,
  t.name as parent_name,
  t.id::text as parent_id,
  t.attribute as parent_attribute,
  ex.name as child_name,
  ex.id::text as child_id,
  ex.attribute as child_attribute,
  CASE 
    WHEN ex.attribute = t.attribute THEN 'CORRECT'
    WHEN ex.attribute IS NULL AND t.attribute IS NULL THEN 'CORRECT (company)'
    ELSE 'ERROR'
  END as status
FROM edges e
JOIN tasks t ON e.source_node_id = 'task-' || t.id::text
JOIN executors ex ON e.target_node_id = 'executor-' || ex.id::text
ORDER BY t.name, ex.name;

-- 孤立ノードの確認
SELECT 
  'ORPHANED NODES' as relationship,
  'TASK' as parent_name,
  NULL as parent_id,
  NULL as parent_attribute,
  t.name as child_name,
  t.id::text as child_id,
  t.attribute as child_attribute,
  CASE 
    WHEN t.attribute IS NULL THEN 'CORRECT (company)'
    ELSE 'ERROR'
  END as status
FROM tasks t
WHERE 'task-' || t.id::text NOT IN (
  SELECT target_node_id FROM edges WHERE target_node_id LIKE 'task-%'
)
UNION ALL
SELECT 
  'ORPHANED NODES' as relationship,
  'EXECUTOR' as parent_name,
  NULL as parent_id,
  NULL as parent_attribute,
  ex.name as child_name,
  ex.id::text as child_id,
  ex.attribute as child_attribute,
  CASE 
    WHEN ex.attribute IS NULL THEN 'CORRECT (company)'
    ELSE 'ERROR'
  END as status
FROM executors ex
WHERE 'executor-' || ex.id::text NOT IN (
  SELECT target_node_id FROM edges WHERE target_node_id LIKE 'executor-%'
)
ORDER BY relationship, parent_name, child_name;

-- 最終的な属性分布
SELECT 'FINAL ATTRIBUTE DISTRIBUTION:' as section;

SELECT 'businesses' as table_name, 
       name as node_name,
       CASE WHEN attribute IS NULL THEN 'NULL (company)' ELSE attribute END as attribute
FROM businesses 
UNION ALL
SELECT 'tasks' as table_name,
       name as node_name,
       CASE WHEN attribute IS NULL THEN 'NULL (company)' ELSE attribute END as attribute
FROM tasks
UNION ALL
SELECT 'executors' as table_name,
       name as node_name,
       CASE WHEN attribute IS NULL THEN 'NULL (company)' ELSE attribute END as attribute
FROM executors
ORDER BY table_name, attribute, node_name;