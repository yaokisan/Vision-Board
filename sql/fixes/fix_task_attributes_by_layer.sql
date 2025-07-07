-- レイヤーベースで業務ノードの属性を修正するSQLスクリプト

-- 1. 現在の状況確認
SELECT 'CURRENT TASK ATTRIBUTES:' as section;
SELECT t.name as task_name, 
       t.layer_id,
       l.name as layer_name,
       CASE WHEN t.attribute IS NULL THEN 'NULL (company)' ELSE t.attribute::text END as current_attribute
FROM tasks t
LEFT JOIN layers l ON t.layer_id = l.id
ORDER BY l.name, t.name;

-- 2. レイヤー内の事業と業務の関係を確認
SELECT 'LAYER-BUSINESS-TASK MAPPING:' as section;
SELECT 
  l.name as layer_name,
  l.id as layer_id,
  STRING_AGG(DISTINCT b.name, ', ') as businesses_in_layer,
  STRING_AGG(DISTINCT t.name, ', ') as tasks_in_layer,
  COUNT(DISTINCT b.id) as business_count,
  COUNT(DISTINCT t.id) as task_count
FROM layers l
LEFT JOIN businesses b ON b.layer_id = l.id
LEFT JOIN tasks t ON t.layer_id = l.id
GROUP BY l.id, l.name
ORDER BY l.name;

-- 3. 業務の属性を修正する戦略
-- 戦略A: レイヤー内に事業が1つの場合、その事業IDを属性に設定
-- 戦略B: レイヤー内に複数事業がある場合、最初の事業IDを使用
-- 戦略C: レイヤー内に事業がない場合、NULLのまま（会社属性）

-- Step 1: レイヤー内に事業が1つだけある場合
UPDATE tasks 
SET attribute = (
  SELECT b.id 
  FROM businesses b 
  WHERE b.layer_id = tasks.layer_id
  LIMIT 1
)
WHERE layer_id IN (
  SELECT layer_id 
  FROM businesses 
  GROUP BY layer_id 
  HAVING COUNT(*) = 1
);

-- Step 2: レイヤー内に複数事業がある場合、アルファベット順で最初の事業を選択
UPDATE tasks 
SET attribute = (
  SELECT b.id 
  FROM businesses b 
  WHERE b.layer_id = tasks.layer_id
  ORDER BY b.name ASC
  LIMIT 1
)
WHERE layer_id IN (
  SELECT layer_id 
  FROM businesses 
  GROUP BY layer_id 
  HAVING COUNT(*) > 1
);

-- Step 3: レイヤー内に事業がない場合、NULLのまま（会社属性として扱われる）
UPDATE tasks 
SET attribute = NULL
WHERE layer_id NOT IN (
  SELECT DISTINCT layer_id 
  FROM businesses 
  WHERE layer_id IS NOT NULL
);

-- 4. 実行者ノードの属性も更新
UPDATE executors 
SET attribute = (
  SELECT t.attribute
  FROM tasks t 
  WHERE t.id = executors.task_id
);

-- 5. 修正後の確認
SELECT 'AFTER FIX - TASKS:' as section;
SELECT 
  t.name as task_name,
  l.name as layer_name,
  b.name as business_name,
  CASE WHEN t.attribute IS NULL THEN 'NULL (company)' ELSE t.attribute::text END as task_attribute,
  CASE WHEN b.attribute IS NULL THEN 'NULL (company)' ELSE b.attribute::text END as business_attribute,
  CASE 
    WHEN t.attribute = b.id THEN 'MATCH'
    WHEN t.attribute IS NULL AND b.id IS NULL THEN 'OK (company)'
    ELSE 'CHECK'
  END as status
FROM tasks t
LEFT JOIN layers l ON t.layer_id = l.id
LEFT JOIN businesses b ON b.id = t.attribute
ORDER BY l.name, t.name;

-- 6. 実行者の確認
SELECT 'AFTER FIX - EXECUTORS:' as section;
SELECT 
  e.name as executor_name,
  t.name as task_name,
  CASE WHEN e.attribute IS NULL THEN 'NULL (company)' ELSE e.attribute::text END as executor_attribute,
  CASE WHEN t.attribute IS NULL THEN 'NULL (company)' ELSE t.attribute::text END as task_attribute,
  CASE 
    WHEN e.attribute = t.attribute THEN 'MATCH'
    WHEN e.attribute IS NULL AND t.attribute IS NULL THEN 'OK (company)'
    ELSE 'MISMATCH'
  END as status
FROM executors e
LEFT JOIN tasks t ON e.task_id = t.id
ORDER BY t.name, e.name;