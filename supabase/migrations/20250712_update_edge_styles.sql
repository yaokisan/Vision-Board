-- Update edge styles to new dash pattern
-- Date: 2025-07-12
-- Description: Update strokeDasharray from '2,4' to '6,12' for better visibility

BEGIN;

-- Update default style for edges table
ALTER TABLE edges 
ALTER COLUMN style SET DEFAULT '{"stroke": "#4c6ef5", "strokeWidth": 2, "strokeDasharray": "6,12"}';

-- Update existing edges with old dash pattern
UPDATE edges 
SET style = jsonb_set(
    COALESCE(style, '{}'::jsonb),
    '{strokeDasharray}',
    '"6,12"',
    true
)
WHERE style->>'strokeDasharray' = '2,4';

-- Ensure stroke color is set for edges without it
UPDATE edges 
SET style = jsonb_set(
    COALESCE(style, '{}'::jsonb),
    '{stroke}',
    '"#4c6ef5"',
    true
)
WHERE style->>'stroke' IS NULL;

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Edge styles updated successfully';
    RAISE NOTICE 'All edges now use dash pattern 6,12 with blue color';
END $$;

COMMIT;