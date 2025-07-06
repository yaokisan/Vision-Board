-- レイヤーテーブルに位置情報カラムを追加

-- layersテーブルに位置情報を追加
ALTER TABLE layers 
ADD COLUMN position_x NUMERIC DEFAULT 0,
ADD COLUMN position_y NUMERIC DEFAULT 0,
ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();

-- インデックスを追加（検索性能向上）
CREATE INDEX idx_layers_position ON layers(position_x, position_y);

-- コメント追加
COMMENT ON COLUMN layers.position_x IS 'React Flow上でのX座標位置';
COMMENT ON COLUMN layers.position_y IS 'React Flow上でのY座標位置';
COMMENT ON COLUMN layers.updated_at IS 'レコード更新日時';

-- 既存レイヤーにデフォルト位置を設定（レイヤータイプ別に配置）
UPDATE layers 
SET 
  position_x = CASE 
    WHEN type = 'business' THEN 100 + (ROW_NUMBER() OVER (PARTITION BY type ORDER BY created_at) - 1) * 600
    WHEN type = 'management' THEN 100 + (ROW_NUMBER() OVER (PARTITION BY type ORDER BY created_at) - 1) * 600
    ELSE 100
  END,
  position_y = CASE 
    WHEN type = 'business' THEN 500
    WHEN type = 'management' THEN 800
    ELSE 500
  END,
  updated_at = NOW();