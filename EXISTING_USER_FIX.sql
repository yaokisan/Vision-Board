-- 既存ユーザーのためのmemberレコード作成
-- 既存のauth.usersテーブルのユーザーに対してmembersレコードを作成

-- 1. まず既存のauth.usersを確認
SELECT id, email, created_at, raw_user_meta_data FROM auth.users;

-- 2. companiesテーブルを確認（存在しない場合は作成）
SELECT * FROM companies;

-- 3. 会社が存在しない場合は作成
INSERT INTO companies (id, name, created_at, updated_at)
SELECT 
  gen_random_uuid(), 
  'My Company', 
  NOW(), 
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM companies);

-- 4. 既存ユーザーにmemberレコードを作成
-- （まだmembersテーブルにレコードがないauth.usersのユーザー向け）
INSERT INTO members (
  id,
  company_id,
  auth_user_id,
  name,
  email,
  permission,
  member_type,
  created_at,
  updated_at
)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM companies LIMIT 1), -- 最初の会社を選択
  u.id,
  COALESCE(u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)),
  u.email,
  CASE 
    WHEN NOT EXISTS (SELECT 1 FROM members LIMIT 1) THEN 'admin'::text
    ELSE 'viewer'::text
  END,
  'core'::text,
  NOW(),
  NOW()
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM members m WHERE m.auth_user_id = u.id
);

-- 5. 結果確認
SELECT 
  m.*,
  u.email as auth_email
FROM members m 
JOIN auth.users u ON m.auth_user_id = u.id;