-- 既存ノードの属性値を適切な事業属性に修正するSQLスクリプト（修正版）

-- 1. 事業ノード (businesses) の属性を自分自身のIDに設定
UPDATE businesses 
SET attribute = id 
WHERE attribute = 'company' OR attribute IS NULL;

-- 2. 業務ノード (tasks) の属性を所属事業IDに設定（business_idがある場合）
UPDATE tasks 
SET attribute = business_id 
WHERE business_id IS NOT NULL 
  AND (attribute = 'company' OR attribute IS NULL);

-- 3. 実行者ノード (executors) の属性を対応する業務の事業IDに設定
-- business_idがNULLの場合はattributeもNULLのままにする（'company'は使わない）
UPDATE executors 
SET attribute = (
  SELECT t.business_id
  FROM tasks t 
  WHERE t.id = executors.task_id
)
WHERE attribute = 'company' OR attribute IS NULL;

-- 4. 事業レイヤー (layers) で事業タイプの場合、関連する事業の属性に設定
-- 複数の事業が同じレイヤーにある場合は最初の事業IDを使用
UPDATE layers 
SET attribute = (
  SELECT b.id 
  FROM businesses b 
  WHERE b.layer_id = layers.id 
  LIMIT 1
)
WHERE type = 'business' 
  AND (attribute = 'company' OR attribute IS NULL)
  AND EXISTS (
    SELECT 1 FROM businesses b WHERE b.layer_id = layers.id
  );

-- 5. CXO役職 (positions) と会社 (companies) の属性をNULLに設定
-- 'company'という文字列はUUID型に適合しないため、NULLにしてアプリケーション側で判定
UPDATE positions 
SET attribute = NULL 
WHERE attribute = 'company';

UPDATE companies 
SET attribute = NULL 
WHERE attribute = 'company';

-- 6. 経営タイプのレイヤーもNULLに設定
UPDATE layers 
SET attribute = NULL 
WHERE type = 'management' AND attribute = 'company';

-- 7. 確認用クエリ - 各テーブルの属性分布を表示
SELECT 'companies' as table_name, 
       CASE WHEN attribute IS NULL THEN 'NULL (company)' ELSE attribute::text END as attribute, 
       COUNT(*) as count 
FROM companies 
GROUP BY attribute
UNION ALL
SELECT 'positions' as table_name, 
       CASE WHEN attribute IS NULL THEN 'NULL (company)' ELSE attribute::text END as attribute, 
       COUNT(*) as count 
FROM positions 
GROUP BY attribute  
UNION ALL
SELECT 'layers' as table_name, 
       CASE WHEN attribute IS NULL THEN 'NULL (company)' ELSE attribute::text END as attribute, 
       COUNT(*) as count 
FROM layers 
GROUP BY attribute
UNION ALL
SELECT 'businesses' as table_name, 
       CASE WHEN attribute IS NULL THEN 'NULL (company)' ELSE attribute::text END as attribute, 
       COUNT(*) as count 
FROM businesses 
GROUP BY attribute
UNION ALL
SELECT 'tasks' as table_name, 
       CASE WHEN attribute IS NULL THEN 'NULL (company)' ELSE attribute::text END as attribute, 
       COUNT(*) as count 
FROM tasks 
GROUP BY attribute
UNION ALL
SELECT 'executors' as table_name, 
       CASE WHEN attribute IS NULL THEN 'NULL (company)' ELSE attribute::text END as attribute, 
       COUNT(*) as count 
FROM executors 
GROUP BY attribute
ORDER BY table_name, attribute;