-- 会社テーブルと役職テーブルに位置情報カラムを追加

-- companiesテーブルに位置情報を追加
ALTER TABLE companies 
ADD COLUMN position_x NUMERIC DEFAULT 0,
ADD COLUMN position_y NUMERIC DEFAULT 0;

-- positionsテーブルに位置情報を追加
ALTER TABLE positions 
ADD COLUMN position_x NUMERIC DEFAULT 0,
ADD COLUMN position_y NUMERIC DEFAULT 0;

-- インデックスを追加（検索性能向上）
CREATE INDEX idx_companies_position ON companies(position_x, position_y);
CREATE INDEX idx_positions_position ON positions(position_x, position_y);

-- 既存のレコードのコメント
COMMENT ON COLUMN companies.position_x IS 'React Flow上でのX座標位置';
COMMENT ON COLUMN companies.position_y IS 'React Flow上でのY座標位置';
COMMENT ON COLUMN positions.position_x IS 'React Flow上でのX座標位置';
COMMENT ON COLUMN positions.position_y IS 'React Flow上でのY座標位置';