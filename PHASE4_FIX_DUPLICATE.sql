-- Phase 4 修正版: 重複した「テスト２ Company」を削除して正しく分離

-- 1. 現在の状況を確認
SELECT 
  c.id,
  c.name as company_name,
  c.created_at
FROM companies c
WHERE c.name LIKE '%テスト２%'
ORDER BY c.created_at;

-- 2. 重複した「テスト２ Company」を削除（最新のもの以外）
DELETE FROM companies 
WHERE name = 'テスト２ Company' 
AND id NOT IN (
  SELECT id FROM (
    SELECT id 
    FROM companies 
    WHERE name = 'テスト２ Company' 
    ORDER BY created_at DESC 
    LIMIT 1
  ) as latest
);

-- 3. 「テスト２」メンバーを正しい会社に移動し、admin権限に変更
UPDATE members 
SET 
  company_id = (
    SELECT id 
    FROM companies 
    WHERE name = 'テスト２ Company' 
    LIMIT 1
  ),
  permission = 'admin',
  updated_at = NOW()
WHERE name = 'テスト２';

-- 4. 分離後の状況を確認
SELECT 
  m.name as member_name,
  m.email,
  c.name as company_name,
  m.permission,
  m.company_id
FROM members m 
JOIN companies c ON m.company_id = c.id 
ORDER BY c.name, m.created_at;

-- 5. 各会社のメンバー数を確認
SELECT 
  c.name as company_name,
  COUNT(m.id) as member_count
FROM companies c
LEFT JOIN members m ON c.id = m.company_id
GROUP BY c.id, c.name
ORDER BY c.name;