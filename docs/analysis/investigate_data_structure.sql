-- データ構造調査用SQLスクリプト

-- 1. 事業ノードの確認
SELECT 'BUSINESSES:' as section;
SELECT id, name, layer_id, 
       CASE WHEN attribute IS NULL THEN 'NULL (company)' ELSE attribute::text END as attribute
FROM businesses 
ORDER BY name;

-- 2. レイヤーの確認
SELECT 'LAYERS:' as section;
SELECT id, name, type, company_id,
       CASE WHEN attribute IS NULL THEN 'NULL (company)' ELSE attribute::text END as attribute
FROM layers 
ORDER BY name;

-- 3. 業務ノードの確認
SELECT 'TASKS:' as section;
SELECT id, name, business_id, layer_id,
       CASE WHEN attribute IS NULL THEN 'NULL (company)' ELSE attribute::text END as attribute
FROM tasks 
ORDER BY name;

-- 4. 実行者ノードの確認
SELECT 'EXECUTORS:' as section;
SELECT id, name, task_id,
       CASE WHEN attribute IS NULL THEN 'NULL (company)' ELSE attribute::text END as attribute
FROM executors 
ORDER BY name;

-- 5. 業務と事業の関係性分析
SELECT 'TASK-BUSINESS RELATIONSHIPS:' as section;
SELECT 
  t.name as task_name,
  t.business_id,
  t.layer_id,
  b.name as business_name,
  l.name as layer_name,
  l.type as layer_type
FROM tasks t
LEFT JOIN businesses b ON t.business_id = b.id
LEFT JOIN layers l ON t.layer_id = l.id
ORDER BY t.name;

-- 6. レイヤー内の事業確認
SELECT 'BUSINESSES IN LAYERS:' as section;
SELECT 
  l.name as layer_name,
  l.type as layer_type,
  b.name as business_name,
  b.id as business_id
FROM layers l
LEFT JOIN businesses b ON b.layer_id = l.id
ORDER BY l.name, b.name;