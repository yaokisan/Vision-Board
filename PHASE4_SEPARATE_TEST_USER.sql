-- Phase 4: 「テスト２」ユーザーを独自の会社に分離
-- 現在ダミーデータと同じ会社に混在している問題を解決

-- 1. 現在の状況を確認
SELECT 
  m.name as member_name,
  m.email,
  c.name as company_name,
  m.company_id
FROM members m 
JOIN companies c ON m.company_id = c.id 
ORDER BY m.created_at;

-- 2. 「テスト２」ユーザー専用の新しい会社を作成
INSERT INTO companies (id, name, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'テスト２ Company',
  NOW(),
  NOW()
);

-- 3. 作成した会社のIDを取得して「テスト２」メンバーを移動し、admin権限に変更
WITH new_company AS (
  SELECT id FROM companies WHERE name = 'テスト２ Company'
)
UPDATE members 
SET 
  company_id = (SELECT id FROM new_company),
  permission = 'admin',
  updated_at = NOW()
WHERE name = 'テスト２';

-- 4. 分離後の状況を確認
SELECT 
  m.name as member_name,
  m.email,
  c.name as company_name,
  m.company_id,
  c.id as company_id_full
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