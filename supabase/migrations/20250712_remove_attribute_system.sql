-- Migration: Remove attribute system completely
-- Date: 2025-07-12
-- Description: Remove attribute columns from all tables as part of business_id migration

BEGIN;

-- Remove attribute column from companies table
ALTER TABLE companies DROP COLUMN IF EXISTS attribute;

-- Remove attribute column from positions table  
ALTER TABLE positions DROP COLUMN IF EXISTS attribute;

-- Remove attribute column from layers table
ALTER TABLE layers DROP COLUMN IF EXISTS attribute;

-- Remove attribute column from businesses table
ALTER TABLE businesses DROP COLUMN IF EXISTS attribute;

-- Remove attribute column from tasks table
ALTER TABLE tasks DROP COLUMN IF EXISTS attribute;

-- Remove attribute column from executors table
ALTER TABLE executors DROP COLUMN IF EXISTS attribute;

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Attribute system removal completed successfully';
    RAISE NOTICE 'All tables now use business_id for filtering';
END $$;

COMMIT;