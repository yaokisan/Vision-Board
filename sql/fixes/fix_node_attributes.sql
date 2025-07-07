-- 既存ノードの属性値を適切な事業属性に修正するSQLスクリプト

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
UPDATE executors 
SET attribute = (
  SELECT CASE 
    WHEN t.business_id IS NOT NULL THEN t.business_id
    ELSE 'company'
  END
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

-- 5. CXO役職 (positions) と会社 (companies) は会社属性のまま保持
-- これらはすでに 'company' 属性で正しい

-- 6. 確認用クエリ - 各テーブルの属性分布を表示
SELECT 'companies' as table_name, attribute, COUNT(*) as count FROM companies GROUP BY attribute
UNION ALL
SELECT 'positions' as table_name, attribute, COUNT(*) as count FROM positions GROUP BY attribute  
UNION ALL
SELECT 'layers' as table_name, attribute, COUNT(*) as count FROM layers GROUP BY attribute
UNION ALL
SELECT 'businesses' as table_name, attribute, COUNT(*) as count FROM businesses GROUP BY attribute
UNION ALL
SELECT 'tasks' as table_name, attribute, COUNT(*) as count FROM tasks GROUP BY attribute
UNION ALL
SELECT 'executors' as table_name, attribute, COUNT(*) as count FROM executors GROUP BY attribute
ORDER BY table_name, attribute;