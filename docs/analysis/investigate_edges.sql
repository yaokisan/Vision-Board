-- エッジ（接続線）の関係性を調査するSQLスクリプト

-- 1. 現在のエッジ関係を確認
SELECT 'CURRENT EDGES:' as section;
SELECT 
  e.id as edge_id,
  e.source_node_id,
  e.target_node_id,
  -- ソースノードの情報を取得
  CASE 
    WHEN e.source_node_id LIKE 'company-%' THEN 'COMPANY: ' || (SELECT name FROM companies WHERE id = REPLACE(e.source_node_id, 'company-', '')::uuid)
    WHEN e.source_node_id LIKE 'business-%' THEN 'BUSINESS: ' || (SELECT name FROM businesses WHERE id = REPLACE(e.source_node_id, 'business-', '')::uuid)
    WHEN e.source_node_id LIKE 'task-%' THEN 'TASK: ' || (SELECT name FROM tasks WHERE id = REPLACE(e.source_node_id, 'task-', '')::uuid)
    WHEN e.source_node_id LIKE 'position-%' THEN 'POSITION: ' || (SELECT name FROM positions WHERE id = REPLACE(e.source_node_id, 'position-', '')::uuid)
    ELSE e.source_node_id
  END as source_info,
  -- ターゲットノードの情報を取得
  CASE 
    WHEN e.target_node_id LIKE 'company-%' THEN 'COMPANY: ' || (SELECT name FROM companies WHERE id = REPLACE(e.target_node_id, 'company-', '')::uuid)
    WHEN e.target_node_id LIKE 'business-%' THEN 'BUSINESS: ' || (SELECT name FROM businesses WHERE id = REPLACE(e.target_node_id, 'business-', '')::uuid)
    WHEN e.target_node_id LIKE 'task-%' THEN 'TASK: ' || (SELECT name FROM tasks WHERE id = REPLACE(e.target_node_id, 'task-', '')::uuid)
    WHEN e.target_node_id LIKE 'position-%' THEN 'POSITION: ' || (SELECT name FROM positions WHERE id = REPLACE(e.target_node_id, 'position-', '')::uuid)
    ELSE e.target_node_id
  END as target_info
FROM edges e
ORDER BY e.source_node_id, e.target_node_id;

-- 2. BEAUTY ROADに関連するエッジを特定
SELECT 'BEAUTY ROAD CONNECTIONS:' as section;
SELECT 
  e.source_node_id,
  e.target_node_id,
  b.name as business_name,
  t.name as task_name
FROM edges e
LEFT JOIN businesses b ON e.source_node_id = 'business-' || b.id::text
LEFT JOIN tasks t ON e.target_node_id = 'task-' || t.id::text
WHERE b.name = 'BEAUTY ROAD'
   OR t.name IN ('BRメディア', 'BR研修', 'BR SaaS');

-- 3. 事業ノードから業務ノードへのエッジ関係を確認
SELECT 'BUSINESS TO TASK EDGES:' as section;
SELECT 
  b.name as business_name,
  b.id as business_id,
  t.name as task_name,
  t.id as task_id,
  e.source_node_id,
  e.target_node_id
FROM edges e
JOIN businesses b ON e.source_node_id = 'business-' || b.id::text
JOIN tasks t ON e.target_node_id = 'task-' || t.id::text
ORDER BY b.name, t.name;

-- 4. 業務ノードから実行者ノードへのエッジ関係を確認
SELECT 'TASK TO EXECUTOR EDGES:' as section;
SELECT 
  t.name as task_name,
  t.id as task_id,
  ex.name as executor_name,
  ex.id as executor_id,
  e.source_node_id,
  e.target_node_id
FROM edges e
JOIN tasks t ON e.source_node_id = 'task-' || t.id::text
JOIN executors ex ON e.target_node_id = 'executor-' || ex.id::text
ORDER BY t.name, ex.name;

-- 5. 現在の属性状況
SELECT 'CURRENT ATTRIBUTES:' as section;
SELECT 'BEAUTY ROAD business' as info, 
       CASE WHEN attribute IS NULL THEN 'NULL (company)' ELSE attribute::text END as attribute
FROM businesses WHERE name = 'BEAUTY ROAD'
UNION ALL
SELECT 'BRメディア task' as info,
       CASE WHEN attribute IS NULL THEN 'NULL (company)' ELSE attribute END as attribute  
FROM tasks WHERE name = 'BRメディア'
UNION ALL
SELECT 'BR研修 task' as info,
       CASE WHEN attribute IS NULL THEN 'NULL (company)' ELSE attribute END as attribute
FROM tasks WHERE name = 'BR研修'
UNION ALL
SELECT 'BR SaaS task' as info,
       CASE WHEN attribute IS NULL THEN 'NULL (company)' ELSE attribute END as attribute
FROM tasks WHERE name = 'BR SaaS';