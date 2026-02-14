This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## ArUco マーカーの仕様

本アプリは **12cm 立方体の5面**に貼った ArUco マーカーをカメラで検出し、カメラの姿勢を推定します。
以下の仕様に従ってマーカーを準備してください。

### 辞書

**DICT_4X4_50** (4x4 ビット、ID 0〜49)

### マーカーサイズ

- マーカー内側（黒枠を含む正方形）: **9cm x 9cm**
- 周囲の白マージン: 各辺 **1.5cm** 以上
- 印刷領域の合計: 約 **12cm x 12cm**（立方体の面に収まるサイズ）

### 立方体

- 辺の長さ: **12cm**
- 底面（下面）にはマーカーを貼らない（計5面に貼付）

### 各面に貼るマーカー ID と向き

立方体を正面から見て、以下のように配置します。

| 面 | マーカー ID | 説明 |
|----|-----------|------|
| 前面 (front) | **0** | 正面に向けて貼る（基準面） |
| 上面 (top) | **1** | 前面側から読める向きに貼る |
| 右面 (right) | **2** | 上が立方体の上面と揃う向きに貼る |
| 背面 (back) | **3** | 上が立方体の上面と揃う向きに貼る |
| 左面 (left) | **4** | 上が立方体の上面と揃う向きに貼る |

### マーカー画像の生成方法

OpenCV の ArUco マーカー生成ツールや、オンラインジェネレーター（例: [chev.me/arucogen](https://chev.me/arucogen/)）を使って、辞書 **4x4 (50)** の ID 0〜4 を生成してください。印刷時にマーカーの内側が正確に **9cm** になるよう拡大率を調整してください。

### 注意事項

- マーカーの周囲には必ず白い余白を確保してください。余白がないと検出精度が大幅に低下します
- 光沢のある紙は反射で検出が不安定になるため、マット紙での印刷を推奨します
- 立方体の角や辺にマーカーがかからないよう、各面の中央に正確に貼ってください

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
