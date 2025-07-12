-- Create notes table for memo functionality
-- This table stores memo content for the memo panel feature

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create notes table
CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(updated_at);

-- Add comment for documentation
COMMENT ON TABLE notes IS 'Stores memo content for the memo panel feature';
COMMENT ON COLUMN notes.content IS 'The memo content text';

-- Create trigger function for updating updated_at
CREATE OR REPLACE FUNCTION update_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating updated_at
CREATE TRIGGER trigger_update_notes_updated_at
    BEFORE UPDATE ON notes
    FOR EACH ROW
    EXECUTE FUNCTION update_notes_updated_at();

-- Enable Row Level Security
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Create RLS policy (allow all operations for now since it's a single shared memo)
CREATE POLICY "Allow all operations on notes" ON notes
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Insert initial empty note record
INSERT INTO notes (content) VALUES ('') ON CONFLICT DO NOTHING;