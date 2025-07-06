#!/bin/bash

# Vision Board データベースマイグレーション適用スクリプト

set -e

echo "🚀 Vision Board データベースマイグレーション開始..."

# 環境変数チェック
if [ -z "$SUPABASE_DB_URL" ]; then
    echo "❌ エラー: SUPABASE_DB_URL 環境変数が設定されていません"
    echo "例: export SUPABASE_DB_URL='postgresql://postgres:[password]@[host]:5432/postgres'"
    exit 1
fi

# マイグレーションファイルの存在確認
MIGRATION_FILE="supabase/migrations/001_create_member_management_system.sql"
if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ エラー: マイグレーションファイルが見つかりません: $MIGRATION_FILE"
    exit 1
fi

echo "📂 マイグレーションファイル: $MIGRATION_FILE"
echo "🗄️  データベース接続先: $(echo $SUPABASE_DB_URL | sed 's/:[^@]*@/:***@/')"

# 確認メッセージ
read -p "このマイグレーションを実行しますか？ (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ マイグレーション中止"
    exit 1
fi

# マイグレーション実行
echo "⚡ マイグレーション実行中..."
psql "$SUPABASE_DB_URL" -f "$MIGRATION_FILE"

if [ $? -eq 0 ]; then
    echo "✅ マイグレーション完了!"
    echo "📊 作成されたテーブル:"
    echo "   - companies (会社)"
    echo "   - members (メンバー)"
    echo "   - member_businesses (メンバー⇄事業関係)"
    echo "   - member_roles (メンバー⇄役割関係)"
    echo "   - layers (レイヤー)"
    echo "   - businesses (事業)"
    echo "   - tasks (業務)"
    echo "   - positions (経営層)"
    echo "   - executors (実行者)"
    echo ""
    echo "📋 サンプルデータも挿入されました"
    echo "🎉 データベース準備完了!"
else
    echo "❌ マイグレーション失敗"
    exit 1
fi