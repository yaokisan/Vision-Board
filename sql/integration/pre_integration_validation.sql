-- business_id統合前の包括的なデータ検証テスト
-- attribute -> business_id統合の準備として現在のデータ状態を確認

SELECT 'BUSINESS_ID INTEGRATION PRE-VALIDATION' as test_name;

-- テスト1: attribute値の分布確認
SELECT 'Attribute value distribution:' as test_section;

-- 1.1 Tasks テーブルのattribute分布
SELECT 
  'tasks.attribute distribution' as check_item,
  attribute,
  COUNT(*) as count,
  business_id,
  CASE 
    WHEN attribute = 'company' AND business_id IS NOT NULL THEN 'MISMATCH_COMPANY'
    WHEN attribute != 'company' AND attribute != business_id::text THEN 'MISMATCH_BUSINESS'
    WHEN attribute IS NULL AND business_id IS NOT NULL THEN 'NULL_ATTRIBUTE'
    WHEN attribute = business_id::text THEN 'MATCH'
    WHEN attribute = 'company' AND business_id IS NULL THEN 'COMPANY_MATCH'
    ELSE 'OTHER'
  END as alignment_status
FROM tasks 
GROUP BY attribute, business_id
ORDER BY alignment_status, count DESC;

-- 1.2 Executors テーブルのattribute分布
SELECT 
  'executors.attribute distribution' as check_item,
  attribute,
  COUNT(*) as count
FROM executors 
GROUP BY attribute
ORDER BY count DESC;

-- 1.3 Positions テーブルのattribute分布  
SELECT 
  'positions.attribute distribution' as check_item,
  attribute,
  COUNT(*) as count
FROM positions 
GROUP BY attribute
ORDER BY count DESC;

-- テスト2: attribute-business_id整合性チェック
SELECT 'Attribute-business_id consistency:' as test_section;

-- 2.1 Tasksのattribute値が有効な事業IDかチェック
SELECT 
  'tasks with invalid business attribute' as check_item,
  COUNT(*) as invalid_count,
  string_agg(t.name || ' (attr:' || t.attribute || ')', ', ') as invalid_tasks
FROM tasks t
LEFT JOIN businesses b ON t.attribute = b.id::text
WHERE t.attribute IS NOT NULL 
  AND t.attribute != 'company' 
  AND b.id IS NULL;

-- 2.2 business_idが存在しない事業を指しているタスク
SELECT 
  'tasks with non-existent business_id' as check_item,
  COUNT(*) as invalid_count,
  string_agg(t.name || ' (bid:' || t.business_id || ')', ', ') as invalid_tasks
FROM tasks t
LEFT JOIN businesses b ON t.business_id = b.id
WHERE t.business_id IS NOT NULL 
  AND b.id IS NULL;

-- テスト3: 孤立ノードの確認
SELECT 'Orphaned nodes check:' as test_section;

-- 3.1 business_idがnullで、attributeも'company'でないタスク
SELECT 
  'orphaned tasks' as check_item,
  COUNT(*) as count,
  string_agg(name, ', ') as task_names
FROM tasks 
WHERE business_id IS NULL 
  AND (attribute IS NULL OR attribute != 'company');

-- 3.2 task_idが無効なExecutors
SELECT 
  'executors with invalid task_id' as check_item,
  COUNT(*) as count,
  string_agg(e.name, ', ') as executor_names
FROM executors e
LEFT JOIN tasks t ON e.task_id = t.id
WHERE t.id IS NULL;

-- テスト4: 階層関係の整合性
SELECT 'Hierarchy consistency:' as test_section;

-- 4.1 Executor-Task-Business の階層チェック
SELECT 
  e.name as executor_name,
  t.name as task_name,
  t.business_id as task_business_id,
  b.name as business_name,
  e.attribute as executor_attribute,
  t.attribute as task_attribute,
  CASE 
    WHEN e.attribute = t.attribute THEN 'MATCH'
    WHEN e.attribute IS NULL AND t.attribute = 'company' THEN 'COMPANY_MATCH'
    WHEN e.attribute != t.attribute THEN 'MISMATCH'
    ELSE 'OTHER'
  END as attribute_alignment
FROM executors e
JOIN tasks t ON e.task_id = t.id
LEFT JOIN businesses b ON t.business_id = b.id
ORDER BY attribute_alignment, executor_name;

-- テスト5: 移行後の予想される状態
SELECT 'Post-integration preview:' as test_section;

-- 5.1 統合後のTask表示制御シミュレーション
SELECT 
  t.name as task_name,
  t.attribute as current_attribute,
  t.business_id as current_business_id,
  CASE 
    WHEN t.business_id IS NULL THEN 'company'
    ELSE t.business_id::text
  END as future_display_tab,
  b.name as business_name
FROM tasks t
LEFT JOIN businesses b ON t.business_id = b.id
ORDER BY future_display_tab, task_name;

-- テスト6: 統合時の変更が必要なレコード数
SELECT 'Integration change summary:' as test_section;

SELECT 
  'tasks requiring attribute->business_id sync' as change_type,
  COUNT(*) as record_count
FROM tasks 
WHERE (attribute = 'company' AND business_id IS NOT NULL)
   OR (attribute != 'company' AND attribute != business_id::text)
   OR (attribute IS NULL AND business_id IS NOT NULL)

UNION ALL

SELECT 
  'executors requiring attribute update' as change_type,
  COUNT(*) as record_count
FROM executors e
JOIN tasks t ON e.task_id = t.id
WHERE e.attribute != t.attribute
   OR (e.attribute IS NULL AND t.attribute != 'company')

UNION ALL

SELECT 
  'positions requiring attribute cleanup' as change_type,
  COUNT(*) as record_count
FROM positions 
WHERE attribute IS NOT NULL AND attribute != 'company';