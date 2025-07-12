-- ============================================
-- Executors テーブルにメンバー参照機能を追加
-- 実行者カードの人物選択を他のカードと統一するため
-- ============================================

-- executorsテーブルにmember_idカラムを追加
ALTER TABLE executors 
ADD COLUMN member_id UUID REFERENCES members(id) ON DELETE SET NULL;

-- 移行が必要なデータを識別するためのフラグを追加
ALTER TABLE executors 
ADD COLUMN needs_migration BOOLEAN DEFAULT FALSE;

-- インデックス作成（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_executors_member_id ON executors(member_id);
CREATE INDEX IF NOT EXISTS idx_executors_needs_migration ON executors(needs_migration);

-- コメント追加
COMMENT ON COLUMN executors.member_id IS 'メンバーテーブルへの参照（新形式）';
COMMENT ON COLUMN executors.needs_migration IS '手動での再選択が必要なレガシーデータフラグ';

-- 既存のnameフィールドにコメント更新
COMMENT ON COLUMN executors.name IS '実行者名（表示用キャッシュ、後方互換性のため残存）';