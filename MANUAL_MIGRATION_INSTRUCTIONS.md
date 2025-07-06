# データベースマイグレーション手順

## Supabase管理画面での手動実行

以下のSQLを順番にSupabase管理画面のSQL Editorで実行してください：

### 1. auth_user_idカラムの追加（必須）

```sql
-- Add auth_user_id column to members table for Supabase Auth integration
ALTER TABLE members 
ADD COLUMN auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add index for performance
CREATE INDEX idx_members_auth_user_id ON members(auth_user_id);

-- Add comment for documentation
COMMENT ON COLUMN members.auth_user_id IS 'References the Supabase Auth user ID for this member';
```

### 2. Row Level Security (RLS) ポリシーの更新（必須）

```sql
-- Update RLS policies to use auth_user_id
DROP POLICY IF EXISTS "Users can view members in their company" ON members;
DROP POLICY IF EXISTS "Users can insert members in their company" ON members;
DROP POLICY IF EXISTS "Users can update members in their company" ON members;
DROP POLICY IF EXISTS "Users can delete members in their company" ON members;

-- Create new RLS policies using auth_user_id
CREATE POLICY "Users can view their own member record"
ON members FOR SELECT
USING (auth_user_id = auth.uid());

CREATE POLICY "Users can view members in their company"
ON members FOR SELECT
USING (
  company_id IN (
    SELECT company_id 
    FROM members 
    WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Admin users can insert members in their company"
ON members FOR INSERT
WITH CHECK (
  company_id IN (
    SELECT company_id 
    FROM members 
    WHERE auth_user_id = auth.uid() 
    AND permission = 'admin'
  )
);

CREATE POLICY "Admin users can update members in their company"
ON members FOR UPDATE
USING (
  company_id IN (
    SELECT company_id 
    FROM members 
    WHERE auth_user_id = auth.uid() 
    AND permission = 'admin'
  )
)
WITH CHECK (
  company_id IN (
    SELECT company_id 
    FROM members 
    WHERE auth_user_id = auth.uid() 
    AND permission = 'admin'
  )
);

CREATE POLICY "Admin users can delete members in their company"
ON members FOR DELETE
USING (
  company_id IN (
    SELECT company_id 
    FROM members 
    WHERE auth_user_id = auth.uid() 
    AND permission = 'admin'
  )
);

-- Ensure RLS is enabled
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
```

### 3. 新規ユーザー自動作成機能（推奨）

```sql
-- Function to create a member record when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  company_uuid UUID;
BEGIN
  -- Check if this is the first user (no existing members)
  IF NOT EXISTS (SELECT 1 FROM public.members LIMIT 1) THEN
    -- Create a new company for the first user
    INSERT INTO public.companies (name, created_at, updated_at)
    VALUES (
      COALESCE(NEW.raw_user_meta_data->>'company_name', 'My Company'),
      NOW(),
      NOW()
    )
    RETURNING id INTO company_uuid;
  ELSE
    -- For subsequent users, assign to the first company
    SELECT id INTO company_uuid FROM public.companies LIMIT 1;
  END IF;

  -- Create the member record
  INSERT INTO public.members (
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
  VALUES (
    gen_random_uuid(),
    company_uuid,
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    CASE 
      WHEN NOT EXISTS (SELECT 1 FROM public.members LIMIT 1) THEN 'admin'::text
      ELSE 'viewer'::text
    END,
    'core'::text,
    NOW(),
    NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.members TO anon, authenticated;
GRANT ALL ON public.companies TO anon, authenticated;
```

## 実行順序

1. まず「1. auth_user_idカラムの追加」を実行
2. 次に「2. Row Level Security (RLS) ポリシーの更新」を実行  
3. 最後に「3. 新規ユーザー自動作成機能」を実行

## 確認方法

実行後、以下で確認できます：

```sql
-- テーブル構造確認
\d members

-- RLSポリシー確認
SELECT * FROM pg_policies WHERE tablename = 'members';

-- 関数確認
SELECT proname FROM pg_proc WHERE proname = 'handle_new_user';
```