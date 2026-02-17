# Collamin Shelftalker

A Next.js 14 application that generates realistic aging projections showing how your skin will look in 20 years with and without Collamin skincare using Google Gemini AI.

## Features
- App Router architecture with custom API route for Google Gemini image generation
- Calm, medical-grade interface with Persian (RTL) support
- Side-by-side comparison slider showing aging projections
- Story-ready vertical comparison image generation
- Responsive layout for mobile + desktop

## Getting Started
1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Configure environment**
   Set your Google Gemini API key:
   ```bash
   GEMINI_API_KEY=your_api_key_here
   ```
3. **Run the dev server**
   ```bash
   npm run dev
   ```
   Visit `http://localhost:3000` and upload a portrait.

## Deployment
- Push the project to GitHub and deploy with [Vercel](https://vercel.com/).
- Set the `GEMINI_API_KEY` secret in the Vercel dashboard.

## Project Structure
```
app/
  layout.tsx        // Global layout & fonts
  page.tsx          // Upload UI + comparison slider
  api/generate/     // Serverless route calling Google Gemini
public/
  collamin_logo.png // Collamin logo asset
  collamin-bottle.webp // Product image
```

## شمارنده استفاده (Stats)
برای دیدن تعداد دفعات استفاده از ابزار، به آدرس پروژه **`/stats`** را اضافه کنید:
- لوکال: `http://localhost:3000/stats`
- پروداکشن: `https://your-domain.com/stats`

در این صفحه شمارنده استفاده، تعداد درخواست‌های ناموفق، تصاویر استوری ساخته‌شده و میانگین زمان تولید نمایش داده می‌شود.

## Notes
- The API route generates two images: one showing natural aging without skincare, and one with Collamin skincare
- A third vertical story image is composed for Instagram Stories
- Portrait orientation images only (height > width)
