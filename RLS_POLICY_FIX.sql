-- RLSポリシーの無限再帰を修正

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can view their own member record" ON members;
DROP POLICY IF EXISTS "Users can view members in their company" ON members;
DROP POLICY IF EXISTS "Admin users can insert members in their company" ON members;
DROP POLICY IF EXISTS "Admin users can update members in their company" ON members;
DROP POLICY IF EXISTS "Admin users can delete members in their company" ON members;

-- シンプルな新しいポリシーを作成
-- 1. 自分のレコードは閲覧可能
CREATE POLICY "Users can view their own member record"
ON members FOR SELECT
USING (auth_user_id = auth.uid());

-- 2. 自分と同じ会社のメンバーは閲覧可能（サブクエリを避ける）
CREATE POLICY "Users can view company members"
ON members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM members m2 
    WHERE m2.auth_user_id = auth.uid() 
    AND m2.company_id = members.company_id
  )
);

-- 3. admin権限ユーザーは同じ会社のメンバーを作成可能
CREATE POLICY "Admin users can insert members"
ON members FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM members m2 
    WHERE m2.auth_user_id = auth.uid() 
    AND m2.permission = 'admin' 
    AND m2.company_id = company_id
  )
);

-- 4. admin権限ユーザーは同じ会社のメンバーを更新可能
CREATE POLICY "Admin users can update members"
ON members FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM members m2 
    WHERE m2.auth_user_id = auth.uid() 
    AND m2.permission = 'admin' 
    AND m2.company_id = members.company_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM members m2 
    WHERE m2.auth_user_id = auth.uid() 
    AND m2.permission = 'admin' 
    AND m2.company_id = company_id
  )
);

-- 5. admin権限ユーザーは同じ会社のメンバーを削除可能
CREATE POLICY "Admin users can delete members"
ON members FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM members m2 
    WHERE m2.auth_user_id = auth.uid() 
    AND m2.permission = 'admin' 
    AND m2.company_id = members.company_id
  )
);

-- RLSが有効になっていることを確認
ALTER TABLE members ENABLE ROW LEVEL SECURITY;