# Vision Board - 組織図管理アプリ

## プロジェクト概要

Empire Art社向けの動的組織図管理アプリケーション。事業内容や組織構成の頻繁な変更に対応し、全員が現在の状態を一目で把握できるビジュアルボード。

## 技術スタック

- **フロントエンド**: Next.js 14 (App Router)
- **スタイリング**: Tailwind CSS
- **データベース**: Supabase
- **認証**: Supabase Auth
- **ドラッグ&ドロップ**: @dnd-kit/core
- **ホスティング**: Vercel
- **デプロイ**: GitHub連携自動デプロイ

## プロジェクト構成

```
vision-board/
├── app/
│   ├── (auth)/              # 認証関連ページ
│   ├── dashboard/           # メインダッシュボード
│   ├── globals.css          # グローバルスタイル
│   └── layout.tsx
├── components/
│   ├── cards/               # カードコンポーネント
│   │   ├── CompanyCard.tsx
│   │   ├── PositionCard.tsx
│   │   ├── LayerCard.tsx
│   │   ├── BusinessCard.tsx
│   │   ├── TaskCard.tsx
│   │   └── ExecutorCard.tsx
│   ├── ui/                  # UI基本コンポーネント
│   └── board/               # ボード関連コンポーネント
├── lib/
│   ├── supabase/            # Supabase設定
│   └── utils/               # ユーティリティ関数
├── types/
│   └── index.ts             # TypeScript型定義
└── public/
```

## データベース設計 (Supabase)

### テーブル構成

#### companies (会社)
- id: UUID (Primary Key)
- name: TEXT
- created_at: TIMESTAMP
- updated_at: TIMESTAMP

#### positions (役職)
- id: UUID (Primary Key)
- company_id: UUID (FK)
- name: TEXT (CEO, COO)
- person_name: TEXT
- created_at: TIMESTAMP
- updated_at: TIMESTAMP

#### layers (レイヤー)
- id: UUID (Primary Key)
- company_id: UUID (FK)
- name: TEXT (事業, 経営)
- type: TEXT (business, management)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP

#### businesses (事業)
- id: UUID (Primary Key)
- layer_id: UUID (FK)
- name: TEXT
- goal: TEXT
- responsible_person: TEXT
- category: TEXT (任意のグルーピング)
- position_x: NUMERIC
- position_y: NUMERIC
- created_at: TIMESTAMP
- updated_at: TIMESTAMP

#### tasks (業務)
- id: UUID (Primary Key)
- business_id: UUID (FK)
- layer_id: UUID (FK)
- name: TEXT
- goal: TEXT
- responsible_person: TEXT
- group_name: TEXT (任意のグルーピング)
- position_x: NUMERIC
- position_y: NUMERIC
- created_at: TIMESTAMP
- updated_at: TIMESTAMP

#### executors (実行者)
- id: UUID (Primary Key)
- task_id: UUID (FK)
- name: TEXT
- role: TEXT
- position_x: NUMERIC
- position_y: NUMERIC
- created_at: TIMESTAMP
- updated_at: TIMESTAMP

## カードタイプと色設計

### カードタイプ
- 🏢 **会社カード**: 組織名
- 👤 **役職カード**: CEO/COO
- 📋 **レイヤーカード**: 事業/経営の大分類
- 🚀 **事業カード**: 事業名、目標、責任者
- 💼 **業務カード**: 業務名、目標、責任者
- ⚡ **実行者カード**: 実行者名、役割

### 色設計
- **事業責任者**: 金色系 (bg-yellow-400)
- **業務責任者**: オレンジ系 (bg-orange-400)
- **実行者**: 青系 (bg-blue-400)
- **事業関連**: 緑系統 (bg-green-100)
- **経営関連**: 青緑系統 (bg-teal-100)

## 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# 型チェック
npm run type-check

# リント
npm run lint

# 本番サーバー起動
npm run start
```

## 環境変数

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 主要機能

1. **ドラッグ&ドロップ**: カードの位置変更による組織構造の変更
2. **リアルタイム更新**: Supabaseリアルタイム機能
3. **柔軟なグルーピング**: 事業カテゴリー、業務グループの管理
4. **視覚的デザイン**: アイコン、色分け、滑らかなアニメーション
5. **レスポンシブデザイン**: デスクトップ・タブレット対応

## デプロイ

1. GitHubリポジトリにプッシュ
2. Vercelに自動デプロイ
3. 環境変数設定
4. Supabaseデータベース接続

## 注意事項

- 既存の優れたデザイン要素を保持
- 白背景の角丸カード、適度な影
- ホバー時の青いボーダー
- ドラッグ時のスムーズな動き
- SVGアニメーションによる接続線

## 開発順序

1. Next.js プロジェクトセットアップ
2. Supabase設定・データベース構築
3. 基本カードコンポーネント作成
4. ドラッグ&ドロップ機能実装
5. レイアウト・スタイリング
6. データ永続化機能
7. 認証機能（必要に応じて）
8. デプロイ設定