-- business_id統合時の影響分析
-- UI統合時の判断材料となるデータを提供

SELECT 'BUSINESS_ID INTEGRATION IMPACT ANALYSIS' as analysis_name;

-- 分析1: 現在のattribute使用パターン
SELECT 'Current attribute usage patterns:' as analysis_section;

-- 1.1 attribute値の種類とその意味
WITH attribute_analysis AS (
  SELECT 
    attribute,
    COUNT(*) as usage_count,
    CASE 
      WHEN attribute = 'company' THEN 'Company-level node'
      WHEN attribute IS NULL THEN 'Default (company)'
      WHEN EXISTS (SELECT 1 FROM businesses b WHERE b.id::text = attribute) THEN 'Valid business ID'
      ELSE 'Invalid/Unknown'
    END as attribute_type
  FROM (
    SELECT attribute FROM tasks WHERE attribute IS NOT NULL
    UNION ALL
    SELECT attribute FROM executors WHERE attribute IS NOT NULL
    UNION ALL  
    SELECT attribute FROM positions WHERE attribute IS NOT NULL
    UNION ALL
    SELECT attribute FROM businesses WHERE attribute IS NOT NULL
    UNION ALL
    SELECT attribute FROM layers WHERE attribute IS NOT NULL
  ) all_attributes
  GROUP BY attribute
)
SELECT * FROM attribute_analysis ORDER BY usage_count DESC;

-- 分析2: "company"属性業務の詳細分析
SELECT 'Company-level tasks analysis:' as analysis_section;

SELECT 
  t.id,
  t.name as task_name,
  t.attribute,
  t.business_id,
  b.name as business_name,
  COUNT(e.id) as executor_count,
  CASE 
    WHEN t.business_id IS NULL THEN 'Truly company-level (no business)'
    WHEN t.business_id IS NOT NULL THEN 'Assigned to business but marked as company'
  END as company_task_type
FROM tasks t
LEFT JOIN businesses b ON t.business_id = b.id
LEFT JOIN executors e ON e.task_id = t.id
WHERE t.attribute = 'company' OR t.attribute IS NULL
GROUP BY t.id, t.name, t.attribute, t.business_id, b.name
ORDER BY company_task_type, executor_count DESC;

-- 分析3: 事業別の業務分布
SELECT 'Business-wise task distribution:' as analysis_section;

SELECT 
  COALESCE(b.name, 'No Business (Company-level)') as business_name,
  COUNT(t.id) as task_count,
  COUNT(e.id) as total_executors,
  string_agg(DISTINCT t.attribute, ', ') as attribute_values,
  CASE 
    WHEN b.id IS NULL THEN 'company'
    ELSE b.id::text
  END as future_display_tab
FROM tasks t
LEFT JOIN businesses b ON t.business_id = b.id
LEFT JOIN executors e ON e.task_id = t.id
GROUP BY b.id, b.name
ORDER BY task_count DESC;

-- 分析4: 統合後のタブ表示シミュレーション
SELECT 'Post-integration tab display simulation:' as analysis_section;

WITH tab_simulation AS (
  SELECT 
    CASE 
      WHEN t.business_id IS NULL THEN 'company'
      ELSE b.name
    END as display_tab,
    t.name as task_name,
    COUNT(e.id) as executor_count,
    t.attribute as current_attribute,
    CASE 
      WHEN t.business_id IS NULL AND t.attribute != 'company' THEN 'CHANGE_TO_COMPANY'
      WHEN t.business_id IS NOT NULL AND t.attribute = 'company' THEN 'CHANGE_TO_BUSINESS'
      WHEN t.business_id IS NOT NULL AND t.attribute != t.business_id::text THEN 'SYNC_NEEDED'
      ELSE 'NO_CHANGE'
    END as change_impact
  FROM tasks t
  LEFT JOIN businesses b ON t.business_id = b.id
  LEFT JOIN executors e ON e.task_id = t.id
  GROUP BY t.id, t.name, t.business_id, b.name, t.attribute
)
SELECT 
  display_tab,
  COUNT(*) as task_count,
  SUM(executor_count) as total_executors,
  COUNT(CASE WHEN change_impact != 'NO_CHANGE' THEN 1 END) as tasks_requiring_change
FROM tab_simulation
GROUP BY display_tab
ORDER BY task_count DESC;

-- 分析5: UI変更の影響範囲
SELECT 'UI change impact scope:' as analysis_section;

-- 5.1 EditModal影響分析
SELECT 
  'EditModal impact' as component,
  COUNT(CASE WHEN node_type = 'task' THEN 1 END) as tasks_affected,
  COUNT(CASE WHEN node_type = 'executor' THEN 1 END) as executors_affected,
  COUNT(CASE WHEN node_type = 'position' THEN 1 END) as positions_affected
FROM (
  SELECT 'task' as node_type, attribute FROM tasks
  UNION ALL
  SELECT 'executor' as node_type, attribute FROM executors
  UNION ALL
  SELECT 'position' as node_type, attribute FROM positions
) modal_data
WHERE attribute IS NOT NULL;

-- 5.2 自動設定ロジック影響
SELECT 
  'Auto-assignment logic impact' as impact_area,
  COUNT(*) as affected_records,
  string_agg(DISTINCT attribute, ', ') as attribute_values
FROM tasks 
WHERE attribute != business_id::text OR attribute IS NULL;

-- 分析6: 推奨される統合アプローチ
SELECT 'Recommended integration approach:' as analysis_section;

WITH integration_complexity AS (
  SELECT 
    'Low complexity' as approach,
    'Direct attribute->business_id mapping' as method,
    COUNT(CASE WHEN t.attribute = t.business_id::text THEN 1 END) as applicable_tasks
  FROM tasks t
  
  UNION ALL
  
  SELECT 
    'Medium complexity' as approach,
    'Company tasks (business_id=null)' as method,
    COUNT(CASE WHEN t.attribute = 'company' OR t.attribute IS NULL THEN 1 END) as applicable_tasks
  FROM tasks t
  
  UNION ALL
  
  SELECT 
    'High complexity' as approach,
    'Mismatched attribute/business_id' as method,
    COUNT(CASE WHEN t.attribute != 'company' AND t.attribute != t.business_id::text THEN 1 END) as applicable_tasks
  FROM tasks t
)
SELECT * FROM integration_complexity ORDER BY applicable_tasks DESC;

-- 分析7: データ品質チェック
SELECT 'Data quality assessment:' as analysis_section;

SELECT 
  'Data Quality Issues' as category,
  'Orphaned executors' as issue_type,
  COUNT(*) as count
FROM executors e
LEFT JOIN tasks t ON e.task_id = t.id
WHERE t.id IS NULL

UNION ALL

SELECT 
  'Data Quality Issues' as category,
  'Tasks with invalid business_id' as issue_type,
  COUNT(*) as count
FROM tasks t
LEFT JOIN businesses b ON t.business_id = b.id
WHERE t.business_id IS NOT NULL AND b.id IS NULL

UNION ALL

SELECT 
  'Data Quality Issues' as category,
  'Attribute-business_id mismatches' as issue_type,
  COUNT(*) as count
FROM tasks t
WHERE t.attribute IS NOT NULL 
  AND t.attribute != 'company'
  AND t.attribute != t.business_id::text;