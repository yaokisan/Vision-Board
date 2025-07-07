# Vision Board - 現在のデータベーススキーマ状態

最終更新: 2025-07-07

## 概要

Vision Boardアプリケーションのデータベース構造と、属性システムの現在の状態を完全に記録したドキュメント。

## テーブル構造

### 1. companies (会社)
```sql
- id: UUID (Primary Key)
- name: TEXT
- attribute: VARCHAR (NULL許可) -- 'company'属性はNULLで表現
- position_x: NUMERIC
- position_y: NUMERIC
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### 2. positions (役職・CXO)
```sql
- id: UUID (Primary Key)
- company_id: UUID (FK → companies.id)
- name: TEXT (CEO, CTO, CFO等)
- person_name: TEXT
- member_id: UUID (FK → members.id)
- attribute: VARCHAR (NULL許可) -- 'company'属性はNULLで表現
- position_x: NUMERIC
- position_y: NUMERIC
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### 3. layers (レイヤー・コンテナ)
```sql
- id: UUID (Primary Key)
- company_id: UUID (FK → companies.id)
- name: TEXT
- type: TEXT (business, management)
- attribute: TEXT (NULL許可) -- 'company'属性はNULLで表現
- color: VARCHAR
- description: TEXT
- width: NUMERIC
- height: NUMERIC
- position_x: NUMERIC
- position_y: NUMERIC
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### 4. businesses (事業)
```sql
- id: UUID (Primary Key)
- layer_id: UUID (FK → layers.id)
- name: TEXT
- goal: TEXT
- responsible_person: TEXT
- responsible_person_id: UUID (FK → members.id)
- category: TEXT
- attribute: VARCHAR -- 自分自身のIDを設定（事業属性を作成）
- position_x: NUMERIC
- position_y: NUMERIC
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### 5. tasks (業務)
```sql
- id: UUID (Primary Key)
- business_id: UUID (FK → businesses.id, NULL許可)
- layer_id: UUID (FK → layers.id)
- name: TEXT
- goal: TEXT
- responsible_person: TEXT
- responsible_person_id: UUID (FK → members.id)
- group_name: TEXT
- attribute: VARCHAR -- 親事業のIDまたはNULL(company)
- position_x: NUMERIC
- position_y: NUMERIC
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### 6. executors (実行者)
```sql
- id: UUID (Primary Key)
- task_id: UUID (FK → tasks.id)
- name: TEXT
- role: TEXT
- attribute: VARCHAR -- 親業務の属性と同じであるべき
- position_x: NUMERIC
- position_y: NUMERIC
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### 7. edges (エッジ・接続線)
```sql
- id: UUID (Primary Key)
- company_id: UUID (FK → companies.id)
- source_node_id: TEXT -- 'business-{uuid}', 'task-{uuid}' 等の形式
- target_node_id: TEXT -- 'task-{uuid}', 'executor-{uuid}' 等の形式
- edge_type: TEXT
- style: JSONB
- animated: BOOLEAN
- deletable: BOOLEAN
- reconnectable: BOOLEAN
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

## 属性システムの設計

### 属性値の意味
- **NULL**: 'company'属性（会社タブで表示）
- **UUID文字列**: 特定の事業ID（その事業タブで表示）

### ノードタイプ別の属性ルール

#### A. 自律的な属性を持つノード
- **companies**: 常にNULL（会社属性）
- **positions**: 常にNULL（会社属性）
- **businesses**: 自分自身のID（独自の事業属性を作成）

#### B. 親ノードの属性を継承すべきノード
- **tasks**: 
  - エッジで事業に接続 → その事業のID
  - エッジで接続されていない → NULL（会社属性）
- **executors**: 親となる業務ノードの属性と同じ
- **layers**: 関連する事業の属性または NULL

## 現在の問題と修正が必要な箇所

### 1. 属性の不整合
```
BEAUTY ROAD (c6ebb6b3-1185-48ca-b64c-80e116734d1e):
- 事業: c6ebb6b3-... ✅ 正しい
- BR研修: c6ebb6b3-... ✅ 正しい  
- BRメディア: 54eea9e4-... ❌ 間違い (AGAのID)
- BR SaaS: c4d5638c-... ❌ 間違い (新しい事業のID)
- BRメディア実行者: 54eea9e4-... ❌ 間違い
- BR研修実行者×2: c6ebb6b3-... ⚠️ 偶然一致（自動連動なし）
```

### 2. 自動連動システムの未実装
- エッジ作成時の属性自動継承
- エッジ削除時の属性リセット
- 親ノード属性変更時の子ノード連動
- エッジ接続中の属性変更禁止

## エッジ関係の現状

### Business → Task エッジ
```
BEAUTY ROAD → BR研修, BRメディア, BR SaaS
D2C → 新しい業務×2
AGA → 新しい業務×1
AIM → 新しい業務×1
```

### Task → Executor 関係（task_idベース）
```
BRメディア → 実行者「あ」×1
BR研修 → 実行者「あ」「ええ」×2
```

### 孤立ノード
```
業務: 新しい業務×1 (エッジなし)
実行者: なし（全て task_id で接続済み）
```

## タブ表示システム

### 会社タブ
- `attribute IS NULL` のノードを表示
- 全てのコンテナを表示

### 事業タブ（例：BEAUTY ROADタブ）
- `attribute = 'c6ebb6b3-1185-48ca-b64c-80e116734d1e'` のノードを表示
- 該当属性のコンテナのみ表示

## 次のステップ

1. **属性修正**: エッジ関係に基づいて正しい属性を設定
2. **自動連動システム実装**: 
   - エッジ作成/削除時の属性自動更新
   - 親子関係の属性継承
   - エッジ接続中の属性変更禁止
3. **業務ノードの独立属性システム**: 
   - 会社/CXOの子でも独立して事業属性を持つ機能

## 関連ファイル

- データベーススキーマ: `/sql/migrations/`
- 属性修正スクリプト: `/sql/fixes/`
- データ分析結果: `/docs/analysis/`