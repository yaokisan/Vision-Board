-- 安全な位置情報カラム追加（既存チェック付き）

-- 1. 現在のテーブル構造を確認
SELECT 
    table_name,
    column_name,
    data_type 
FROM information_schema.columns 
WHERE table_name IN ('companies', 'positions') 
AND column_name LIKE 'position_%'
ORDER BY table_name, column_name;

-- 2. companiesテーブルに位置情報を追加（存在しない場合のみ）
DO $$ 
BEGIN
    -- companiesテーブルのposition_xをチェック
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'companies' 
        AND column_name = 'position_x'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE companies ADD COLUMN position_x NUMERIC DEFAULT 0;
        RAISE NOTICE 'Added position_x to companies table';
    ELSE
        RAISE NOTICE 'position_x already exists in companies table';
    END IF;
    
    -- companiesテーブルのposition_yをチェック
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'companies' 
        AND column_name = 'position_y'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE companies ADD COLUMN position_y NUMERIC DEFAULT 0;
        RAISE NOTICE 'Added position_y to companies table';
    ELSE
        RAISE NOTICE 'position_y already exists in companies table';
    END IF;
END $$;

-- 3. 最終確認
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name IN ('companies', 'positions') 
AND column_name LIKE 'position_%'
ORDER BY table_name, column_name;