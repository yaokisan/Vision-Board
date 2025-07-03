# 接続線座標計算問題の修正記録

## 📋 問題の概要

### 発生した問題
1. **接続線が全く繋がらない**: カード間を正しく接続できない
2. **ズーム・パンで線がずれる**: キャンバス変形に追従しない  
3. **CXOカードのドラッグ問題**: ドラッグ後に元の位置に戻る不安定な挙動

## 🔍 問題分析プロセス

### 1. 初期状態の把握
- 接続線は表示されているが、完全に間違った位置
- ズームイン/アウトで線の位置が変化
- カードドラッグ時の線の追従が不安定

### 2. CXOカード問題の特定と修正
**問題**: `handleDragEnd`でドロップゾーン制約により、CXOカードの位置更新が阻害

**修正内容**:
```typescript
// カードの種類を判定
const cardType = active.data.current?.type

// CXOカードや会社カードは常に位置を更新
if (cardType === 'company' || cardType === 'position') {
  // 位置を保存
}
// レイヤー内のカードはドロップゾーン内でのみ位置を更新
else if (over && (over.id === 'business-layer-drop' || over.id === 'management-layer-drop')) {
  // 位置を保存  
}
```

**結果**: ✅ CXOカードの安定したドラッグ&ドロップが実現

### 3. 接続線座標計算の修正試行

#### 修正試行1: キャンバス変形の考慮
```typescript
// キャンバスの変形情報を取得
const matrix = new DOMMatrix(transform)
zoom = matrix.a  // scale値
panX = matrix.e  // translateX値  
panY = matrix.f  // translateY値

// 変形を考慮した座標計算
const startX = (startRect.left + startRect.width / 2 - canvasRect.left - panX) / zoom
```

**問題**: 座標計算が複雑すぎて正確性に欠ける

#### 修正試行2: 接続点の調整
- `startRect.bottom` → `startRect.top + startRect.height / 2` (中心点)
- `endRect.top` → `endRect.top + endRect.height / 2` (中心点)

**問題**: 依然として正しい接続ができない

#### 修正試行3: シンプルな相対座標計算
```typescript
// SVGコンテナを基準とした相対座標
const startX = startRect.left + startRect.width / 2 - svgRect.left
const startY = startRect.top + startRect.height / 2 - svgRect.top
```

**現状**: まだ解決に至っていない

## 🔧 デバッグ情報の活用

### 実装したログ出力
```typescript
console.log(`Connection: ${startElementId} -> ${endElementId}`)
console.log('Start element rect:', startRect)
console.log('End element rect:', endRect) 
console.log('Calculated coordinates:', { startX, startY, endX, endY })
console.log('Generated path:', path)
```

### 判明した事実
- 要素は正しく見つかっている
- ビューポート座標は取得できている
- SVGパス生成も実行されている
- **座標変換の計算ロジックに根本的な問題がある**

## 🚨 未解決の問題

### 主要課題
1. **座標系の不整合**: SVG座標系とDOM座標系の変換が不正確
2. **キャンバス変形の扱い**: ズーム・パン変形を正しく考慮できていない
3. **コンテナ内要素**: ResizableContainer内の要素座標計算が特に困難

### 次のアプローチ候補
1. **SVG配置の見直し**: 固定配置ではなく、キャンバス内配置への変更
2. **座標計算の単純化**: より直接的な座標取得方法の検討
3. **ライブラリの活用**: 接続線専用ライブラリの導入検討

## 📅 作業履歴

- **2025-07-03**: CXOカード問題修正完了
- **2025-07-03**: 接続線座標計算の複数回修正試行
- **2025-07-03**: デバッグログ実装、問題分析継続中

---

*この問題は継続調査中です。根本的な座標変換ロジックの再設計が必要と思われます。*