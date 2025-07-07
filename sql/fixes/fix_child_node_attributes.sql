-- 事業に紐づく子要素ノードの属性を修正するSQLスクリプト

-- 1. 確認：現在の状態をチェック
SELECT 'Current state check' as action;

-- 事業ノードの属性状況
SELECT 'businesses' as table_name, 
       CASE WHEN attribute IS NULL THEN 'NULL (company)' ELSE attribute::text END as attribute, 
       COUNT(*) as count 
FROM businesses 
GROUP BY attribute;

-- 業務ノードの属性状況  
SELECT 'tasks' as table_name,
       CASE WHEN attribute IS NULL THEN 'NULL (company)' ELSE attribute::text END as attribute,
       COUNT(*) as count
FROM tasks
GROUP BY attribute;

-- 実行者ノードの属性状況
SELECT 'executors' as table_name,
       CASE WHEN attribute IS NULL THEN 'NULL (company)' ELSE attribute::text END as attribute,
       COUNT(*) as count
FROM executors
GROUP BY attribute;

-- 2. 業務ノード (tasks) の属性を修正
-- business_idがある場合はそのbusiness_idを属性に設定
UPDATE tasks 
SET attribute = business_id 
WHERE business_id IS NOT NULL;

-- business_idがNULLの場合はNULLに設定（会社属性として扱う）
UPDATE tasks 
SET attribute = NULL 
WHERE business_id IS NULL;

-- 3. 実行者ノード (executors) の属性を修正
-- 対応する業務から事業IDを取得して設定
UPDATE executors 
SET attribute = (
  SELECT t.business_id
  FROM tasks t 
  WHERE t.id = executors.task_id
);

-- 4. 事業レイヤー (layers) の属性を修正
-- 事業タイプのレイヤーは関連する事業の属性に設定
UPDATE layers 
SET attribute = (
  SELECT b.id 
  FROM businesses b 
  WHERE b.layer_id = layers.id 
  LIMIT 1
)
WHERE type = 'business' 
  AND EXISTS (
    SELECT 1 FROM businesses b WHERE b.layer_id = layers.id
  );

-- 経営タイプのレイヤーはNULLに設定
UPDATE layers 
SET attribute = NULL 
WHERE type = 'management';

-- 5. 修正後の確認用クエリ
SELECT 'After fix - businesses' as table_name, 
       CASE WHEN attribute IS NULL THEN 'NULL (company)' ELSE attribute::text END as attribute, 
       COUNT(*) as count 
FROM businesses 
GROUP BY attribute
UNION ALL
SELECT 'After fix - tasks' as table_name,
       CASE WHEN attribute IS NULL THEN 'NULL (company)' ELSE attribute::text END as attribute,
       COUNT(*) as count
FROM tasks
GROUP BY attribute
UNION ALL
SELECT 'After fix - executors' as table_name,
       CASE WHEN attribute IS NULL THEN 'NULL (company)' ELSE attribute::text END as attribute,
       COUNT(*) as count
FROM executors
GROUP BY attribute
UNION ALL
SELECT 'After fix - layers' as table_name,
       CASE WHEN attribute IS NULL THEN 'NULL (company)' ELSE attribute::text END as attribute,
       COUNT(*) as count
FROM layers
GROUP BY attribute
ORDER BY table_name, attribute;

-- 6. 詳細な関係性チェック
SELECT 'Relationship check' as action;

-- 業務ノードと事業ノードの関係をチェック
SELECT 
  t.name as task_name,
  t.business_id,
  t.attribute as task_attribute,
  b.name as business_name,
  b.attribute as business_attribute,
  CASE 
    WHEN t.attribute = b.attribute THEN 'MATCH'
    WHEN t.business_id IS NULL AND t.attribute IS NULL THEN 'OK (company task)'
    ELSE 'MISMATCH'
  END as status
FROM tasks t
LEFT JOIN businesses b ON t.business_id = b.id
ORDER BY status, t.name;