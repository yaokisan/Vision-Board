-- 実行者データの状況確認用SQL
-- Supabase SQLエディターで実行してください

-- 1. member_idがnullの実行者を確認
SELECT 
    e.id,
    e.name as executor_name,
    e.member_id,
    e.needs_migration,
    t.name as task_name,
    b.name as business_name
FROM executors e
LEFT JOIN tasks t ON t.id = e.task_id
LEFT JOIN businesses b ON b.id = t.business_id
WHERE e.member_id IS NULL
ORDER BY e.name;

-- 2. メンバーテーブルの名前一覧
SELECT 
    m.id,
    m.name as member_name,
    m.company_id,
    c.name as company_name
FROM members m
LEFT JOIN companies c ON c.id = m.company_id
ORDER BY m.name;

-- 3. 名前の類似性チェック（手動確認用）
SELECT 
    e.name as executor_name,
    m.name as member_name,
    CASE 
        WHEN TRIM(LOWER(e.name)) = TRIM(LOWER(m.name)) THEN '完全一致'
        WHEN e.name ILIKE '%' || m.name || '%' THEN '部分一致'
        WHEN m.name ILIKE '%' || e.name || '%' THEN '逆部分一致'
        ELSE '不一致'
    END as match_type
FROM executors e
CROSS JOIN members m
WHERE e.member_id IS NULL
AND (
    TRIM(LOWER(e.name)) = TRIM(LOWER(m.name))
    OR e.name ILIKE '%' || m.name || '%'
    OR m.name ILIKE '%' || e.name || '%'
)
ORDER BY e.name, match_type;