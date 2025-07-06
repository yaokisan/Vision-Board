-- 会社テーブルのみに位置情報カラムを追加
-- positionsテーブルには既にposition_x, position_yが存在

-- companiesテーブルに位置情報を追加（存在しない場合のみ）
DO $$ 
BEGIN
    -- position_xカラムが存在しない場合のみ追加
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'companies' AND column_name = 'position_x'
    ) THEN
        ALTER TABLE companies ADD COLUMN position_x NUMERIC DEFAULT 0;
    END IF;
    
    -- position_yカラムが存在しない場合のみ追加
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'companies' AND column_name = 'position_y'
    ) THEN
        ALTER TABLE companies ADD COLUMN position_y NUMERIC DEFAULT 0;
    END IF;
END $$;

-- インデックスを追加（存在しない場合のみ）
DO $$
BEGIN
    -- companiesテーブルのインデックス
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'companies' AND indexname = 'idx_companies_position'
    ) THEN
        CREATE INDEX idx_companies_position ON companies(position_x, position_y);
    END IF;
    
    -- positionsテーブルのインデックス
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'positions' AND indexname = 'idx_positions_position'
    ) THEN
        CREATE INDEX idx_positions_position ON positions(position_x, position_y);
    END IF;
END $$;

-- コメントを追加
COMMENT ON COLUMN companies.position_x IS 'React Flow上でのX座標位置';
COMMENT ON COLUMN companies.position_y IS 'React Flow上でのY座標位置';