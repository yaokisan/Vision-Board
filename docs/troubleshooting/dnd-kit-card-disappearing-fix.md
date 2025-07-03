# @dnd-kit カード一瞬消失問題の解決方法

## 📋 問題の概要

### 症状
- ドラッグ&ドロップでカードを移動した際、ドラッグ終了の瞬間にカードが一瞬消える
- カードは最終的には正しい位置に表示されるが、視覚的な違和感がある
- 位置の永続化機能の有無に関わらず発生

### 発生環境
- **ライブラリ**: `@dnd-kit/core`
- **フレームワーク**: Next.js 14 + React
- **ブラウザ**: 全ブラウザで確認

## 🔍 原因の特定プロセス

### 1. 初期仮説（すべて不正解）
- ❌ CSS transform 形式の不整合 (`translate` vs `translate3d`)
- ❌ React 状態更新の順序問題
- ❌ CSS transition の副作用

### 2. 真の原因発見
**ブラウザ開発者ツール** での詳細調査により判明：

```html
<!-- ドラッグ終了時に一瞬だけ以下が適用される -->
<div style="opacity: 0; ...">
```

**根本原因**: `@dnd-kit` の内部仕様で、ドラッグ終了時に `opacity: 0` が一時的に適用される

## ✅ 解決方法

### 1. インラインスタイルで強制上書き

```tsx
// components/board/DraggableCard.tsx
const style: React.CSSProperties = {
  transform: finalTransform,
  transition: 'none',
  opacity: 1,                // @dnd-kit の opacity:0 を上書き
  visibility: 'visible',     // 追加の保険
}
```

### 2. CSS での全体的な対策

```css
/* app/globals.css */
/* @dnd-kit override - prevent elements from disappearing */
[role="button"][aria-roledescription="draggable"] {
  opacity: 1 !important;
  visibility: visible !important;
}
```

## 🛠 実装手順

### Step 1: DraggableCard コンポーネント修正

```tsx
const style: React.CSSProperties = {
  transform: finalTransform,
  transition: 'none',
  opacity: 1,
  visibility: 'visible',
}
```

### Step 2: グローバル CSS 追加

```css
[role="button"][aria-roledescription="draggable"] {
  opacity: 1 !important;
  visibility: visible !important;
}
```

### Step 3: 動作確認
- カードをドラッグして手を離す
- 一瞬も消えずにスムーズに移動することを確認

## 🔧 デバッグ方法

### 開発者ツールでの確認手順
1. ブラウザで F12 → Elements タブ
2. 要素選択ツールでドラッガブルカードを選択
3. Styles タブで `opacity` プロパティを監視
4. ドラッグ終了時の変化を観察

### 確認ポイント
- `opacity: 0` が一瞬適用されるか
- `visibility` の変化があるか
- その他の CSS プロパティの影響

## 📚 学んだ教訓

1. **ライブラリの内部仕様**: サードパーティライブラリは予期しない動作をすることがある
2. **ブラウザ開発者ツールの重要性**: CSS の動的変化は開発者ツールでしか確認できない
3. **多層防御**: インラインスタイル + CSS の両方で対策することで確実性が増す
4. **!important の適切な使用**: ライブラリの強制的な上書きには必要な場合がある

## 🚨 注意事項

- この修正は `@dnd-kit` の将来のバージョンで不要になる可能性がある
- 他のドラッグ&ドロップライブラリでも類似の問題が発生する可能性がある
- 必要に応じて定期的にライブラリのアップデートを確認する

## 📅 解決日時
- **発生日**: 2025-07-03
- **解決日**: 2025-07-03
- **調査時間**: 約2時間
- **主要決め手**: ブラウザ開発者ツールでの `opacity: 0` 発見

---

*このドキュメントは同様の問題に遭遇した際の迅速な解決のために作成されました。*