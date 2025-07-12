-- Update edge dash spacing to be tighter
-- Date: 2025-07-12
-- Description: Reduce dash spacing from '6,12' to '6,6' for better visual density

BEGIN;

-- Update default style for edges table
ALTER TABLE edges 
ALTER COLUMN style SET DEFAULT '{"stroke": "#4c6ef5", "strokeWidth": 2, "strokeDasharray": "6,6"}';

-- Update existing edges with current dash pattern
UPDATE edges 
SET style = jsonb_set(
    COALESCE(style, '{}'::jsonb),
    '{strokeDasharray}',
    '"6,6"',
    true
)
WHERE style->>'strokeDasharray' = '6,12';

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Edge dash spacing updated successfully';
    RAISE NOTICE 'Changed from 6,12 to 6,6 for tighter spacing';
END $$;

COMMIT;