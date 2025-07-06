-- Function to create a member record when a user signs up
-- This automatically creates a member record in the members table
-- when a new user is created in auth.users

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
    -- For subsequent users, we'll need to assign them to an existing company
    -- This could be handled by an admin invitation system later
    -- For now, assign to the first company
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

-- Create trigger to automatically call the function on user creation
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.members TO anon, authenticated;
GRANT ALL ON public.companies TO anon, authenticated;