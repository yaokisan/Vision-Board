-- Add auth_user_id column to members table for Supabase Auth integration
-- This allows linking members to authenticated users

-- Add the auth_user_id column
ALTER TABLE members 
ADD COLUMN auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add index for performance
CREATE INDEX idx_members_auth_user_id ON members(auth_user_id);

-- Add comment for documentation
COMMENT ON COLUMN members.auth_user_id IS 'References the Supabase Auth user ID for this member';

-- Update RLS (Row Level Security) policies to use auth_user_id
-- Drop existing policies if they exist
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