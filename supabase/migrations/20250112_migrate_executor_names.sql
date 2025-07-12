-- ============================================
-- Executors の既存name データを member_id に一括変換
-- 完全移行アプローチによるデータクリーンアップ
-- ============================================

-- ステップ1: 既存のnameをmember_idに変換（完全一致で検索）
UPDATE executors 
SET member_id = (
    SELECT m.id 
    FROM members m
    INNER JOIN tasks t ON t.id = executors.task_id
    INNER JOIN businesses b ON b.id = t.business_id
    WHERE TRIM(m.name) = TRIM(executors.name)
    AND m.company_id = b.company_id
    LIMIT 1
)
WHERE member_id IS NULL 
AND name IS NOT NULL 
AND TRIM(name) != '';

-- ステップ2: 変換できなかったデータにneeds_migrationフラグを設定
UPDATE executors 
SET needs_migration = TRUE 
WHERE member_id IS NULL 
AND name IS NOT NULL 
AND TRIM(name) != '';

-- ステップ3: 空のnameデータを cleanup
UPDATE executors 
SET name = '未設定',
    needs_migration = TRUE
WHERE (name IS NULL OR TRIM(name) = '')
AND member_id IS NULL;

-- ステップ4: 正常に変換されたデータのneeds_migrationフラグをfalseに設定
UPDATE executors 
SET needs_migration = FALSE 
WHERE member_id IS NOT NULL;

-- マイグレーション結果をログ出力用に一時的なコメント追加
-- （本番運用時はこのコメントを削除してください）
COMMENT ON TABLE executors IS '実行者テーブル - メンバー参照移行完了。needs_migration=trueのデータは手動選択が必要';

-- 統計情報表示（マイグレーション確認用）
-- 正常に変換されたレコード数
-- SELECT 'Successfully migrated' as status, COUNT(*) as count 
-- FROM executors WHERE member_id IS NOT NULL;

-- 手動移行が必要なレコード数  
-- SELECT 'Needs manual migration' as status, COUNT(*) as count 
-- FROM executors WHERE needs_migration = TRUE;